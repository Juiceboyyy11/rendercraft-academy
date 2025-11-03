'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreateAssignmentFormProps {
  sectionId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAssignmentForm({ sectionId, onClose, onSuccess }: CreateAssignmentFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    assignment_order: 1,
    is_published: true
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

    if (!formData.title) {
      setError('Assignment title is required.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          section_id: sectionId,
          title: formData.title,
          description: formData.description || null,
          instructions: formData.instructions || null,
          max_points: formData.max_points,
          assignment_order: formData.assignment_order,
          is_published: formData.is_published
        })

      if (error) throw error
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error creating assignment:', err)
      setError(err.message || 'Failed to create assignment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create Assignment</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                placeholder="e.g., Week 1 Final Project"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assignment Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none"
                placeholder="Brief description of what students need to do..."
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Detailed Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none"
                placeholder="Detailed step-by-step instructions for students..."
              />
            </div>

            {/* Max Points */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Points
              </label>
              <input
                type="number"
                name="max_points"
                value={formData.max_points}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Assignment Order */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assignment Order
              </label>
              <input
                type="number"
                name="assignment_order"
                value={formData.assignment_order}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
              />
              <p className="text-xs text-white/60 mt-2">
                Order within the section (1 = first assignment)
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
                Publish immediately (visible to students)
              </label>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center justify-end space-x-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Create Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}






