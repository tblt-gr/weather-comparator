"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
