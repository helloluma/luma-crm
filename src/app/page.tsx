'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), { ssr: false })

export default function Home() {
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'email_confirmed') {
      setShowSuccessMessage(true)
      // Hide the message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [searchParams])

  const handleSuccess = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
  }

  const goToRegister = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/register'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Email Confirmed!</span>
            </div>
            <p className="text-sm">Your account has been activated. You can now log in below.</p>
          </div>
        )}
        
        <LoginForm onSuccess={handleSuccess} onRegister={goToRegister} />
      </div>
    </div>
  );
}