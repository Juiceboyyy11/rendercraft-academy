'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Save } from 'lucide-react'

interface Section {
  id: string
  title: string
  description: string | null
  section_order: number
  is_published: boolean
  course_id: string
}

interface EditSectionFormProps {
  section: Section
  onClose: () => void
  onSuccess: (updatedSection: Partial<Section>) => void
}

export default function EditSectionForm({ section, onClose, onSuccess }: EditSectionFormProps) {
  const [formData, setFormData] = useState({
    title: section.title,
    description: section.description || '',
    section_order: section.section_order,
    is_published: section.is_published
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updatedSection = {
        title: formData.title,
        description: formData.description || null,
        section_order: formData.section_order,
        is_published: formData.is_published
      }

      console.log('EditSectionForm - calling onSuccess with:', updatedSection)
      onSuccess(updatedSection)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to update section')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900 border border-white/20 rounded-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Edit Section</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Section Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                placeholder="e.g., Week 1: Introduction"
                required
              />
            </div>

            {/* Description */}
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
              />
              <p className="text-xs text-white/60 mt-2">
                Order within the course (1 = first section)
              </p>
            </div>

            {/* Published */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-white/5 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm text-white">
                Publish section (visible to students)
              </label>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 sm:px-6 sm:py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Update Section</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
