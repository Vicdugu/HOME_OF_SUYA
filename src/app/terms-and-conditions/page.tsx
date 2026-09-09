import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Home of Suya",
  description: "Terms and conditions for Home of Suya BBQ booking service",
};

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-brand-orange mb-2">Terms & Conditions</h1>
      <p className="text-gray-500 mb-8">Last updated: September 2026</p>

      <div className="space-y-8 text-gray-300">
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            Welcome to Home of Suya. By placing an order through our website or any of our sales 
            channels, you agree to the terms and conditions outlined below. Please read them carefully 
            before completing your purchase.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Products & Orders</h2>
          <p className="mb-4">
            All our Suya products are freshly prepared. Once an order is placed and payment is confirmed, 
            you will receive an email confirmation with your order details.
          </p>
          <p>
            We reserve the right to refuse or cancel orders if an item is unavailable or if there is 
            an issue with payment or delivery information.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Delivery Terms</h2>

          <h3 className="text-lg font-semibold text-brand-orange mb-3">3.1 UK Nationwide Delivery (Royal Mail Next Day)</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>We ship nationwide using <strong>Royal Mail Tracked 24 (Next Day Delivery)</strong>.</li>
            <li>All orders must be placed for 24hrs to receive orders for orders dispatched to Royal Mail.</li>
            <li>There shall be no deliveries on Sunday.</li>
            <li>Royal Mail aims to deliver the next working day, but delays may occur due to weather, strikes, or operational issues.</li>
            <li>Once dispatched, you will receive a tracking number.</li>
            <li>Home of Suya is not responsible for delays caused by Royal Mail, however we shall track all orders.</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-orange mb-3">3.2 Cardiff & Same-City Delivery</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Same-city delivery is available within Cardiff and selected CF postcodes.</li>
            <li>Delivery times vary based on demand, traffic, and weather.</li>
            <li>Customers must provide accurate delivery addresses and be available to receive the order.</li>
            <li>If the driver cannot deliver due to incorrect details or no response, the order may be returned without refund.</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-orange mb-3">3.3 Pickup</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Customers may choose free pickup from our Cardiff location.</li>
            <li>Pickup times must be followed to ensure freshness and smooth service.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Refunds & Returns</h2>

          <h3 className="text-lg font-semibold text-brand-orange mb-3">4.1 Food Items</h3>
          <p className="mb-4">
            Due to the nature of fresh food, <strong>we do not accept returns</strong>.
          </p>

          <h3 className="text-lg font-semibold text-brand-orange mb-3">4.2 Refund Eligibility</h3>
          <p className="mb-3">Refunds may be issued only in the following situations:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>The order was not delivered due to an error on our side.</li>
            <li>The product arrived damaged or unsafe to consume (photo evidence required within 2 hours of delivery).</li>
            <li>A duplicate payment was made by mistake.</li>
          </ul>

          <p className="mb-3">Refunds will <strong>not</strong> be issued for:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Delays caused by Royal Mail or external couriers.</li>
            <li>Incorrect delivery information provided by the customer.</li>
            <li>Change of mind after the order has been prepared or dispatched.</li>
            <li>Missed deliveries due to customer unavailability.</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-orange mb-3">4.3 Refund Process</h3>
          <p>
            If eligible, refunds are processed within <strong>3–5 working days</strong> back to your 
            selected payment method.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Allergens & Food Safety</h2>
          <p>
            Our products may contain peanuts, spices, and other allergens. Customers are responsible 
            for checking allergen information before ordering. Home of Suya is not liable for allergic 
            reactions if allergen information was provided.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Pricing & Payment</h2>
          <p>
            All prices are listed in GBP (£). Payment must be completed at checkout before an order 
            is processed. Prices may change without prior notice.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. Privacy</h2>
          <p>
            We only use customer information for order processing, delivery, and communication. We do 
            not share your details with third parties except delivery partners.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">8. Contact Information</h2>
          <p className="mb-4">For questions or support, contact us at:</p>
          <div className="p-4 bg-gray-800 rounded-lg space-y-2">
            <p>
              <strong className="text-white">Email:</strong>{" "}
              <a href="mailto:homeofsuya@gmail.com" className="text-brand-orange hover:text-orange-400">
                homeofsuya@gmail.com
              </a>
            </p>
            <p>
              <strong className="text-white">Phone:</strong>{" "}
              <a href="tel:07467767223" className="text-brand-orange hover:text-orange-400">
                0746 7767223
              </a>
            </p>
            <p>
              <strong className="text-white">Location:</strong> Cardiff, United Kingdom
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
          <p>
            Home of Suya may update these Terms & Conditions at any time. Continued use of the website 
            means you accept the latest version.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
        <p>
          For our Privacy Policy, please visit the{" "}
          <a href="/privacy-policy" className="text-brand-orange hover:text-orange-400 underline">
            Privacy Policy page
          </a>
          . For our Cookie Policy, please visit the{" "}
          <a href="/cookie-policy" className="text-brand-orange hover:text-orange-400 underline">
            Cookie Policy page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
