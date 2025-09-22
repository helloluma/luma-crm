'use client'

import { useState, useEffect } from 'react'
import { File, Download, Trash2, Eye, Calendar, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Document, DocumentWithClient } from '@/types'

interface DocumentListProps {
  clientId: string
  documents?: Document[]
  onDocumentDeleted?: (documentId: string) => void
  onDocumentError?: (error: string) => void
  className?: string
}

export function DocumentList({
  clientId,
  documents: initialDocuments,
  onDocumentDeleted,
  onDocumentError,
  className = ''
}: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentWithClient[]>(initialDocuments || [])
  const [loading, setLoading] = useState(!initialDocuments)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!initialDocuments) {
      fetchDocuments()
    }
  }, [clientId, initialDocuments])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          client:clients(name),
          uploaded_by_profile:profiles!uploaded_by(name, email)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setDocuments(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents'
      onDocumentError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (error) {
        throw new Error(`Download failed: ${error.message}`)
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = document.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed'
      onDocumentError?.(errorMessage)
    }
  }

  const previewDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600) // 1 hour expiry

      if (error) {
        throw new Error(`Preview failed: ${error.message}`)
      }

      // Open in new tab for preview
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Preview failed'
      onDocumentError?.(errorMessage)
    }
  }

  const deleteDocument = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.filename}"?`)) {
      return
    }

    try {
      setDeletingIds(prev => new Set(prev).add(document.id))

      // Delete from database first
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError.message)
        // Don't throw here as the database record is already deleted
      }

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      onDocumentDeleted?.(document.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      onDocumentError?.(errorMessage)
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(document.id)
        return newSet
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <File className="h-5 w-5 text-green-600" />
    }
    if (mimeType === 'application/pdf') {
      return <File className="h-5 w-5 text-red-600" />
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <File className="h-5 w-5 text-blue-600" />
    }
    return <File className="h-5 w-5 text-gray-600" />
  }

  const canPreview = (mimeType: string): boolean => {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/')
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-5 w-5 bg-gray-300 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {getFileIcon(document.mime_type || '')}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {document.filename}
              </h4>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(document.created_at)}</span>
                </span>
                {document.file_size && (
                  <span>{formatFileSize(document.file_size)}</span>
                )}
                {document.uploaded_by_profile && (
                  <span className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{document.uploaded_by_profile.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {canPreview(document.mime_type || '') && (
              <button
                onClick={() => previewDocument(document)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Preview document"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => downloadDocument(document)}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Download document"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteDocument(document)}
              disabled={deletingIds.has(document.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete document"
            >
              {deletingIds.has(document.id) ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}