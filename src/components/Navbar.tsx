import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./AuthButton";

export default function Navbar() {
  return (
    <nav className="border-b border-teal-600/20 backdrop-blur-sm bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="NeuUXAI Logo"
            width={110}
            height={28}
            className="object-contain"
            priority
          />
        </Link>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="hover:text-neuuxai transition">
            Home
          </Link>

          <Link href="/#features" className="hover:text-neuuxai transition">
            Features
          </Link>

          <Link href="/#how-it-works" className="hover:text-neuuxai transition">
            How It Works
          </Link>

          <Link href="/pricing" className="hover:text-neuuxai transition">
            Pricing
          </Link>
        </div>

        {/* AUTH */}
        <div className="flex items-center gap-4">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
