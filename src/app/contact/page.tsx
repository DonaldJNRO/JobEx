"use client";

import { useState } from "react";
import { MapPin, Mail, Phone, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    // Simulate send — replace with Web3Forms or email API
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <section className="bg-gradient-to-br from-primary to-primary-dark py-20 text-center">
        <h1 className="text-4xl font-extrabold text-white">Get in Touch</h1>
        <p className="text-white/60 mt-3">We&apos;d love to hear from you</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">Address</p>
                    <p className="text-sm text-text-muted">20 Wenlock Road, London, N1 7GU, UK</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">Email</p>
                    <a href="mailto:hello@sabieapp.com" className="text-sm text-primary hover:underline">hello@sabieapp.com</a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-white mb-3">For Businesses</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Want to list your property, experience, or event on Sabię? Visit{" "}
                <a href="https://studio.sabieapp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Sabię Studio
                </a>{" "}
                to create your listing and start reaching travelers.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-[#18181f] rounded-2xl border border-white/6 p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-bold text-white">Message Sent!</h3>
                <p className="text-sm text-text-muted mt-2">We&apos;ll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-sm text-primary font-medium hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Name</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl bg-[#0f0f13] border border-white/8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                  <input type="email" required className="w-full px-4 py-3 rounded-xl bg-[#0f0f13] border border-white/8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Subject</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl bg-[#0f0f13] border border-white/8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Message</label>
                  <textarea required rows={5} className="w-full px-4 py-3 rounded-xl bg-[#0f0f13] border border-white/8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {sending ? "Sending..." : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
