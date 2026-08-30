"use client";

import { useEffect, useState } from "react";

const NOTIFS_STORAGE_KEY = "kilio-notifs";

export function NotificationsRow() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(localStorage.getItem(NOTIFS_STORAGE_KEY) !== "off");
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    localStorage.setItem(NOTIFS_STORAGE_KEY, next ? "on" : "off");
  }

  return (
    <div className="flex items-center justify-between border-t border-line py-3.5">
      <span className="text-[14px] font-medium text-ink">Notifications</span>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className="relative h-[26px] w-11 rounded-full transition-colors"
        style={{ background: on ? "var(--accent-kcal)" : "var(--surface-alt)" }}
      >
        <span
          className="absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white transition-all"
          style={{ left: on ? "20px" : "2px" }}
        />
      </button>
    </div>
  );
}
