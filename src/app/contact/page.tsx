"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, PartyPopper, Phone, Send, User } from "lucide-react";
import { FormField, inputCls } from "@/components/ui/FormField";

type ContactFormValues = {
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  venue: string;
  budget: string;
  serviceStyle: "PICKUP" | "DELIVERY" | "FULL_SERVICE" | "UNSURE";
  deliveryArea: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMPTY_FORM: ContactFormValues = {
  fullName: "",
  email: "",
  phone: "",
  eventDate: "",
  guestCount: "",
  venue: "",
  budget: "",
  serviceStyle: "UNSURE",
  deliveryArea: "",
  message: "",
};

function validate(form: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Name is required";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (form.phone.trim() && !/^[\d\s+\-().]{7,20}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }

  if (form.guestCount.trim() && (!/^\d+$/.test(form.guestCount.trim()) || Number(form.guestCount) <= 0)) {
    errors.guestCount = "Enter a valid guest count";
  }

  if (!form.message.trim()) {
    errors.message = "Please tell us about your enquiry";
  } else if (form.message.trim().length < 10) {
    errors.message = "Please provide a little more detail";
  }

  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [submitError, setSubmitError] = useState("");

  function setField(field: keyof ContactFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError("");
    }
    if (status) {
      setStatus("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitError("");
      setStatus("");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          eventDate: form.eventDate,
          guestCount: form.guestCount,
          venue: form.venue.trim(),
          budget: form.budget.trim(),
          serviceStyle: form.serviceStyle,
          deliveryArea: form.deliveryArea.trim(),
          message: form.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not send your enquiry"
        );
      }

      setForm(EMPTY_FORM);
      setErrors({});
      setStatus(
        typeof data.message === "string"
          ? data.message
          : "Thanks. Your enquiry has been sent to the team."
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not send your enquiry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-black">
      <div className="bg-surface-dark border-b border-surface-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/book"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            Back to booking
          </Link>
          <span className="text-gray-400 text-sm">Contact Us</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-brand-gold/30 bg-gradient-to-br from-brand-red/20 via-surface-dark to-brand-black p-6 shadow-xl shadow-brand-red/10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-gold">
                <PartyPopper size={13} />
                Hosting a Party
              </div>
              <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                Catering Enquiry
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">
                Use this form for party catering, group trays, private events, or any booking that needs a custom quote.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-5">
              <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest">
                Catering Details
              </h2>

              <FormField label="Full Name" htmlFor="fullName" required error={errors.fullName}>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={(event) => setField("fullName", event.target.value)}
                    placeholder="e.g. Amina Hassan"
                    autoComplete="name"
                    className={`${inputCls(!!errors.fullName)} pl-11`}
                  />
                </div>
              </FormField>

              <FormField label="Email Address" htmlFor="email" required error={errors.email}>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`${inputCls(!!errors.email)} pl-11`}
                  />
                </div>
              </FormField>

              <FormField label="Phone Number" htmlFor="phone" hint="Optional" error={errors.phone}>
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                    placeholder="e.g. 07..."
                    autoComplete="tel"
                    className={`${inputCls(!!errors.phone)} pl-11`}
                  />
                </div>
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Event Date" htmlFor="eventDate" hint="Optional">
                  <input
                    id="eventDate"
                    type="date"
                    value={form.eventDate}
                    onChange={(event) => setField("eventDate", event.target.value)}
                    className={inputCls()}
                  />
                </FormField>

                <FormField label="Guest Count" htmlFor="guestCount" hint="Optional" error={errors.guestCount}>
                  <input
                    id="guestCount"
                    type="number"
                    min="1"
                    value={form.guestCount}
                    onChange={(event) => setField("guestCount", event.target.value)}
                    placeholder="e.g. 40"
                    className={inputCls(!!errors.guestCount)}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Venue / Event Location" htmlFor="venue" hint="Optional">
                  <input
                    id="venue"
                    type="text"
                    value={form.venue}
                    onChange={(event) => setField("venue", event.target.value)}
                    placeholder="e.g. Cardiff Bay community hall"
                    className={inputCls()}
                  />
                </FormField>

                <FormField label="Budget" htmlFor="budget" hint="Optional">
                  <input
                    id="budget"
                    type="text"
                    value={form.budget}
                    onChange={(event) => setField("budget", event.target.value)}
                    placeholder="e.g. £500-£700"
                    className={inputCls()}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Service Style" htmlFor="serviceStyle">
                  <select
                    id="serviceStyle"
                    value={form.serviceStyle}
                    onChange={(event) => setField("serviceStyle", event.target.value as ContactFormValues["serviceStyle"])}
                    className={inputCls()}
                  >
                    <option value="UNSURE">Not sure yet</option>
                    <option value="PICKUP">Pickup trays</option>
                    <option value="DELIVERY">Delivered catering</option>
                    <option value="FULL_SERVICE">Full service event</option>
                  </select>
                </FormField>

                <FormField label="Delivery Area / Postcode" htmlFor="deliveryArea" hint="Optional">
                  <input
                    id="deliveryArea"
                    type="text"
                    value={form.deliveryArea}
                    onChange={(event) => setField("deliveryArea", event.target.value)}
                    placeholder="e.g. Cardiff CF10"
                    className={inputCls()}
                  />
                </FormField>
              </div>

              <FormField
                label="Enquiry Details"
                htmlFor="message"
                required
                hint="Tell us the menu, service format, and anything special"
                error={errors.message}
              >
                <textarea
                  id="message"
                  rows={7}
                  value={form.message}
                  onChange={(event) => setField("message", event.target.value)}
                  placeholder="We're hosting a party for 40 guests and would like mixed suya trays, jollof, and setup support..."
                  className={`${inputCls(!!errors.message)} resize-y min-h-40`}
                />
              </FormField>

              {submitError ? <p className="text-brand-red text-sm">{submitError}</p> : null}
              {status ? <p className="text-green-400 text-sm">{status}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Sending Enquiry..." : "Request Catering Quote"}
              </button>
            </form>
          </section>

          <aside className="card p-6 h-fit space-y-4">
            <h2 className="text-brand-gold font-semibold text-xs uppercase tracking-widest">
              What to Include
            </h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>Preferred event date and guest count</li>
              <li>Venue or delivery area</li>
              <li>Pickup, delivery, or full-service support</li>
              <li>Budget and menu expectations</li>
            </ul>
            <p className="text-xs text-gray-500">
              Enquiries are now stored for the admin team and can be tracked, quoted, and closed from the catering dashboard.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}