"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Import toast
import { Button } from "@/components/ui/button"; // Import Button
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  // const [error, setError] = useState(""); // Removed, using toast instead
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(""); // Removed

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match"); // Use toast
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters"); // Use toast
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy"); // Use toast
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (authError) {
        toast.error(authError.message || "Failed to create account"); // Use toast
        setLoading(false);
        return;
      }

      // Redirect to onboarding after successful signup
      router.push("/onboarding");
    } catch (err) {
      toast.error("An unexpected error occurred"); // Use toast
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding", // Callback to onboarding
      });
    } catch (err) {
      toast.error("Failed to sign up with Google"); // Use toast
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start creating amazing case studies today
        </p>
      </div>

      {/* Error div removed, using toast instead */}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className="h-10"
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="h-10"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              className="h-10" // No pr-10 needed if button is positioned correctly
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground/90"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" /> // Match size h-4 w-4
              ) : (
                <Eye className="h-4 w-4" /> // Match size h-4 w-4
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="h-10"
              placeholder="••••••••"
            />
            {/* You can optionally add a show/hide button here too if desired */}
          </div>
        </div>

        <Label className="flex items-center space-x-2 pt-2">
          <Input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 text-foreground rounded focus:ring-foreground"
          />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-foreground hover:text-muted-foreground font-medium"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-foreground hover:text-muted-foreground font-medium"
            >
              Privacy Policy
            </Link>
          </span>
        </Label>

        <Button
          type="submit"
          disabled={loading}
          variant={"default"}
          size={"lg"}
          className="w-full !mt-6" // Added !mt-6 for spacing after checkbox
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Creating account...</span>
            </div>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-muted text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        onClick={handleGoogleSignUp}
        variant={"outline"}
        className="w-full"
        size="lg"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-foreground hover:text-muted-foreground font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
