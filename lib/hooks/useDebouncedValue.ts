"use client";

import { useEffect, useState } from "react";

/**
 * The trailing edge of `value` — it only updates once `value` has held still for
 * `delayMs`.
 *
 * Every search box in this app feeds its input straight into a TanStack query
 * key, and a new key is a new network request. Without this, typing "haaland"
 * fires seven catalog queries and shows the results of whichever happens to land
 * last. Pass the raw input through here before it reaches the query.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/** Long enough to swallow a fast typist's keystrokes, short enough to feel live. */
export const SEARCH_DEBOUNCE_MS = 300;
