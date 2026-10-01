import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profile";

export default async function HomePage() {
  const result = await getCurrentProfile();
  if (result.status === "unauthenticated") redirect("/login");

  const profile = result.status === "success" ? result.profile : null;
  const displayName = typeof profile?.display_name === "string" ? profile.display_name : "there";
  const isFirstVisit = profile?.tutorial_completed === false;

  return (
    <main className="login-page">
      <section className="login-scene" aria-label="Forged welcome">
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
            <p className="login-kicker">YOUR FORGED SPACE</p>
            <h1>Welcome, {displayName}</h1>
          </div>
          <p className="home-placeholder-message">
            {isFirstVisit
              ? "Your account is ready. The first-time tutorial is not available yet."
              : "Your Forged home is being prepared."}
          </p>
          <Link href="/profile" className="home-profile-link">Manage profile</Link>
        </div>
      </section>
    </main>
  );
}
