"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spotlight, SpotLightItem } from "@/components/ui/spotlight";

export default function Home() {
    const year = new Date().getFullYear();

    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);

    /* ========================= */
    /* AUTH CHECK (NEW)          */
    /* ========================= */

    useEffect(() => {
        async function checkUser() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                router.replace("/dashboard"); // 🔥 redirect if logged in
            } else {
                setLoading(false);
            }
        }

        checkUser();
    }, [supabase, router]);

    /* ========================= */
    /* PREVENT FLICKER           */
    /* ========================= */

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                Loading...
            </div>
        );
    }

    /* ========================= */
    /* ORIGINAL UI (UNCHANGED)   */
    /* ========================= */

    return (
        <main className="min-h-screen">
            <section className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="text-center space-y-8 max-w-3xl">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-bold">
                            <span className="text-neuuxai">Design</span> <span>Smarter.</span>
                            <br />
                            <span>Plan</span>{" "}
                            <span className="text-neuuxai">Faster.</span>
                        </h1>

                        <p className="text-lg text-gray-400 leading-relaxed">
                            Your AI partner that turns your ideas into user flows, personas,
                            and journey maps through effortless conversations.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild className="text-lg flex items-center gap-2 justify-center">
                            <Link href="/auth/signup">
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                    </div>

                    {/* Demo Chat Card */}
                    <div className="border border-foreground rounded-2xl p-8 bg-linear-to-b from-teal-900/20 to-transparent mt-12">
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold">
                                    UX
                                </div>
                                <div className="bg-neutral-900 rounded-lg p-4 text-left max-w-md">
                                    <p className="text-sm text-gray-300">
                                        Lorem ipsum dolor sit amet consectetur. Habitant eu bibendum
                                        amet quis duis tincidunt id. Posuere quam lorem erat mauris
                                        aliquet nec placerat.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <div className="bg-teal-900/40 rounded-lg p-4 text-left max-w-md">
                                    <p className="text-sm text-gray-300">
                                        Lorem ipsum dolor sit amet consectetur.
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
                                    className="flex-1 bg-neutral-900 border border-teal-600/30 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500"
                                    disabled
                                />
                                <Button className="p-3 rounded-md flex items-center justify-center">
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================
          FEATURES SECTION
         ====================== */}
            <section id="features" className="py-24 px-4 scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    {/* Heading */}
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold">
                            Built to simplify{" "}
                            <span className="text-neuuxai">UX planning</span>
                        </h2>
                        <p className="text-gray-400 text-lg mt-4">
                            Everything you need to plan better user experiences, faster.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <Spotlight className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: "AI-Driven UX Planning",
                                description:
                                    "Turn simple ideas into user flows, personas, and journey maps through conversations.",
                            },
                            {
                                title: "Instant UX Insights",
                                description:
                                    "Identify usability issues and improvement opportunities in seconds.",
                            },
                            {
                                title: "Structured Design Outputs",
                                description:
                                    "Get clear UX documentation that’s easy to understand and use.",
                            },
                            {
                                title: "Beginner Friendly",
                                description:
                                    "No prior UX knowledge required. Just explain your idea and start.",
                            },
                            {
                                title: "Faster Planning",
                                description:
                                    "Reduce planning time and focus more on building real solutions.",
                            },
                            {
                                title: "Built for Teams & Students",
                                description:
                                    "Perfect for students, designers, startups, and product teams.",
                            },
                        ].map((feature, index) => (
                            <SpotLightItem key={index}>
                                <div className="relative h-full rounded-xl border border-teal-600/20 bg-linear-to-b from-neutral-950 to-neutral-900 p-6 transition">
                                    <h3 className="text-lg font-semibold mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </SpotLightItem>
                        ))}
                    </Spotlight>
                </div>
            </section>

            <section
                id="how-it-works"
                className="relative py-32 bg-gradient from-teal-900/20 to-transparent mt-12 overflow-hidden scroll-mt-24"
            >
                <div className="max-w-7xl mx-auto px-2 grid lg:grid-cols-2 items-start">

                    {/* LEFT SIDE – TITLE */}
                    <div>
                        <p className="text-neuuxai font-semibold mb-3">
                            How to start
                        </p>
                        <h2 className="text-5xl font-bold leading-tight">
                            Your UX
                            <br />
                            Roadmap
                        </h2>
                    </div>

                    {/* RIGHT SIDE – ROADMAP */}
                    <div className="relative min-h-150">

                        {/* SVG CURVED PATH */}
                        <svg
                            viewBox="0 0 600 700"
                            fill="none"
                            className="absolute inset-0 w-full h-full"
                        >
                            <path
                                d="M50 650 C 100 500, 300 500, 350 350 C 400 200, 520 200, 550 50"
                                stroke="rgba(20,184,166,0.35)"
                                strokeWidth="3"
                                fill="none"
                            />

                            {/* Dots */}
                            <circle cx="350" cy="350" r="8" fill="#22d3ee" />
                            <circle cx="50" cy="650" r="8" fill="#14b8a6" />
                            <circle cx="550" cy="50" r="8" fill="#5eead4" />
                        </svg>

                        {/* STEP 1 */}
                        <div className="absolute top-142.5 max-w-sm">
                            <h3 className="text-lg font-semibold mb-2">
                                Create your account
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Sign up and access NeuUX AI instantly with no setup.
                            </p>
                        </div>

                        {/* STEP 2 ✅ FIXED */}
                        <div className="absolute right-62.5 top-72.5 max-w-sm">
                            <h3 className="text-lg font-semibold mb-2">
                                Describe your idea
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Explain your product idea naturally, just like a conversation.
                            </p>
                        </div>

                        {/* STEP 3 */}
                        <div className="absolute right-18.75 top-\[80px] max-w-sm">
                            <h3 className="text-lg font-semibold mb-2">
                                Get UX outputs
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Receive user flows, personas, and structured UX insights.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="relative pt-24 pb-12 overflow-hidden">

                {/* BIG BACKGROUND BRAND TEXT */}
                <div className="absolute -bottom-15 left-1/2 -translate-x-1/2 select-none pointer-events-none">
                    <h1 className="text-[220px] font-bold text-white/5 tracking-tight">
                        neuuxai
                    </h1>
                </div>

                <div className="relative max-w-7xl mx-auto px-6">

                    {/* TOP CTA */}
                    <div className="mb-24 rounded-3xl bg-linear-to-b from-teal-900/40 to-teal-900/10 border border-teal-600/20 p-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Design smarter UX with <span className="text-neuuxai">NeuUX AI</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                            Turn ideas into structured UX outputs using conversational AI.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="px-6 py-3 rounded-lg bg-white text-black font-medium hover:opacity-90 transition">
                                Get Started
                            </button>
                            <button className="px-6 py-3 rounded-lg border border-foreground/20 text-white hover:bg-white/10 transition">
                                Learn More
                            </button>
                        </div>
                    </div>

                    {/* FOOTER GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">

                        {/* BRAND */}
                        <div>
                            <Image
                                src="/logo.png"
                                alt="NeuUX AI"
                                width={140}
                                height={40}
                                className="mb-4 opacity-90"
                                priority
                            />

                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                NeuUX AI helps designers and teams create user-centered UX faster
                                using conversational AI.
                            </p>

                            <div className="flex gap-4 text-muted-foreground">
                                <span className="hover:text-neuuxai cursor-pointer">𝕏</span>
                                <span className="hover:text-neuuxai cursor-pointer">in</span>
                            </div>
                        </div>

                        {/* PRODUCT */}
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="hover:text-white cursor-pointer">Features</li>
                                <li className="hover:text-white cursor-pointer">How it works</li>
                                <li className="hover:text-white cursor-pointer">Pricing</li>
                            </ul>
                        </div>

                        {/* CONTACT */}
                        <div>
                            <h4 className="font-semibold mb-4">Contact us</h4>
                            <div className="space-y-3">
                                <input
                                    placeholder="Full name"
                                    className="w-full bg-neutral-900 border border-foreground/10 rounded-lg px-3 py-2 text-sm"
                                />
                                <input
                                    placeholder="Email address"
                                    className="w-full bg-neutral-900 border border-foreground/10 rounded-lg px-3 py-2 text-sm"
                                />
                                <textarea
                                    placeholder="Message"
                                    rows={3}
                                    className="w-full bg-neutral-900 border border-foreground/10 rounded-lg px-3 py-2 text-sm"
                                />
                                <div className="flex justify-end">
                                    <button
                                        className="w-10 h-10 flex items-center justify-center text-neuuxai hover:scale-105 transition"
                                        aria-label="Send message"
                                    >
                                        ➤
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM BAR */}
                    <div className="border-t border-foreground/10 pt-4 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
                        <p>© {year} NeuUX AI. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-white cursor-pointer">Privacy</span>
                            <span className="hover:text-white cursor-pointer">Terms</span>
                        </div>
                    </div>

                </div>
            </footer>


        </main>
    )
}