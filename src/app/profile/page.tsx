import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getCurrentProfile } from "@/lib/services/profile";

export default async function ProfilePage() {
  const result = await getCurrentProfile();
  if (result.status === "unauthenticated") redirect("/login");

  if (result.status !== "success") {
    return (
      <main className="profile-page">
        <section className="profile-unavailable">
          <p className="profile-eyebrow">PROFILE UNAVAILABLE</p>
          <h1>We couldn&apos;t load your profile.</h1>
          <p>Please try again in a moment.</p>
          <Link href="/home">Return home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <header className="profile-nav">
        <Link href="/home" className="profile-back">← Back to home</Link>
        <span>FORGED</span>
      </header>
      <ProfileEditor profile={result.profile} />
    </main>
  );
}
