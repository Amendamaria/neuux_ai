import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Verify Error:", error)
    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}