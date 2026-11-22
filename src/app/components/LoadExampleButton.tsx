"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function LoadExampleButton({ onLoad, label = "Load example", compact = true }: {
  onLoad: () => void;
  label?: string;
  compact?: boolean;
}) {
  // The server-rendered control should not accept a click until its handler is attached.
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return (
    <button className={`button button-secondary${compact ? " button-small" : ""}`} type="button"
      disabled={!ready} onClick={onLoad}>
      {ready ? label : "Preparing example…"}
    </button>
  );
}
