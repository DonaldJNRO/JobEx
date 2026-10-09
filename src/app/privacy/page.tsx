import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy policy | Sabię",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 2026">
      <h2>1. Information We Collect</h2>
      <p>When you use Sabię, we collect information you provide directly, such as your name, email address, profile photo, and trip details. We also collect usage data to improve our services.</p>
      <p>On this website specifically, you can send a booking request or a message without creating an account. When you do, we record the name and the email address or phone number you type, along with what you are asking about, and we sign you in anonymously so the request can be stored against an identifier. That identifier is not linked to a name unless you give us one.</p>
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to provide and improve our services, to pass your booking requests to the business you are asking, and to communicate with you about your trips.</p>
      <h2>3. Data Sharing</h2>
      <p>We do not sell your personal data. When you send a booking request, the business you are asking receives the details of that request, including the name and contact you gave, because they cannot reply to you otherwise.</p>
      <p>Payments are processed by Stripe, in the Sabię app and on this website, and we never see or store your full card details. Where a payment is taken we hold the money until after your visit, and the business is paid afterwards.</p>
      <h2>4. Data Security</h2>
      <p>We use industry-standard encryption and security measures to protect your data. All data is stored securely on Google Cloud Platform through Firebase.</p>
      <h2>5. If You Are a Business on Sabię</h2>
      <p>Sabię Studio, on the web at studio.sabieapp.com and as an app, is for the businesses listed on Sabię rather than for travellers. If you run one, we hold the details of your business and its listings, the bookings and enquiries travellers send you, the messages exchanged about them, and a record of what you have earned and been paid.</p>
      <p>If you install the Studio app we also register a notification token for your device, so a booking request can reach you. That token identifies the device, not you, and it is removed when you sign out or uninstall the app.</p>
      <p>Your payout details are entered on the Studio website and are held so we can pay you. They are never entered in or readable from the Studio app. We share what we must with our payment and payout providers to move the money, and with nobody else.</p>
      <p>A traveller who books with you sees your business name, your listing and the address you published. They do not see your payout details or your earnings.</p>
      <h2>6. Your Rights</h2>
      <p>You can access, update, or delete your account data at any time through the app settings. For data deletion requests, contact us at hello@sabieapp.com.</p>
      <h2>7. Contact</h2>
      <p>For privacy inquiries: <a href="mailto:hello@sabieapp.com">hello@sabieapp.com</a></p>
      <p>Sabię Ltd, 20 Wenlock Road, London, N1 7GU, United Kingdom</p>
    </LegalPage>
  );
}
