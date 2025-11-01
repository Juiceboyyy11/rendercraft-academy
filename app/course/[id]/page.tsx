import { supabase } from '@/lib/supabase'
import CourseDetailClient from '@/app/course/[id]/CourseDetailClient'

// Generate static params for all published courses
export async function generateStaticParams() {
    try {
    const { data: courses } = await supabase
        .from('courses')
      .select('id')
        .eq('is_published', true)
    
    return courses?.map((course) => ({
      id: course.id,
    })) || []
    } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default function CourseDetailPage() {
  return <CourseDetailClient />
}