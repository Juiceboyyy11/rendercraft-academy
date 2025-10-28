'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Play, Clock, Link } from 'lucide-react'

interface CreateLessonFormProps {
  sectionId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLessonForm({ sectionId, onClose, onSuccess }: CreateLessonFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    video_duration: 0,
    is_published: true,
    is_last_video_of_week: false,
    assignment_text: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.title || !formData.video_url) {
      setError('Lesson title and video URL are required.')
      setLoading(false)
      return
    }

    try {
      // Get the next lesson order for this section
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('lesson_order')
        .eq('section_id', sectionId)
        .order('lesson_order', { ascending: false })
        .limit(1)

      const nextOrder = existingLessons && existingLessons.length > 0 
        ? existingLessons[0].lesson_order + 1 
        : 1

        const { error } = await supabase
          .from('lessons')
          .insert({
            section_id: sectionId,
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url,
            video_duration: formData.video_duration || null,
            lesson_order: nextOrder,
            is_published: formData.is_published,
            is_last_video_of_week: formData.is_last_video_of_week,
            assignment_text: formData.is_last_video_of_week ? formData.assignment_text : null,
          })

      if (error) throw error
      onSuccess()
    } catch (err: any) {
      console.error('Error creating lesson:', err)
      setError(err.message || 'Failed to create lesson.')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Add New Video</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Video Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Video Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              placeholder="e.g., Introduction to Extruding"
            />
          </div>

          {/* Video Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Video Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all h-24 resize-none"
              placeholder="Short description of what students will learn in this video..."
            />
          </div>

          {/* YouTube Video URL */}
          <div>
            <label htmlFor="video_url" className="block text-sm font-medium text-white mb-2">
              YouTube Video URL *
            </label>
            <div className="flex items-center space-x-2">
              <Link size={18} className="text-white/70" />
              <input
                type="url"
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <p className="text-xs text-white/60 mt-2">
              Paste the full YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
            </p>
          </div>

          {/* Video Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-white mb-2">
              Video Duration (seconds)
            </label>
            <div className="flex items-center space-x-2">
              <Clock size={18} className="text-white/70" />
              <input
                type="number"
                id="duration"
                value={formData.video_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, video_duration: parseInt(e.target.value) || 0 }))}
                className="w-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                placeholder="300"
                min="0"
              />
              <span className="text-white/70 text-sm">
                {formData.video_duration > 0 && `(${formatDuration(formData.video_duration)})`}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Optional: Duration in seconds (e.g., 300 for 5 minutes)
            </p>
          </div>

          {/* Last Video of Week Checkbox */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_last_video_of_week}
                onChange={(e) => setFormData(prev => ({ ...prev, is_last_video_of_week: e.target.checked }))}
                className="w-5 h-5 text-blue-600 bg-white/5 border border-white/20 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-white">Last Video of Week</span>
                <p className="text-xs text-white/60">
                  Check this if this is the final video of the week. Assignment will appear after this video.
                </p>
              </div>
            </label>
          </div>

          {/* Assignment Text Editor - Only show if Last Video of Week is checked */}
          {formData.is_last_video_of_week && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assignment Instructions *
              </label>
              <textarea
                name="assignment_text"
                value={formData.assignment_text}
                onChange={(e) => setFormData(prev => ({ ...prev, assignment_text: e.target.value }))}
                rows={6}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none"
                placeholder="Write the assignment instructions for students..."
              />
              <p className="text-xs text-white/60 mt-2">
                This text will appear below the video. Students must submit their assignment before marking the lesson complete.
              </p>
            </div>
          )}


          {/* Preview */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-2">Preview</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Play size={16} className="text-white/70" />
                <span className="text-white font-medium">{formData.title || 'Video Title'}</span>
              </div>
              {formData.description && (
                <p className="text-white/70 text-sm">{formData.description}</p>
              )}
              <div className="flex items-center space-x-4 text-xs text-white/60">
                <span>Duration: {formData.video_duration > 0 ? formatDuration(formData.video_duration) : 'Not set'}</span>
                <span className={`px-2 py-1 rounded ${
                  formData.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {formData.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Video...</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>Add Video</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

