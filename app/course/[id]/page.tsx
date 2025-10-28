'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Play, 
  ArrowLeft,
  Video,
  BookOpen,
  RefreshCw,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  FileText
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  price: number
  is_free: boolean
  is_published: boolean
  created_at: string
}

interface CourseSection {
  id: string
  course_id: string
  title: string
  description: string | null
  section_order: number
  is_published: boolean
  created_at: string
}

interface Lesson {
  id: string
  section_id: string
  title: string
  description: string | null
  video_url: string | null
  video_duration: number | null
  lesson_order: number
  is_published: boolean
  is_last_video_of_week: boolean
  created_at: string
}

interface Assignment {
  id: string
  section_id: string
  title: string
  description: string | null
  instructions: string | null
  due_date: string | null
  max_points: number
  assignment_order: number
  is_published: boolean
  created_at: string
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<CourseSection[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showOverview, setShowOverview] = useState(true)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Map<string, any>>(new Map())
  const [showAssignmentForm, setShowAssignmentForm] = useState<string | null>(null)
  const [uploadingAssignment, setUploadingAssignment] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
      checkAuth()
    }
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [courseId])

  // Add refresh functionality
  const handleRefresh = () => {
    console.log('🔄 Refreshing course data...')
    setRefreshing(true)
    setRefreshMessage(null)
    fetchCourseData().finally(() => {
      setRefreshing(false)
      setRefreshMessage('Course data refreshed! Deleted videos should now be removed.')
      setTimeout(() => setRefreshMessage(null), 3000)
    })
  }

  // Add auto-refresh when page becomes visible (in case user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && courseId) {
        console.log('📱 Page became visible, refreshing data...')
        fetchCourseData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single()

      if (courseError) {
        console.error('Error fetching course:', courseError)
        router.push('/')
        return
      }

      setCourse(courseData)

      // Fetch course sections (simplified - show all sections)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .order('section_order', { ascending: true })

      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError)
      } else {
        console.log('Sections fetched:', sectionsData)
        setSections(sectionsData || [])
        if (sectionsData && sectionsData.length > 0) {
          setActiveSection(sectionsData[0].id)
        }
      }

      // Fetch lessons for all sections
      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(s => s.id)
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('section_id', sectionIds)
          .order('lesson_order', { ascending: true })

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError)
        } else {
          console.log('📚 Lessons fetched:', lessonsData)
          console.log('📚 Number of lessons:', lessonsData?.length || 0)
          console.log('📚 Section IDs used:', sectionIds)
          console.log('📚 Lesson details:', lessonsData?.map(l => ({ id: l.id, title: l.title, section_id: l.section_id })))
          setLessons(lessonsData || [])
        }

        // Fetch assignments for all sections
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .in('section_id', sectionIds)
          .order('assignment_order', { ascending: true })

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError)
        } else {
          setAssignments(assignmentsData || [])
        }

        // Fetch assignment submissions for the current user (if logged in)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('assignment_submissions')
            .select('*')
            .eq('user_id', session.user.id)

          if (submissionsError) {
            console.error('Error fetching assignment submissions:', submissionsError)
          } else {
            console.log('Assignment submissions fetched:', submissionsData)
            // Convert array to Map for easier lookup
            const submissionsMap = new Map()
            submissionsData?.forEach(submission => {
              submissionsMap.set(submission.assignment_id, submission)
            })
            setAssignmentSubmissions(submissionsMap)
          }
        }
      }

    } catch (error) {
      console.error('Error fetching course data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
    setUser(session?.user || null)
    
    // If user is logged in, fetch their assignment submissions
    if (session?.user) {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('user_id', session.user.id)

      if (submissionsError) {
        console.error('Error fetching assignment submissions in checkAuth:', submissionsError)
      } else {
        console.log('Assignment submissions fetched in checkAuth:', submissionsData)
        // Convert array to Map for easier lookup
        const submissionsMap = new Map()
        submissionsData?.forEach(submission => {
          submissionsMap.set(submission.assignment_id, submission)
        })
        setAssignmentSubmissions(submissionsMap)
      }
    } else {
      // Clear submissions if user is not logged in
      setAssignmentSubmissions(new Map())
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getLessonsForSection = (sectionId: string) => {
    return lessons.filter(lesson => lesson.section_id === sectionId)
  }

  const getAssignmentsForSection = (sectionId: string) => {
    return assignments.filter(assignment => assignment.section_id === sectionId)
  }

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const selectLesson = (lessonId: string, sectionId: string) => {
    setActiveLesson(lessonId)
    setActiveSection(sectionId)
    // Expand the section if it's not already expanded
    if (!expandedSections.has(sectionId)) {
      toggleSectionExpansion(sectionId)
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    if (!isLoggedIn || !user) return
    
    try {
      // Find the lesson to check if it's the last video of week
      const lesson = lessons.find(l => l.id === lessonId)
      
      // If this is the last video of week, check for assignment submission
      if (lesson?.is_last_video_of_week) {
        // Check if there's a separate assignment for this section
        const weekAssignment = assignments.find(a => a.section_id === lesson.section_id)
        const assignmentId = weekAssignment ? weekAssignment.id : `lesson-${lessonId}`
        
        // Check if assignment has been submitted
        const submission = assignmentSubmissions.get(assignmentId)
        if (!submission) {
          alert('You must submit the assignment before marking this lesson as complete.')
          return
        }
      }
      
      // Add to completed lessons
      const newCompleted = new Set(completedLessons)
      newCompleted.add(lessonId)
      setCompletedLessons(newCompleted)
      
      // Update progress
      const newProgress = Math.round((newCompleted.size / lessons.length) * 100)
      setProgress(newProgress)
      
      // Here you would typically save to database
      console.log(`Marked lesson ${lessonId} as complete. Progress: ${newProgress}%`)
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  const unmarkLessonComplete = async (lessonId: string) => {
    if (!isLoggedIn || !user) return
    
    try {
      // Remove from completed lessons
      const newCompleted = new Set(completedLessons)
      newCompleted.delete(lessonId)
      setCompletedLessons(newCompleted)
      
      // Update progress
      const newProgress = Math.round((newCompleted.size / lessons.length) * 100)
      setProgress(newProgress)
      
      // Here you would typically save to database
      console.log(`Unmarked lesson ${lessonId} as complete. Progress: ${newProgress}%`)
    } catch (error) {
      console.error('Error unmarking lesson complete:', error)
    }
  }

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.has(lessonId)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    // Extract video ID from YouTube URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      // Add mobile-friendly parameters to force inline playback and prevent redirects
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'
      return `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1&playsinline=1&controls=1&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0&enablejsapi=1&origin=${origin}&widget_referrer=${origin}`
    }
    return url
  }

  const ensureUserProfile = async () => {
    if (!user) return false
    
    try {
      // Check if user exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        console.log('User not found in users table, creating profile...')
        
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
            role: 'student'
          })
        
        if (createError) {
          console.error('Error creating user profile:', createError)
          return false
        }
        
        console.log('User profile created successfully')
        return true
      } else if (checkError) {
        console.error('Error checking user profile:', checkError)
        return false
      } else {
        console.log('User profile exists')
        return true
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      return false
    }
  }

  const submitAssignment = async (assignmentId: string, file: File) => {
    if (!isLoggedIn || !user) {
      console.error('User not logged in')
      alert('You must be logged in to submit assignments')
      return
    }
    
    // Set loading state
    setUploadingAssignment(assignmentId)
    
    try {
      console.log('Starting assignment submission for assignment:', assignmentId)
      console.log('User details:', { id: user.id, email: user.email })
      console.log('File details:', { name: file.name, size: file.size, type: file.type })
      
      // Ensure user profile exists
      const profileExists = await ensureUserProfile()
      if (!profileExists) {
        alert('Error: User profile not found. Please try logging out and back in.')
        return
      }
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${assignmentId}_${user.id}_${Date.now()}.${fileExt}`
      
      console.log('Uploading file with name:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        alert(`Upload failed: ${uploadError.message}`)
        return
      }
      
      console.log('File uploaded successfully:', uploadData)
      
      // For virtual assignments (lesson-based), store in database with a special assignment_id
      if (assignmentId.startsWith('lesson-')) {
        // Create a virtual assignment record in the assignments table if it doesn't exist
        const lessonId = assignmentId.replace('lesson-', '')
        const lesson = lessons.find(l => l.id === lessonId)
        
        if (lesson) {
          // Check if virtual assignment exists
          const { data: existingAssignment } = await supabase
            .from('assignments')
            .select('id')
            .eq('title', 'Week Assignment')
            .eq('section_id', lesson.section_id)
            .single()
          
          let virtualAssignmentId = existingAssignment?.id
          
          // Create virtual assignment if it doesn't exist
          if (!virtualAssignmentId) {
            const { data: newAssignment, error: assignmentError } = await supabase
              .from('assignments')
              .insert({
                section_id: lesson.section_id,
                title: 'Week Assignment',
                description: lesson.description || 'Complete the assignment for this lesson',
                instructions: lesson.description || 'Complete the assignment for this lesson',
                assignment_order: 1,
                is_published: true
              })
              .select()
              .single()
            
            if (assignmentError) {
              console.error('Error creating virtual assignment:', assignmentError)
            } else {
              virtualAssignmentId = newAssignment.id
            }
          }
          
          // Now store the submission with the virtual assignment ID
          const submissionRecord = {
            assignment_id: virtualAssignmentId,
            user_id: user.id,
            file_url: uploadData.path,
            file_name: file.name,
            file_size: file.size,
            submitted_at: new Date().toISOString()
          }
          
          console.log('Saving virtual assignment submission:', submissionRecord)
          
          const { data: submissionData, error: submissionError } = await supabase
            .from('assignment_submissions')
            .insert(submissionRecord)
            .select()
            .single()
          
          if (submissionError) {
            console.error('Error saving virtual assignment submission:', submissionError)
            alert(`Database error: ${submissionError.message}`)
            
            // Try to delete the uploaded file if database insert failed
            await supabase.storage
              .from('assignment-submissions')
              .remove([uploadData.path])
            
            return
          }
          
          console.log('Virtual assignment submission saved successfully:', submissionData)
          
          // Update local state
          const newSubmissions = new Map(assignmentSubmissions)
          newSubmissions.set(assignmentId, submissionData)
          setAssignmentSubmissions(newSubmissions)
          
          console.log('Virtual assignment submitted successfully!')
          alert('Assignment submitted successfully!')
          return
        }
      }
      
      // For real assignments, save to database
      const submissionRecord = {
        assignment_id: assignmentId,
        user_id: user.id,
        file_url: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        submitted_at: new Date().toISOString()
      }
      
      console.log('Saving submission record:', submissionRecord)
      
      const { data: submissionData, error: submissionError } = await supabase
        .from('assignment_submissions')
        .insert(submissionRecord)
        .select()
        .single()
      
      if (submissionError) {
        console.error('Error saving submission:', submissionError)
        alert(`Database error: ${submissionError.message}`)
        
        // Try to delete the uploaded file if database insert failed
        await supabase.storage
          .from('assignment-submissions')
          .remove([uploadData.path])
        
        return
      }
      
      console.log('Submission saved successfully:', submissionData)
      
      // Update local state
      const newSubmissions = new Map(assignmentSubmissions)
      newSubmissions.set(assignmentId, submissionData)
      setAssignmentSubmissions(newSubmissions)
      
      console.log('Assignment submitted successfully!')
      alert('Assignment submitted successfully!')
      
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Clear loading state
      setUploadingAssignment(null)
    }
  }

  const deleteAssignmentSubmission = async (assignmentId: string) => {
    if (!isLoggedIn || !user) return
    
    try {
      const submission = assignmentSubmissions.get(assignmentId)
      if (!submission) return
      
      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('assignment-submissions')
        .remove([submission.file_url])
      
      if (deleteError) {
        console.error('Error deleting file:', deleteError)
      }
      
      // Delete submission record
      const { error: submissionError } = await supabase
        .from('assignment_submissions')
        .delete()
        .eq('id', submission.id)
      
      if (submissionError) {
        console.error('Error deleting submission:', submissionError)
        return
      }
      
      // Update local state
      const newSubmissions = new Map(assignmentSubmissions)
      newSubmissions.delete(assignmentId)
      setAssignmentSubmissions(newSubmissions)
      
      console.log('Assignment submission deleted!')
    } catch (error) {
      console.error('Error deleting assignment submission:', error)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading course...</div>
      </div>
    )
  }

  if (!course) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Course Not Found</h1>
          <p className="text-xl mb-4">This course doesn't exist or is not published.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-black border-r border-white/10 fixed lg:relative z-50 lg:z-auto h-full`}>
        <div className="p-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Course Content</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={16} className="text-white/70" />
            </button>
          </div>

          {/* Course Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Overview Section */}
          <div className="mb-4">
            <button
              onClick={() => {
                setShowOverview(true)
                setActiveLesson(null)
                setActiveSection(null)
              }}
              className={`w-full p-3 text-left rounded-lg transition-colors flex items-center space-x-2 ${
                showOverview ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen size={16} />
              <span className="font-medium">Overview</span>
            </button>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            {sections.map((section) => {
              const sectionLessons = getLessonsForSection(section.id)
              const isExpanded = expandedSections.has(section.id)
              
              return (
                <div key={section.id} className="border border-white/10 rounded-lg">
                  <button
                    onClick={() => toggleSectionExpansion(section.id)}
                    className="w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium text-white">{section.title}</span>
                    </div>
                    <span className="text-xs text-white/50">{sectionLessons.length}</span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {sectionLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            selectLesson(lesson.id, section.id)
                            setShowOverview(false)
                          }}
                          className={`w-full text-left p-2 rounded hover:bg-white/5 transition-colors flex items-center justify-between ${
                            activeLesson === lesson.id ? 'bg-white/10' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle size={12} className="text-green-400" />
                            ) : (
                              <Circle size={12} className="text-white/70" />
                            )}
                            <span className={`text-sm ${isLessonCompleted(lesson.id) ? 'text-white line-through' : 'text-white/80'}`}>
                              {lesson.title}
                            </span>
                          </div>
                          {lesson.video_duration && (
                            <span className="text-xs text-white/50">{formatDuration(lesson.video_duration)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <div className="bg-black/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <Menu size={20} className="text-white/70" />
                  </button>
                )}
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Home</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 border border-white/20 rounded text-white text-sm font-medium hover:border-white/40 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                
                {refreshMessage && (
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-sm">
                    {refreshMessage}
                  </div>
                )}
                
                {!isLoggedIn && (
                  <Link 
                    href="/auth/signin"
                    className="px-4 py-2 border border-white/20 rounded text-white text-sm font-medium hover:border-white/40 transition-colors"
                  >
                    Sign In to Access
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="max-w-4xl mx-auto w-full">
            {showOverview ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 lg:p-8 w-full">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6">Course Overview</h2>
                <div className="prose prose-invert prose-lg max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: course.description || '<p>Master professional 3D animation techniques with industry experts. Learn from experienced professionals and build your portfolio.</p>'
                    }}
                  />
                </div>
                
                {/* Course Stats */}
                <div className="mt-8 grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{sections.length}</div>
                    <div className="text-white/70 text-sm">Weeks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{lessons.length}</div>
                    <div className="text-white/70 text-sm">Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{assignments.length}</div>
                    <div className="text-white/70 text-sm">Assignments</div>
                  </div>
                </div>
              </div>
            ) : activeLesson ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 w-full">
                {(() => {
                  const lesson = lessons.find(l => l.id === activeLesson)
                  if (!lesson) return null
                  
                  return (
                    <div className="w-full">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4 break-words">{lesson.title}</h2>
                      {lesson.description && (
                        <div 
                          className="text-white/70 mb-4 sm:mb-6 prose prose-invert prose-sm max-w-none break-words"
                          dangerouslySetInnerHTML={{ __html: lesson.description }}
                        />
                      )}
                      
                      {lesson.video_url ? (
                        <div className="w-full bg-black rounded-lg overflow-hidden relative" style={{ aspectRatio: '16/9', minHeight: '200px', maxHeight: '400px' }}>
                          {lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be') ? (
                            <iframe
                              src={getYouTubeEmbedUrl(lesson.video_url)}
                              title={lesson.title}
                              className="w-full h-full absolute inset-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              frameBorder="0"
                              loading="lazy"
                              style={{ 
                                border: 'none',
                                WebkitTouchCallout: 'none',
                                WebkitUserSelect: 'none',
                                userSelect: 'none'
                              }}
                            />
                          ) : (
                            <video 
                              src={lesson.video_url}
                              controls
                              className="w-full h-full absolute inset-0"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Video size={48} className="text-white/50 mx-auto mb-4" />
                            <p className="text-white/70">Video not available</p>
                            <p className="text-white/50 text-sm mt-2">Video URL: {lesson.video_url || 'Not set'}</p>
                          </div>
                        </div>
                      )}

                      {/* Mark as Complete Button */}
                      {isLoggedIn && !isLessonCompleted(lesson.id) && (
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => markLessonComplete(lesson.id)}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Mark as Complete</span>
                          </button>
                        </div>
                      )}

                      {/* Completion Status */}
                      {isLoggedIn && isLessonCompleted(lesson.id) && (
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => unmarkLessonComplete(lesson.id)}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Mark as Incomplete</span>
                          </button>
                        </div>
                      )}

                      {/* Assignment Section - Show after last video of week */}
                      {lesson.is_last_video_of_week && (
                        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <FileText size={20} className="mr-2" />
                            Week Assignment
                          </h3>
                          <p className="text-white/70 mb-4">
                            Complete this assignment to finish the week. Upload your work as a file.
                          </p>
                          
                          {(() => {
                            // First, try to find a separate assignment in the assignments table
                            const weekAssignment = assignments.find(a => a.section_id === lesson.section_id)
                            
                            // If no separate assignment exists, use the lesson's assignment_text
                            if (!weekAssignment && lesson.assignment_text) {
                              // Create a virtual assignment object for the lesson's assignment_text
                              const virtualAssignment = {
                                id: `lesson-${lesson.id}`,
                                title: 'Week Assignment',
                                description: lesson.assignment_text,
                                section_id: lesson.section_id
                              }
                              
                              const submission = assignmentSubmissions.get(virtualAssignment.id)
                              
                              return (
                                <div>
                                  <div 
                                    className="text-white/70 mb-4 prose prose-invert prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: lesson.assignment_text }}
                                  />
                                  
                                  {submission ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <CheckCircle size={16} className="text-green-400" />
                                          <span className="text-green-400 font-medium">Assignment Submitted</span>
                                        </div>
                                        <div className="text-sm text-white/70">
                                          {submission.file_name} ({(submission.file_size / 1024 / 1024).toFixed(2)} MB)
                                        </div>
                                      </div>
                                      <div className="mt-3 flex space-x-2">
                                        <button
                                          onClick={() => deleteAssignmentSubmission(virtualAssignment.id)}
                                          className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                        >
                                          Delete & Resubmit
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <input
                                        type="file"
                                        id={`assignment-${virtualAssignment.id}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            submitAssignment(virtualAssignment.id, file)
                                          }
                                        }}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.zip,.rar,.blend,.fbx,.obj,.jpg,.jpeg,.png,.mp4,.mov"
                                      />
                                      <label
                                        htmlFor={`assignment-${virtualAssignment.id}`}
                                        className={`inline-block px-6 py-3 border rounded-lg transition-colors cursor-pointer flex items-center space-x-2 ${
                                          uploadingAssignment === virtualAssignment.id
                                            ? 'bg-blue-500/30 text-blue-300 border-blue-500/50 cursor-not-allowed'
                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                                        }`}
                                      >
                                        {uploadingAssignment === virtualAssignment.id ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                                            <span>Uploading...</span>
                                          </>
                                        ) : (
                                          <span>Upload Assignment</span>
                                        )}
                                      </label>
                                      <p className="text-xs text-white/50 mt-2">
                                        Accepted formats: PDF, DOC, ZIP, BLEND, FBX, OBJ, JPG, PNG, MP4, MOV
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            
                            // If separate assignment exists, use that
                            if (weekAssignment) {
                              const submission = assignmentSubmissions.get(weekAssignment.id)
                              
                              return (
                                <div>
                                  <h4 className="font-semibold text-white mb-2">{weekAssignment.title}</h4>
                                  {weekAssignment.description && (
                                    <div 
                                      className="text-white/70 mb-4 prose prose-invert prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: weekAssignment.description }}
                                    />
                                  )}
                                  
                                  {submission ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <CheckCircle size={16} className="text-green-400" />
                                          <span className="text-green-400 font-medium">Assignment Submitted</span>
                                        </div>
                                        <div className="text-sm text-white/70">
                                          {submission.file_name} ({(submission.file_size / 1024 / 1024).toFixed(2)} MB)
                                        </div>
                                      </div>
                                      <div className="mt-3 flex space-x-2">
                                        <button
                                          onClick={() => deleteAssignmentSubmission(weekAssignment.id)}
                                          className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                        >
                                          Delete & Resubmit
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <input
                                        type="file"
                                        id={`assignment-${weekAssignment.id}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            submitAssignment(weekAssignment.id, file)
                                          }
                                        }}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.zip,.rar,.blend,.fbx,.obj,.jpg,.jpeg,.png,.mp4,.mov"
                                      />
                                      <label
                                        htmlFor={`assignment-${weekAssignment.id}`}
                                        className={`inline-block px-6 py-3 border rounded-lg transition-colors cursor-pointer flex items-center space-x-2 ${
                                          uploadingAssignment === weekAssignment.id
                                            ? 'bg-blue-500/30 text-blue-300 border-blue-500/50 cursor-not-allowed'
                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                                        }`}
                                      >
                                        {uploadingAssignment === weekAssignment.id ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                                            <span>Uploading...</span>
                                          </>
                                        ) : (
                                          <span>Upload Assignment</span>
                                        )}
                                      </label>
                                      <p className="text-xs text-white/50 mt-2">
                                        Accepted formats: PDF, DOC, ZIP, BLEND, FBX, OBJ, JPG, PNG, MP4, MOV
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            
                            // No assignment found at all
                            return (
                              <div className="text-white/70">
                                <p>No assignment found for this section.</p>
                                <p className="text-sm text-white/50 mt-2">
                                  Please create an assignment in the admin panel for this section.
                                </p>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8 lg:p-12 text-center w-full">
                <BookOpen size={40} className="text-white/50 mx-auto mb-4 sm:hidden" />
                <BookOpen size={48} className="text-white/50 mx-auto mb-6 hidden sm:block lg:hidden" />
                <BookOpen size={64} className="text-white/50 mx-auto mb-6 hidden lg:block" />
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4">Welcome to {course.title}</h3>
                <p className="text-white/70 text-lg mb-6">
                  Select a lesson from the sidebar to start learning
                </p>
                <div className="flex items-center justify-center space-x-2 text-white/50">
                  <Play size={20} />
                  <span>Click on any lesson to begin</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
