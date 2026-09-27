"use client";

/**
 * Live exchange rates, fetched once, shared by every component on the page.
 *
 * THE SAME SOURCE AND THE SAME BASE AS THE APP. sabie-v53-main's
 * CurrencyContext reads @fawazahmed0/currency-api with a GBP base and falls
 * back to the pages.dev mirror. The web must not disagree with the app about
 * what ₦8,000 is worth, because a guest can have both open, so this is the
 * same two URLs in the same order rather than a second opinion.
 *
 * WHY A MODULE-LEVEL PROMISE rather than a hook that fetches. Every listing
 * card on the home page needs rates, and a per-component fetch would be forty
 * identical requests on first paint. The promise is created once on first use
 * and every caller awaits the same one.
 *
 * WHAT HAPPENS WHEN IT FAILS is the important part, and it is inherited from
 * the app: "Rates not in yet: show native only (don't lie)." A failed fetch
 * leaves ready false, buildDisplayPrice returns the operator's own price in
 * the operator's own currency, and nothing on the page is wrong. It is never
 * a reason to show a zero, a dash, or a guess.
 */

import { useEffect, useState } from "react";
import { guestCurrency } from "./display-price";

const BASE = "gbp"; // the CDN uses lowercase codes
const PRIMARY = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE}.json`;
const FALLBACK = `https://latest.currency-api.pages.dev/v1/currencies/${BASE}.json`;

export type Rates = Record<string, number>;

let cached: Rates | null = null;
let inFlight: Promise<Rates | null> | null = null;

async function fetchFrom(url: string): Promise<Rates> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const block = data?.[BASE];
  if (!block || typeof block !== "object") throw new Error("malformed response");
  // Uppercased so callers use ISO codes, exactly as the app stores them.
  return Object.fromEntries(
    Object.entries(block).map(([k, v]) => [k.toUpperCase(), Number(v)]),
  ) as Rates;
}

export function loadRates(): Promise<Rates | null> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      cached = await fetchFrom(PRIMARY);
    } catch {
      try {
        cached = await fetchFrom(FALLBACK);
      } catch {
        // Both down. Native prices stand, which are always true.
        cached = null;
      }
    }
    inFlight = null;
    return cached;
  })();
  return inFlight;
}

/**
 * Rates plus whether they have arrived.
 *
 * `ready` is what gates conversion, so a component rendering before the fetch
 * resolves shows the native price and then swaps, rather than showing nothing
 * or a wrong number in the gap.
 */
export function useRates(): { rates: Rates | null; ready: boolean } {
  // Seeded from the module cache so a second component mounting after the
  // first fetch is already ready on its first render, with no flash.
  const [rates, setRates] = useState<Rates | null>(cached);
  const [ready, setReady] = useState<boolean>(cached !== null);

  useEffect(() => {
    if (cached !== null) return;
    let alive = true;
    loadRates().then((r) => {
      if (!alive) return;
      setRates(r);
      // Ready even when r is null: the question this answers is "has the
      // attempt finished", and a finished-but-failed attempt must not leave
      // every price on the page waiting forever.
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  return { rates, ready: ready && rates !== null };
}

/**
 * The visitor's own money, ready to hand to priceParts().
 *
 * ONE HOOK, so every surface asks the question the same way. The region comes
 * from navigator.language's region subtag rather than the language itself,
 * which is the same correction the app made: a UK user with Language=English
 * was read as en_US and shown dollars.
 *
 * An unknown region yields "", which converts nothing and leaves the
 * operator's own price standing.
 */
export function useMoney(): { rates: Rates | null; ready: boolean; to: string } {
  const { rates, ready } = useRates();
  const [to, setTo] = useState("");

  useEffect(() => {
    // Read in an effect, never during render: navigator does not exist on the
    // server, and reading it while rendering would make the server and client
    // markup differ and trip hydration.
    if (typeof navigator === "undefined") return;
    setTo(guestCurrency(navigator.language));
  }, []);

  return { rates, ready, to };
}
