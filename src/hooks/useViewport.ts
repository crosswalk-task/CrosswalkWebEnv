import { useEffect, useRef, useState } from "react";

type ViewportSize = {
  width: number;
  height: number;
  devicePixelRatio: number;
};

export function useViewport(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0, devicePixelRatio: 1 };
    }
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  });

  // prevent calling too much during browser resizing
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const measureViewportSize = () => {
      const next: ViewportSize = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      };
      setSize(next);
    };

    const schedule = () => {
      if (rafId.current != null) return;
      rafId.current = window.requestAnimationFrame(() => {
        rafId.current = null;
        measureViewportSize();
      });
    };

    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("scroll", schedule, { passive: true }); // 모바일 주소창 슬라이드 등

    measureViewportSize();
    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  return size;
}
