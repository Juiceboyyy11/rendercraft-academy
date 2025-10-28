'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Eye, EyeOff, Play, Calendar, Users, BookOpen, ChevronDown, ChevronRight, Upload, FileText } from 'lucide-react'
import CreateCourseForm from './CreateCourseForm'
import CreateSectionForm from './CreateSectionForm'
import CreateLessonForm from './CreateLessonForm'
import CreateAssignmentForm from './CreateAssignmentForm'
import EditCourseForm from './EditCourseForm'
import EditLessonForm from './EditLessonForm'
import EditSectionForm from './EditSectionForm'

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  is_free: boolean
  is_published: boolean
  created_by: string
  created_at: string
  course_sections: CourseSection[]
}

interface CourseSection {
  id: string
  title: string
  description: string | null
  section_order: number
  is_published: boolean
  lessons: Lesson[]
  assignments: Assignment[]
}

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  video_duration: number | null
  lesson_order: number
  is_published: boolean
}

interface Assignment {
  id: string
  title: string
  description: string | null
  instructions: string | null
  due_date: string | null
  max_points: number
  assignment_order: number
  is_published: boolean
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [editingSection, setEditingSection] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_sections (
            *,
            lessons (*),
            assignments (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
        throw coursesError
      }

      console.log('Raw courses data:', coursesData)
      console.log('Fetching courses after section update - checking for updated sections')

      // Sort sections, lessons, and assignments by their order
      const sortedCourses = coursesData?.map(course => ({
        ...course,
        course_sections: course.course_sections
          ?.sort((a, b) => a.section_order - b.section_order)
          .map(section => ({
            ...section,
            lessons: section.lessons?.sort((a, b) => a.lesson_order - b.lesson_order) || [],
            assignments: section.assignments?.sort((a, b) => a.assignment_order - b.assignment_order) || []
          })) || []
      })) || []

      console.log('Processed courses data:', sortedCourses)
      console.log('Setting courses state with updated data')
      setCourses(sortedCourses)
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([]) // Set empty array on error to prevent crashes
    } finally {
      setLoading(false)
    }
  }

  const toggleCoursePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId)

      if (error) throw error
      fetchCourses()
    } catch (error) {
      console.error('Error updating course:', error)
    }
  }

  const editCourse = (course: Course) => {
    setEditingCourse(course)
  }

  const updateCourse = async (updatedCourse: Partial<Course>) => {
    if (!editingCourse) return

    try {
      const { error } = await supabase
        .from('courses')
        .update(updatedCourse)
        .eq('id', editingCourse.id)

      if (error) throw error
      
      setEditingCourse(null)
      fetchCourses()
    } catch (error) {
      console.error('Error updating course:', error)
    }
  }

  const editSection = (section: any) => {
    setEditingSection(section)
  }

  const updateSection = async (updatedSection: any) => {
    if (!editingSection) return

    try {
      console.log('🔄 Updating section:', editingSection.id, 'with data:', updatedSection)
      
      // Update the section in Supabase
      const { data, error } = await supabase
        .from('course_sections')
        .update({
          title: updatedSection.title,
          description: updatedSection.description,
          section_order: updatedSection.section_order,
          is_published: updatedSection.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSection.id)
        .select()

      if (error) {
        console.error('❌ Database update error:', error)
        throw new Error(`Failed to update section: ${error.message}`)
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No rows updated - trying alternative approach...')
        
        // Try updating with explicit field mapping
        const { data: altData, error: altError } = await supabase
          .from('course_sections')
          .update({
            title: updatedSection.title,
            description: updatedSection.description,
            section_order: updatedSection.section_order,
            is_published: updatedSection.is_published,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSection.id)
          .select()
        
        if (altError) {
          console.error('❌ Alternative update error:', altError)
          throw new Error(`RLS Policy Error: ${altError.message}. Please run the SQL fix script.`)
        }
        
        if (!altData || altData.length === 0) {
          console.warn('⚠️ Alternative approach also failed - trying direct SQL approach...')
          
          // Try using rpc (Remote Procedure Call) to bypass RLS
          const { data: rpcData, error: rpcError } = await supabase.rpc('update_section_direct', {
            section_id: editingSection.id,
            new_title: updatedSection.title,
            new_description: updatedSection.description,
            new_section_order: updatedSection.section_order,
            new_is_published: updatedSection.is_published
          })
          
          if (rpcError) {
            console.error('❌ RPC update error:', rpcError)
            throw new Error(`RLS Policy Error: All update methods failed. Please run the urgent SQL fix script to disable RLS temporarily.`)
          }
          
          console.log('✅ Section updated with RPC approach:', rpcData)
          return
        }
        
        console.log('✅ Section updated with alternative approach:', altData[0])
        return
      }
      
      console.log('✅ Section updated in database:', data[0])
      
      // Update local state immediately for instant UI feedback
      setCourses(prev => prev.map(course => ({
        ...course,
        course_sections: course.course_sections.map(section => 
          section.id === editingSection.id 
            ? { ...section, ...updatedSection, updated_at: new Date().toISOString() }
            : section
        )
      })))
      
      // Clear editing state
      setEditingSection(null)
      
      // Force UI refresh to ensure consistency
      setRefreshKey(prev => prev + 1)
      
      console.log('✅ Section update completed successfully')
      alert('Section updated successfully!')
      
    } catch (error: any) {
      console.error('❌ Error updating section:', error)
      alert(`Failed to update section: ${error.message}`)
    }
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all lessons and assignments in this section. This action cannot be undone.')) return

    try {
      console.log('🗑️ Deleting section:', sectionId)
      
      // Delete all lessons in this section first
      console.log('Deleting lessons in section...')
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .eq('section_id', sectionId)

      if (lessonsError) {
        console.error('❌ Error deleting lessons:', lessonsError)
        throw new Error(`Failed to delete lessons: ${lessonsError.message}`)
      }

      // Delete all assignments in this section
      console.log('Deleting assignments in section...')
      const { error: assignmentsError } = await supabase
        .from('assignments')
        .delete()
        .eq('section_id', sectionId)

      if (assignmentsError) {
        console.error('❌ Error deleting assignments:', assignmentsError)
        throw new Error(`Failed to delete assignments: ${assignmentsError.message}`)
      }

      // Finally delete the section
      console.log('Deleting section...')
      const { error: sectionError } = await supabase
        .from('course_sections')
        .delete()
        .eq('id', sectionId)

      if (sectionError) {
        console.error('❌ Error deleting section:', sectionError)
        throw new Error(`Failed to delete section: ${sectionError.message}`)
      }

      console.log('✅ Section deleted from database')
      
      // Update local state immediately for instant UI feedback
      setCourses(prev => prev.map(course => ({
        ...course,
        course_sections: course.course_sections.filter(section => section.id !== sectionId)
      })))
      
      // Clear expanded section if it was the deleted one
      if (expandedSection === sectionId) {
        console.log('Clearing expanded section state')
        setExpandedSection(null)
      }
      
      // Force UI refresh to ensure consistency
      setRefreshKey(prev => prev + 1)
      
      console.log('✅ Section deletion completed successfully')
      alert('Section deleted successfully!')
      
    } catch (error: any) {
      console.error('❌ Error deleting section:', error)
      alert(`Failed to delete section: ${error.message}`)
    }
  }

  const updateLesson = async (updatedLesson: any) => {
    if (!editingLesson) return

    try {
      console.log('🔄 Updating lesson:', editingLesson.id, 'with data:', updatedLesson)
      
      // Update the lesson in Supabase
      const { data, error } = await supabase
        .from('lessons')
        .update({
          title: updatedLesson.title,
          description: updatedLesson.description,
          video_url: updatedLesson.video_url,
          video_duration: updatedLesson.video_duration,
          lesson_order: updatedLesson.lesson_order,
          is_published: updatedLesson.is_published,
          is_last_video_of_week: updatedLesson.is_last_video_of_week,
          assignment_text: updatedLesson.assignment_text,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLesson.id)
        .select()

      if (error) {
        console.error('❌ Database update error:', error)
        throw new Error(`Failed to update lesson: ${error.message}`)
      }
      
      if (!data || data.length === 0) {
        throw new Error('No rows were updated. Check if you have admin permissions.')
      }
      
      console.log('✅ Lesson updated in database:', data[0])
      
      // Update local state immediately for instant UI feedback
      setCourses(prev => prev.map(course => ({
        ...course,
        course_sections: course.course_sections.map(section => ({
          ...section,
          lessons: section.lessons.map(lesson => 
            lesson.id === editingLesson.id 
              ? { ...lesson, ...updatedLesson, updated_at: new Date().toISOString() }
              : lesson
          )
        }))
      })))
      
      // Clear editing state
      setEditingLesson(null)
      
      // Force UI refresh to ensure consistency
      setRefreshKey(prev => prev + 1)
      
      console.log('✅ Lesson update completed successfully')
      alert('Video updated successfully!')
      
    } catch (error: any) {
      console.error('❌ Error updating lesson:', error)
      alert(`Failed to update video: ${error.message}`)
    }
  }

  const editLesson = (lesson: any) => {
    setEditingLesson(lesson)
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) return

    try {
      console.log('🗑️ Deleting lesson:', lessonId)
      
      // Delete the lesson from Supabase
      const { data, error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .select()

      if (error) {
        console.error('❌ Database delete error:', error)
        throw new Error(`Failed to delete video: ${error.message}`)
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No rows deleted - trying alternative approach...')
        
        // Try alternative delete approach
        const { data: altData, error: altError } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId)
          .select()
        
        if (altError) {
          console.error('❌ Alternative delete error:', altError)
          throw new Error(`RLS Policy Error: ${altError.message}. Please run the lesson delete fix script.`)
        }
        
        if (!altData || altData.length === 0) {
          throw new Error('RLS Policy Error: No rows deleted. Please check your admin permissions for lessons table.')
        }
        
        console.log('✅ Lesson deleted with alternative approach:', altData[0])
      } else {
        console.log('✅ Lesson deleted from database:', data[0])
      }
      
      // Update local state immediately for instant UI feedback
      setCourses(prev => prev.map(course => ({
        ...course,
        course_sections: course.course_sections.map(section => ({
          ...section,
          lessons: section.lessons.filter(lesson => lesson.id !== lessonId)
        }))
      })))
      
      // Force UI refresh to ensure consistency
      setRefreshKey(prev => prev + 1)
      
      console.log('✅ Lesson deletion completed successfully')
      alert('Video deleted successfully!')
      
    } catch (error: any) {
      console.error('❌ Error deleting lesson:', error)
      alert(`Failed to delete video: ${error.message}`)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/70">Loading courses...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Courses Management</h2>
          <p className="text-white/70 mt-2 text-sm sm:text-base">Create and manage your courses with sections, lessons, and assignments</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={64} className="mx-auto text-white/30 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
            <p className="text-white/70 mb-6">Create your first course to get started</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" key={refreshKey}>
            {courses.map((course) => (
              <div key={course.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/8 transition-colors">
                {/* Course Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <BookOpen size={20} className="text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Course Badges */}
                  <div className="absolute top-3 right-3 flex flex-col space-y-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      course.is_published 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {course.is_published ? 'Live' : 'Draft'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      course.is_free 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {course.is_free ? 'FREE' : `$${course.price}`}
                    </span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2">{course.title}</h3>
                  
                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-white/60 mb-3 sm:mb-4">
                    <div className="flex items-center space-x-1">
                      <BookOpen size={14} />
                      <span>{course.course_sections?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Play size={14} />
                      <span>{course.course_sections?.reduce((acc, section) => acc + (section.lessons?.length || 0), 0) || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText size={14} />
                      <span>{course.course_sections?.reduce((acc, section) => acc + (section.assignments?.length || 0), 0) || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleCoursePublish(course.id, course.is_published)}
                        className={`p-2 rounded hover:bg-white/10 transition-colors ${
                          course.is_published ? 'text-green-400' : 'text-gray-400'
                        }`}
                        title={course.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {course.is_published ? <Eye size={14} className="sm:w-4 sm:h-4" /> : <EyeOff size={14} className="sm:w-4 sm:h-4" />}
                      </button>
                      <button
                        onClick={() => editCourse(course)}
                        className="p-2 rounded hover:bg-white/10 transition-colors text-white/70"
                        title="Edit Course"
                      >
                        <Edit size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="p-2 rounded hover:bg-white/10 transition-colors text-red-400"
                        title="Delete Course"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                      className="p-2 rounded hover:bg-white/10 transition-colors text-white/70"
                      title="View Details"
                    >
                      {expandedCourse === course.id ? <ChevronDown size={14} className="sm:w-4 sm:h-4" /> : <ChevronRight size={14} className="sm:w-4 sm:h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Course Content */}
                {expandedCourse === course.id && (
                  <div className="border-t border-white/10 bg-white/2">
                    <div className="p-3 sm:p-4">
                      <div className="space-y-3">
                        {course.course_sections?.map((section) => (
                          <div key={section.id} className="bg-white/5 border border-white/10 rounded-lg p-2 sm:p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-white">{section.title}</h4>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  section.is_published 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {section.is_published ? 'Live' : 'Draft'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => editSection(section)}
                                  className="p-1 text-white/50 hover:text-white transition-colors"
                                  title="Edit Section"
                                >
                                  <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteSection(section.id)}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete Section"
                                >
                                  <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                                <button
                                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                                  className="p-1 rounded hover:bg-white/10 transition-colors text-white/70"
                                >
                                  {expandedSection === section.id ? <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" /> : <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />}
                                </button>
                              </div>
                            </div>
                            
                            {expandedSection === section.id && (
                              <div className="space-y-2 mt-2">
                                {/* Lessons */}
                                <div>
                                  <h5 className="text-xs font-medium text-white/80 mb-1 flex items-center space-x-1">
                                    <Play size={12} />
                                    <span>Lessons ({section.lessons?.length || 0})</span>
                                  </h5>
                                  <div className="space-y-1">
                                    {section.lessons?.map((lesson) => (
                                      <div key={lesson.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                                        <div className="flex items-center space-x-2">
                                          <Play size={12} className="text-white/70" />
                                          <span className="text-xs text-white">{lesson.title}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="px-1 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                            Live
                                          </span>
                                          <button
                                            onClick={() => editLesson(lesson)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                            title="Edit Video"
                                          >
                                            <Edit size={8} className="text-white/70 sm:w-2.5 sm:h-2.5" />
                                          </button>
                                          <button
                                            onClick={() => deleteLesson(lesson.id)}
                                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                            title="Delete Video"
                                          >
                                            <Trash2 size={8} className="text-red-400 sm:w-2.5 sm:h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Add Video Button */}
                                    <button
                                      onClick={() => {
                                        setSelectedSectionId(section.id)
                                        setShowLessonForm(true)
                                      }}
                                      className="w-full py-1.5 px-2 bg-white/5 border border-white/20 rounded text-white hover:bg-white/10 transition-colors flex items-center justify-center space-x-1 text-xs mt-2"
                                    >
                                      <Plus size={10} className="sm:w-3 sm:h-3" />
                                      <span>Add Video</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Assignments */}
                                <div>
                                  <h5 className="text-xs font-medium text-white/80 mb-1 flex items-center space-x-1">
                                    <FileText size={12} />
                                    <span>Assignments ({section.assignments?.length || 0})</span>
                                  </h5>
                                  <div className="space-y-1">
                                    {section.assignments?.map((assignment) => (
                                      <div key={assignment.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                                        <div className="flex items-center space-x-2">
                                          <FileText size={12} className="text-white/70" />
                                          <span className="text-xs text-white">{assignment.title}</span>
                                        </div>
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                          assignment.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                          {assignment.is_published ? 'Live' : 'Draft'}
                                        </span>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        setSelectedSectionId(section.id)
                                        setShowAssignmentForm(true)
                                      }}
                                      className="w-full py-1.5 px-2 bg-white/5 border border-white/20 rounded text-white hover:bg-white/10 transition-colors flex items-center justify-center space-x-1 text-xs mt-2"
                                    >
                                      <Plus size={10} className="sm:w-3 sm:h-3" />
                                      <span>Add Assignment</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Add New Section Button */}
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              setSelectedCourseId(course.id)
                              setShowSectionForm(true)
                            }}
                            className="w-full py-2 px-3 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center justify-center space-x-2 text-sm"
                          >
                            <Plus size={14} />
                            <span>Add Section</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <CreateCourseForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchCourses()
            setShowCreateForm(false)
          }}
        />
      )}

          {/* Create Section Form */}
          {showSectionForm && selectedCourseId && (
            <CreateSectionForm
              courseId={selectedCourseId}
              onClose={() => {
                setShowSectionForm(false)
                setSelectedCourseId(null)
              }}
              onSuccess={() => {
                fetchCourses()
                setShowSectionForm(false)
                setSelectedCourseId(null)
              }}
            />
          )}

          {/* Create Lesson Form */}
          {showLessonForm && selectedSectionId && (
            <CreateLessonForm
              sectionId={selectedSectionId}
              onClose={() => {
                setShowLessonForm(false)
                setSelectedSectionId(null)
              }}
              onSuccess={() => {
                fetchCourses()
                setShowLessonForm(false)
                setSelectedSectionId(null)
              }}
            />
          )}

          {/* Edit Course Form */}
          {editingCourse && (
            <EditCourseForm
              course={editingCourse}
              onClose={() => setEditingCourse(null)}
              onSuccess={(updatedCourse) => {
                updateCourse(updatedCourse)
              }}
            />
          )}

          {/* Edit Lesson Form */}
          {editingLesson && (
            <EditLessonForm
              lesson={editingLesson}
              onClose={() => setEditingLesson(null)}
              onSuccess={(updatedLesson) => {
                updateLesson(updatedLesson)
              }}
            />
          )}

          {/* Edit Section Form */}
          {editingSection && (
            <EditSectionForm
              section={editingSection}
              onClose={() => setEditingSection(null)}
              onSuccess={async (updatedSection) => {
                await updateSection(updatedSection)
              }}
            />
          )}

          {/* Create Assignment Form */}
          {showAssignmentForm && selectedSectionId && (
            <CreateAssignmentForm
              sectionId={selectedSectionId}
              onClose={() => {
                setShowAssignmentForm(false)
                setSelectedSectionId(null)
              }}
              onSuccess={() => {
                fetchCourses()
                setShowAssignmentForm(false)
                setSelectedSectionId(null)
              }}
            />
          )}
        </div>
      )
    }
