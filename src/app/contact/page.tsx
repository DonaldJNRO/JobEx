"use client";

import { useState } from "react";
import { MapPin, Mail, Phone, Send, CheckCircle, AlertTriangle } from "lucide-react";
import {
  CONTACT_EMAIL,
  mailtoFallback,
  sendContactMessage,
  validateContactMessage,
  type ContactMessage,
} from "@/lib/contact";

const EMPTY: ContactMessage = { name: "", email: "", subject: "", message: "" };

const FIELD_CLASS =
  "w-full px-4 py-3 rounded-xl bg-surface border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function ContactPage() {
  const [form, setForm] = useState<ContactMessage>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof ContactMessage) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const problem = validateContactMessage(form);
    if (problem) { setError(problem); return; }

    setError(null);
    setSending(true);
    try {
      await sendContactMessage(form);
      setSubmitted(true);
      setForm(EMPTY);
    } catch {
      // Never claim it was sent. The fallback below hands the person their own
      // words in their own mail client, which is the one route that does not
      // depend on anything of ours working.
      setError("We could not send that just now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <section className="bg-gradient-to-br from-primary to-primary-dark py-section text-center">
        <h1 className="text-4xl font-extrabold text-white">Get in touch</h1>
        <p className="text-white/85 mt-3">We&apos;d love to hear from you</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-section">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-ink mb-6">Contact information</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-ink">Address</p>
                    <p className="text-sm text-text-muted">20 Wenlock Road, London, N1 7GU, UK</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-ink">Email</p>
                    <a href="mailto:hello@sabieapp.com" className="text-sm text-primary hover:underline">hello@sabieapp.com</a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-ink mb-3">For businesses</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Want to list your property, experience, or event on Sabię? Visit{" "}
                <a href="https://studio.sabieapp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Sabię Studio
                </a>{" "}
                to create your listing and start reaching travellers.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl border border-line p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-bold text-ink">Message sent</h3>
                <p className="text-sm text-text-muted mt-2">
                  It is with us now. We reply to {CONTACT_EMAIL} within a working day.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-sm text-primary font-medium hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-ink mb-1.5">Name</label>
                  <input id="contact-name" name="name" type="text" required autoComplete="name" value={form.name} onChange={set("name")} className={FIELD_CLASS} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-ink mb-1.5">Email</label>
                  <input id="contact-email" name="email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} className={FIELD_CLASS} />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-ink mb-1.5">Subject</label>
                  <input id="contact-subject" name="subject" type="text" required value={form.subject} onChange={set("subject")} className={FIELD_CLASS} />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-ink mb-1.5">Message</label>
                  <textarea id="contact-message" name="message" required rows={5} value={form.message} onChange={set("message")} className={`${FIELD_CLASS} resize-none`} />
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
                    <p className="text-sm text-amber-800">
                      {error}{" "}
                      <a href={mailtoFallback(form)} className="font-semibold underline underline-offset-2">
                        Email it to us instead
                      </a>
                      , with what you typed already filled in.
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {sending ? "Sending" : <><Send size={16} /> Send message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
