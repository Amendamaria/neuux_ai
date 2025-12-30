"use client"

import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen">
      <Navbar showLogin={true} />

      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-3xl">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="text-neuuxai">Design</span> <span>Smarter.</span>
              <br />
              <span>Plan</span> <span className="text-neuuxai">Faster.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Your AI partner that turns your ideas into user flows, personas, and journey maps through effortless
              conversations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/signup")}
              className="text-lg flex items-center gap-2 justify-center"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="border border-teal-600/30 rounded-2xl p-8 bg-gradient-to-b from-teal-900/20 to-transparent mt-12">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold">
                  UX
                </div>
                <div className="bg-neutral-900 rounded-lg p-4 text-left max-w-md">
                  <p className="text-sm text-gray-300">
                    Lorem ipsum dolor sit amet consectetur. Habitant eu bibendum amet quis duis tincidunt id. Posuere
                    quam lorem erat mauris aliquet nec placerat. Odio rhoncus est praesent nec orci. Sit sit accumsan
                    arcu sed eu ut. Sed non non purus cras diam commodo.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="bg-teal-900/40 rounded-lg p-4 text-left max-w-md">
                  <p className="text-sm text-gray-300">
                    Lorem ipsum dolor sit amet consectetur. Habitant eu bibendum amet quis duis tincidunt id.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-500 shrink-0 flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Input
                  type="text"
                  placeholder="Share your ideas..."
                  className="flex-1 bg-neutral-900 border border-teal-600/30 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-teal-600"
                  disabled
                />
                <Button variant={"default"} className="p-3 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M10.5 1.5H3a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path d="M13.5 4.5l2.5-2.5M16 2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
