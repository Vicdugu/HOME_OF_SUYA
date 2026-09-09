export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-100 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Home of Suya</h3>
            <p className="text-gray-400 text-sm">
              A genuine taste of home. Authentic Northern Nigerian Suya with all the right spices.
            </p>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-md font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:homeofsuya@gmail.com" className="text-gray-400 hover:text-white transition">
                  Email: homeofsuya@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:07467767223" className="text-gray-400 hover:text-white transition">
                  Phone: 0746 7767223
                </a>
              </li>
            </ul>
          </div>

          {/* Location Section */}
          <div>
            <h4 className="text-md font-semibold mb-4">Location</h4>
            <p className="text-gray-400 text-sm mb-2">Cardiff, United Kingdom</p>
            <p className="text-gray-400 text-sm">Nationwide next‑day delivery available</p>
          </div>

          {/* Legal & Policies Section */}
          <div>
            <h4 className="text-md font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms-and-conditions" className="text-gray-400 hover:text-brand-orange transition">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-gray-400 hover:text-brand-orange transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="text-gray-400 hover:text-brand-orange transition">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © 2026 Home of Suya. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
