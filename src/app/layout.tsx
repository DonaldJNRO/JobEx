import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sabię — Plan Trips With Friends",
  description: "Stop the endless group chats. Sabię brings everyone together to plan, vote, and book trips that actually happen. AI-powered recommendations, built-in budget splitting, and vibes that match your crew.",
  keywords: ["travel", "group travel", "trip planning", "AI travel", "book accommodation", "experiences", "events"],
  openGraph: {
    title: "Sabię — Plan Trips With Friends",
    description: "AI-powered group travel planning. Browse stays, experiences, and events.",
    siteName: "Sabię",
    type: "website",
    url: "https://www.sabieapp.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0f0f13] text-[#e4e4e8] antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
