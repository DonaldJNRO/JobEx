import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sabię — Plan the trip back home, with the crew",
  description: "Sabię is the group travel app for the diaspora. Plan, vote, split and book trips together — UK to Lagos, Accra, and everywhere in between.",
  keywords: ["diaspora travel", "group travel", "trip planning", "Lagos travel", "Accra travel", "African diaspora", "Detty December", "travel with friends"],
  openGraph: {
    title: "Sabię — Plan the trip back home, with the crew",
    description: "The group travel app for the diaspora. UK to Lagos, Accra, and everywhere in between.",
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
