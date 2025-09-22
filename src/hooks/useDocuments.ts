import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Document, DocumentWithClient, DocumentInsert } from '@/types'

interface UseDocumentsOptions {
  clientId?: string
  autoFetch?: boolean
}

interface UseDocumentsReturn {
  documents: DocumentWithClient[]
  loading: boolean
  error: string | null
  uploadDocument: (file: File, clientId: string) => Promise<Document>
  deleteDocument: (documentId: string) => Promise<void>
  downloadDocument: (document: Document) => Promise<void>
  previewDocument: (document: Document) => Promise<string>
  refreshDocuments: () => Promise<void>
}

export function useDocuments({ 
  clientId, 
  autoFetch = true 
}: UseDocumentsOptions = {}): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentWithClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async (targetClientId?: string) => {
    if (!targetClientId && !clientId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select(`
          *,
          client:clients(name),
          uploaded_by_profile:profiles!uploaded_by(name, email)
        `)
        .eq('client_id', targetClientId || clientId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setDocuments(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const uploadDocument = useCallback(async (file: File, targetClientId: string): Promise<Document> => {
    try {
      setError(null)

      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported')
      }

      // Generate unique file path
      const fileId = `${Date.now()}-${file.name}`
      const filePath = `client-documents/${targetClientId}/${fileId}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Create document record
      const documentData: DocumentInsert = {
        client_id: targetClientId,
        filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      }

      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([filePath])
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Update local state if this is for the current client
      if (targetClientId === clientId) {
        await fetchDocuments()
      }

      return document as Document
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [clientId, fetchDocuments])

  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      setError(null)

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const downloadDocument = useCallback(async (document: Document): Promise<void> => {
    try {
      setError(null)

      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`)
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const previewDocument = useCallback(async (document: Document): Promise<string> => {
    try {
      setError(null)

      const { data, error: previewError } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600) // 1 hour expiry

      if (previewError) {
        throw new Error(`Preview failed: ${previewError.message}`)
      }

      return data.signedUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Preview failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const refreshDocuments = useCallback(async (): Promise<void> => {
    await fetchDocuments()
  }, [fetchDocuments])

  // Auto-fetch documents on mount if clientId is provided
  useEffect(() => {
    if (autoFetch && clientId) {
      fetchDocuments()
    }
  }, [autoFetch, clientId, fetchDocuments])

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    previewDocument,
    refreshDocuments
  }
}