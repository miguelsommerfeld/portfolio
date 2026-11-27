# Especificação da Página: Home (`apps/web`)

Este documento descreve a arquitetura visual, estrutural, comportamental e técnica da **Homepage** do portfólio (`apps/web`), alinhada ao estado atual da aplicação.

> **Obrigatório:** Qualquer alteração nesta página **DEVE** seguir integralmente [`AGENTS.md`](../../AGENTS.md) e [`.agent/rules/web.md`](../rules/web.md), mantendo coerência visual com [`navbar.md`](./components/navbar.md), [`resume.md`](./components/resume.md) e [`auth.card.md`](./components/auth.card.md).

---

## 1. Visão Geral e Fluxo da Experiência

A homepage é organizada em **três atos verticais contínuos**, conduzidos por rolagem suave (**Lenis**) e animações sincronizadas ao scroll (**GSAP + ScrollTrigger**) combinadas aos recursos nativos do **Angular 22** (`animate.enter`, `animate.leave` e `withViewTransitions()`):

1. **Seção 1 — Hero de Boas-vindas:** tela cheia inicial com a mensagem `"Seja bem-vindo(a) ao meu portfolio!"` revelada com **Typewriter Effect**, indicador de rolagem e saída suave via `ScrollTrigger`.
2. **Seção 2 — Vitrine de Projetos (`ProjectShowcase`):** cada projeto cadastrado em `home.projects.ts` ocupa uma seção própria travada durante o scroll (*scroll pinning* em desktop), exibindo informações do projeto + lista numerada compacta à esquerda e galeria de slides com bordas arredondadas à direita. Ao esgotar os slides de um projeto, o scroll é liberado naturalmente para o próximo projeto.
3. **Seção 3 — Prévia 3D e Acesso ao Currículo (`Resume`):** após o último projeto ser percorrido, o componente `<app-resume />` revela uma folha A4 em perspectiva 3D sincronizada ao scroll com o botão **`Acessar currículo`**, que valida a sessão na API e abre `ResumeCard` (ou `AuthCard` caso não autenticado).

---

## 2. Direção Visual e Coerência com o Sistema

- **Tema:** Dark mode fixo (`bg-neutral-950`, texto principal `text-neutral-50`), herdando `apps/web/src/styles.css`.
- **Tipografia:** exclusivamente a fonte local **`JetBrains Mono`** configurada em `apps/web/src/styles.css`.
- **Compensação da Navbar fixa:** todas as seções preveem espaçamento superior seguro (`pt-14` / `pt-16`) para compensar `app-navbar` (`fixed top-0 h-14 z-50`).
- **Linguagem visual Liquid Glass:** superfícies escuras semitransparentes com `backdrop-blur`, bordas `border-white/15` e reflexos internos sutis.
- **Estilização:** classes utilitárias do **Tailwind CSS v4**, sem arquivos `.css` vazios por componente.

---

## 3. Estrutura das Seções

### 3.1. Seção 1 — Hero (Typewriter Effect)

- **Layout:** `min-h-screen` centralizada vertical e horizontalmente (`pt-14`) sobre `bg-neutral-950` com brilho radial sutil.
- **Mensagem:** `"Seja bem-vindo(a) ao meu portfolio!"` em `<h1>` com `aria-label` completo, revelada caractere por caractere (`55ms`) via `signal` + `setInterval` em `afterNextRender()`, limpa via `DestroyRef`.
- **Cursor e indicador de scroll:** cursor vertical piscante durante a digitação e pulso sutil ao finalizar; após concluir, exibe o indicador `scroll` com `animate.enter="fade-up-enter"`.
- **Acessibilidade e saída:** sob `prefers-reduced-motion: reduce`, exibe o texto completo imediatamente sem cursor animado. Em movimento normal, aplica fade e deslocamento vertical (`opacity: 0`, `y: -40`) via `ScrollTrigger` com `scrub: true`.

### 3.2. Seção 2 — Vitrine de Projetos (`ProjectShowcase`)

Encapsulada no componente standalone `ProjectShowcase` (`apps/web/src/app/components/project-showcase/`), renderizado via `@for` (com `@empty` defensivo) a partir de `HOME_PROJECTS` (`apps/web/src/app/pages/home/home.projects.ts`).

- **Contrato de Dados (`project-showcase.models.ts`):** interfaces `ProjectSlide` e `ProjectShowcaseItem`.
- **Catálogo atual (`home.projects.ts`):** 3 projetos (`Portfolio`, `Noiseless` e `Cadastro de Clientes`). Projetos sem `imageUrl` (ou com falha no carregamento) renderizam um quadro visual estilizado com `accentGradient` em proporção `aspect-16/10`.
- **Fundo ambiente:** camada absoluta borrada (`blur-3xl scale-110 opacity-25`) acompanhando a paleta do slide ativo com vinheta escura para manter alto contraste.
- **Layout Desktop (`100vh`):** grade em 2 colunas (`lg:col-span-5` à esquerda com número/categoria, título, objetivo, entregas, stacks, links opcionais e lista numerada de slides; `lg:col-span-7` à direita com galeria arredondada, transições `slide-enter`/`slide-leave` e contador `01 / N`).
- **Scroll Pinning (`gsap.matchMedia`):**
  - Ativo apenas em `(prefers-reduced-motion: no-preference) and (min-width: 1024px)` quando `slides.length > 1`.
  - Troca 100% livre (sem `snap`) com distância `+=Math.max(1, slides.length - 1) * 90%`.
  - Clicar em um item da lista rola suavemente até a posição correspondente no `ScrollTrigger` (ou alterna `activeSlideIndex` diretamente quando o pin está desativado).
  - `Home` agenda `smoothScroll.refresh()` via `requestAnimationFrame` após o render para recalcular as posições de pin consecutivas.

### 3.3. Seção 3 — Prévia 3D e Acesso ao Currículo (`Resume`)

Renderizada via `<app-resume />` imediatamente após o `@for` de projetos, conforme detalhado em [`.agent/web/components/resume.md`](./components/resume.md).

---

## 4. Organização de Arquivos

```text
apps/web/src/app/
├── components/
│   ├── project-showcase/
│   │   ├── project-showcase.models.ts
│   │   ├── project-showcase.ts
│   │   ├── project-showcase.html
│   │   └── project-showcase.spec.ts
│   └── resume/
│       ├── resume.ts
│       ├── resume.html
│       └── resume.spec.ts
├── pages/
│   └── home/
│       ├── home.projects.ts
│       ├── home.ts
│       ├── home.html
│       └── home.spec.ts
└── app.routes.ts                            # Rota '' com loadComponent para Home e redirect /login
```

---

## 5. Validação

Executar em `apps/web`:

```bash
npm run build
npm test
```

Testes unitários em `home.spec.ts` e `project-showcase.spec.ts` cobrem Typewriter Effect, `prefers-reduced-motion`, renderização dos 3 projetos, troca de slides, fallback visual de imagens, integração com `<app-resume />` e execução segura em `jsdom`.
