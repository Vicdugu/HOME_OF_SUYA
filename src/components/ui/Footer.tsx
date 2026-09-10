export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-100 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-4">
          {/* Brand Section */}
          <div>
            <h3 className="text-sm font-semibold mb-1.5 leading-tight">Home of Suya</h3>
            <p className="text-gray-400 text-xs leading-snug">
              A genuine taste of home. Authentic Northern Nigerian Suya with all the right spices.
            </p>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-sm font-semibold mb-2 leading-tight">Contact Us</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <a href="mailto:homeofsuya@gmail.com" className="text-gray-400 hover:text-white transition leading-snug">
                  Email: homeofsuya@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:07467767223" className="text-gray-400 hover:text-white transition leading-snug">
                  Phone: 0746 7767223
                </a>
              </li>
            </ul>
          </div>

          {/* Location Section */}
          <div>
            <h4 className="text-sm font-semibold mb-2 leading-tight">Location</h4>
            <p className="text-gray-400 text-xs mb-1 leading-snug">Cardiff, United Kingdom</p>
            <p className="text-gray-400 text-xs leading-snug">Nationwide next‑day delivery available</p>
          </div>

          {/* Legal & Policies Section */}
          <div>
            <h4 className="text-sm font-semibold mb-2 leading-tight">Legal</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <a href="/terms-and-conditions" className="text-gray-400 hover:text-brand-orange transition leading-snug">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-gray-400 hover:text-brand-orange transition leading-snug">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="text-gray-400 hover:text-brand-orange transition leading-snug">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-center text-gray-400 text-xs leading-snug">
            © 2026 Home of Suya. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
