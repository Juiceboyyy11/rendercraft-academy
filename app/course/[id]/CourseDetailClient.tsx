'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
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

export default function CourseDetailClient() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<CourseSection[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({})
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, any>>({})
  const [lessonCompletions, setLessonCompletions] = useState<Record<string, Array<{ user_id: string; user_name: string; completed_at: string }>>>({})
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [videoLoadError, setVideoLoadError] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
      checkAdminStatus()
    }

    // Listen for auth changes to update admin status
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        isAdmin(session.user.id).then(setIsAdminUser)
      } else {
        setIsAdminUser(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [courseId])

  // Detect if video iframe fails to load after timeout
  useEffect(() => {
    if (selectedLesson?.video_url && !videoLoadError[selectedLesson.id]) {
      const timeout = setTimeout(() => {
        // Check if iframe is actually loaded (this is a fallback)
        // Note: Cross-origin restrictions prevent checking iframe content
        // So we'll show a manual button for users to report issues
      }, 5000) // 5 second timeout

      return () => clearTimeout(timeout)
    }
  }, [selectedLesson, videoLoadError])

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const adminStatus = await isAdmin(session.user.id)
        setIsAdminUser(adminStatus)
      } else {
        setIsAdminUser(false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdminUser(false)
    }
  }

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single()

      if (courseError) {
        console.error('Course fetch error:', courseError)
        setError('Course not found or not published')
        return
      }

      setCourse(courseData)

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('section_order')

      if (sectionsError) {
        console.error('Sections fetch error:', sectionsError)
        setError('Failed to load course sections')
        return
      }

      setSections(sectionsData || [])

      // Fetch lessons for all sections
      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(section => section.id)
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('section_id', sectionIds)
          .eq('is_published', true)
          .order('lesson_order')

        if (lessonsError) {
          console.error('Lessons fetch error:', lessonsError)
        } else {
          setLessons(lessonsData || [])
        }

        // Fetch assignments for all sections
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .in('section_id', sectionIds)
          .eq('is_published', true)
          .order('assignment_order')

        if (assignmentsError) {
          console.error('Assignments fetch error:', assignmentsError)
        } else {
          setAssignments(assignmentsData || [])
        }

        // Fetch lesson completions with user names (only if admin)
        // First check if user is admin, then fetch if they are
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && await isAdmin(session.user.id)) {
          if (lessonsData && lessonsData.length > 0) {
            const lessonIds = lessonsData.map(lesson => lesson.id)
            const { data: completionsData, error: completionsError } = await supabase
              .from('lesson_progress')
              .select(`
                lesson_id,
                completed_at,
                user_id,
                users (
                  id,
                  full_name,
                  email
                )
              `)
              .in('lesson_id', lessonIds)
              .order('completed_at', { ascending: false })

            if (completionsError) {
              console.error('Error fetching lesson completions:', completionsError)
            } else {
              // Organize completions by lesson_id
              const completionsByLesson: Record<string, Array<{ user_id: string; user_name: string; completed_at: string }>> = {}
              
              completionsData?.forEach((completion: any) => {
                const lessonId = completion.lesson_id
                if (!completionsByLesson[lessonId]) {
                  completionsByLesson[lessonId] = []
                }
                
                // Handle user data - could be object or array
                const user = Array.isArray(completion.users) ? completion.users[0] : completion.users
                const userId = user?.id || completion.user_id
                const userName = user?.full_name || user?.email || 'Anonymous'
                
                if (userId) {
                  completionsByLesson[lessonId].push({
                    user_id: userId,
                    user_name: userName,
                    completed_at: completion.completed_at
                  })
                }
              })
              
              setLessonCompletions(completionsByLesson)
            }
          }
        }

        // Update lesson progress state for current user (always fetch for progress tracking)
        if (session?.user) {
          if (lessonsData && lessonsData.length > 0) {
            const lessonIds = lessonsData.map(lesson => lesson.id)
            const { data: userProgressData, error: userProgressError } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .in('lesson_id', lessonIds)
              .eq('user_id', session.user.id)

            if (!userProgressError && userProgressData) {
              const userProgress: Record<string, boolean> = {}
              userProgressData.forEach((progress: any) => {
                userProgress[progress.lesson_id] = true
              })
              setLessonProgress(userProgress)
            }
          }
        }
      }

      // Auto-expand first section
      if (sectionsData && sectionsData.length > 0) {
        setExpandedSections(new Set([sectionsData[0].id]))
        setSelectedSection(sectionsData[0])
      }

    } catch (err) {
      console.error('Error fetching course data:', err)
      setError('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const selectLesson = (lesson: Lesson) => {
    // Check if user can access this lesson (previous lessons must be completed)
    if (!canAccessLesson(lesson.id)) {
      alert('Click on the "Mark as complete" button below to move to the next lesson.')
      return
    }
    setSelectedLesson(lesson)
    setSidebarOpen(false)
    // Reset video load error when switching lessons
    setVideoLoadError(prev => ({ ...prev, [lesson.id]: false }))
  }

  const canAccessLesson = (lessonId: string): boolean => {
    // Get all lessons sorted by section_order and lesson_order across all sections
    const allLessonsSorted: Lesson[] = []
    
    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.section_order - b.section_order)
    
    // Collect lessons from each section in order
    sortedSections.forEach(section => {
      const sectionLessons = getLessonsForSection(section.id)
      const sortedSectionLessons = [...sectionLessons].sort((a, b) => a.lesson_order - b.lesson_order)
      allLessonsSorted.push(...sortedSectionLessons)
    })
    
    // Find the index of the lesson in the sorted array
    const lessonIndex = allLessonsSorted.findIndex(l => l.id === lessonId)
    
    // If lesson not found or it's the first lesson, allow access
    if (lessonIndex <= 0) {
      return true
    }
    
    // Check if all previous lessons (across all sections) are completed
    for (let i = 0; i < lessonIndex; i++) {
      if (!lessonProgress[allLessonsSorted[i].id]) {
        return false // Previous lesson not completed
      }
    }
    
    return true // All previous lessons completed
  }

  const getNextLesson = (): Lesson | null => {
    if (!selectedLesson) return null
    
    // Get all lessons sorted by section_order and lesson_order across all sections
    const allLessonsSorted: Lesson[] = []
    const sortedSections = [...sections].sort((a, b) => a.section_order - b.section_order)
    
    sortedSections.forEach(section => {
      const sectionLessons = getLessonsForSection(section.id)
      const sortedSectionLessons = [...sectionLessons].sort((a, b) => a.lesson_order - b.lesson_order)
      allLessonsSorted.push(...sortedSectionLessons)
    })
    
    const currentIndex = allLessonsSorted.findIndex(l => l.id === selectedLesson.id)
    if (currentIndex >= 0 && currentIndex < allLessonsSorted.length - 1) {
      return allLessonsSorted[currentIndex + 1]
    }
    return null
  }

  const canNavigateNext = (): boolean => {
    if (!selectedLesson) return false
    
    // Current lesson must be completed to go to next
    if (!lessonProgress[selectedLesson.id]) {
      return false
    }
    
    // Check if there's a next lesson
    const nextLesson = getNextLesson()
    if (!nextLesson) return false
    
    // Check if next lesson is accessible (all previous completed)
    return canAccessLesson(nextLesson.id)
  }

  const selectSection = (section: CourseSection) => {
    setSelectedSection(section)
    setExpandedSections(prev => new Set(Array.from(prev).concat(section.id)))
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return ''
    
    // If already an embed URL, return as is (but ensure it has proper params)
    if (url.includes('/embed/')) {
      // Ensure it has the necessary parameters for better compatibility
      const embedUrl = new URL(url)
      embedUrl.searchParams.set('rel', '0')
      embedUrl.searchParams.set('modestbranding', '1')
      embedUrl.searchParams.set('playsinline', '1')
      embedUrl.searchParams.set('enablejsapi', '1')
      return embedUrl.toString()
    }
    
    // Extract video ID from various YouTube URL formats
    let videoId = ''
    
    // youtube.com/watch?v=VIDEO_ID or youtube.com/watch?v=VIDEO_ID&t=...
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&]+)/)
    if (watchMatch) {
      videoId = watchMatch[1]
    }
    
    // youtube.com/shorts/VIDEO_ID (YouTube Shorts)
    const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^?\/]+)/)
    if (shortsMatch) {
      videoId = shortsMatch[1]
    }
    
    // youtu.be/VIDEO_ID
    const beMatch = url.match(/(?:youtu\.be\/)([^?\/]+)/)
    if (beMatch) {
      videoId = beMatch[1]
    }
    
    // youtube.com/embed/VIDEO_ID (already embed)
    const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^?\/]+)/)
    if (embedMatch) {
      videoId = embedMatch[1]
    }
    
    // If we found a video ID, return embed URL with proper parameters
    if (videoId && videoId.length === 11) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
    }
    
    // If no match, return original URL (might be a different video platform)
    console.warn('Could not extract YouTube video ID from:', url)
    return url
  }

  const getLessonsForSection = (sectionId: string) => {
    return lessons.filter(lesson => lesson.section_id === sectionId)
  }

  const getAssignmentsForSection = (sectionId: string) => {
    return assignments.filter(assignment => assignment.section_id === sectionId)
  }

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('User not logged in')
        return
      }

      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          user_id: user.id,
          completed_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error marking lesson complete:', error)
        return
      }

      // Update lesson progress state
      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: true
      }))

      // Only update lesson completions state if user is admin
      if (isAdminUser) {
        // Fetch updated completion data with user name
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        const userName = userData?.full_name || userData?.email || 'Anonymous'

        // Update lesson completions state
        setLessonCompletions(prev => {
          const updated = { ...prev }
          if (!updated[lessonId]) {
            updated[lessonId] = []
          }
          // Check if user already in list (to avoid duplicates)
          const userExists = updated[lessonId].some(c => c.user_id === user.id)
          if (!userExists) {
            updated[lessonId] = [{
              user_id: user.id,
              user_name: userName,
              completed_at: new Date().toISOString()
            }, ...updated[lessonId]]
          }
          return updated
        })
      }
    } catch (err) {
      console.error('Error updating lesson progress:', err)
    }
  }

  const unmarkLessonComplete = async (lessonId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('User not logged in')
        return
      }

      // Delete the lesson progress record
      const { error } = await supabase
        .from('lesson_progress')
        .delete()
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error unmarking lesson complete:', error)
        return
      }

      // Update lesson progress state
      setLessonProgress(prev => {
        const updated = { ...prev }
        delete updated[lessonId]
        return updated
      })

      // Only update lesson completions state if user is admin
      if (isAdminUser) {
        setLessonCompletions(prev => {
          const updated = { ...prev }
          if (updated[lessonId]) {
            // Remove current user from completions list
            updated[lessonId] = updated[lessonId].filter(c => c.user_id !== user.id)
            // If no completions left, remove the lesson entry
            if (updated[lessonId].length === 0) {
              delete updated[lessonId]
            }
          }
          return updated
        })
      }
    } catch (err) {
      console.error('Error unmarking lesson progress:', err)
    }
  }

  const toggleLessonComplete = async (lessonId: string) => {
    if (lessonProgress[lessonId]) {
      await unmarkLessonComplete(lessonId)
    } else {
      await markLessonComplete(lessonId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This course does not exist or is not published.'}</p>
          <Link 
            href="/academy"
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Academy
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">{course.title}</h1>
                <p className="text-sm text-gray-400">Course</p>
              </div>
            </div>
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-black border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden">
            <h2 className="text-lg font-semibold">Course Content</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto h-full pb-20">
            <div className="p-4">
              {sections.map((section) => {
                const sectionLessons = getLessonsForSection(section.id)
                const sectionAssignments = getAssignmentsForSection(section.id)
                const isExpanded = expandedSections.has(section.id)
                
                return (
                  <div key={section.id} className="mb-4">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <div>
                        <h3 className="font-medium">{section.title}</h3>
                        <p className="text-sm text-gray-400">
                          {sectionLessons.length} lessons, {sectionAssignments.length} assignments
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-4 mt-2 space-y-1">
                        {/* Lessons require previous ones to be completed */}
                        {sectionLessons.map((lesson) => {
                          const isAccessible = canAccessLesson(lesson.id)
                          const isCompleted = lessonProgress[lesson.id]
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => selectLesson(lesson)}
                              disabled={!isAccessible}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
                                !isAccessible 
                                  ? 'opacity-50 cursor-not-allowed bg-white/2' 
                                  : selectedLesson?.id === lesson.id 
                                    ? 'bg-white/10 hover:bg-white/10' 
                                    : 'hover:bg-white/5'
                              }`}
                              title={!isAccessible ? 'Click on the "Mark as complete" button below to move to the next lesson' : ''}
                            >
                              <div className="flex items-center space-x-2">
                                <Video className={`w-4 h-4 ${!isAccessible ? 'text-gray-600' : 'text-gray-400'}`} />
                                <span className={`text-sm ${!isAccessible ? 'text-gray-500' : 'text-white'}`}>
                                  {lesson.title}
                                  {!isAccessible && <span className="ml-1 text-xs">🔒</span>}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {lesson.video_duration && (
                                  <span className="text-xs text-gray-500">
                                    {formatDuration(lesson.video_duration)}
                                  </span>
                                )}
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Circle className={`w-4 h-4 ${!isAccessible ? 'text-gray-600' : 'text-gray-500'}`} />
                                )}
                              </div>
                            </button>
                          )
                        })}
                        
                        {sectionAssignments.map((assignment) => (
                          <button
                            key={assignment.id}
                            className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                          >
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{assignment.title}</span>
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
        <div className="flex-1 lg:ml-0">
          {selectedLesson ? (
            <div className="max-w-4xl mx-auto p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{selectedLesson.title}</h2>
                {selectedLesson.description && (
                  <p className="text-gray-400">{selectedLesson.description}</p>
                )}
              </div>

              {selectedLesson.video_url ? (
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 relative">
                  {!videoLoadError[selectedLesson.id] ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedLesson.video_url)}
                      title={selectedLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => {
                        console.log('Video iframe loaded successfully')
                        setVideoLoadError(prev => ({ ...prev, [selectedLesson.id]: false }))
                      }}
                      onError={() => {
                        console.error('Video iframe error')
                        setVideoLoadError(prev => ({ ...prev, [selectedLesson.id]: true }))
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                      <div className="text-center p-6 max-w-md">
                        <Video className="w-16 h-16 text-white/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Video Not Loading</h3>
                        <p className="text-white/70 mb-4">
                          The video may be blocked by your network, ad blocker, or privacy settings.
                        </p>
                        <div className="space-y-2">
                          <a
                            href={selectedLesson.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            Watch on YouTube ↗
                          </a>
                          <div className="text-white/60 text-sm mt-4">
                            <p className="mb-1">Troubleshooting:</p>
                            <ul className="text-left text-xs space-y-1 ml-4">
                              <li>• Disable ad blockers</li>
                              <li>• Check network/firewall settings</li>
                              <li>• Try a different browser</li>
                              <li>• Verify video allows embedding</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback button - visible if video appears blank */}
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={() => {
                        setVideoLoadError(prev => ({ ...prev, [selectedLesson.id]: true }))
                      }}
                      className="px-4 py-2 bg-red-500/80 text-white text-sm rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                      title="Click if video is not loading"
                    >
                      Video Not Loading?
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No video available for this lesson</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLessonComplete(selectedLesson.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      lessonProgress[selectedLesson.id]
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{lessonProgress[selectedLesson.id] ? 'Mark Incomplete' : 'Mark Complete'}</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous button - only disabled at first lesson, never based on completion */}
                  <button
                    onClick={() => {
                      const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id)
                      const prevLesson = lessons[currentIndex - 1]
                      if (prevLesson) setSelectedLesson(prevLesson)
                    }}
                    disabled={lessons.findIndex(l => l.id === selectedLesson.id) === 0}
                    className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {/* Next button - requires current lesson to be completed before allowing navigation */}
                  <button
                    onClick={() => {
                      if (!canNavigateNext()) {
                        alert('Click on the "Mark as complete" button below to move to the next lesson.')
                        return
                      }
                      const nextLesson = getNextLesson()
                      if (nextLesson) setSelectedLesson(nextLesson)
                    }}
                    disabled={!canNavigateNext() || lessons.findIndex(l => l.id === selectedLesson.id) === lessons.length - 1}
                    className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!lessonProgress[selectedLesson.id] ? 'Click on the "Mark as complete" button below to move to the next lesson' : ''}
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Who Completed This Lesson - Only visible to admins */}
              {isAdminUser && lessonCompletions[selectedLesson.id] && lessonCompletions[selectedLesson.id].length > 0 && (
                <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    Completed by ({lessonCompletions[selectedLesson.id].length} {lessonCompletions[selectedLesson.id].length === 1 ? 'person' : 'people'})
                  </h3>
                  <div className="space-y-2">
                    {lessonCompletions[selectedLesson.id].map((completion, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{completion.user_name}</span>
                        <span className="text-white/50">
                          {new Date(completion.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-6">
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Welcome to {course.title}</h2>
                <p className="text-gray-400 mb-6">
                  Select a lesson from the sidebar to start learning
                </p>
                <button
                  onClick={() => {
                    if (sections.length > 0) {
                      const firstSection = sections[0]
                      setExpandedSections(new Set([firstSection.id]))
                      setSelectedSection(firstSection)
                      const firstLesson = getLessonsForSection(firstSection.id)[0]
                      if (firstLesson) setSelectedLesson(firstLesson)
                    }
                  }}
                  className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
