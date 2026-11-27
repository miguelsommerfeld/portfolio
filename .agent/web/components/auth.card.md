# Especificação do Componente: AuthCard e ResumeCard (Autenticação OAuth2 e Acesso ao Currículo)

Este documento define o plano e os requisitos visuais, estruturais, comportamentais e técnicos do componente **AuthCard** (`app-auth-card`) e do card complementar **ResumeCard** (`app-resume-card`), responsáveis respectivamente pela autenticação OAuth2 (**Google** ou **GitHub**) e pela seleção da variante do currículo (**com dados sensíveis** mediante código de 8 caracteres ou **sem dados sensíveis**) no frontend (`apps/web`).

> **Obrigatório:** Qualquer agente responsável por implementar esta feature **DEVE** seguir integralmente todas as diretrizes de [`AGENTS.md`](../../../AGENTS.md) e [`.agent/rules/web.md`](../../rules/web.md), mantendo coerência visual e arquitetural com [`navbar.md`](./navbar.md) e [`resume.md`](./resume.md).

---

## 1. Visão Geral e Fluxo de Uso

- **Papel:**
  - **`AuthCard` (`app-auth-card`):** card modal minimalista centralizado na viewport, oferecendo exclusivamente **Google** e **GitHub**.
  - **`ResumeCard` (`app-resume-card`):** card modal na mesma estética *liquid glass*, oferecendo **Currículo com dados sensíveis** (exigindo o código diário de 8 caracteres) ou **Currículo sem dados sensíveis**.
- **Renderização global:** ambos são montados no shell raiz (`apps/web/src/app/app.html`) ao lado de `<app-navbar />` e `<router-outlet />`, garantindo disponibilidade imediata em qualquer rota.
- **Gatilhos e fluxo integrado:**
  1. **Navbar (`apps/web/src/app/components/navbar/navbar.html`):** quando `!isAuthenticated()`, clicar em **`Auth`** limpa eventual intenção pendente de currículo e abre o `AuthCard`.
  2. **Resume (`apps/web/src/app/components/resume/resume.html`):** o botão **`Acessar currículo`** não usa `@if / @else` local de autenticação; ao clicar, chama `ResumeService.requestResumeAccess()` validando a sessão no middleware da API (`GET /auth/me` com `withCredentials: true`):
     - **`401 UNAUTHORIZED`:** grava a intenção não-sensível `portfolio:post_auth_action = 'open_resume'` em `sessionStorage` e abre o `AuthCard`.
     - **`200 OK`:** abre o `ResumeCard` para escolha da versão do currículo.
  3. **Retorno pós-OAuth2:** ao voltar para `/` após autenticação bem-sucedida, `AuthService.checkSession()` consome a flag de `sessionStorage` e aciona a abertura automática do `ResumeCard` no centro da tela (sem exigir scroll até o fim da página).
  4. **Download no `ResumeCard`:**
     - **Currículo sem dados sensíveis:** dispara `GET ${API_BASE_URL}/resume` (`withCredentials: true`, `responseType: 'blob'`) sem header `x-resume-code` → abre o PDF (`200 OK`).
     - **Currículo com dados sensíveis:** exibe campo de código de 8 caracteres (`XXXX-XXXX`) e dispara `GET ${API_BASE_URL}/resume` com header `x-resume-code` → abre o PDF (`200 OK`), exibe erro inline em `403`/`503` ou reabre `AuthCard` com intenção pós-login em `401`.
- **Formas de fechamento:** botão `×`, clique no backdrop ou tecla `Escape` (sem alterar `overflow` no `<body>`/`<html>`, preservando o `position: sticky` da página).

---

## 2. Direção Visual — Liquid Glass (Dark Mode Fixo)

O portfólio adota **Dark mode fixo** com acabamento **liquid glass** consistente com `app-navbar`:

- **Overlay / Backdrop (centralização na viewport):**
  - `fixed inset-0 z-60 flex items-center justify-center overscroll-contain bg-neutral-950/60 p-4 backdrop-blur-sm sm:p-6` com `data-lenis-prevent` e bloqueio de `wheel`/`touchmove` no backdrop (evitando mexer no `overflow` do `body`/`html` e mantendo `position: sticky` intacto).
- **Card Central (Liquid Glass com bordas arredondadas):**
  - `relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-neutral-950/55 bg-linear-to-b from-white/10 to-white/3 p-6 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_24px_64px_-12px_rgba(0,0,0,0.75)] sm:p-7`.
- **Tipografia e Estilização:** exclusivamente `JetBrains Mono` global e classes Tailwind CSS v4 (keyframes compartilhados em `apps/web/src/styles.css`, liberando `user-select: text` em `input, textarea`).

---

## 3. Conteúdo dos Cards

### 3.1. `AuthCard` (`app-auth-card`)

- Cabeçalho: título **`Entrar`**, subtítulo `Escolha um provedor para continuar` e botão fechar (`×`).
- Opções nativas `<a>` para navegação top-level OAuth2:
  1. **Google:** `/icons/google.png` (sem `invert`), rótulo `Continuar com Google`, `href="${API_BASE_URL}/auth/google"`.
  2. **GitHub:** `/icons/github.png` (com `invert`), rótulo `Continuar com GitHub`, `href="${API_BASE_URL}/auth/github"`.

### 3.2. `ResumeCard` (`app-resume-card`)

- Cabeçalho: título **`Acessar currículo`**, subtítulo contextual por etapa e botão fechar (`×`).
- **Etapa 1 (`options`):** dois botões *liquid glass*: **`Currículo com dados sensíveis`** e **`Currículo sem dados sensíveis`**.
- **Etapa 2 (`code`):** formulário com `<input>` formatado em `XXXX-XXXX` (8 caracteres alfanuméricos maiúsculos), botões **`Voltar`** e **`Abrir currículo`** (habilitado com 8 caracteres), e feedback inline `role="alert"` para `403` (*Código inválido ou expirado*) e `503`.

---

## 4. Transições, Scroll e Acessibilidade

- Entrada e saída com `animate.enter` / `animate.leave` (`.auth-backdrop-enter`, `.auth-backdrop-leave`, `.auth-card-enter`, `.auth-card-leave`, `.fade-up-enter`) em `apps/web/src/styles.css`, respeitando `@media (prefers-reduced-motion: reduce)`.
- `SmoothScrollService.cancelMomentum()` congela a inércia do Lenis na posição atual sem adicionar `.lenis-stopped { overflow: clip; }`.
- `Resume.onCtaFocus($event)` só rola quando `:focus-visible` está ativo (foco via teclado), nunca em cliques de mouse; modais usam `.focus({ preventScroll: true })` ao abrir e ao restaurar foco.
- Diálogos semânticos com `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, fechamento por `Escape`/backdrop e cancelamento de downloads em andamento ao fechar.

---

## 5. Validação

Executar em `apps/web`:

```bash
npm run build
npm test
```
