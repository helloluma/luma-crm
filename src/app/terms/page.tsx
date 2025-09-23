'use client'

import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()

  const handleBackToApp = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Luma CRM</span>
            </div>
            <button 
              onClick={handleBackToApp}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600">Last updated: January 1, 2025</p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              By accessing and using Luma CRM ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Luma CRM is a customer relationship management platform designed specifically for real estate professionals. Our service provides tools for managing clients, tracking deals, scheduling appointments, and streamlining real estate business operations.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Registration and Account Security</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              To use Luma CRM, you must register for an account and provide accurate, complete information. You are responsible for:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring your contact information remains current and accurate</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              You agree to use Luma CRM only for lawful purposes and in accordance with these Terms. You may not:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Use the service to store or transmit illegal, harmful, or offensive content</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use the service to send spam or unsolicited communications</li>
              <li>Reverse engineer, decompile, or attempt to extract source code from our service</li>
              <li>Use automated scripts or bots to access the service</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Subscription and Payment Terms</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Luma CRM operates on a subscription basis. By subscribing to our service:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>You agree to pay all applicable fees for your chosen plan</li>
              <li>Payments are processed automatically on your billing cycle</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Refunds are provided according to our refund policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data and Privacy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy. By using our service, you consent to the collection and use of information as outlined in our Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              In no event shall Luma CRM, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to the service immediately, without prior notice, if you breach these Terms. Upon termination, your right to use the service will cease immediately. You may terminate your account at any time by contacting us.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the service. Your continued use of the service after such modifications constitutes acceptance of the updated Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-medium text-gray-900">Luma CRM</p>
              <p className="text-gray-700">Email: hello@useluma.io</p>
              <p className="text-gray-700">Website: www.useluma.io</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">©2025 Luma CRM - All rights reserved</p>
          <div className="flex justify-center space-x-6 mt-2">
            <button 
              onClick={() => router.push('/terms')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => router.push('/privacy')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Privacy Policy
            </button>
            <a href="mailto:hello@useluma.io" className="text-sm text-gray-500 hover:text-gray-700">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}


