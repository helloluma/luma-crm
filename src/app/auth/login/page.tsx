'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'auth_callback_error':
          setError('Authentication failed. Please try again.')
          break
        case 'email_confirmation_error':
          setError('Email confirmation failed. Please try again.')
          break
        case 'unexpected_error':
          setError('An unexpected error occurred. Please try again.')
          break
        case 'invalid_callback':
          setError('Invalid authentication link. Please try again.')
          break
        default:
          setError('An error occurred. Please try again.')
      }
    }
  }, [searchParams])

  const goToLogin = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/luma_logo.svg" alt="Luma" className="w-32 h-8" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Authentication Error
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            There was an issue with your authentication. Please try logging in again.
          </p>

          {/* Action Button */}
          <button
            onClick={goToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}


