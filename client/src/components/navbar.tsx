import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import Link from "next/link"

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
          variant={"link"}
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:no-underline transition"
        >
          <span className="text-2xl font-bold text-foreground">
            Neu<span className="text-neuuxai">UX</span><span className="text-xs text-gray-400">ai</span>
          </span>
        </Button>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="hover:underline transition">
            Home
          </Link>
          <Link href="#" className="hover:underline transition">
            Features
          </Link>
          <Link href="#" className="hover:underline transition">
            How It Works
          </Link>
          <Link href="/pricing" className="hover:underline transition">
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
