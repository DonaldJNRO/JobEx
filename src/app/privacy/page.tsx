import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy policy | Sabię",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="March 2026">
      <h2>1. Information We Collect</h2>
      <p>When you use Sabię, we collect information you provide directly, such as your name, email address, profile photo, and trip details. We also collect usage data to improve our services.</p>
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to provide and improve our services, personalize your experience with AI recommendations, process bookings and payments, and communicate with you about your trips.</p>
      <h2>3. Data Sharing</h2>
      <p>We do not sell your personal data. We share information with hosts and service providers only when necessary to fulfill your bookings. Payment processing is handled securely by Stripe.</p>
      <h2>4. Data Security</h2>
      <p>We use industry-standard encryption and security measures to protect your data. All data is stored securely on Google Cloud Platform through Firebase.</p>
      <h2>5. Your Rights</h2>
      <p>You can access, update, or delete your account data at any time through the app settings. For data deletion requests, contact us at hello@sabieapp.com.</p>
      <h2>6. Contact</h2>
      <p>For privacy inquiries: <a href="mailto:hello@sabieapp.com">hello@sabieapp.com</a></p>
      <p>Sabię Ltd, 20 Wenlock Road, London, N1 7GU, United Kingdom</p>
    </LegalPage>
  );
}
