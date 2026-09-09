import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dinescan.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DineScan — Next-Gen Restaurant Operating System, KOT & Mobile POS",
    template: "%s | DineScan Restaurant SaaS"
  },
  description: "DineScan transforms restaurant operations with digital QR table self-ordering, real-time Web Audio KOT kitchen displays, mobile waiter POS, automatic CGST+SGST tax billing, and instant WhatsApp digital receipts.",
  keywords: [
    "DineScan", "QR Menu SaaS", "Digital Restaurant Menu", "KOT Kitchen Display",
    "Mobile Waiter POS", "Table Self Ordering", "GST Tax Billing", "Restaurant Management System"
  ],
  authors: [{ name: "DineScan Platform Inc." }],
  openGraph: {
    title: "DineScan — Modern Table Ordering, KOT & Mobile POS",
    description: "Replace paper menus with digital QR table ordering, real-time KOT kitchen screen, mobile waiter POS, and automatic GST billing.",
    url: siteUrl,
    siteName: "DineScan SaaS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 1024,
        height: 1024,
        alt: "DineScan Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "DineScan — Next-Gen Restaurant OS",
    description: "Transform your restaurant service with 0.4s fast QR menus and digital KOT kitchen displays.",
    images: ["/logo.jpg"]
  },
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "32x32", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "192x192", type: "image/jpeg" }
    ],
    apple: [
      { url: "/logo.jpg", sizes: "180x180", type: "image/jpeg" }
    ]
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </AuthProvider>
      </body>
    </html>
  );
}
