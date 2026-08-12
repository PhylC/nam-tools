"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent, trackUpgradeClicked } from "../../lib/analytics";
import { useAuth } from "../../lib/useAuth";

export type AccountMenuActiveSection = "account" | "settings" | "workspace";

type AccountMenuProps = {
  active: AccountMenuActiveSection;
  actualPlan?: string;
  canManageBilling?: boolean;
  isOpeningPortal?: boolean;
  onOpenBilling?: () => void;
  onSignOut?: () => void | Promise<void>;
};

function MenuText({ title, description }: { title: string; description: string }) {
  return (
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
  );
}

export function AccountMenu({
  active,
  actualPlan,
  canManageBilling = false,
  isOpeningPortal = false,
  onOpenBilling,
  onSignOut,
}: AccountMenuProps) {
  const router = useRouter();
  const auth = useAuth();
  const plan = actualPlan ?? auth.actualPlan;
  const isFree = plan === "free";

  async function handleSignOut() {
    if (onSignOut) {
      await onSignOut();
      return;
    }
    const result = await auth.signOut();
    if (result.ok) {
      trackEvent("logout_completed");
      router.push("/calculators?auth=signed-out");
    }
  }

  return (
    <aside className="account-actions-panel" aria-label="Account menu">
      <div>
        <h3>Account menu</h3>
        <p>Move between your billing, settings and saved planning work.</p>
      </div>
      <nav className="account-menu-list" aria-label="Account sections">
        {active === "account" ? (
          canManageBilling && onOpenBilling ? (
            <button
              className="account-menu-item account-menu-item-active"
              disabled={isOpeningPortal}
              onClick={onOpenBilling}
              type="button"
            >
              <MenuText
                title={isOpeningPortal ? "Opening billing..." : "Plan & billing"}
                description="Manage subscription, invoices and payment details"
              />
            </button>
          ) : (
            <div className="account-menu-item account-menu-item-active" aria-current="page">
              <MenuText
                title="Plan & billing"
                description={isFree ? "Upgrade or compare plans" : "Plan status and account details"}
              />
            </div>
          )
        ) : (
          <Link
            className="account-menu-item"
            href="/account"
            onClick={isFree ? () => trackUpgradeClicked("account_menu_plan_billing") : undefined}
          >
            <MenuText
              title="Plan & billing"
              description={isFree ? "Upgrade or compare plans" : "Plan status, invoices and payment details"}
            />
          </Link>
        )}
        {active === "settings" ? (
          <div className="account-menu-item account-menu-item-active" aria-current="page">
            <MenuText title="Settings" description="Defaults, branding and export preferences" />
          </div>
        ) : (
          <Link className="account-menu-item" href="/settings">
            <MenuText title="Settings" description="Defaults, branding and export preferences" />
          </Link>
        )}
        {active === "workspace" ? (
          <div className="account-menu-item account-menu-item-active" aria-current="page">
            <MenuText title="Workspace" description="Saved plans, scenarios, decks and exports" />
          </div>
        ) : (
          <Link className="account-menu-item" href="/workspace">
            <MenuText title="Workspace" description="Saved plans, scenarios, decks and exports" />
          </Link>
        )}
      </nav>
      <button className="account-menu-item account-menu-sign-out" onClick={handleSignOut} type="button">
        <MenuText title="Sign out" description="End this session on this device" />
      </button>
    </aside>
  );
}
