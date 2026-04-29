

import { useState, useMemo, useCallback } from "react";
import { VirtualList, type VirtualListMetrics, type ListItem } from "./VirtualList";

const HEAVY_DOM_ROWS = 500;

function generateItems(count: number, seed = 0): ListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: seed * 100_000 + i,
    label: `node_${String(i).padStart(5, "0")}`,
    value: Math.abs(Math.sin(i * 9301 + seed * 49297)),
  }));
}

function HeavyDomList({ items }: { items: ListItem[] }) {
  return (
    <div
      style={{
        height: 480,
        overflowY: "auto",
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 8,
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 20px",
            borderBottom: "1px solid #30363d",
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#8b949e", width: 56 }}>#{item.id}</span>
          <div style={{ flex: 1, height: 6, background: "#1c2128", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${item.value * 100}%`,
                background: "linear-gradient(90deg, #f0883e, #db6d28)",
                borderRadius: 3,
              }}
            />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#c9d1d9", width: 40, textAlign: "right" }}>
            {(item.value * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

type DemoTab = "virtual" | "heavy" | "code";

export function VirtualListDemo() {
  const [tab, setTab] = useState<DemoTab>("virtual");
  const [mounted, setMounted] = useState(true);
  const [seed, setSeed] = useState(0);
  const [count, setCount] = useState(10_000);
  const [metrics, setMetrics] = useState<VirtualListMetrics>({ visibleCount: 0, listRenders: 0 });

  const items = useMemo(() => generateItems(count, seed), [count, seed]);
  const heavyItems = useMemo(() => generateItems(HEAVY_DOM_ROWS, seed), [seed]);

  const handleSwap = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const handleMetrics = useCallback((m: VirtualListMetrics) => {
    setMetrics((prev) =>
      prev.visibleCount === m.visibleCount && prev.listRenders === m.listRenders ? prev : m,
    );
  }, []);

  const goTab = useCallback((next: DemoTab) => {
    if (typeof document !== "undefined" && "startViewTransition" in document && document.startViewTransition) {
      document.startViewTransition(() => setTab(next));
    } else {
      setTab(next);
    }
  }, []);

  return (
    <div className="demo-page">
      <h2 className="demo-title">@tanstack/react-virtual — memory safe</h2>
      <p className="demo-sub">
        Compare virtualização com centenas de nós reais no DOM e use as métricas no Desempenho / Memória do DevTools.
      </p>

      <div className="demo-tabs" role="tablist" aria-label="Modo da demo">
        {(
          [
            ["virtual", "Virtualizado"],
            ["heavy", "Sem virtualização"],
            ["code", "Código / leaks"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={"demo-tab" + (tab === id ? " demo-tab--active" : "")}
            onClick={() => goTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="demo-panels">
        {tab === "virtual" && (
          <section className="demo-panel" aria-labelledby="panel-virtual">
            <p className="demo-hint">
              {count.toLocaleString("pt-BR")} itens lógicos — no DOM ficam só as linhas visíveis + overscan (~
              {metrics.visibleCount || "…"} nós de linha).
            </p>

            <div className="demo-metrics" aria-live="polite">
              <span>
                <strong>Linhas no DOM (viewport)</strong>: {metrics.visibleCount}
              </span>
              <span title="Atualiza quando você rola ou redimensiona — não é um contador por frame.">
                <strong>Renders da lista (acum.)</strong>: {metrics.listRenders}
              </span>
            </div>

            <div className="demo-actions">
              <button type="button" onClick={handleSwap}>
                Trocar dataset (seed: {seed})
              </button>
              <button type="button" onClick={() => setCount((c) => (c === 10_000 ? 50_000 : 10_000))}>
                Toggle: {count === 10_000 ? "→ 50k itens" : "→ 10k itens"}
              </button>
              <button type="button" onClick={() => setMounted((m) => !m)}>
                {mounted ? "Desmontar" : "Montar"} lista
              </button>
            </div>

            {mounted && <VirtualList key={seed} items={items} itemHeight={44} onMetrics={handleMetrics} />}

            {!mounted && (
              <div className="demo-unmounted">
                Componente desmontado — Heap snapshot: desmontar e comparar snapshots confirma ausência de retenção óbvia de
                lista/observer.
              </div>
            )}
          </section>
        )}

        {tab === "heavy" && (
          <section className="demo-panel" aria-labelledby="panel-heavy">
            <p className="demo-hint demo-hint--warn">
              {HEAVY_DOM_ROWS.toLocaleString("pt-BR")} elementos <code>&lt;div&gt;</code> reais na árvore — use DevTools →
              Desempenho (linha <strong>Nós</strong>) ou Elements e veja o custo vs. aba Virtualizado.
            </p>
            <HeavyDomList items={heavyItems} />
          </section>
        )}

        {tab === "code" && (
          <section className="demo-panel demo-panel--code" aria-labelledby="panel-code">
            <h3 className="demo-code-title">Quatro fontes comuns de leak em listas virtualizadas</h3>
            <ol className="demo-leak-list">
              <li>
                <strong>setState após unmount</strong> — listeners ou <code>requestAnimationFrame</code> que ainda chamam{" "}
                <code>setState</code> depois do desmonte. <em>Correção:</em> flag <code>mountedRef</code> + cleanup no{" "}
                <code>useEffect</code>.
              </li>
              <li>
                <strong>RAF / timers sem cancelar</strong> — callback segura referências ao componente. <em>Correção:</em>{" "}
                <code>cancelAnimationFrame</code> / <code>clearTimeout</code> no cleanup.
              </li>
              <li>
                <strong>Reusar o virtualizer com dataset novo</strong> — cache de medidas ou instância “presa”.
                <em>Correção:</em> <code>key=&#123;seed&#125;</code> no componente da lista ou <code>measure()</code> quando
                os dados mudam.
              </li>
              <li>
                <strong>measure() dentro de onChange</strong> — no TanStack pode gerar loop infinito (
                <code>onChange → measure → onChange</code>). <em>Correção:</em> não encadear <code>measure()</code> no{" "}
                <code>onChange</code>; confiar no ciclo interno da lib ou chamar <code>measure()</code> só em eventos
                pontuais (troca de ítens, resize manual).
              </li>
            </ol>
            <p className="demo-footer-note">
              Botão <strong>Desmontar</strong> + Memory → Heap snapshot ajuda a validar cleanup (ResizeObserver/listeners são
              liberados com o unmount da lista quando não há referências extras).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
