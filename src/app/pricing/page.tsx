"use client"

import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function PricingPage() {
  const router = useRouter()

  const plans = [
    {
      name: "Free Plan",
      price: "Free",
      features: [
        "Limited AI usage",
        "Basic UX Analysis",
        "Basic UI Recommendations",
        "Save up to 5 projects",
        "No PDF export",
      ],
    },
    {
      name: "Premium Plan",
      price: "Premium",
      features: [
        "Unlimited AI generations",
        "Full UX Analysis",
        "Advanced UI Recommendations",
        "Detailed Design Flows",
        "Full Case Study Export",
        "Priority processing",
      ],
      highlighted: true,
    },
  ]

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-16">Pricing</h1>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-8 transition ${plan.highlighted
                ? "border-teal-500/60 bg-gradient-to-b from-teal-900/40 to-transparent"
                : "border-teal-600/30 bg-gradient-to-b from-teal-900/20 to-transparent"
                }`}
            >
              {/* Plan Header */}
              <div className="mb-8">
                <p className="text-sm text-gray-400 mb-2">{plan.name}</p>
                <h2 className="text-4xl font-bold text-white">{plan.price}</h2>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-teal-600/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => router.push("/auth/signup")}
                className={`w-full rounded-full py-3 font-semibold ${plan.highlighted
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-transparent border border-teal-600/50 hover:bg-teal-900/20 text-white"
                  }`}
              >
                Get it Now
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
