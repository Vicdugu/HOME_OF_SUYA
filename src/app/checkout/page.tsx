"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BookingOrderSummary } from "@/components/booking/BookingOrderSummary";
import { PromoCodeInput } from "@/components/booking/PromoCodeInput";
import { FormField, inputCls } from "@/components/ui/FormField";
import { trackClientEvent } from "@/lib/client-analytics";
import { DEFAULT_DELIVERY_SETTINGS } from "@/lib/delivery-settings";
import { getDeliveryFee } from "@/lib/delivery-pricing";
const STEPS = [
  { n: 1, label: "Menu" },
  { n: 2, label: "Date & Delivery" },
  { n: 3, label: "Your Details" },
  { n: 4, label: "Payment" },
];

interface FormValues {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(form: FormValues, needsAddress: boolean): FormErrors {
  const e: FormErrors = {};
  if (!form.name.trim()) e.name = "Name is required";
  if (!form.whatsapp.trim()) {
    e.whatsapp = "WhatsApp number is required";
  } else if (!/^[\d\s+\-().]{7,15}$/.test(form.whatsapp.trim())) {
    e.whatsapp = "Enter a valid phone number";
  }
  if (!form.email.trim()) {
    e.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    e.email = "Enter a valid email address";
  }
  if (needsAddress && !form.address.trim()) {
    e.address = "Address is required for delivery";
  }
  return e;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, setCustomerDetails, totalItems, subtotal, setPromo } =
    useCart();

  // Redirect guards
  const [settings, setSettings] = useState(DEFAULT_DELIVERY_SETTINGS);

  useEffect(() => {
    trackClientEvent("view_checkout_step", "checkout");
    if (totalItems === 0) router.replace("/");
    else if (!state.bookingDate || !state.timeSlot || !state.deliveryType)
      router.replace("/book");
  }, [totalItems, state.bookingDate, state.timeSlot, state.deliveryType, router]);

  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const deliveryFee = getDeliveryFee(state.deliveryType, subtotal, settings);
  const total = subtotal + deliveryFee - state.promoDiscount;

  const needsAddress =
    state.deliveryType === "CARDIFF" || state.deliveryType === "POSTAGE";

  const [form, setForm] = useState<FormValues>({
    name: state.customerName,
    whatsapp: state.customerWhatsapp,
    email: state.customerEmail,
    address: state.customerAddress,
    notes: state.customerNotes,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function set(field: keyof FormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleSubmit() {
    const e = validate(form, needsAddress);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      // Scroll to first error
      const first = document.querySelector("[data-error]");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setCustomerDetails({
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    });
    trackClientEvent("advance_to_payment", "checkout", {
      hasEmail: Boolean(form.email.trim()),
      needsAddress,
    });
    router.push("/payment");
  }

  if (totalItems === 0) return null;

  return (
    <main className="min-h-screen bg-brand-black">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-surface-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/book"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            Date &amp; Delivery
          </Link>

          <ol className="hidden sm:flex items-center gap-1">
            {STEPS.map(({ n, label }) => {
              const active = n === 3;
              const done = n < 3;
              return (
                <li key={n} className="flex items-center gap-1">
                  <span
                    className={[
                      "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      done
                        ? "bg-brand-gold text-black"
                        : active
                        ? "bg-brand-red text-white"
                        : "bg-surface-border text-gray-500",
                    ].join(" ")}
                  >
                    {n}
                  </span>
                  <span
                    className={`text-xs ${active ? "text-white" : "text-gray-500"}`}
                  >
                    {label}
                  </span>
                  {n < STEPS.length && (
                    <span className="text-gray-700 text-xs mx-1">›</span>
                  )}
                </li>
              );
            })}
          </ol>

          <span className="text-gray-400 text-sm shrink-0 sm:hidden">
            Step 3 of 4
          </span>
          <span className="hidden sm:block" />
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Form ───────────────────────────────────────────── */}
          <div className="flex-1 space-y-8 min-w-0">
            <div>
              <h1 className="text-white font-black text-2xl md:text-3xl mb-1">
                Your Details
              </h1>
              <p className="text-gray-400 text-sm">
                How should we reach you about your order?
              </p>
            </div>

            {/* ── Contact ──────────────────────────────────────── */}
            <section className="card p-6 space-y-5">
              <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
                <User size={14} />
                Contact Details
              </h2>

              <FormField
                label="Full Name"
                htmlFor="name"
                required
                error={errors.name}
              >
                <div data-error={errors.name ? true : undefined}>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Amina Hassan"
                    autoComplete="name"
                    className={inputCls(!!errors.name)}
                  />
                </div>
              </FormField>

              <FormField
                label="WhatsApp Number"
                htmlFor="whatsapp"
                required
                hint="We'll send your booking confirmation here"
                error={errors.whatsapp}
              >
                <div
                  className="relative"
                  data-error={errors.whatsapp ? true : undefined}
                >
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="whatsapp"
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                    placeholder="+44 7700 000000"
                    autoComplete="tel"
                    className={`${inputCls(!!errors.whatsapp)} pl-9`}
                  />
                </div>
              </FormField>

              <FormField
                label="Email Address"
                htmlFor="email"
                required
                hint="We'll send order updates here"
                error={errors.email}
              >
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`${inputCls(!!errors.email)} pl-9`}
                  />
                </div>
              </FormField>
            </section>

            {/* ── Delivery address (shown only if Cardiff/Postage) ── */}
            {needsAddress && (
              <section className="card p-6 space-y-5">
                <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} />
                  Delivery Address
                </h2>

                <FormField
                  label="Full Address"
                  htmlFor="address"
                  required
                  hint={
                    state.deliveryType === "POSTAGE"
                      ? "Include postcode — Royal Mail delivery"
                      : "Include postcode — Cardiff only"
                  }
                  error={errors.address}
                >
                  <div data-error={errors.address ? true : undefined}>
                    <textarea
                      id="address"
                      rows={3}
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder={
                        "123 High Street\nCardiff\nCF10 1AA"
                      }
                      autoComplete="street-address"
                      className={`${inputCls(!!errors.address)} resize-none`}
                    />
                  </div>
                </FormField>
              </section>
            )}

            {/* ── Notes ────────────────────────────────────────── */}
            <section className="card p-6 space-y-5">
              <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} />
                Special Instructions
              </h2>

              <FormField
                label="Order Notes"
                htmlFor="notes"
                hint="Optional — allergy info, spice level, etc."
              >
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="e.g. Extra spicy, no onions, nut allergy..."
                  className={`${inputCls()} resize-none`}
                />
              </FormField>
            </section>

            {/* ── Promo code ───────────────────────────────────── */}
            <section className="card p-6 space-y-4">
              <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
                <span>🏷</span>
                Promo Code
              </h2>
              <PromoCodeInput />
            </section>

            {/* ── Submit ───────────────────────────────────────── */}
            <button
              onClick={handleSubmit}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              Continue to Payment
              <ArrowRight size={18} />
            </button>
          </div>

          {/* ── Sidebar ────────────────────────────────────────── */}
          <aside className="lg:w-72 shrink-0">
            <BookingOrderSummary deliveryFee={deliveryFee} total={total} />
          </aside>
        </div>
      </div>
    </main>
  );
}
