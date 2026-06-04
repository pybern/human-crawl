"use client";

import { useEffect, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { useApp } from "@/lib/store";

/**
 * Mounts a drei <View> (and its 3D children) only once its slot scrolls near
 * the viewport, then keeps it mounted (drei skips rendering off-screen Views,
 * so that stays cheap). This avoids compiling every section's shaders at once
 * on first load — which otherwise stalls the main thread. Falls back to a
 * static node when WebGL is unavailable or before first reveal.
 */
export default function LazyView({
  children,
  fallback,
  className = "absolute inset-0 h-full w-full",
  rootMargin = "300px",
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const webglOk = useApp((s) => s.webglOk);

  useEffect(() => {
    if (!webglOk) return;
    const el = slotRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect(); // latch: keep mounted afterwards
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [webglOk, rootMargin]);

  return (
    <div ref={slotRef} className={className}>
      {webglOk && near ? (
        <View className="h-full w-full">{children}</View>
      ) : (
        fallback ?? null
      )}
    </div>
  );
}
