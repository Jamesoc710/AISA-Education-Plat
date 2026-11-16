import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { APP_NAME, ORG_NAME, SITE_URL } from "@/lib/brand";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const DESCRIPTION = `The ${ORG_NAME} study platform. Learn how modern AI works, practice until it sticks, and keep up with the week in tech.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: APP_NAME, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
