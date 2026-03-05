"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function SignUpForm() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password match check
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

 const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

if (!passwordRegex.test(formData.password)) {
  setError(
    "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."
  );
  return;
}

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },

          // IMPORTANT: redirect confirmation link here
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log("Signup response:", data);

      if (error) throw error;

      router.push("/auth/signup-success");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="min-h-screen flex items-center justify-center px-2">
        <div className="w-full max-w-md border border-teal-600/40 rounded-3xl p-8 bg-linear-to-b from-teal-900/30 to-transparent space-y-8">

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">
              Welcome To NeuUX AI!
            </h1>
            <p className="text-gray-400">Create your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="bg-transparent border border-teal-600/30 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:border-teal-600 text-sm"
              />

              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-transparent border border-teal-600/30 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:border-teal-600 text-sm"
              />
            </div>

            <Input
              type="password"
              name="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:border-teal-600"
            />

            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full bg-transparent border border-teal-600/30 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:border-teal-600"
            />

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/auth/login")}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Login
              </Button>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}