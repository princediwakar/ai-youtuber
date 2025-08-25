'use client'

import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center mb-8">
            <Shield className="mr-3 text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  When you use Universal YouTube Uploader, we collect information necessary to provide our service:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture from Google's OAuth service.</li>
                  <li><strong>YouTube Channel Data:</strong> We access your YouTube channel to create playlists and upload videos on your behalf.</li>
                  <li><strong>Video Files:</strong> Video files you upload are temporarily processed and sent directly to YouTube. We do not store your video files.</li>
                  <li><strong>Usage Data:</strong> We may collect information about how you use our service for improvement purposes.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <div className="text-gray-700 space-y-3">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload videos to your YouTube channel</li>
                  <li>Create and manage playlists on your behalf</li>
                  <li>Generate AI-powered descriptions and tags for your videos</li>
                  <li>Provide and improve our service</li>
                  <li>Communicate with you about our service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Storage and Security</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  <strong>No Video Storage:</strong> Your video files are not stored on our servers. They are processed temporarily and uploaded directly to YouTube.
                </p>
                <p>
                  <strong>Authentication:</strong> We use Google OAuth for secure authentication. Your Google credentials are never stored on our servers.
                </p>
                <p>
                  <strong>Data Protection:</strong> We implement appropriate technical and organizational measures to protect your personal information.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
              <div className="text-gray-700 space-y-3">
                <p>Our service integrates with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google/YouTube:</strong> For authentication and video uploading</li>
                  <li><strong>DeepSeek API:</strong> For AI-powered content analysis and generation</li>
                </ul>
                <p>
                  These third-party services have their own privacy policies that govern how they handle your data.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
              <div className="text-gray-700 space-y-3">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Revoke access to your Google account at any time</li>
                  <li>Request deletion of your account data</li>
                  <li>Access information about how your data is used</li>
                  <li>Contact us with privacy-related questions</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We retain your information only as long as necessary to provide our service. Video files are not stored beyond the upload process. Account information is retained until you revoke access or delete your account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to This Policy</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  If you have questions about this Privacy Policy or our data practices, please contact us.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}