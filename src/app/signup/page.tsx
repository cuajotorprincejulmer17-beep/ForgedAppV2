"use client";

import { AtSign, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type MouseEvent, useState } from "react";
import { PasswordInput } from "@/components/ui/password-input";

function updateHoverPosition(event: React.MouseEvent<HTMLDivElement>) {
  const field = event.currentTarget;
  const rect = field.getBoundingClientRect();
  field.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  field.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}

function updateButtonHoverPosition(event: MouseEvent<HTMLElement>) {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  target.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}

function validateForm(username: string, displayName: string, email: string, password: string) {
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  if (!normalizedUsername) return "Username is required.";
  if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
    return "Username must be 3-20 characters using letters, numbers, or underscores.";
  }
  if (!displayName.trim()) return "Display name is required.";
  if (displayName.trim().length > 40) return "Display name must be 40 characters or fewer.";
  if (!email.trim()) return "Email is required.";
  if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9\s]/.test(password)) return "Password must include a special character.";
  return null;
}

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isComplete) return;

    const validationError = validateForm(username, displayName, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, email, password }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        requiresEmailConfirmation?: boolean;
      } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to create your account right now. Please try again.");
        return;
      }

      setIsComplete(true);
      if (result?.requiresEmailConfirmation) {
        setSuccessMessage("Your account is ready. Check your email to verify it before logging in.");
        return;
      }

      router.replace("/home");
      router.refresh();
    } catch {
      setError("Unable to create your account right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page signup-page">
      <section className="login-scene" aria-label="Forged welcome">
        <div className="scene-stars" />
        <div className="scene-moon" />
        <div className="scene-mountain scene-mountain-back" />
        <div className="scene-mountain scene-mountain-front" />
        <div className="scene-spire" />
        <div className="scene-water" />
        <div className="login-brand">
          <div className="login-brand-glow" aria-hidden="true" />
          <img src="/Assets/logo.png" alt="" className="login-brand-logo" />
          <span>FORGED</span>
          <p>Your space. Your people. Your story.</p>
        </div>
      </section>

      <section className="login-panel-wrap">
        <div className="login-panel">
          <div className="login-heading">
            <p className="login-kicker">CREATE ACCOUNT</p>
            <h1>Join Forged</h1>
          </div>

          <form className="login-form signup-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <label htmlFor="signup-username">Username</label>
            <div className="login-input-wrap" onMouseMove={updateHoverPosition}>
              <AtSign aria-hidden="true" />
              <input
                id="signup-username"
                name="username"
                type="text"
                placeholder="yourname"
                autoComplete="username"
                autoCapitalize="none"
                maxLength={20}
                aria-required="true"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <label htmlFor="signup-display-name">Display name</label>
            <div className="login-input-wrap" onMouseMove={updateHoverPosition}>
              <UserRound aria-hidden="true" />
              <input
                id="signup-display-name"
                name="displayName"
                type="text"
                placeholder="How people will see you"
                autoComplete="name"
                maxLength={40}
                aria-required="true"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>

            <label htmlFor="signup-email">Email</label>
            <div className="login-input-wrap" onMouseMove={updateHoverPosition}>
              <Mail aria-hidden="true" />
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                maxLength={254}
                aria-required="true"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <label htmlFor="signup-password">Password</label>
            <div className="password-field" onMouseMove={updateHoverPosition}>
              <PasswordInput value={password} onChange={setPassword} />
            </div>
            <p className="signup-password-rules" id="signup-password-rules">
              At least 8 characters, with an uppercase letter, a number, and a special character.
            </p>

            {error && <p className="login-error" role="alert">{error}</p>}
            {successMessage && <p className="signup-success" role="status">{successMessage}</p>}
            <button
              type="submit"
              className="login-submit hover-reveal"
              onMouseMove={updateButtonHoverPosition}
              disabled={isSubmitting || isComplete}
            >
              {isSubmitting ? "Creating account..." : isComplete ? "Account created" : "Create Account"}
            </button>
          </form>

          <Link href="/login" className="forgot-link">Already have an account? Log in</Link>
        </div>
      </section>
    </main>
  );
}
