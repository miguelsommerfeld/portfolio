# Especificação da Página: Home (`apps/web`)

Este documento define o plano e os requisitos visuais, estruturais, comportamentais e técnicos da **Homepage** do portfólio (`apps/web`).

> **Obrigatório:** Qualquer agente responsável por implementar esta página **DEVE** seguir integralmente todas as diretrizes de [`AGENTS.md`](../../AGENTS.md) e [`.agent/rules/web.md`](../rules/web.md), bem como manter coerência visual com a barra de navegação definida em [`.agent/web/components/navbar.md`](./components/navbar.md).

---

## 1. Visão Geral e Fluxo da Experiência

A homepage é organizada em **três atos verticais contínuos**, conduzidos por rolagem suave (**Lenis**) e animações sincronizadas ao scroll (**GSAP + ScrollTrigger**) combinadas com os recursos nativos do **Angular 22** (`animate.enter`, `animate.leave` e `withViewTransitions()`):

1. **Seção 1 — Hero de Boas-vindas:** tela cheia inicial com a mensagem `"Seja bem-vindo(a) ao meu portfolio"` revelada com **Typewriter Effect**.
2. **Seção 2 — Vitrine de Projetos (Componente Reutilizável):** inspirada na seção interativa do FlowOS — cada projeto ocupa uma seção própria travada durante o scroll (*scroll pinning*), com **informações detalhadas do projeto + lista numerada compacta à esquerda** e **galeria de imagens em `div` com bordas arredondadas à direita** que alternam livremente conforme o usuário rola a página. Ao esgotar as imagens de um projeto, o scroll é liberado naturalmente e revela a próxima instância do mesmo componente com o próximo projeto.
3. **Seção 3 — Encerramento e CTA de Currículo:** após o último projeto ser totalmente percorrido, o scroll aciona uma transição suave de encerramento revelando o botão em estilo **liquid glass com bordas arredondadas** escrito **`acessar currículo`**, navegando para `/curriculo` via View Transitions.

---

## 2. Direção Visual e Coerência com o Sistema

- **Tema:** Dark mode fixo (`bg-neutral-950`, texto principal `text-neutral-50`), herdando a base global de `apps/web/src/styles.css`.
- **Tipografia:** utilizar exclusivamente a fonte global **`JetBrains Mono`** já configurada em `apps/web/src/styles.css` (proibido carregar fontes externas ou redefinir `font-family` manualmente em componentes).
- **Compensação da Navbar fixa:** como `app-navbar` é fixa no topo (`fixed top-0 h-14 z-50`), todas as seções devem prever espaçamento superior seguro (ex.: `pt-14` ou `pt-20`) para que nenhum título, contador ou imagem fique encoberto pela barra.
- **Linguagem visual Liquid Glass:** reutilizar a mesma família de tokens da navbar para elementos translúcidos (superfície escura semitransparente `bg-neutral-950/35` ou `bg-white/[0.06]`, gradiente especular sutil `bg-linear-to-b from-white/8 to-white/2`, `backdrop-blur-xl backdrop-saturate-150`, bordas `border border-white/15` e brilho interno `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),...]`).
- **Estilização:** priorizar classes utilitárias do **Tailwind CSS v4**. Evitar arquivos `.css` vazios ou CSS customizado redundante por componente.

---

## 3. Especificação das Seções

### 3.1. Seção 1 — Hero (Typewriter Effect)

- **Dimensão e Layout:**
  - Ocupa toda a altura inicial da viewport (`min-h-screen`), centralizada vertical e horizontalmente, com `pt-14` para compensar a navbar.
  - Ambiente escuro minimalista (`bg-neutral-950`) com brilho radial ambiente muito discreto para dar profundidade sem poluir a leitura.
- **Mensagem principal:**
  - Texto exato: **`Seja bem-vindo(a) ao meu portfolio`**
  - Exibido em um `<h1>` responsivo e bem escalonado (ex.: `text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white/95`).
- **Efeito Typewriter:**
  - Revela a frase caractere por caractere ao carregar a página (implementado de forma limpa via `signal` + timer controlado em `afterNextRender()` e limpo com `DestroyRef`, ou via timeline GSAP com controle de progresso de caracteres — **sem adicionar novas dependências**).
  - Acompanhado por um cursor vertical/bloco discreto (`|`) piscando suavemente enquanto digita e mantendo pulso sutil ao finalizar.
  - **Acessibilidade (`prefers-reduced-motion: reduce`):** quando ativo, exibe o texto completo imediatamente, sem animação de digitação e sem cursor piscante.
- **Convite à rolagem e saída da seção:**
  - Após a conclusão do Typewriter Effect, exibe suavemente (com `animate.enter` ou GSAP) um indicador discreto de rolagem na parte inferior (ex.: texto curto ou seta minimalista com `aria-hidden="true"`).
  - Ao começar a rolar para baixo, aplicar uma transição suave de saída (ex.: leve fade + deslocamento sutil de parallax via `ScrollTrigger` com `scrub`) preparando a entrada da vitrine de projetos.

---

### 3.2. Seção 2 — Vitrine de Projetos (Componente Reutilizável estilo FlowOS)

Esta seção deve ser encapsulada em um **componente standalone reutilizável** (`ProjectShowcase` em `apps/web/src/app/components/project-showcase/`), renderizado via `@for` na página `Home` para cada projeto cadastrado. Dessa forma, basta adicionar novos itens à lista de projetos para que novas seções completas sejam renderizadas em sequência.

#### 3.2.1. Contrato de Dados e Dados Iniciais

Definir interfaces TypeScript estritas (sem `any`) em `apps/web/src/app/components/project-showcase/project-showcase.models.ts`:

```ts
export interface ProjectSlide {
  id: string;
  title: string;
  caption: string;
  imageUrl?: string;
  imageAlt: string;
  accentGradient?: string;
}

export interface ProjectShowcaseItem {
  id: string;
  category: string;
  title: string;
  objective: string;
  deliverables: string[];
  stacks: string[];
  slides: ProjectSlide[];
  repoUrl?: string;
  liveUrl?: string;
}
```

- **Dados iniciais estruturais (`apps/web/src/app/pages/home/home.projects.ts`):**
  - Entregar já populado com **2 projetos estruturais de exemplo** (cada um contendo de **3 a 4 slides**, objetivo, entregas e stacks) para validar imediatamente toda a mecânica de *scroll pinning*, troca de imagens, transição entre projetos consecutivos e chegada à seção final.
  - Estruturado para que o desenvolvedor substitua apenas os textos e os caminhos reais das imagens (em `apps/web/public/projects/<id>/...`) sem tocar na lógica do componente.
- **Fallback visual estilizado para imagens:**
  - Quando `slide.imageUrl` não estiver definido ou falhar ao carregar (`(error)`), o container da direita deve renderizar um **quadro visual estilizado** (superfície dark glass com `accentGradient` sutil, número/título/legenda do slide e proporção estável `aspect-[16/10]`), evitando imagens quebradas e *layout shift*.

#### 3.2.2. Fundo Ambiente da Seção (Estilo FlowOS em Dark Mode)

- Base escura minimalista (`bg-neutral-950`) com `relative overflow-hidden`.
- **Reflexo / Glow sutil da imagem ativa ao fundo:**
  - Camada absoluta atrás do conteúdo (`pointer-events-none select-none aria-hidden="true"`) exibindo a própria imagem do slide ativo (ou o `accentGradient` do slide no modo fallback) fortemente borrada (`blur-3xl scale-110`), em baixa opacidade (`opacity-20` a `opacity-25`) e suavizada por máscara/vinheta escura (`bg-neutral-950/75` + gradiente radial/vertical nas bordas superior e inferior para transição invisível entre seções).
  - Ao trocar o slide ativo, o reflexo de fundo faz crossfade suave acompanhando a paleta da nova imagem, mantendo alto contraste e legibilidade para todo o texto.

#### 3.2.3. Estrutura Visual (Desktop — 2 Colunas equilibradas em `100vh`)

Container principal (`relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12`) dimensionado para caber confortavelmente dentro de **`100vh`** em desktop (descontando `pt-14` da navbar, sem corte vertical nem scrollbar interna), dividido em duas colunas (`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center`):

- **Coluna da Esquerda (`lg:col-span-5`) — Informações Fixas + Lista Numerada Compacta:**
  1. **Cabeçalho / Índice:** rótulo compacto no topo indicando o número do projeto e a categoria (ex.: `01 / FULLSTACK`), remetendo ao detalhe superior do FlowOS.
  2. **Título do Projeto:** `<h2>` de alto contraste e forte hierarquia tipográfica (tamanho equilibrado para preservar espaço vertical, ex.: `text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight`).
  3. **Informações fixas do projeto (concisas para caber em `100vh`):**
     - **Objetivo:** parágrafo curto e direto (`text-sm text-white/70`).
     - **O que foi realizado (`deliverables`):** lista enxuta de tópicos curtos (`text-xs sm:text-sm text-white/80`).
     - **Stacks:** badges/pills compactos em dark glass (`rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/80`).
     - **Links opcionais (`repoUrl` / `liveUrl`):** se presentes, exibidos de forma discreta com `target="_blank" rel="noopener noreferrer"`.
  4. **Lista Numerada Compacta das Telas / Passos (`slides`) — estilo FlowOS:**
     - Posicionada abaixo das informações do projeto, separada por divisórias sutis (`divide-y divide-white/10 border-t border-white/10`).
     - Cada item exibe o índice formatado (`01`, `02`, `03`...) e o `title` do slide em layout compacto (`py-2.5`).
     - O passo correspondente ao slide ativo recebe destaque visual claro (número com cor de acento / brilho, título em `text-white` e legenda `caption` destacada), enquanto os itens inativos permanecem discretos (`text-white/45`) para economizar espaço e guiar o olhar.
     - **Interação por clique:** clicar em qualquer item da lista deve selecionar o slide (rolando suavemente via `SmoothScrollService` até a posição correspondente do `ScrollTrigger` quando o pin estiver ativo, ou trocando `activeSlideIndex` diretamente quando o pin estiver desativado).

- **Coluna da Direita (`lg:col-span-7`) — Galeria de Imagens:**
  - Container (`div`) com **bordas arredondadas** pronunciadas (`rounded-2xl sm:rounded-3xl`), `overflow-hidden`, borda luminosa fina (`border border-white/12`), fundo escuro translúcido (`bg-neutral-900/60`) e sombra profunda (`shadow-2xl shadow-black/60`).
  - Proporção consistente (`aspect-[16/10]`) com `object-cover` quando houver imagem real, ou fallback visual estilizado quando não houver.
  - **Troca animada entre imagens:** ao mudar `activeSlideIndex` (`signal<number>(0)`), a transição entre o slide anterior e o novo deve ser fluida (crossfade + leve escala `scale(1.03 → 1)` usando GSAP ou `animate.enter`/`animate.leave`), sem piscar ou causar reflow.
  - **Contador discreto:** indicador no canto inferior direito da seção (ex.: `01 / 04`) acompanhando o slide atual, espelhando o detalhe minimalista do FlowOS.

#### 3.2.4. Comportamento de Scroll Pinning (Troca Livre) e Encadeamento entre Projetos

- **Trava da seção (`pin: true`) com troca livre:**
  - Cada instância de `ProjectShowcase` registra seu próprio `ScrollTrigger` dentro de `afterNextRender()` usando `gsap.context(() => { ... }, hostElement)` e executa `ctx.revert()` no `DestroyRef.onDestroy()`.
  - **Sem `snap` forçado:** a troca das imagens é **100% livre baseada na posição do scroll**, garantindo movimento natural e sem "puxões" junto à inércia do `Lenis`.
  - A distância de rolagem (`end`) é proporcional à quantidade de slides do projeto (ex.: `() => \`+=${Math.max(1, slides.length - 1) * 90}%\`` baseado na altura da viewport), garantindo ritmo uniforme independentemente de um projeto ter 2 ou 6 slides.
  - No callback `onUpdate(self)`, converte `self.progress` (`0 → 1`) para o índice discreto `Math.min(slides.length - 1, Math.floor(self.progress * slides.length))` e atualiza o `signal` `activeSlideIndex` **apenas quando o índice mudar**.
- **Liberação e encadeamento para o próximo projeto:**
  - Quando `self.progress` atinge `1` (última imagem do projeto exibida), o `ScrollTrigger` libera o pin automaticamente.
  - O usuário continua descendo e encontra a próxima instância de `<app-project-showcase />` com o próximo projeto, iniciando um novo ciclo de pin e troca de imagens.
  - Caso um projeto possua apenas 1 slide (`slides.length <= 1`), não há pin prolongado — a seção é exibida normalmente com animação suave de entrada.
- **Sincronização com `SmoothScrollService`:**
  - Após a inicialização das seções da homepage, acionar `smoothScroll.refresh()` (`ScrollTrigger.refresh()`) para garantir o cálculo preciso das posições de pin consecutivas.
- **Responsividade e Acessibilidade (`gsap.matchMedia()`):**
  - Usar `gsap.matchMedia()` para ativar `pin: true` apenas quando `(prefers-reduced-motion: no-preference)` e `(min-width: 1024px)`.
  - Em telas menores (`< 1024px`) ou quando `prefers-reduced-motion: reduce` estiver ativo: desativar o pin, empilhar informações e galeria em coluna única e permitir navegar entre slides clicando na lista numerada.

---

### 3.3. Seção 3 — Transição Final e Botão "acessar currículo"

- **Gatilho de exibição:**
  - Posicionada imediatamente após o `@for` de projetos.
  - Quando o último projeto libera o scroll e o usuário continua descendo, a seção final (`min-h-[75vh]`, centralizada) entra com uma **transição coreografada via GSAP `ScrollTrigger`** (fade-in + leve elevação `y: 32 → 0` + leve escala `0.96 → 1` no container/botão).
- **Botão Principal — Liquid Glass:**
  - Texto exato: **`acessar currículo`**
  - Elemento `<a routerLink="/curriculo">` navegando para a rota interna `/curriculo`, aproveitando nativamente `withViewTransitions()` já habilitado em `apps/web/src/app/app.config.ts`.
  - *Escopo:* este plano cobre apenas a criação da Homepage e o link apontando para `/curriculo` (a criação da página de currículo em si será tratada em uma especificação própria quando solicitada).
  - **Estética Liquid Glass com bordas arredondadas:**
    - Formato arredondado generoso (`rounded-full`, harmonizando com o botão `Auth`/`Logout` da navbar em escala de destaque: `px-8 py-4 text-base sm:text-lg font-medium`).
    - Superfície translúcida com refração: `border border-white/20 bg-white/[0.07] bg-linear-to-b from-white/14 to-white/[0.03] backdrop-blur-xl backdrop-saturate-150`.
    - Brilho especular interno e profundidade: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_32px_-4px_rgba(0,0,0,0.45)]`.
    - Hover orgânico consistente com a navbar: ampliação sutil via `transform` (`hover:scale-105`), aumento suave da luminosidade (`hover:bg-white/[0.14] hover:border-white/30`), curva `ease-[cubic-bezier(0.22,1,0.36,1)]`, foco acessível (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`) e respeito a `motion-reduce:transition-none motion-reduce:hover:scale-100`.
    - Brilho radial sutil atrás do botão (`pointer-events-none`) para evidenciar a refração do `backdrop-blur` sobre o fundo escuro.

---

## 4. Integração com Animações e Eventual Refinamento da Base

O projeto já possui a stack recomendada instalada e configurada:

- **`gsap` + `ScrollTrigger`** e **`lenis`**: integrados em `apps/web/src/app/core/services/smooth-scroll.service.ts`.
- **`withViewTransitions()`**: habilitado em `apps/web/src/app/app.config.ts` com transições base em `apps/web/src/styles.css`.
- **`animate.enter` / `animate.leave`**: nativos do Angular 22 para entrada/saída de elementos controlados por `@if` / `@for`.

**Diretriz de ajuste permitido:** durante a implementação da homepage, o agente **pode** refinar parâmetros do `SmoothScrollService` (como `lerp`, `wheelMultiplier`, `refresh()` ou helpers de scroll programático para slides) e ajustar animações em `apps/web/src/styles.css`, desde que:
- Preserve a segurança em ambientes `jsdom` / SSR (verificando `typeof win.matchMedia === 'function'` antes de registrar/executar `ScrollTrigger` e `Lenis`).
- Preserve o respeito integral a `prefers-reduced-motion: reduce`.
- Não introduza novas dependências npm nem quebre os testes existentes.

---

## 5. Arquitetura e Organização de Arquivos no Frontend

Seguindo a estrutura definida em [`.agent/rules/web.md`](../rules/web.md):

```text
apps/web/src/app/
├── components/
│   ├── navbar/                              # Já existente
│   └── project-showcase/                    # Novo componente reutilizável de vitrine de projeto
│       ├── project-showcase.models.ts       # Interfaces ProjectShowcaseItem e ProjectSlide
│       ├── project-showcase.ts              # Standalone, Signals, input.required, GSAP ScrollTrigger
│       ├── project-showcase.html            # Layout 2 colunas (info + lista esquerda, galeria direita)
│       └── project-showcase.spec.ts         # Testes unitários (Vitest)
├── pages/
│   └── home/                                # Nova página Home (lazy-loaded)
│       ├── home.projects.ts                 # Lista tipada com 2 projetos estruturais iniciais
│       ├── home.ts                          # Typewriter Effect, composição das seções e CTA final
│       ├── home.html                        # Seção 1 (Hero), Seção 2 (@for ProjectShowcase), Seção 3 (CTA)
│       └── home.spec.ts                     # Testes unitários (Vitest)
└── app.routes.ts                            # Rota '' apontando para Home via loadComponent
```

### Convenções Obrigatórias para a Implementação

- **Roteamento:** registrar `path: ''` em `apps/web/src/app/app.routes.ts` usando `loadComponent: () => import('./pages/home/home').then((m) => m.Home)`.
- **Angular 22 Moderno:**
  - 100% standalone (sem `NgModule`).
  - Estado e propriedades exclusivamente via Signals (`signal()`, `computed()`, `input.required()`, `viewChild()`).
  - Fluxo de controle com `@if` / `@else` / `@for (...; track ...)` (incluindo `@empty` defensivo se não houver projetos; proibido `*ngIf`, `*ngFor`).
  - Injeção via `inject(...)`.
  - Sem `@angular/animations` (depreciado).
- **Estilo de código (`AGENTS.md`):**
  - Chaves estilo Allman (`{` na linha seguinte) em classes, construtores e métodos de classe.
  - Chaves na mesma linha em `if`, `for`, `try/catch`, funções utilitárias e objetos literais.
  - Imports, chamadas e assinaturas em linha única sempre que legíveis.
  - Proibido o uso de `any`.

---

## 6. Estratégia de Testes e Validação

### Testes Unitários (Vitest)

1. **`project-showcase.spec.ts`:**
   - Renderiza índice/categoria, título, objetivo, entregas (`deliverables`), stacks e lista numerada de slides recebidos via `input`.
   - Exibe o primeiro slide inicialmente (com suporte a imagem real e ao fallback visual estilizado quando `imageUrl` está ausente) dentro de container com bordas arredondadas, e atualiza o slide ativo + contador (`01 / N`) ao clicar em outro passo da lista.
   - Funciona com segurança em `jsdom` (sem falhar caso `window.matchMedia` não esteja disponível) e limpa recursos sem erros ao destruir o componente.
2. **`home.spec.ts`:**
   - Renderiza o `<h1>` da primeira seção com a mensagem `"Seja bem-vindo(a) ao meu portfolio"` (validando o progresso do Typewriter Effect com fake timers do Vitest e a exibição imediata sob `prefers-reduced-motion: reduce`).
   - Renderiza uma instância de `<app-project-showcase />` para cada projeto cadastrado em `home.projects.ts` (2 projetos iniciais).
   - Renderiza a seção final com o link liquid glass contendo o texto `"acessar currículo"` apontando para `/curriculo`.

### Validação Obrigatória

Antes de encerrar a implementação, executar em `apps/web`:

```bash
npm run build
npm test
```

---

## 7. Critérios de Aceite

- [ ] A rota raiz (`/`) carrega a página `Home` com lazy-loading via `loadComponent`.
- [ ] A primeira seção exibe `"Seja bem-vindo(a) ao meu portfolio"` com **Typewriter Effect** suave e respeita `prefers-reduced-motion: reduce`.
- [ ] A segunda seção utiliza um componente standalone reutilizável (`ProjectShowcase`), inicializado com 2 projetos estruturais de exemplo em `home.projects.ts` (com fallback visual estilizado até inclusão das imagens reais) e preparado para receber novos projetos facilmente.
- [ ] Cada projeto exibe fundo escuro (`bg-neutral-950`) com reflexo/glow sutil da imagem ativa ao fundo, informações fixas + lista numerada compacta à esquerda cabendo confortavelmente em `100vh`, e galeria de imagens em `div` com bordas arredondadas à direita.
- [ ] Durante o scroll em desktop, a seção do projeto trava (`ScrollTrigger` com `pin: true`) com troca livre baseada na posição do scroll (sem `snap` forçado); ao esgotar as imagens, o scroll é liberado e segue para a próxima instância do componente com o próximo projeto.
- [ ] Em mobile (`< 1024px`) ou `prefers-reduced-motion: reduce`, o pin é desativado e os slides continuam acessíveis por clique na lista numerada.
- [ ] Após o último projeto, ao continuar o scroll, ocorre uma transição suave revelando o botão em estilo **liquid glass** com bordas arredondadas escrito **`acessar currículo`**, navegando para `/curriculo` via `routerLink` + `withViewTransitions()`.
- [ ] Todas as transições utilizam `gsap` (`ScrollTrigger`), `lenis` (`SmoothScrollService`) e recursos nativos do Angular 22 (`animate.enter`/`animate.leave`, `withViewTransitions()`), sem instalar bibliotecas extras.
- [ ] A implementação respeita integralmente [`AGENTS.md`](../../AGENTS.md) e [`.agent/rules/web.md`](../rules/web.md) (standalone, signals, Tailwind v4, `JetBrains Mono`, estilo de código, sem `any`).
- [ ] Testes unitários em `home.spec.ts` e `project-showcase.spec.ts` passando, com `npm run build` e `npm test` em `apps/web` executando sem erros.
