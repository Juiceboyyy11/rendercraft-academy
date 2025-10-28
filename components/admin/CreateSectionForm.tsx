'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Plus } from 'lucide-react'

interface CreateSectionFormProps {
  courseId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateSectionForm({ courseId, onClose, onSuccess }: CreateSectionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    section_order: 1
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Creating section with data:', {
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        section_order: formData.section_order,
        is_published: true
      })

      const { data, error } = await supabase
        .from('course_sections')
        .insert({
          course_id: courseId,
          title: formData.title,
          description: formData.description,
          section_order: formData.section_order,
          is_published: true
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Section created successfully:', data)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating section:', error)
      alert('Error creating section. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Add New Section</h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition-colors text-white/70"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Section Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              placeholder="e.g., Week 1, Introduction, Basics..."
            />
          </div>

          {/* Section Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Section Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none"
              placeholder="Describe what students will learn in this section..."
            />
          </div>

          {/* Section Order */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Section Order
            </label>
            <input
              type="number"
              name="section_order"
              value={formData.section_order}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              placeholder="1"
            />
            <p className="text-xs text-white/60 mt-2">
              The order this section will appear in the course (1 = first, 2 = second, etc.)
            </p>
          </div>


          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Create Section</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

