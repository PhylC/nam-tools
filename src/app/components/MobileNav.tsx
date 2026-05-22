"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

const mobileLinks = [
  { href: "/roi-tool", label: "ROI Tool", match: ["/roi-tool"] },
  { href: "/calculators", label: "Calculators", match: ["/calculators"] },
  { href: "/presentation-templates", label: "Presentations", match: ["/presentation-templates", "/templates", "/tools/buyer-meeting-prep", "/tools/customer-review-template", "/tools/joint-business-plan-builder"] },
  { href: "/pricing", label: "Pricing", match: ["/pricing"] },
];

function currentLabel(pathname: string) {
  if (pathname.startsWith("/roi-tool")) return "ROI Tool";
  if (pathname.startsWith("/presentation-templates")) return "Presentations";
  if (pathname.startsWith("/tools/buyer-meeting-prep")) return "Presentations";
  if (pathname.startsWith("/tools/customer-review-template")) return "Presentations";
  if (pathname.startsWith("/tools/joint-business-plan-builder")) return "Presentations";
  if (pathname.startsWith("/templates")) return "Presentations";
  if (pathname.startsWith("/pricing")) return "Pricing";
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/calculators")) return "Calculators";
  return "Menu";
}

export function MobileNav() {
  const pathname = usePathname();
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);

  function isActive(match: string[]) {
    return match.some((item) => pathname.startsWith(item));
  }

  function toggleMenu() {
    setIsOpen((current) => !current);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="mobile-menu-toggle"
        onClick={toggleMenu}
        type="button"
      >
        Menu
      </button>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="mobile-tool-nav"
        onClick={toggleMenu}
        type="button"
      >
        <span>Current tool</span>
        <strong>{currentLabel(pathname)}</strong>
        <span aria-hidden="true">▾</span>
      </button>
      <nav className={isOpen ? "mobile-nav-panel mobile-nav-panel-open" : "mobile-nav-panel"} id={panelId} aria-label="Mobile navigation">
        {mobileLinks.map((link) => (
          <Link
            aria-current={isActive(link.match) ? "page" : undefined}
            className={isActive(link.match) ? "mobile-nav-link mobile-nav-link-active" : "mobile-nav-link"}
            href={link.href}
            key={link.href}
            onClick={closeMenu}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
