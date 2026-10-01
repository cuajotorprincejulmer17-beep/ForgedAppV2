"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleAlert, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentAuthSession, updateCurrentPassword } from "@/lib/services/auth-client";

type PasswordResetExperienceProps = {
  mode: "forgot" | "reset";
};

type PanelView = "request" | "sent" | "checking" | "reset" | "invalid" | "updated";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visibleName = name.length < 3 ? name.slice(0, 1) : name.slice(0, 2);
  return `${visibleName}${"•".repeat(Math.max(3, Math.min(name.length - visibleName.length, 7)))}@${domain}`;
}

export function PasswordResetExperience({ mode }: PasswordResetExperienceProps) {
  const router = useRouter();
  const [view, setView] = useState<PanelView>(mode === "forgot" ? "request" : "checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "reset") return;

    let isActive = true;
    const hasInvalidLink = new URLSearchParams(window.location.search).get("error") === "invalid_link";
    if (hasInvalidLink) {
      queueMicrotask(() => {
        if (isActive) setView("invalid");
      });
      return () => {
        isActive = false;
      };
    }

    getCurrentAuthSession()
      .then(({ data, error: sessionError }) => {
        if (isActive) setView(!sessionError && data.session ? "reset" : "invalid");
      })
      .catch(() => {
        if (isActive) setView("invalid");
      });

    return () => {
      isActive = false;
    };
  }, [mode]);

  const passwordChecks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9\s]/.test(password),
  ];
  const passwordStrength = passwordChecks.filter(Boolean).length;

  async function sendResetEmail() {
    const normalizedEmail = email.trim();
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "We couldn't send a reset link right now. Please try again.");
        return;
      }

      setEmail(normalizedEmail);
      setView("sent");
      if (view === "sent") setNotice("If an account matches, a new secure link is on its way.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (mode === "forgot" || view === "sent") {
      await sendResetEmail();
      return;
    }

    if (passwordStrength < passwordChecks.length) {
      setError("Use at least 8 characters, an uppercase letter, a number, and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match yet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const { error: updateError } = await updateCurrentPassword(password);
      if (updateError) {
        if (updateError.status === 401 || updateError.code === "session_not_found") {
          setView("invalid");
        } else if (updateError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (updateError.status === 422 || updateError.code === "weak_password") {
          setError("Choose a stronger password and try again.");
        } else {
          setError("We couldn't update your password. Check it and try again.");
        }
        return;
      }

      setView("updated");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = {
    request: "Forgot your password?",
    sent: "Check your inbox",
    checking: "Checking your reset link",
    reset: "Create a new password",
    invalid: "This reset link has expired",
    updated: "Password updated",
  }[view];

  const description = {
    request: "Enter the email associated with your FORGED account and we'll send you a secure reset link.",
    sent: "If an account exists for this address, a secure password reset link is on its way.",
    checking: "Verifying your secure password reset link.",
    reset: "Choose a new password for your FORGED account.",
    invalid: "This link may be invalid or expired. Request a fresh one to continue securely.",
    updated: "Your password has been changed successfully.",
  }[view];

  return (
    <main className="recovery-page">
      <div className="recovery-atmosphere" aria-hidden="true">
        <span className="recovery-glow recovery-glow--blue" />
        <span className="recovery-glow recovery-glow--violet" />
        <span className="recovery-technical-grid" />
      </div>

      <header className="recovery-header">
        <Link href="/" className="recovery-brand" aria-label="FORGED home">
          <Image src="/Assets/logo.png" alt="" aria-hidden="true" width={34} height={34} />
          <span>FORGED</span>
        </Link>
        <Link href="/login" className="recovery-top-link">
          <ArrowLeft aria-hidden="true" />
          Back to Login
        </Link>
      </header>

      <div className="recovery-main">
        <div className="recovery-content">
          <Card className="recovery-panel" aria-labelledby="recovery-title">
            <div className="recovery-panel-content" key={view}>
              <div className={`recovery-icon${view === "sent" || view === "updated" ? " recovery-icon--success" : ""}`}>
                {view === "sent" || view === "updated" ? (
                  <Check aria-hidden="true" />
                ) : view === "invalid" ? (
                  <CircleAlert aria-hidden="true" />
                ) : view === "request" ? (
                  <Mail aria-hidden="true" />
                ) : (
                  <KeyRound aria-hidden="true" />
                )}
              </div>

              <p className="recovery-eyebrow">
                {view === "updated" ? "ACCOUNT SECURED" : "ACCOUNT RECOVERY"}
              </p>
              <h1 id="recovery-title">{title}</h1>
              <p className="recovery-description">{description}</p>

              {view === "request" && (
                <form className="recovery-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
                  <div className="recovery-field">
                    <Label htmlFor="recovery-email">Email</Label>
                    <Input
                      id="recovery-email"
                      name="email"
                      className="recovery-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      placeholder="you@example.com"
                      maxLength={254}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "recovery-error" : undefined}
                      required
                    />
                  </div>
                  {error && <p className="recovery-error" id="recovery-error" role="alert">{error}</p>}
                  <Button type="submit" size="lg" className="recovery-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending link..." : "Send reset link"}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </form>
              )}

              {view === "sent" && (
                <div className="recovery-result" role="status" aria-live="polite">
                  <p className="recovery-address">
                    <Mail aria-hidden="true" />
                    <span>{maskEmail(email)}</span>
                  </p>
                  <p className="recovery-expiry">Reset links expire after a limited time.</p>
                  {notice && <p className="recovery-notice">{notice}</p>}
                  {error && <p className="recovery-error" role="alert">{error}</p>}
                  <form onSubmit={handleSubmit}>
                    <Button type="submit" variant="ghost" className="recovery-secondary" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Resend email"}
                    </Button>
                  </form>
                </div>
              )}

              {view === "reset" && (
                <form className="recovery-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
                  <div className="recovery-field">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      name="new-password"
                      className="recovery-input"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby="password-strength"
                      required
                    />
                    <div className="recovery-strength" id="password-strength" aria-live="polite">
                      <span className="recovery-strength-bars" aria-hidden="true">
                        {passwordChecks.map((isMet, index) => (
                          <span className={isMet ? "is-met" : ""} key={index} />
                        ))}
                      </span>
                      <span>{password ? ["Getting started", "Fair", "Good", "Strong"][Math.max(0, passwordStrength - 1)] : "At least 8 characters, uppercase, number, and symbol"}</span>
                    </div>
                  </div>
                  <div className="recovery-field">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      className="recovery-input"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter your new password again"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      aria-invalid={Boolean(error && password !== confirmPassword)}
                      required
                    />
                  </div>
                  {error && <p className="recovery-error" role="alert">{error}</p>}
                  <Button type="submit" size="lg" className="recovery-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating password..." : "Reset password"}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </form>
              )}

              {view === "invalid" && (
                <Link href="/forgot-password" className="recovery-submit recovery-link-button">
                  Request a new reset link
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}

              {view === "updated" && (
                <div className="recovery-result" role="status">
                  <p className="recovery-updated-note"><ShieldCheck aria-hidden="true" /> Your account is ready to use.</p>
                  <Button type="button" size="lg" className="recovery-submit" onClick={() => router.replace("/login?password=updated")}>
                    Continue to login
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              )}

              {view === "checking" && (
                <p className="recovery-checking" role="status">Your secure link is being verified.</p>
              )}

              <Link href="/login" className="recovery-back-link">
                <ArrowLeft aria-hidden="true" />
                Back to login
              </Link>
            </div>
          </Card>
          <p className="recovery-footnote"><ShieldCheck aria-hidden="true" /> Secure account recovery</p>
        </div>
      </div>
    </main>
  );
}