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

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])

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
    setSelectedLesson(lesson)
    setSidebarOpen(false)
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

  const getLessonsForSection = (sectionId: string) => {
    return lessons.filter(lesson => lesson.section_id === sectionId)
  }

  const getAssignmentsForSection = (sectionId: string) => {
    return assignments.filter(assignment => assignment.section_id === sectionId)
  }

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error marking lesson complete:', error)
        return
      }

      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: true
      }))
    } catch (err) {
      console.error('Error updating lesson progress:', err)
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
                        {sectionLessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-left ${
                              selectedLesson?.id === lesson.id ? 'bg-white/10' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {lesson.video_duration && (
                                <span className="text-xs text-gray-500">
                                  {formatDuration(lesson.video_duration)}
                                </span>
                              )}
                              {lessonProgress[lesson.id] ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                        ))}
                        
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
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
                  <iframe
                    src={selectedLesson.video_url}
                    title={selectedLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
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
                    onClick={() => markLessonComplete(selectedLesson.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
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
                  <button
                    onClick={() => {
                      const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id)
                      const nextLesson = lessons[currentIndex + 1]
                      if (nextLesson) setSelectedLesson(nextLesson)
                    }}
                    disabled={lessons.findIndex(l => l.id === selectedLesson.id) === lessons.length - 1}
                    className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
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
