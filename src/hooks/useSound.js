import { useRef, useCallback } from "react";

export function useSound(enabled) {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency, duration, type = "sine") => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + duration,
        );
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {}
    },
    [enabled, getCtx],
  );

  const playSuccess = useCallback(() => {
    playTone(523, 0.1);
    setTimeout(() => playTone(659, 0.1), 100);
    setTimeout(() => playTone(784, 0.15), 200);
  }, [playTone]);

  const playFail = useCallback(() => {
    playTone(300, 0.15, "sawtooth");
    setTimeout(() => playTone(220, 0.2, "sawtooth"), 150);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(800, 0.05, "square");
  }, [playTone]);

  return { playTone, playSuccess, playFail, playClick };
}
