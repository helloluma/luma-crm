'use client'

import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: January 1, 2025</p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              At Luma CRM, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our customer relationship management platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We collect personal information that you voluntarily provide when using Luma CRM, including:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Name, email address, and contact information</li>
              <li>Account registration and professional information</li>
              <li>Payment and billing information</li>
              <li>Client data you input into the CRM system</li>
              <li>Communication preferences and settings</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-3">Usage Information</h3>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We automatically collect information about how you use our service:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Log data (IP address, browser type, operating system)</li>
              <li>Usage patterns and feature interactions</li>
              <li>Device information and unique identifiers</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Provide, operate, and maintain our CRM service</li>
              <li>Process transactions and manage your account</li>
              <li>Communicate with you about your account and our services</li>
              <li>Provide customer support and technical assistance</li>
              <li>Improve our service and develop new features</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in these circumstances:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>With your explicit consent or at your direction</li>
              <li>With trusted service providers who assist in operating our platform</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To protect the rights, property, or safety of Luma CRM or our users</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication protocols</li>
              <li>Employee training on data privacy and security</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              You have certain rights regarding your personal information:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Access and review your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, remember your preferences, analyze usage patterns, and ensure security. You can control cookie preferences through your browser settings.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services. When you close your account, we will delete or anonymize your personal data within a reasonable timeframe, unless required to retain it for legal purposes.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Our service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites and encourage you to read their privacy policies.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Our service is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
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


