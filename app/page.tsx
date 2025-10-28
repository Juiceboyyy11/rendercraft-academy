'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Play, Clock, Users, Star, Lock, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'

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

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCourses()
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...')
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Courses fetched:', data)
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
    setUser(session?.user || null)
  }

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  if (loading) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header />
      
      {/* Personalized Welcome Message */}
      {user && user.full_name && (
        <div className="bg-white/5 border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3">
          <div className="container mx-auto">
            <p className="text-white/80 text-sm">
              Welcome back, <span className="text-white font-medium">{user.full_name}</span>! Ready to continue your animation journey?
            </p>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="h-screen sm:min-h-screen relative pt-20">
        {/* Background WebP with Enhanced Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero showreel.webp" 
            alt="RenderCraft Animation Showreel"
            className="w-full h-full object-cover object-center"
            loading="eager"
            sizes="100vw"
          />
          {/* Enhanced gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-screen sm:min-h-screen flex items-start px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                {/* Main Heading */}
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-4xl xs:text-5xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-tight font-lato">
                    <span className="block">Your true</span>
                    <span className="block">animation journey</span>
                    <span className="block">starts here.</span>
                  </h1>
                </div>
                
                {/* Description */}
                <div className="max-w-2xl sm:max-w-3xl">
                  <p className="text-xl sm:text-xl md:text-xl lg:text-2xl xl:text-2xl text-white/90 font-light leading-relaxed font-lato">
                    Clear, fun and practical courses for 3D storytellers.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-6 sm:pt-8 md:pt-10 flex justify-center sm:justify-start">
                  <button 
                    onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border border-white/40 px-12 sm:px-12 md:px-10 lg:px-12 py-6 sm:py-6 md:py-5 lg:py-6 rounded-lg text-white font-semibold hover:border-white/60 hover:bg-white/5 transition-all duration-300 flex items-center space-x-4 sm:space-x-4 text-2xl sm:text-2xl md:text-xl lg:text-2xl"
                  >
                    <span>Our Courses</span>
                    <svg width="24" height="24" className="sm:w-6 sm:h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Courses Section - Cards Only */}
      <section className="py-16 sm:py-20 bg-black px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Why choose our courses?
              </h2>
              <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto px-4">
                We provide comprehensive, industry-focused training that prepares you for real-world animation challenges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center group hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Industry Expertise</h3>
                <p className="text-white/70">Learn from professionals with years of experience in animation and VFX.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center group hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Comprehensive Curriculum</h3>
                <p className="text-white/70">From basics to advanced techniques, covering all aspects of 3D animation.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center group hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Community Support</h3>
                <p className="text-white/70">Join a vibrant community of learners and get feedback on your work.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center group hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Practical Projects</h3>
                <p className="text-white/70">Build real projects that you can add to your portfolio.</p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <button 
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Start Learning Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-12 sm:py-16 bg-black px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Our Courses
            </h2>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto font-light px-4">
              Professional 3D animation courses designed for storytellers and creators.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play size={32} className="text-white/50" />
              </div>
              <p className="text-white/50 text-xl">No courses available yet.</p>
              <p className="text-white/30 text-sm mt-2">Check back soon for new content.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {courses.map((course, index) => {
                console.log('Rendering course:', course.title, 'isLoggedIn:', isLoggedIn)
                return (
                <div key={course.id} className="group">
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
                    {/* Course Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Play size={24} className="text-white ml-1" />
                          </div>
                        </div>
                      )}
                      
                      {/* Course Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          course.is_free 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {course.is_free ? 'FREE' : `$${course.price}`}
                        </span>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                        {course.title}
                      </h3>
                      
                      <div 
                        className="text-white/60 text-sm leading-relaxed mb-3 prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: course.description ? 
                            course.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 
                            'Master professional 3D animation techniques with industry experts.'
                        }}
                      />


                      {/* Course Action Button */}
                      <Link
                        href={`/course/${course.id}`}
                        className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                          isLoggedIn 
                            ? 'bg-white text-black hover:bg-white/90' 
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {isLoggedIn ? (
                          <>
                            <Play size={16} />
                            <span>Start Course</span>
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            <span>Sign In to Access</span>
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-12 sm:py-16 bg-black px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Meet the Founder
              </h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                {/* Founder Image */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border border-white/20">
                    <Image
                      src="/images/Founder.png"
                      alt="Omololu Ogunsola-Paul - Founder"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Founder Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Omololu Ogunsola-Paul
                  </h3>
                  <p className="text-white/80 mb-4 font-medium">
                    Founder & Lead Instructor
                  </p>
                  
                  <p className="text-white/70 leading-relaxed mb-4">
                    With years of experience in 3D animation and VFX, Omololu has worked on numerous 
                    professional projects and understands what it takes to succeed in the industry.
                  </p>

                  {/* Social Links */}
                  <div className="flex justify-center sm:justify-start">
                    <a
                      href="https://www.linkedin.com/in/omololu-ogunsola-paul?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BP5M4cdMKSd%2Bk3PTvPag%2Bxg%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-sm"
                    >
                      <ExternalLink size={14} />
                      <span>Connect on LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

