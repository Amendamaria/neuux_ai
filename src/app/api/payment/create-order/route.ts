import Razorpay from "razorpay"
import { NextResponse } from "next/server"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: Request) {
  try {
    const { amount, plan } = await req.json()

    const options = {
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan,
      },
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Create Order Error:", error)
    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    )
  }
}