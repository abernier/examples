import { useEffect, useRef, useState } from "react";

/** True while the element is anywhere near the viewport. Used to park canvases. */
export function useOnScreen<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, visible] as const;
}
