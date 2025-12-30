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
      <body
        className={`${monteserrat.variable} ${poppins.variable} font-sans antialiased text-foreground`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(ellipse 150% 100% at 50% 100%, rgba(0, 74, 81, 0.8) 0%, rgba(0, 74, 81, 0.4) 30%, rgba(0, 74, 81, 0.1) 70%, transparent 100%)",
              filter: "blur(500px)",
            }}
          />

          {children}
        </div>
      </body>

    </html>
  )
}
