"use client";

import { Mail } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type MouseEvent, useState } from "react";

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

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!identifier.trim() || !password) {
      setError("Enter your email or username and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to log in right now. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to log in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
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
            <p className="login-kicker">WELCOME BACK</p>
            <h1>Log in to continue to Forged</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <label htmlFor="identifier">Email or username</label>
            <div className="login-input-wrap" onMouseMove={updateHoverPosition}>
              <Mail aria-hidden="true" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="you@example.com"
                autoComplete="username"
                aria-required="true"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="password-field" onMouseMove={updateHoverPosition}>
              <PasswordInput value={password} onChange={setPassword} />
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}
            <button
              type="submit"
              className="login-submit hover-reveal"
              onMouseMove={updateButtonHoverPosition}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <Link href="/forgot-password" className="forgot-link">Forgot your password?</Link>
          <div className="login-divider"><span />or<span /></div>
          <Link href="/signup" className="create-account hover-reveal" onMouseMove={updateButtonHoverPosition}>Create an Account</Link>
        </div>
      </section>
    </main>
  );
}
