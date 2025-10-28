'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) throw error

        // Create user profile if it doesn't exist
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
              role: 'student'
            })

          if (profileError) console.error('Profile error:', profileError)
        }

        toast.success('Welcome back!')
        router.push('/')
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        })

        if (error) throw error

        if (data.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: formData.fullName,
              role: 'student'
            })

          if (profileError) console.error('Profile error:', profileError)
        }

        toast.success('Account created! Please check your email to verify your account.')
        setIsLogin(true) // Switch to login form
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="rendercraft-text text-white text-4xl font-bold tracking-widest mb-4">
            RENDERCRAFT
          </div>
          <p className="text-white/60 text-sm uppercase tracking-wide">
            Academy
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/60 text-sm">
              {isLogin 
                ? 'Sign in to continue your learning journey' 
                : 'Join thousands of students learning 3D animation'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch between login/register */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setFormData({
                  email: '',
                  password: '',
                  fullName: '',
                  confirmPassword: ''
                })
              }}
              className="text-white font-medium hover:text-white/80 transition-colors mt-1"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          {/* Forgot Password */}
          {isLogin && (
            <div className="mt-6 text-center">
              <button className="text-white/60 text-sm hover:text-white/80 transition-colors">
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="text-white/40">
            <div className="text-xs uppercase tracking-wide mb-1">Free Courses</div>
            <div className="text-sm font-medium text-white/60">Start Learning</div>
          </div>
          <div className="text-white/40">
            <div className="text-xs uppercase tracking-wide mb-1">Expert Teachers</div>
            <div className="text-sm font-medium text-white/60">Industry Pros</div>
          </div>
          <div className="text-white/40">
            <div className="text-xs uppercase tracking-wide mb-1">Community</div>
            <div className="text-sm font-medium text-white/60">Join Students</div>
          </div>
        </div>
      </div>
    </div>
  )
}


