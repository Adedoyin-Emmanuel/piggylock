"use client";

import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { githubUrl, socials } from "@/lib/config";
import { Logo } from "./logo";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const connect = [
  { href: githubUrl, label: "GitHub" },
  { href: socials.x, label: "X (Twitter)" },
  { href: socials.instagram, label: "Instagram" },
  { href: socials.linkedin, label: "LinkedIn" },
];

/**
 * Sticky top bar. On mobile, a shadcn/ui-style menu: a three-line toggle that
 * morphs into an ✕, opening a full-screen, blurred panel below the header.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Lock page scroll, close on Escape, and close if the screen grows past mobile.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 640px)");
    const onResize = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#" aria-label="PiggyLock home" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <nav
          aria-label="Main"
          className="hidden items-center gap-7 text-sm font-medium text-muted-foreground sm:flex"
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} className="link-underline hover:text-foreground">
              {l.label}
            </a>
          ))}
          <a href={githubUrl} className="flex items-center gap-1.5 hover:text-foreground">
            <HugeiconsIcon icon={GithubIcon} className="size-[18px]" />
            <span className="link-underline">GitHub</span>
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="-mr-2 flex size-11 touch-manipulation items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:hidden"
        >
          {/* Three lines that morph into an ✕: outer lines rotate, middle fades. */}
          <span className="relative h-3.5 w-[18px]" aria-hidden>
            <span
              className={`absolute left-0 block h-0.5 w-full rounded-full bg-foreground transition-all duration-150 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute top-1.5 left-0 block h-0.5 w-full rounded-full bg-foreground transition-opacity duration-150 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-full rounded-full bg-foreground transition-all duration-150 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>
    </header>

      {/* Rendered beside (not inside) the header: the header's backdrop-filter
          would otherwise become the containing block for this fixed panel. */}
      {open && (
        <div
          id="mobile-menu"
          className="animate-fade-in fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto bg-background/90 backdrop-blur-md sm:hidden"
        >
          <div className="flex flex-col gap-12 px-6 py-6">
            <nav aria-label="Main" className="flex flex-col gap-4">
              <p className="text-sm font-medium text-muted-foreground">Menu</p>
              <div className="flex flex-col gap-3">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="text-2xl font-medium"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </nav>
            <nav aria-label="Connect" className="flex flex-col gap-4">
              <p className="text-sm font-medium text-muted-foreground">Connect</p>
              <div className="flex flex-col gap-3">
                {connect.map((l) => (
                  <a key={l.href} href={l.href} className="text-2xl font-medium">
                    {l.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
