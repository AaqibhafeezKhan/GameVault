import { useState, useRef, useCallback } from "react";

export function useTimer(countDown = false, initialSeconds = 0) {
  const [elapsed, setElapsed] = useState(initialSeconds);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(initialSeconds);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    startTimeRef.current = Date.now() - elapsedRef.current * 1000;
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = countDown
        ? Math.max(
            0,
            initialSeconds - Math.floor((now - startTimeRef.current) / 1000),
          )
        : Math.floor((now - startTimeRef.current) / 1000);
      elapsedRef.current = newElapsed;
      setElapsed(newElapsed);
    }, 200);
  }, [countDown, initialSeconds]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const reset = useCallback(
    (newInitial) => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      const val = newInitial !== undefined ? newInitial : initialSeconds;
      elapsedRef.current = val;
      setElapsed(val);
    },
    [initialSeconds],
  );

  return { elapsed, start, stop, reset };
}
