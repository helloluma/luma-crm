'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { DocumentUpload } from './DocumentUpload'
import { DocumentList } from './DocumentList'
import type { Document } from '@/types'

interface DocumentManagerProps {
  clientId: string
  clientName?: string
  className?: string
}

export function DocumentManager({ clientId, clientName, className = '' }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleUploadComplete = (document: Document) => {
    setDocuments(prev => [document, ...prev])
    setNotification({
      type: 'success',
      message: `"${document.filename}" uploaded successfully`
    })
    setShowUpload(false)
    
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000)
  }

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: error
    })
    
    // Clear notification after 5 seconds for errors
    setTimeout(() => setNotification(null), 5000)
  }

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setNotification({
      type: 'success',
      message: 'Document deleted successfully'
    })
    
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000)
  }

  const handleDocumentError = (error: string) => {
    setNotification({
      type: 'error',
      message: error
    })
    
    // Clear notification after 5 seconds for errors
    setTimeout(() => setNotification(null), 5000)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-gray-700" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            {clientName && (
              <p className="text-sm text-gray-600">for {clientName}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`
            flex items-center space-x-3 p-4 rounded-lg border
            ${notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
            }
          `}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-current hover:opacity-75"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Upload New Document</h4>
          <DocumentUpload
            clientId={clientId}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <DocumentList
            clientId={clientId}
            documents={documents}
            onDocumentDeleted={handleDocumentDeleted}
            onDocumentError={handleDocumentError}
          />
        </div>
      </div>
    </div>
  )
}