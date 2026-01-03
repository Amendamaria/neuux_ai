import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface NavbarProps {
  showLogin: boolean
}

export default function Navbar({ showLogin }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <nav className="border-b border-teal-600/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Button
          variant="link"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <Image
            src="/logo.png"
            alt="NeuUXAI Logo"
            width={110}
            height={28}
            className="w-full h-full object-contain"
            priority
          />
        </Button>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="">
            Home
          </Link>
          <div className="hidden md:flex items-center gap-8">
  <button
    onClick={() =>
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
    }
    className="hover:text-neuuxai transition"
  >
    Features
  </button>

  <button
    onClick={() =>
      document
        .getElementById("how-it-works")
        ?.scrollIntoView({ behavior: "smooth" })
    }
    className="hover:text-neuuxai transition"
  >
    How It Works
  </button>
</div>

          <Link href="/pricing" className="">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {showLogin ? (
            <Button
              variant={"default"}
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
          ) : (
            <Button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full p-2 transition"
            >
              <User className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
