import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Poppins } from "next/font/google"
import "./globals.css"

const monteserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeuUX AI - Design Smarter. Plan Faster.",
  description:
    "Your AI partner that turns your ideas into user flows, personas, and journey maps through effortless conversations.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${monteserrat.variable} ${poppins.variable} font-sans antialiased text-foreground`}>
        <div className="fixed inset-0 -z-10 overflow-hidden bg-neuuxai-base">
          <div className="bg-neuuxai-glow top-[-30%] left-[-20%]" />
          <div className="bg-neuuxai-glow bottom-[-35%] right-[-25%] opacity-30" />
          <div className="bg-neuuxai-vignette" />
        </div>
        {children}
      </body>
    </html>
  )
}
