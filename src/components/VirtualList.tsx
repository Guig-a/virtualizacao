
import { useCallback, useEffect, useRef } from "react";
import { useVirtualizerSafe } from "../hooks/useVirtualizerSafe";

export interface ListItem {
  id: number;
  label: string;
  value: number;
}

export interface VirtualListMetrics {
  /** Quantidade de linhas DOM renderizadas (viewport + overscan). */
  visibleCount: number;
  /** Total de renders acumulados do VirtualList (só enviado ao pai quando a fatia visível muda). */
  listRenders: number;
}

interface VirtualListProps {
  items: ListItem[];
  itemHeight?: number;
  onMetrics?: (m: VirtualListMetrics) => void;
}

interface RowProps {
  item: ListItem;
  start: number;
  height: number;
}

function Row({ item, start, height }: RowProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${start}px)`,
        height,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        borderBottom: "1px solid #30363d",
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#8b949e", width: 56 }}>
        #{item.id}
      </span>
      <div style={{ flex: 1, height: 6, background: "#1c2128", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${item.value * 100}%`,
            background: "linear-gradient(90deg, #58a6ff, #3fb950)",
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#c9d1d9", width: 40, textAlign: "right" }}>
        {(item.value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export function VirtualList({ items, itemHeight = 44, onMetrics }: VirtualListProps) {
  const estimateSize = useCallback(() => itemHeight, [itemHeight]);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const { parentRef, virtualItems, totalSize } = useVirtualizerSafe({
    count: items.length,
    estimateSize,
    overscan: 5,
  });

  /** Só muda quando as linhas visíveis mudam (scroll/resize) — evita loop pai→filho ao atualizar métricas. */
  const visibleSliceKey = virtualItems.map((row) => row.index).join("|");

  useEffect(() => {
    onMetrics?.({
      visibleCount: virtualItems.length,
      listRenders: renderCountRef.current,
    });
  }, [visibleSliceKey, onMetrics, virtualItems.length]);

  return (
    <div
      ref={parentRef}
      style={{
        height: 480,
        overflowY: "auto",
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 8,
        position: "relative",
      }}
    >
      <div style={{ height: totalSize, position: "relative" }}>
        {virtualItems.map((row) => (
          <Row
            key={items[row.index].id}
            item={items[row.index]}
            start={row.start}
            height={row.size}
          />
        ))}
      </div>
    </div>
  );
}
