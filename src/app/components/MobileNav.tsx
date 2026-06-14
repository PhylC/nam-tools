"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { MobileAuthLinks } from "./AuthNav";
import { TemporaryPlanToggle } from "./AptMode";

const mobileLinks = [
  { href: "/roi-tool", label: "ROI Tool", match: ["/roi-tool"] },
  { href: "/calculators", label: "Calculators", match: ["/calculators"] },
  { href: "/presentation-templates", label: "Presentations", match: ["/presentation-templates", "/templates", "/tools/buyer-meeting-prep", "/tools/customer-review-template", "/tools/joint-business-plan-builder"] },
  { href: "/pricing", label: "Pricing", match: ["/pricing"] },
  { href: "/workspace", label: "Workspace", match: ["/workspace"] },
  { href: "/settings", label: "Settings", match: ["/settings"] },
];

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
        <MobileAuthLinks onNavigate={closeMenu} />
        <div className="mobile-menu-test-toggle">
          <TemporaryPlanToggle />
        </div>
      </nav>
    </>
  );
}
