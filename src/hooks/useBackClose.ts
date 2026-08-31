"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Keeps a UI layer (a sheet, a speed dial, ...) in sync with the browser
 * history so the hardware/OS back button closes it instead of leaving the
 * app. While `active` is true, pushes one history entry tagged with a
 * token unique to this hook instance. When that entry stops being the
 * current one (back button, or any `history.back()` call — including one
 * triggered by a sibling `useBackClose` instance reacting to the same
 * event), `onBack` runs. Multiple instances can be stacked (e.g. a menu,
 * then a form on top of it) — each only reacts once its own entry is left
 * behind. Only ever close through single-step `history.back()` calls (see
 * `goBackSteps` for closing more than one level at once) — a multi-step
 * `history.go(-n)` collapses several entries into one popstate event,
 * which can race with the host app's own router history handling.
 */
export function useBackClose(active: boolean, onBack: () => void) {
  const token = useId();
  const pushedRef = useRef(false);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!active) return;

    history.pushState({ backCloseToken: token }, "");
    pushedRef.current = true;

    return () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        history.back();
      }
    };
  }, [active, token]);

  // Registered for the component's whole lifetime (not toggled with
  // `active`): tearing it down and re-adding it on every `active` flip
  // would let one stacked instance's reaction to a popstate event
  // unregister a sibling instance's listener before that same event
  // reaches it, since DOM listeners removed mid-dispatch are skipped.
  useEffect(() => {
    function handlePopState() {
      if (!pushedRef.current) return;
      const current = window.history.state as { backCloseToken?: string } | null;
      if (current?.backCloseToken !== token) {
        pushedRef.current = false;
        onBackRef.current();
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [token]);
}

/**
 * Closes `steps` back-pushed layers at once (e.g. a form opened on top of
 * a speed dial), one `history.back()` at a time — each waiting for the
 * previous step's popstate before firing the next — so every popstate
 * event stays single-step and lands in `useBackClose`'s well-tested path.
 */
export function goBackSteps(steps: number) {
  if (steps <= 0) return;
  const handlePopState = () => {
    window.removeEventListener("popstate", handlePopState);
    if (steps > 1) goBackSteps(steps - 1);
  };
  window.addEventListener("popstate", handlePopState);
  history.back();
}
