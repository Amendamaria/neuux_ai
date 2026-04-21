"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

// ✅ Razorpay types
type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOrder = {
  id: string
  amount: number
  currency: string
}

type RazorpayOptions = {
  key: string | undefined
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  theme: {
    color: string
  }
}

// ✅ Extend window (NO any)
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void
    }
  }
}

export default function PricingPage() {
  const router = useRouter()

  // ✅ Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  // ✅ Payment handler
  const handlePayment = async () => {
    try {
      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load")
        return
      }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "Premium",
          amount: 499,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to create order")
      }

      const data: { order: RazorpayOrder } = await res.json()

      if (!data?.order?.id) {
        alert("Order creation failed")
        return
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "NeuUX AI",
        description: "Premium Plan",
        order_id: data.order.id,

        handler: async function (response: RazorpayResponse) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
          })

          const result = await verifyRes.json()

          if (result.success) {
            alert("Payment Successful 🎉")
            router.push("/dashboard")
          } else {
            alert("Payment verification failed")
          }
        },

        theme: {
          color: "#14b8a6",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error) {
      console.error("Payment Error:", error)
      alert("Payment failed")
    }
  }

  const plans = [
    {
      name: "Free Plan",
      price: "Free",
      features: [
        "Limited AI usage",
        "Basic UX Analysis",
        "Save up to 5 projects",
        "Wireframe blueprint limited to 5 screens",
      ],
    },
    {
      name: "Premium Plan",
      price: "₹499",
      features: [
        "Unlimited AI generations",
        "Full UX Analysis",
        "Detailed Design Flows",
        "Wireframe blueprint for unlimited screens",
        "Priority processing",
      ],
      highlighted: true,
    },
  ]

  return (
    <main className="min-h-screen">
     

      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-16">
          Pricing
        </h1>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`border rounded-3xl p-8 transition ${
                plan.highlighted
                  ? "border-teal-500/60 bg-linear-to-b from-teal-900/40 to-transparent"
                  : "border-teal-600/30 bg-linear-to-b from-teal-900/20 to-transparent"
              }`}
            >
              {/* Header */}
              <div className="mb-8">
                <p className="text-sm text-gray-400 mb-2">{plan.name}</p>
                <h2 className="text-4xl font-bold text-white">
                  {plan.price}
                </h2>
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

              {/* CTA */}
              <Button
                onClick={() =>
                  plan.name === "Premium Plan"
                    ? handlePayment()
                    : router.push("/auth/signup")
                }
                className={`w-full rounded-full py-3 font-semibold ${
                  plan.highlighted
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "bg-transparent border border-teal-600/50 hover:bg-teal-900/20 text-white"
                }`}
              >
                {plan.name === "Premium Plan"
                  ? "Buy Now"
                  : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}