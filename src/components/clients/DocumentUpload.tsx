'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'
import type { Document, DocumentInsert } from '@/types'

interface DocumentUploadProps {
  clientId: string
  onUploadComplete?: (document: Document) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // in bytes
  allowedFileTypes?: string[]
  className?: string
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
]

export function DocumentUpload({
  clientId,
  onUploadComplete,
  onUploadError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes = DEFAULT_ALLOWED_TYPES,
  className = ''
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({})

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`
    }

    if (!allowedFileTypes.includes(file.type)) {
      return 'File type not supported'
    }

    return null
  }, [maxFileSize, allowedFileTypes])

  const uploadFile = async (file: File): Promise<Document | null> => {
    const fileId = `${Date.now()}-${file.name}`
    const filePath = `client-documents/${clientId}/${fileId}`

    try {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }))
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))

      // Create document record in database
      const documentData: DocumentInsert = {
        client_id: clientId,
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

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
      setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }))

      return document as Document
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }))
      throw error
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)

    try {
      for (const file of acceptedFiles) {
        const validationError = validateFile(file)
        if (validationError) {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }))
          onUploadError?.(validationError)
          continue
        }

        try {
          const document = await uploadFile(file)
          if (document) {
            onUploadComplete?.(document)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          onUploadError?.(errorMessage)
        }
      }
    } finally {
      setUploading(false)
      // Clear status after 3 seconds
      setTimeout(() => {
        setUploadProgress({})
        setUploadStatus({})
      }, 3000)
    }
  }, [clientId, validateFile, uploadFile, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    disabled: uploading
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: 'uploading' | 'success' | 'error') => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
            <p className="text-sm text-gray-500">
              Supported: PDF, DOC, DOCX, Images, TXT
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(uploadStatus[filename] || 'uploading')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}