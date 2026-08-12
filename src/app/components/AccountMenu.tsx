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

type MenuIcon = "billing" | "settings" | "workspace" | "signOut";

function AccountMenuIcon({ icon }: { icon: MenuIcon }) {
  const paths = {
    billing: (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
        <path d="M3.5 9h17" />
        <path d="M7.5 14h4" />
      </>
    ),
    settings: (
      <>
        <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
        <path d="M19.43 12.98c.04-.32.04-.64 0-.96l2.02-1.58-1.92-3.32-2.38.96a7.78 7.78 0 0 0-.83-.48L15.96 5h-3.84l-.36 2.6c-.29.14-.57.3-.83.48l-2.38-.96-1.92 3.32 2.02 1.58a7.57 7.57 0 0 0 0 .96l-2.02 1.58 1.92 3.32 2.38-.96c.26.18.54.34.83.48l.36 2.6h3.84l.36-2.6c.29-.14.57-.3.83-.48l2.38.96 1.92-3.32-2.02-1.58Z" />
      </>
    ),
    workspace: (
      <>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l2 2h5A2.5 2.5 0 0 1 19 9.5v7A2.5 2.5 0 0 1 16.5 19h-10A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path d="M4 10h15" />
      </>
    ),
    signOut: (
      <>
        <path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18H10" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),
  };

  return (
    <span className="account-menu-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        {paths[icon]}
      </svg>
    </span>
  );
}

function MenuText({ title, description }: { title: string; description: string }) {
  return (
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
  );
}

function MenuContent({ icon, title, description }: { icon: MenuIcon; title: string; description: string }) {
  return (
    <>
      <AccountMenuIcon icon={icon} />
      <MenuText title={title} description={description} />
    </>
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
        <p>Billing, settings and saved work.</p>
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
              <MenuContent
                icon="billing"
                title={isOpeningPortal ? "Opening billing..." : "Plan & billing"}
                description="Manage subscription, invoices and payment details"
              />
            </button>
          ) : (
            <div className="account-menu-item account-menu-item-active" aria-current="page">
              <MenuContent
                icon="billing"
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
            <MenuContent
              icon="billing"
              title="Plan & billing"
              description={isFree ? "Upgrade or compare plans" : "Plan status, invoices and payment details"}
            />
          </Link>
        )}
        {active === "settings" ? (
          <div className="account-menu-item account-menu-item-active" aria-current="page">
            <MenuContent icon="settings" title="Settings" description="Defaults, branding and export preferences" />
          </div>
        ) : (
          <Link className="account-menu-item" href="/settings">
            <MenuContent icon="settings" title="Settings" description="Defaults, branding and export preferences" />
          </Link>
        )}
        {active === "workspace" ? (
          <div className="account-menu-item account-menu-item-active" aria-current="page">
            <MenuContent icon="workspace" title="Workspace" description="Saved plans, scenarios, decks and exports" />
          </div>
        ) : (
          <Link className="account-menu-item" href="/workspace">
            <MenuContent icon="workspace" title="Workspace" description="Saved plans, scenarios, decks and exports" />
          </Link>
        )}
      </nav>
      <button className="account-menu-item account-menu-sign-out" onClick={handleSignOut} type="button">
        <MenuContent icon="signOut" title="Sign out" description="End this session on this device" />
      </button>
    </aside>
  );
}
