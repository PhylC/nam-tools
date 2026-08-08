"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackUpgradeClicked } from "../../lib/analytics";

type TrackedUpgradeLinkProps = ComponentProps<typeof Link> & {
  location: string;
};

export function TrackedUpgradeLink({ location, onClick, ...props }: TrackedUpgradeLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackUpgradeClicked(location);
        onClick?.(event);
      }}
    />
  );
}
