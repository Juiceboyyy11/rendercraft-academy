'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAdmin, getCurrentUser } from '@/lib/admin'
import { Plus, Edit, Trash2, Eye, Users, BookOpen, MessageSquare, Image } from 'lucide-react'
import CourseManagement from '@/components/admin/CourseManagement'
import UserManagement from '@/components/admin/UserManagement'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('courses')
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const adminStatus = await isAdmin(currentUser.id)
        setIsAdminUser(adminStatus)
        
        if (!adminStatus) {
          router.push('/')
        }
      } else {
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Access Denied</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Admin Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white rendercraft-text">RENDERCRAFT</h1>
              <p className="text-white/70 text-xs sm:text-sm">Admin Dashboard</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-white/70 text-xs sm:text-sm break-all">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 sm:gap-0 sm:space-x-8 overflow-x-auto">
            {[
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
              { id: 'portfolio', label: 'Portfolio', icon: Image },
              { id: 'users', label: 'Users', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 sm:py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                <tab.icon size={16} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {activeTab === 'courses' && <CourseManagement />}

        {activeTab === 'testimonials' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Testimonials Management</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors">
                <Plus size={20} />
                <span>Add Testimonial</span>
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/70">Testimonials management interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Portfolio Management</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors">
                <Plus size={20} />
                <span>Add Portfolio Item</span>
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/70">Portfolio management interface will be implemented here.</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  )
}
