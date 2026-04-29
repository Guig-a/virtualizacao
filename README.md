# Lista virtualizada — BOM grande sem travar a UI

Recentemente trabalhei numa solução com **engenharia de componentes**: um item formado por vários outros, com possibilidade de **subconjuntos** — um **BOM hierárquico**.

Na prática, algumas estruturas tinham poucas dezenas de componentes. Outras passavam de **centenas**, chegando a **milhares**.

Para lidar com isso sem degradar a interface, reproduzi aqui uma abordagem que adotei no projeto: **virtualização** com [`@tanstack/react-virtual`](https://tanstack.com/virtual/latest). Uma **VirtualList** renderiza apenas o que está na **viewport** + um pequeno **overscan**. Na prática, isso mantém **poucas dezenas de nós no DOM** mesmo com **10k–50k itens lógicos**.

Este repositório inclui também um **modo sem virtualização** para comparar. Nele, **centenas de elementos reais no DOM** rapidamente viram gargalo — no **React DevTools**, o tempo de render fica concentrado na lista inteira. No modo virtualizado, o custo se limita à lista e às **poucas linhas visíveis**.

## O que os números mostram (React Profiler)

Medidas tiradas em commits equivalentes ao alternar entre os modos na demo:

| Modo | Tempo de render (commit) | Observação |
|------|---------------------------|------------|
| Sem virtualização | **~320 ms** | Um único componente pesado (**~275 ms**) colapsando o flame graph |
| Com `@tanstack/react-virtual` | **~43 ms** | Custo concentrado na lista + apenas os **Row** visíveis na janela |

Isso dá na ordem de **~7×** naquele commit — números variam conforme máquina e cenário; vale repetir o teste na sua stack.

Em produção, com dados reais chegando em tempo real, essa margem é muito da diferença entre uma UI **responsiva** e uma que **trava**.

## Memory safety

Além da performance, foquei em **evitar memory leak**. O virtualizer usa internamente um **ResizeObserver** (e listeners de scroll); se o fluxo de **desmontagem** não estiver correto, referências podem ficar retidas.

Nesta demo há um hook **`useVirtualizerSafe`** com cleanup explícito (`mountedRef`, cancelamento de **RAF** quando aplicável) e **`key`** na lista ao trocar de dataset para **remount limpo** — padrão útil quando o dataset muda por completo e você não quer reusar cache/medidas com dados novos.

Para validar: **Desmontar** a lista na UI + **DevTools → Memory → Heap snapshot** antes/depois.

## Stack

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![TanStack Virtual](https://img.shields.io/badge/TanStack_Virtual-EF4444?style=flat-square&logo=tanstack&logoColor=white)](https://tanstack.com/virtual/latest)

## Como rodar

```bash
pnpm install
pnpm dev
```

Abra o URL que o Vite indicar (geralmente `http://localhost:5173`).

```bash
pnpm build   # produção
pnpm preview # pré-visualizar o build
```

## Estrutura (principal)

- `src/hooks/useVirtualizerSafe.ts` — wrapper com guards de cleanup em volta do virtualizer  
- `src/components/VirtualList.tsx` — lista virtualizada  
- `src/components/VirtualListDemo.tsx` — demo com abas (virtualizado × DOM pesado × notas sobre leaks)


