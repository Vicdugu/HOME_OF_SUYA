import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Home of Suya",
  description: "Cookie policy and cookie settings for Home of Suya",
};

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-brand-orange mb-2">Cookie Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: September 9, 2026</p>

      <div className="space-y-8 text-gray-300">
        {/* What Are Cookies */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website. They
            contain information about your browsing activity and preferences. Most websites use
            cookies to improve user experience, analyze traffic, and personalize content.
          </p>
        </section>

        {/* Types of Cookies */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Types of Cookies We Use</h2>

          <div className="space-y-6">
            {/* Essential */}
            <div className="border-l-4 border-brand-orange pl-4">
              <h3 className="text-lg font-semibold text-brand-orange mb-2">Essential Cookies</h3>
              <p className="mb-2">
                <strong>Status:</strong> Always enabled (cannot be disabled)
              </p>
              <p className="mb-2">
                <strong>Purpose:</strong> Required for basic site functionality
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Session management and login authentication</li>
                <li>Shopping cart functionality</li>
                <li>Security and fraud prevention</li>
                <li>CSRF protection</li>
                <li>Account preferences</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                <strong>Examples:</strong> admin_session, cart_id, csrf_token, user_id
              </p>
            </div>

            {/* Analytics */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Analytics Cookies</h3>
              <p className="mb-2">
                <strong>Status:</strong> Opt-in (you control via cookie banner)
              </p>
              <p className="mb-2">
                <strong>Purpose:</strong> Understand how users interact with our site
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Page views and user journeys</li>
                <li>Session duration and engagement metrics</li>
                <li>Traffic sources and user demographics</li>
                <li>Performance analysis and optimization</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                <strong>Provider:</strong> Google Analytics
              </p>
              <p className="text-sm text-gray-400">
                <strong>Retention:</strong> Up to 2 years
              </p>
            </div>

            {/* Marketing */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-semibold text-pink-400 mb-2">Marketing Cookies</h3>
              <p className="mb-2">
                <strong>Status:</strong> Opt-in (you control via cookie banner)
              </p>
              <p className="mb-2">
                <strong>Purpose:</strong> Personalize ads and track marketing effectiveness
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Facebook Pixel for retargeting</li>
                <li>Google Ads conversion tracking</li>
                <li>Social media engagement tracking</li>
                <li>Email campaign tracking</li>
                <li>Cross-site behavior tracking</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                <strong>Providers:</strong> Facebook, Google, LinkedIn
              </p>
              <p className="text-sm text-gray-400">
                <strong>Retention:</strong> Up to 1 year
              </p>
            </div>

            {/* Preferences */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Preference Cookies</h3>
              <p className="mb-2">
                <strong>Status:</strong> Opt-in (you control via cookie banner)
              </p>
              <p className="mb-2">
                <strong>Purpose:</strong> Remember your preferences for better experience
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Language and locale preferences</li>
                <li>Dark mode / light mode preference</li>
                <li>Font size and accessibility settings</li>
                <li>Previously viewed meals and bookings</li>
                <li>User interests and dietary restrictions</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                <strong>Retention:</strong> Until you clear cookies or update preferences
              </p>
            </div>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Third-Party Cookies</h2>
          <p className="mb-4">
            Third-party services we use may also set cookies:
          </p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-2 text-brand-orange">Service</th>
                <th className="text-left py-2 px-2 text-brand-orange">Purpose</th>
                <th className="text-left py-2 px-2 text-brand-orange">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr>
                <td className="py-2 px-2">Google Analytics</td>
                <td className="py-2 px-2">Website traffic analysis</td>
                <td className="py-2 px-2">Analytics</td>
              </tr>
              <tr>
                <td className="py-2 px-2">SumUp</td>
                <td className="py-2 px-2">Payment processing</td>
                <td className="py-2 px-2">Essential</td>
              </tr>
              <tr>
                <td className="py-2 px-2">Facebook Pixel</td>
                <td className="py-2 px-2">Retargeting & tracking</td>
                <td className="py-2 px-2">Marketing</td>
              </tr>
              <tr>
                <td className="py-2 px-2">Google Ads</td>
                <td className="py-2 px-2">Conversion tracking</td>
                <td className="py-2 px-2">Marketing</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Managing Cookies */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. How to Manage Cookies</h2>

          <h3 className="text-lg font-semibold text-brand-orange mb-2">Via Our Cookie Banner</h3>
          <p className="mb-3">
            When you visit our site, you'll see a cookie consent banner at the bottom. You can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>
              <strong>Accept All:</strong> Enable all cookies (essential + analytics + marketing + preferences)
            </li>
            <li>
              <strong>Customize:</strong> Choose which cookie types to enable
            </li>
            <li>
              <strong>Reject All:</strong> Disable all non-essential cookies
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-orange mb-2">Via Browser Settings</h3>
          <p className="mb-2">
            You can also control cookies through your browser:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
            </li>
            <li>
              <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
            </li>
            <li>
              <strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and other site data
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-400">
            Note: Disabling cookies may affect some website functionality.
          </p>
        </section>

        {/* Do Not Track */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Do Not Track (DNT)</h2>
          <p>
            Some browsers include a Do Not Track feature. While we respect your privacy preferences,
            we don't currently respond to DNT signals. Instead, please use our cookie consent banner
            to manage your preferences.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
          <p className="mb-4">
            Under GDPR and other privacy laws, you have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Withdraw your cookie consent at any time</li>
            <li>Request what cookies we have stored</li>
            <li>Request deletion of your cookie data</li>
            <li>Opt-out of specific cookie types</li>
            <li>Request a copy of your data</li>
          </ul>
        </section>

        {/* Cookie Examples */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. Example Cookies</h2>
          <div className="bg-gray-800 rounded-lg p-4 text-sm font-mono space-y-2">
            <div className="text-gray-400">
              <span className="text-gray-300">// Essential</span>
            </div>
            <div className="text-gray-300">admin_session: [encrypted JWT token]</div>
            <div className="text-gray-300">cart_id: [unique shopping cart ID]</div>
            <div className="text-gray-300">csrf_token: [CSRF protection token]</div>

            <div className="text-gray-400 mt-4">
              <span className="text-gray-300">// Analytics</span>
            </div>
            <div className="text-gray-300">_ga: [Google Analytics ID]</div>
            <div className="text-gray-300">_gid: [Google Analytics session ID]</div>

            <div className="text-gray-400 mt-4">
              <span className="text-gray-300">// Marketing</span>
            </div>
            <div className="text-gray-300">_fbp: [Facebook Pixel ID]</div>
            <div className="text-gray-300">goog_pem_conversion: [Google conversion data]</div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">8. Questions?</h2>
          <p>
            If you have questions about our cookie usage or this Cookie Policy, please contact us:
          </p>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="font-semibold text-white">Home of Suya</p>
            <p>Email: <a href="mailto:privacy@homeofsuya.com" className="text-brand-orange hover:text-orange-400">privacy@homeofsuya.com</a></p>
            <p>Phone: <a href="tel:+442920000000" className="text-brand-orange hover:text-orange-400">+44 (0)29 2000 0000</a></p>
            <p>Address: Cardiff, Wales, UK</p>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">9. Policy Updates</h2>
          <p>
            We may update this Cookie Policy from time to time. Changes will be effective
            immediately upon posting. We'll update the "Last Updated" date above.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
        <p>
          For our full Privacy Policy, please visit the{" "}
          <a href="/privacy-policy" className="text-brand-orange hover:text-orange-400 underline">
            Privacy Policy page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
