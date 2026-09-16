import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Terms of service | Sabię",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="March 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Sabię, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
      <h2>2. Use of Services</h2>
      <p>Sabię provides a platform for group travel planning, booking accommodations, experiences, and events. You must be at least 18 years old to create an account and make bookings.</p>
      <h2>3. User Accounts</h2>
      <p>You are responsible for maintaining the security of your account credentials. You agree to provide accurate information and keep it updated.</p>
      <h2>4. Bookings and payments</h2>
      <p>All bookings are subject to availability and host confirmation. Payments are processed securely through Stripe. Cancellation policies vary by listing and are displayed before booking.</p>
      <h2>5. Content and conduct</h2>
      <p>You retain ownership of content you post. By posting, you grant Sabię a license to display it on our platform. You agree not to post harmful, misleading, or illegal content.</p>
      <h2>6. Limitation of Liability</h2>
      <p>Sabię acts as a platform connecting travellers with hosts. We are not liable for the quality of third-party services booked through our platform.</p>
      <h2>7. Contact</h2>
      <p>For questions about these terms: <a href="mailto:hello@sabieapp.com">hello@sabieapp.com</a></p>
      <p>Sabię Ltd, 20 Wenlock Road, London, N1 7GU, United Kingdom</p>
    </LegalPage>
  );
}
