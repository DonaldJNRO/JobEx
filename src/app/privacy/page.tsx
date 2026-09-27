import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy policy | Sabię",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="September 2026">
      <h2>1. Information We Collect</h2>
      <p>When you use Sabię, we collect information you provide directly, such as your name, email address, profile photo, and trip details. We also collect usage data to improve our services.</p>
      <p>On this website specifically, you can send a booking request or a message without creating an account. When you do, we record the name and the email address or phone number you type, along with what you are asking about, and we sign you in anonymously so the request can be stored against an identifier. That identifier is not linked to a name unless you give us one.</p>
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to provide and improve our services, to pass your booking requests to the business you are asking, and to communicate with you about your trips.</p>
      <h2>3. Data Sharing</h2>
      <p>We do not sell your personal data. When you send a booking request, the business you are asking receives the details of that request, including the name and contact you gave, because they cannot reply to you otherwise.</p>
      <p>Payments in the Sabię app are processed by Stripe, and we never see or store your full card details. This website does not take payments at all, so nothing you do here involves a card.</p>
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
