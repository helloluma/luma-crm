'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const RegisterForm = dynamic(() => import('@/components/auth/RegisterForm'), { ssr: false })

export default function RegisterPage() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  const handleSuccess = (email?: string) => {
    setUserEmail(email || '')
    setShowConfirmation(true)
  }

  const goToLogin = () => {
    router.push('/')
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src="/luma_logo.svg" alt="Luma" className="w-32 h-8" />
            </div>

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Check Your Email
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent a confirmation email to{' '}
              <span className="font-medium text-gray-900">{userEmail}</span>.
              Please check your inbox and click the confirmation link to activate your account.
            </p>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={goToLogin}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </button>
              
              <button
                onClick={() => setShowConfirmation(false)}
                className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:text-gray-800 transition-colors"
              >
                Try Different Email
              </button>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-6">
              Didn't receive an email? Contact support if the problem persists.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <RegisterForm onSuccess={handleSuccess} onLogin={goToLogin} />
      </div>
    </div>
  )
}
