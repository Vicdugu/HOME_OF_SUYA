import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Home of Suya",
  description: "Privacy policy for Home of Suya BBQ booking service",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-brand-orange mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: September 9, 2026</p>

      <div className="space-y-8 text-gray-300">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            Home of Suya ("we," "us," "our," or "Company") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website and use our services.
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-semibold text-brand-orange mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Name, email address, and phone number</li>
            <li>Delivery address and payment information</li>
            <li>Booking preferences and dietary requirements</li>
            <li>Communication preferences and feedback</li>
            <li>Account login credentials (for registered users)</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-orange mb-2 mt-4">2.2 Information Collected Automatically</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Browser type, IP address, and device information</li>
            <li>Pages visited, time spent on site, and referral source</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Location data (if you permit it)</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-orange mb-2 mt-4">2.3 Payment Information</h3>
          <p>
            Payment information (credit card, debit card) is processed by our payment provider
            (SumUp) and is not stored on our servers. We comply with PCI-DSS standards.
          </p>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Process your bookings and deliver our services</li>
            <li>Send order confirmations and delivery notifications</li>
            <li>Improve our website and user experience</li>
            <li>Personalize your experience and preferences</li>
            <li>Send promotional emails (only with your consent)</li>
            <li>Comply with legal obligations and prevent fraud</li>
            <li>Analyze usage patterns to improve our services</li>
          </ul>
        </section>

        {/* Cookie Policy */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies to enhance your browsing experience. You can manage your cookie
            preferences in our Cookie Consent banner. Learn more in our{" "}
            <a href="/cookie-policy" className="text-brand-orange hover:text-orange-400 underline">
              Cookie Policy
            </a>
            .
          </p>
        </section>

        {/* Data Protection */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Data Protection</h2>
          <p>
            We implement industry-standard security measures including encryption, secure
            authentication, and regular security audits. However, no method of transmission is
            100% secure. We recommend using a secure connection and keeping your credentials
            confidential.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights (GDPR/CCPA)</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate data</li>
            <li>Right to delete your data</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to opt-out of marketing communications</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at{" "}
            <a href="mailto:privacy@homeofsuya.com" className="text-brand-orange hover:text-orange-400 underline">
              privacy@homeofsuya.com
            </a>
          </p>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Services</h2>
          <p>
            We may share your information with third parties for specific purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
            <li>
              <strong>Payment Processors:</strong> SumUp (payment processing)
            </li>
            <li>
              <strong>Analytics:</strong> Google Analytics (usage analytics)
            </li>
            <li>
              <strong>Communication:</strong> Resend (email), WhatsApp (notifications)
            </li>
            <li>
              <strong>Delivery:</strong> Your selected delivery provider
            </li>
          </ul>
          <p className="mt-4">
            These providers are bound by confidentiality agreements and comply with data
            protection laws.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Account data: Retained while you have an active account</li>
            <li>Booking history: Retained for 7 years (tax/legal compliance)</li>
            <li>Payment records: Retained for 7 years (tax requirements)</li>
            <li>Cookies: Retained per your preferences (typically 1 year)</li>
            <li>Marketing preferences: Until you unsubscribe</li>
          </ul>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please
            contact us:
          </p>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="font-semibold text-white">Home of Suya</p>
            <p>Email: <a href="mailto:privacy@homeofsuya.com" className="text-brand-orange hover:text-orange-400">privacy@homeofsuya.com</a></p>
            <p>Phone: <a href="tel:+442920000000" className="text-brand-orange hover:text-orange-400">+44 (0)29 2000 0000</a></p>
            <p>Address: Cardiff, Wales, UK</p>
          </div>
        </section>

        {/* Policy Updates */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">10. Policy Updates</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this
            page with an updated "Last Updated" date. Continued use of our services after
            changes constitutes your acceptance of the updated policy.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
        <p>
          For our full Cookie Policy, please visit the{" "}
          <a href="/cookie-policy" className="text-brand-orange hover:text-orange-400 underline">
            Cookie Policy page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
