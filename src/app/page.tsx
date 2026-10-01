"use client";

import Link from "next/link";
import { ArrowRight, Compass, MessageCircle, Users } from "lucide-react";
import { useEffect } from "react";
import TopoField from "@/components/ui/topo-field";

function LogoAsset({ className }: { className?: string }) {
  return <img src="/Assets/logo.png" className={className} alt="" aria-hidden="true" />;
}

const features = [
  {
    icon: Users,
    title: "Personal emblems",
    copy: "Create a distinct identity that makes your people feel instantly recognized.",
  },
  {
    icon: Compass,
    title: "Spaces, not templates",
    copy: "Shape the rhythm of your community with room to evolve instead of rigid presets.",
  },
  {
    icon: MessageCircle,
    title: "Calm by design",
    copy: "Strip away noise and keep the essentials front and center so conversation stays easy.",
  },
];

export default function Home() {
  useEffect(() => {
    const root = document.querySelector(".landing-page") as HTMLElement | null;
    const topo = document.querySelector(".landing-topo") as HTMLElement | null;
    if (!root || !topo) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      topo.style.setProperty("--mx", "0");
      topo.style.setProperty("--my", "0");
      return;
    }

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = nx * 20;
      targetY = ny * 20;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      topo.style.setProperty("--mx", currentX.toFixed(2));
      topo.style.setProperty("--my", currentY.toFixed(2));
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="landing-page">
      <div className="landing-topo" aria-hidden="true">
        <div className="landing-topo-layer landing-topo-layer--far">
          <TopoField speed={0.85} length={0.9} density={0.8} opacity={0.42} />
        </div>
        <div className="landing-topo-layer landing-topo-layer--mid">
          <TopoField speed={1.15} length={1.1} density={1.05} opacity={0.58} />
        </div>
        <div className="landing-topo-layer landing-topo-layer--near">
          <TopoField speed={1.5} length={1.35} density={1.4} opacity={0.75} />
        </div>
        <div className="landing-topo-fade" />
      </div>

      <header className="landing-nav">
        <Link href="/" className="landing-brand">
          <LogoAsset className="landing-logo" />
          <span>FORGED</span>
        </Link>

        <nav className="landing-links" aria-label="Main navigation">
          <a href="#why-forged">Why Forged</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-actions">
          <Link href="/login" className="landing-login">
            Log in
          </Link>
          <Link href="/signup" className="landing-cta">
            Get started <ArrowRight />
          </Link>
        </div>
      </header>

      <section className="landing-hero" id="why-forged">
        <div className="landing-copy">
          <p className="landing-eyebrow">A place to belong</p>
          <h1>
            Better conversations.
            <span className="landing-highlight">Stronger communities.</span>
          </h1>
          <p className="landing-description">
            Your space. Your people. Your story. Forged is where genuine connection becomes
            something you can build on.
          </p>
          <div className="landing-hero-actions">
            <Link href="/signup" className="landing-primary">
              Create your space <ArrowRight />
            </Link>
            <Link href="/login" className="landing-secondary">
              I already have an account
            </Link>
          </div>
          <p className="landing-note">
            <span className="status-pulse" /> Free to join. Made for your people.
          </p>
        </div>
      </section>

      <section className="landing-features-section" id="features">
        <div className="landing-features-header">
          <p className="landing-section-eyebrow">WHY FORGED</p>
          <h2>Everything you need. Nothing you don&apos;t.</h2>
          <p>The essentials of community — done properly, kept calm.</p>
        </div>

        <div className="landing-features-grid">
          {features.map(({ icon: Icon, title, copy }) => (
            <article className="landing-feature" key={title}>
              <span className="feature-icon">
                <Icon />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-process-section" aria-labelledby="landing-process-title">
        <div className="landing-process-header">
          <p className="landing-section-eyebrow">MADE TO TAKE SHAPE</p>
          <h2 id="landing-process-title">A community grows from the details.</h2>
          <p>Start with the people who matter. Build a space that feels like yours.</p>
        </div>

        <div className="landing-process-grid">
          <article className="landing-step">
            <span className="landing-step-number">01</span>
            <h3>Give it an identity</h3>
            <p>Create a distinct emblem that helps your people feel instantly recognized.</p>
          </article>
          <article className="landing-step">
            <span className="landing-step-number">02</span>
            <h3>Make room to gather</h3>
            <p>Shape spaces around your community instead of squeezing into a template.</p>
          </article>
          <article className="landing-step">
            <span className="landing-step-number">03</span>
            <h3>Find your rhythm</h3>
            <p>Keep the essentials in view, so conversation can stay at the heart of it.</p>
          </article>
        </div>
      </section>

      <section className="landing-about-section" id="about" aria-labelledby="landing-about-title">
        <div className="landing-about-heading">
          <p className="landing-section-eyebrow">ABOUT FORGED</p>
          <h2 id="landing-about-title">A home for the people who make it yours.</h2>
        </div>
        <div className="landing-about-copy">
          <p>
            The best communities are more than a feed. They have their own character, their own
            rituals, and room for every conversation that brings people closer.
          </p>
          <p>
            Forged gives those communities a place to grow on their own terms: recognizable,
            flexible, and focused on the people inside.
          </p>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="landing-cta-panel">
          <div aria-hidden className="landing-cta-blur landing-cta-blur--left" />
          <div aria-hidden className="landing-cta-blur landing-cta-blur--right" />
          <div className="landing-cta-content">
            <p className="landing-section-eyebrow">Ready to forge?</p>
            <h2>
              Your community deserves a home.
              <span className="landing-highlight">Not a template.</span>
            </h2>
            <p>Create your emblem. Build your spaces. Tell your story.</p>
            <div className="landing-cta-actions">
              <Link href="/signup" className="landing-primary">
                Create your space →
              </Link>
              <Link href="/login" className="landing-account-link">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-footer-mark">FORGED</span>
        <p>Not a copy. A new forge.</p>
        <p className="landing-footer-year">© {new Date().getFullYear()} Forged</p>
      </footer>
    </main>
  );
}
