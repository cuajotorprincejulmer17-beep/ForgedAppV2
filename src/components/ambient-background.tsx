"use client";

import { useEffect, useRef } from "react";

export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0, ty = 0; // target (-0.5..0.5)
    let cx = 0, cy = 0; // current, lerped

    const onMove = (e: MouseEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };

    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      el.style.setProperty("--mx", cx.toFixed(4));
      el.style.setProperty("--my", cy.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="ambient" aria-hidden>
      {/* mid — glows sampled from the reference: blue top-left, blue bottom-left, violet right */}
      <div className="ambient__glow ambient__glow--blue-tl" />
      <div className="ambient__glow ambient__glow--blue-bl" />
      <div className="ambient__glow ambient__glow--violet-r" />
      {/* near — hairline rings, move the most */}
      <div className="ambient__ring ambient__ring--one" />
      <div className="ambient__ring ambient__ring--two" />
      <div className="ambient__ring ambient__ring--three" />
      {/* stars with twinkle */}
      <div className="ambient__stars" />
    </div>
  );
}
