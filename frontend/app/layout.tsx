import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

const description = "Fairness-constrained credit default scoring with calibrated probabilities, SHAP explanations and recourse. Educational use only."

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: { default: "Fair Credit Scorer", template: "%s · Fair Credit Scorer" },
  description,
  applicationName: "Fair Credit Scorer",
  openGraph: { type: "website", siteName: "Fair Credit Scorer", title: "Fair Credit Scorer", description },
  twitter: { card: "summary_large_image", title: "Fair Credit Scorer", description },
}

export const viewport: Viewport = {
  themeColor: "#f7f8f5",
  colorScheme: "light",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
