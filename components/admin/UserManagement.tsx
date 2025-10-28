'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  User, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Eye,
  Calendar,
  Mail,
  BookOpen,
  Play
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
  last_sign_in_at?: string | null
}

interface CourseEnrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  course: {
    id: string
    title: string
  }
}

interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed_at: string
  lesson: {
    id: string
    title: string
    section_id: string
    section: {
      id: string
      title: string
      course_id: string
    }
  }
}

interface AssignmentSubmission {
  id: string
  user_id: string
  assignment_id: string | null
  lesson_id: string | null
  file_url: string | null
  file_name: string
  file_size: number
  submitted_at: string
  assignment: {
    id: string
    title: string
    section_id: string
    section: {
      id: string
      title: string
      course_id: string
    }
  } | null
  lesson: {
    id: string
    title: string
    section_id: string
    section: {
      id: string
      title: string
      course_id: string
    }
  } | null
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)

      // Check if current user is admin
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('Current user:', currentUser)
      
      if (currentUser) {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()
        console.log('Current user role:', currentUserData?.role)
      }

      // Fetch all users from users table - this should include ALL users who have created accounts
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        console.error('Users error details:', usersError)
        setUsers([])
      } else {
        console.log('Users fetched successfully:', usersData)
        console.log('Number of users:', usersData?.length || 0)
        setUsers(usersData || [])
      }

      // Fetch course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          course_id,
          enrolled_at,
          course:course_id (
            id,
            title
          )
        `)

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
      } else {
        setEnrollments((enrollmentsData as any) || [])
      }

      // Fetch lesson progress
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select(`
          id,
          user_id,
          lesson_id,
          completed_at,
          lesson:lesson_id (
            id,
            title,
            section_id,
            section:section_id (
              id,
              title,
              course_id
            )
          )
        `)

      if (progressError) {
        console.error('Error fetching lesson progress:', progressError)
      } else {
        setLessonProgress((progressData as any) || [])
      }

      // Fetch assignment submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          user_id,
          assignment_id,
          lesson_id,
          file_url,
          file_name,
          file_size,
          submitted_at,
          assignment:assignment_id (
            id,
            title,
            section_id,
            section:section_id (
              id,
              title,
              course_id
            )
          ),
          lesson:lesson_id (
            id,
            title,
            section_id,
            section:section_id (
              id,
              title,
              course_id
            )
          )
        `)

      if (submissionsError) {
        console.error('Error fetching assignment submissions:', submissionsError)
      } else {
        console.log('Assignment submissions fetched:', submissionsData)
        setAssignmentSubmissions((submissionsData as any) || [])
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserEnrollments = (userId: string) => {
    return enrollments.filter(e => e.user_id === userId)
  }

  const getUserProgress = (userId: string) => {
    return lessonProgress.filter(p => p.user_id === userId)
  }

  const getUserSubmissions = (userId: string) => {
    return assignmentSubmissions.filter(s => s.user_id === userId)
  }

  const downloadFile = async (submission: AssignmentSubmission) => {
    try {
      console.log('Downloading file:', submission)
      console.log('File URL:', submission.file_url)
      console.log('File name:', submission.file_name)
      
      // Handle legacy submissions that might not have file_url
      let fileUrl = submission.file_url
      let downloadSuccess = false
      
      if (!fileUrl) {
        console.log('No file_url found, trying multiple file naming patterns')
        
        // Try different file naming patterns for legacy submissions
        const possibleUrls = [
          // Pattern 1: Just the filename
          submission.file_name,
          // Pattern 2: user_id_filename
          `${submission.user_id}_${submission.file_name}`,
          // Pattern 3: submission_id_filename
          `${submission.id}_${submission.file_name}`,
          // Pattern 4: timestamp_filename (if we can extract from submission)
          submission.file_name.includes('_') ? submission.file_name : null
        ].filter(Boolean)
        
        console.log('Trying possible file URLs:', possibleUrls)
        
        // Try each possible URL until one works
        for (const url of possibleUrls) {
          if (!url) continue
          
          try {
            console.log(`Trying to download: ${url}`)
            const { data, error } = await supabase.storage
              .from('assignment-submissions')
              .download(url)
            
            if (!error && data) {
              console.log(`Successfully found file at: ${url}`)
              fileUrl = url
              downloadSuccess = true
              break
            } else {
              console.log(`Failed to download ${url}:`, error?.message)
            }
          } catch (err) {
            console.log(`Error trying ${url}:`, err)
          }
        }
      } else {
        downloadSuccess = true
      }
      
      if (!downloadSuccess) {
        console.error('Could not find file with any naming pattern:', submission)
        alert('File not found in storage. This might be a legacy submission that needs manual handling.')
        return
      }
      
      console.log('Using file URL:', fileUrl)
      
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .download(fileUrl!)

      if (error) {
        console.error('Error downloading file:', error)
        alert(`Download failed: ${error.message}`)
        return
      }

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = submission.file_name || 'assignment_file'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Download failed. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Loading user data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
            <Users size={20} className="mr-2 sm:w-6 sm:h-6" />
            User Management
          </h2>
          <p className="text-white/70 mt-1 text-sm sm:text-base">Manage students and track their progress</p>
        </div>
        <button
          onClick={fetchUserData}
          className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* User List */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">All Users ({users.length})</h3>
        </div>
        
        <div className="divide-y divide-white/10">
          {users.map((user) => {
            const userEnrollments = getUserEnrollments(user.id)
            const userProgress = getUserProgress(user.id)
            const userSubmissions = getUserSubmissions(user.id)
            
            return (
              <div key={user.id} className="p-4 sm:p-6 hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white/70 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm sm:text-base">{user.full_name || user.email}</h4>
                      {user.full_name && (
                        <p className="text-white/60 text-xs sm:text-sm">{user.email}</p>
                      )}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-white/60 mt-1">
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                          Joined: {formatDate(user.created_at)}
                        </span>
                        <span className="flex items-center">
                          <BookOpen size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                          {userEnrollments.length} courses
                        </span>
                        <span className="flex items-center">
                          <CheckCircle size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                          {userProgress.length} lessons completed
                        </span>
                        <span className="flex items-center">
                          <FileText size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                          {userSubmissions.length} assignments
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setShowUserDetails(true)
                    }}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2 text-xs sm:text-sm"
                  >
                    <Eye size={14} className="sm:w-4 sm:h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/20">
              <h2 className="text-lg sm:text-2xl font-bold text-white">User Details</h2>
              <button 
                onClick={() => setShowUserDetails(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* User Info */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">User Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-white/60">Name:</span>
                    <span className="text-white ml-2">{selectedUser.full_name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Email:</span>
                    <span className="text-white ml-2">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Joined:</span>
                    <span className="text-white ml-2">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Last Sign In:</span>
                    <span className="text-white ml-2">
                      {selectedUser.last_sign_in_at ? formatDate(selectedUser.last_sign_in_at) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Enrollments */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Course Enrollments</h3>
                {getUserEnrollments(selectedUser.id).length > 0 ? (
                  <div className="space-y-2">
                    {getUserEnrollments(selectedUser.id).map((enrollment) => (
                      <div key={enrollment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg space-y-2 sm:space-y-0">
                        <div>
                          <span className="text-white font-medium text-sm sm:text-base">{enrollment.course.title}</span>
                          <span className="text-white/60 text-xs sm:text-sm ml-2">
                            Enrolled: {formatDate(enrollment.enrolled_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">No course enrollments</p>
                )}
              </div>

              {/* Lesson Progress */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Lesson Progress</h3>
                {getUserProgress(selectedUser.id).length > 0 ? (
                  <div className="space-y-2">
                    {getUserProgress(selectedUser.id).map((progress) => (
                      <div key={progress.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <CheckCircle size={14} className="text-green-400 sm:w-4 sm:h-4" />
                          <div>
                            <span className="text-white font-medium text-sm sm:text-base">{progress.lesson.title}</span>
                            <span className="text-white/60 text-xs sm:text-sm ml-2">
                              {progress.lesson.section.title}
                            </span>
                          </div>
                        </div>
                        <span className="text-white/60 text-xs sm:text-sm">
                          {formatDate(progress.completed_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">No lessons completed</p>
                )}
              </div>

              {/* Assignment Submissions */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Assignment Submissions</h3>
                {getUserSubmissions(selectedUser.id).length > 0 ? (
                  <div className="space-y-2">
                    {getUserSubmissions(selectedUser.id).map((submission) => (
                      <div key={submission.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <FileText size={14} className="text-blue-400 sm:w-4 sm:h-4" />
                          <div>
                            <span className="text-white font-medium text-sm sm:text-base">
                              {submission.assignment?.title || submission.lesson?.title || 'Assignment'}
                            </span>
                            <span className="text-white/60 text-xs sm:text-sm ml-2">
                              {submission.assignment?.section?.title || submission.lesson?.section?.title || 'Unknown Section'}
                            </span>
                            <span className="text-white/60 text-xs sm:text-sm ml-2">
                              ({submission.file_name} - {formatFileSize(submission.file_size)})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60 text-xs sm:text-sm">
                            {formatDate(submission.submitted_at)}
                          </span>
                          <button
                            onClick={() => downloadFile(submission)}
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors flex items-center space-x-1 text-xs sm:text-sm"
                          >
                            <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">No assignment submissions</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
