'use client'

import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
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
            <FileText className="mr-3 text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  By accessing and using Universal YouTube Uploader ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Universal YouTube Uploader is a web application that helps users upload videos to their YouTube channels with enhanced features including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bulk video uploads</li>
                  <li>Automatic playlist creation and management</li>
                  <li>AI-powered video descriptions and tags</li>
                  <li>Video organization and metadata enhancement</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <div className="text-gray-700 space-y-3">
                <p>You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                  <li>Only upload content that you own or have the right to distribute</li>
                  <li>Comply with YouTube's Terms of Service and Community Guidelines</li>
                  <li>Not upload copyrighted material without proper authorization</li>
                  <li>Not use the Service to upload harmful, offensive, or illegal content</li>
                  <li>Be responsible for all content uploaded through your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Content and Copyright</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  <strong>Your Content:</strong> You retain ownership of all content you upload through the Service. You grant us a limited license to process and upload your content to YouTube on your behalf.
                </p>
                <p>
                  <strong>Copyright Compliance:</strong> You must ensure all uploaded content complies with copyright laws. We are not responsible for copyright violations resulting from your uploads.
                </p>
                <p>
                  <strong>Content Removal:</strong> We reserve the right to remove access to any content that violates these terms or applicable laws.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. YouTube Integration</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Our Service integrates with YouTube's API. By using our Service, you also agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>YouTube's Terms of Service</li>
                  <li>Google's Privacy Policy</li>
                  <li>YouTube's API Terms of Service</li>
                </ul>
                <p>
                  We are not affiliated with Google or YouTube and are not responsible for changes to YouTube's policies or API.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Limitations and Restrictions</h2>
              <div className="text-gray-700 space-y-3">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Upload malicious code or content</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Use automated systems to access the Service beyond normal usage</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. AI-Generated Content</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Our Service uses AI to generate video descriptions, titles, and tags. While we strive for accuracy, AI-generated content may not always be perfect. You are responsible for reviewing and approving all content before publication.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We strive to maintain high availability but cannot guarantee uninterrupted service. The Service may be temporarily unavailable due to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintenance and updates</li>
                  <li>Third-party service disruptions</li>
                  <li>Technical difficulties</li>
                  <li>Force majeure events</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Account Termination</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may terminate or suspend your access to the Service at any time for violation of these Terms. You may discontinue use of the Service at any time by revoking access to your Google account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We reserve the right to modify these Terms at any time. Changes will be effective upon posting to this page. Continued use of the Service constitutes acceptance of updated Terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved in the appropriate jurisdiction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  If you have questions about these Terms of Service, please contact us.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}