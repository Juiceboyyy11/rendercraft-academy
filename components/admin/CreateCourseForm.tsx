'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Upload, Save } from 'lucide-react'
import RichTextEditor from './RichTextEditor'

interface CreateCourseFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCourseForm({ onClose, onSuccess }: CreateCourseFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [isFree, setIsFree] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadThumbnail = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `course-thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let thumbnailUrl = null
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile)
        if (!thumbnailUrl) {
          throw new Error('Failed to upload thumbnail')
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('courses')
        .insert({
          title,
          description,
          thumbnail_url: thumbnailUrl,
          price: isFree ? 0 : price,
          is_free: isFree,
          is_published: isPublished,
          created_by: user.id
        })

      if (error) {
        throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Course Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
              placeholder="Enter course title"
              required
            />
          </div>

          {/* Course Description */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Course Description
            </label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe what students will learn in this course..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Pricing
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={isFree}
                    onChange={() => setIsFree(true)}
                    className="text-white"
                  />
                  <span className="text-white">Free Course</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={!isFree}
                    onChange={() => setIsFree(false)}
                    className="text-white"
                  />
                  <span className="text-white">Paid Course</span>
                </label>
              </div>
            </div>

            {!isFree && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Publish Status */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Publish Status
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 text-green-600 bg-white/10 border-white/30 rounded"
              />
              <span className="text-white">Publish this course immediately</span>
            </label>
            <p className="text-white/60 text-sm mt-2">
              Published courses will be visible to students. Unpublished courses are drafts.
            </p>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Course Thumbnail
            </label>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <Upload size={16} className="text-white" />
                  <span className="text-white text-sm">Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {thumbnailFile && (
                  <span className="text-white/70 text-sm">
                    {thumbnailFile.name}
                  </span>
                )}
              </div>

              {thumbnailPreview && (
                <div className="w-full max-w-xs">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-32 object-cover rounded-lg border border-white/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
