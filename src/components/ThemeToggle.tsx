"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div className="badge" title="Toggle color theme">Theme: {theme ?? "system"}</div>
      <button className="btn" onClick={toggleTheme}>Toggle theme</button>
    </div>
  );
} 