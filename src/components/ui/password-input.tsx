"use client";

import { useEffect, useRef, useState } from "react";

const SCRAMBLE = "abcdefABCDEF0123456789!<>-_\\/[]{}=+*^?#✦✧";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [blink, setBlink] = useState(false);
  const [scramble, setScramble] = useState<string | null>(null);
  const eyeRef = useRef<HTMLSpanElement>(null);
  const pupilRef = useRef<SVGGElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrambling = scramble !== null;

  // --- pupil follows cursor (only while open) ---
  useEffect(() => {
    if (!visible) return;
    const move = (e: MouseEvent) => {
      const eye = eyeRef.current;
      const pupil = pupilRef.current;
      if (!eye || !pupil) return;
      const r = eye.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(2.5, Math.hypot(dx, dy) / 60);
      pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${
        Math.sin(angle) * dist
      }px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [visible]);

  // --- blink loop (only while open) ---
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const loop = () => {
      if (cancelled) return;
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => {
          setBlink(false);
          loop();
        }, 140);
      }, 2400 + Math.random() * 2600);
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  // --- cleanup scramble on unmount ---
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const toggle = () => {
    if (!visible && value) {
      if (timerRef.current) clearInterval(timerRef.current);
      let i = 0;
      const len = value.length;
      const step = 1250 / len;
      setScramble(
        Array.from(
          { length: len },
          () => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]
        ).join("")
      );
      timerRef.current = setInterval(() => {
        i++;
        if (i >= len) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setScramble(null);
          setVisible(true);
        } else {
          const noise = Array.from(
            { length: len - i },
            () => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]
          ).join("");
          setScramble(value.slice(0, i) + noise);
        }
      }, step);
    } else {
      setScramble(null);
      setVisible((v) => !v);
    }
  };

  return (
    <div className="relative">
      <input
        type={visible || scrambling ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-input bg-background px-3 py-2 pr-11 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground focus:ring-2 focus:ring-ring ${
          scrambling ? "text-transparent" : ""
        }`}
      />

      {/* scramble overlay — only during reveal */}
      {scrambling && (
        <span
          aria-hidden
          className="glitch-reveal pointer-events-none absolute z-10 select-none whitespace-pre font-mono text-sm text-foreground"
        >
          {scramble}
        </span>
      )}

      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {/* OPEN eye */}
        <span
          ref={eyeRef}
          className={`block transition-all duration-200 ${
            visible && !scrambling
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-75 opacity-0 absolute"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <defs>
              <linearGradient id="forged-iris" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5b7cfa" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <g
              style={{
                transform: blink ? "scaleY(0.12)" : "scaleY(1)",
                transformOrigin: "center",
                transformBox: "fill-box",
                transition: "transform 110ms ease",
              }}
            >
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g ref={pupilRef} style={{ transition: "transform 80ms ease-out" }}>
                <circle cx="12" cy="12" r="3.8" fill="url(#forged-iris)" />
                <circle cx="12" cy="12" r="1.7" fill="#070b16" />
                <circle cx="13.3" cy="10.6" r="0.7" fill="#ffffff" opacity="0.9" />
              </g>
            </g>
          </svg>
        </span>

        {/* CLOSED eye (sleeping) */}
        <span
          className={`absolute transition-all duration-200 ${
            visible || scrambling
              ? "rotate-90 scale-75 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 13.5Q12 19.5 21 13.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M7 16.4l-1.4 2M12 17.6v2.2M17 16.4l1.4 2"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
