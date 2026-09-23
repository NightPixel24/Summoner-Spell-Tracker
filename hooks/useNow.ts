import { useEffect, useState } from 'react';

// Current time, re-rendering every `intervalMs` while `active`.
// Timers derive everything from Date.now(), so a paused interval (app in
// background, phone locked) catches up on the next tick.
export function useNow(active: boolean, intervalMs = 100) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return active ? now : Date.now();
}
