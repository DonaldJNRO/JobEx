export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f0f13] py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-text-muted leading-relaxed space-y-6">
          <p><strong>Last updated:</strong> March 2026</p>
          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using Sabię, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          <h2 className="text-xl font-semibold text-white">2. Use of Services</h2>
          <p>Sabię provides a platform for group travel planning, booking accommodations, experiences, and events. You must be at least 18 years old to create an account and make bookings.</p>
          <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
          <p>You are responsible for maintaining the security of your account credentials. You agree to provide accurate information and keep it updated.</p>
          <h2 className="text-xl font-semibold text-white">4. Bookings & Payments</h2>
          <p>All bookings are subject to availability and host confirmation. Payments are processed securely through Stripe. Cancellation policies vary by listing and are displayed before booking.</p>
          <h2 className="text-xl font-semibold text-white">5. Content & Conduct</h2>
          <p>You retain ownership of content you post. By posting, you grant Sabię a license to display it on our platform. You agree not to post harmful, misleading, or illegal content.</p>
          <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
          <p>Sabię acts as a platform connecting travelers with hosts. We are not liable for the quality of third-party services booked through our platform.</p>
          <h2 className="text-xl font-semibold text-white">7. Contact</h2>
          <p>For questions about these terms: <a href="mailto:hello@sabieapp.com" className="text-primary hover:underline">hello@sabieapp.com</a></p>
          <p>Sabię Ltd, 20 Wenlock Road, London, N1 7GU, United Kingdom</p>
        </div>
      </div>
    </div>
  );
}
