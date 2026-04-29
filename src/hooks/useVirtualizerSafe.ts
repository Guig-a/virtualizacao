import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * useVirtualizerSafe
 *
 * Wrapper em volta do useVirtualizer do @tanstack/react-virtual que garante:
 *  1. mountedRef  — impede setState após unmount do componente
 *  2. cancelAnimationFrame — cancela RAFs pendentes no cleanup
 *  3. Não chamar measure() dentro de onChange do virtualizer — isso dispara um
 *     ciclo infinito (onChange → measure → onChange → …). O useVirtualizer já
 *     reconcilia scroll/resize internamente.
 *
 * Uso:
 *   const { virtualItems, totalSize, parentRef } = useVirtualizerSafe({ count: 10_000 });
 */

interface UseVirtualizerSafeOptions {
  count: number;
  estimateSize?: () => number;
  overscan?: number;
}

export function useVirtualizerSafe({
  count,
  estimateSize = () => 44,
  overscan = 5,
}: UseVirtualizerSafeOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const mountedRef = useRef(true);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  });

  return {
    parentRef,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    measure: () => {
      if (mountedRef.current) virtualizer.measure();
    },
  };
}
