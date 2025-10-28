'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { isAdmin } from '@/lib/admin'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
    setUser(session?.user || null)
    
    // Check if user is admin
    if (session?.user) {
      const adminStatus = await isAdmin(session.user.id)
      setIsAdminUser(adminStatus)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-xl z-50">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="rendercraft-text text-white text-lg font-bold tracking-widest">
              RENDERCRAFT
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              Our Courses
            </button>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                {isAdminUser && (
                  <Link 
                    href="/admin"
                    className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    <Settings size={16} />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 border border-white/20 rounded text-white text-sm font-medium hover:border-white/40 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/auth/signin"
                className="border border-white/20 px-4 py-2 rounded text-white text-sm font-medium hover:border-white/40 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl">
            <nav className="container py-6 space-y-4">
              <button 
                onClick={() => {
                  document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })
                  setIsMenuOpen(false)
                }}
                className="block text-white/70 hover:text-white transition-colors text-base font-medium w-full text-left"
              >
                Our Courses
              </button>
              
              {isLoggedIn ? (
                <div className="space-y-3">
                  {isAdminUser && (
                    <Link 
                      href="/admin"
                      className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded text-white text-sm font-medium hover:bg-white/20 transition-colors w-fit"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 px-4 py-2 border border-white/20 rounded text-white text-sm font-medium hover:border-white/40 transition-colors w-fit"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link 
                  href="/auth/signin"
                  className="block border border-white/20 px-4 py-2 rounded text-white text-sm font-medium hover:border-white/40 transition-colors w-fit"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
