"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password === formData.confirmPassword && formData.email) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: formData.email,
          name: formData.fullName,
          isAuthenticated: true,
        }),
      )
      router.push("/chat")
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950">
      <Navbar showLogin={false} />

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-teal-600/40 rounded-3xl p-8 bg-gradient-to-b from-teal-900/30 to-transparent space-y-8">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Welcome To NeuUX AI!</h1>
            <p className="text-gray-400">Create your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name & Email Row */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name:"
                value={formData.fullName}
                onChange={handleChange}
                className="bg-transparent border border-teal-600/30 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition text-sm"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email:"
                value={formData.email}
                onChange={handleChange}
                className="bg-transparent border border-teal-600/30 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition text-sm"
                required
              />
            </div>

            {/* Password Input */}
            <input
              type="password"
              name="password"
              placeholder="Create Password:"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
              required
            />

            {/* Confirm Password Input */}
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password:"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition"
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full py-3 font-semibold"
            >
              SignUp
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Do you have and account?{" "}
              <button onClick={() => router.push("/login")} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
