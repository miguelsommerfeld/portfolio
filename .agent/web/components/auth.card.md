# Especificação dos Componentes: Modais de Autenticação, Currículo e Feedback

Este documento descreve os requisitos visuais, estruturais, comportamentais e técnicos dos modais globais (**`AuthCard`**, **`ResumeCard`**, **`ResumeCodeCard`**) e do toast de erro (**`ErrorToast`**) no frontend (`apps/web`), alinhados ao estado atual da aplicação.

> **Obrigatório:** Qualquer alteração nestes componentes **DEVE** seguir [`AGENTS.md`](../../../AGENTS.md), [`.agent/rules/web.md`](../../rules/web.md), [`navbar.md`](./navbar.md) e [`resume.md`](./resume.md).

---

## 1. Visão Geral e Fluxo Integrado

- **Papel de cada componente (montados no shell raiz `apps/web/src/app/app.html`):**
  - **`AuthCard` (`app-auth-card`):** modal *liquid glass* para autenticação OAuth2 com **Google** ou **GitHub**, com pré-verificação de disponibilidade da API via `ApiHealthService` (`GET /health`).
  - **`ResumeCard` (`app-resume-card`):** modal *liquid glass* em duas etapas para escolher entre **Currículo com dados sensíveis** (código diário `XXXX-XXXX`) ou **Currículo sem dados sensíveis**.
  - **`ResumeCodeCard` (`app-resume-code-card`):** modal exclusivo para owners autenticados (`canAccessResumeCode()`), consultando `GET /resume/code` para exibir o código diário, data de validade, expiração formatada em `pt-BR` e ação de copiar para a área de transferência.
  - **`ErrorToast` (`app-error-toast`):** aviso global (`role="alert"`, `aria-live="assertive"`) gerenciado por `ErrorFeedbackService` com descarte manual e automático (`6s`).
- **Fluxo integrado:**
  1. **Navbar (`Auth` / `Code` / `Logout`):** clicar em `Auth` limpa intenção pendente de currículo e abre `AuthCard`; owners autenticados veem o botão `Code`, que abre `ResumeCodeCard`.
  2. **Resume (`Acessar currículo`):** chama `ResumeService.requestResumeAccess()`, validando a sessão via `GET /auth/me` (`withCredentials: true`):
     - **`200 OK`:** abre `ResumeCard`.
     - **`401 Unauthorized`:** grava `portfolio:post_auth_action = 'open_resume'` em `sessionStorage` e abre `AuthCard`.
     - **Outros erros:** exibe mensagem amigável via `ErrorFeedbackService` (`ErrorToast`).
  3. **Healthcheck pré-OAuth2 no `AuthCard`:** ao escolher Google ou GitHub, consulta `GET /health` via `ApiHealthService`; só redireciona para `${API_BASE_URL}/auth/:provider` quando a API responde `{ status: "ok" }`, exibindo erro inline caso contrário.
  4. **Retorno pós-OAuth2:**
     - Em sucesso (`/`), `AuthService.checkSession()` consome a flag de `sessionStorage` e aciona a abertura automática do `ResumeCard`.
     - Em erro (`/login?error=...`), `app.routes.ts` fecha o `AuthCard`, aciona `ErrorFeedbackService.showGenericError()` e redireciona para `/`.
  5. **Download no `ResumeCard`:**
     - **Sem dados sensíveis:** `GET ${API_BASE_URL}/resume` (`withCredentials: true`, `responseType: 'blob'`) → abre PDF em nova aba (`URL.createObjectURL`, com fallback de clique em `<a>` e revogação após `60s`).
     - **Com dados sensíveis:** envia o código de 8 caracteres no header `x-resume-code` → abre PDF em `200 OK`, exibe erro inline em `403` (*Código inválido ou expirado*) ou erro genérico, e reabre `AuthCard` com intenção pós-login em `401`.
  6. **Consulta no `ResumeCodeCard`:** ao abrir, consulta `GET ${API_BASE_URL}/resume/code` (`withCredentials: true`). Em `401`, solicita nova autenticação; em `403`, revoga `canAccessResumeCode` no cliente e exibe feedback via `ErrorToast`.
- **Fechamento dos modais:** botão `×`, clique no backdrop ou tecla `Escape` (sem alterar `overflow` de `body`/`html`, preservando `position: sticky`).

---

## 2. Direção Visual — Liquid Glass (Dark Mode Fixo)

- **Backdrop:** `fixed inset-0 z-60 flex items-center justify-center overscroll-contain bg-neutral-950/60 p-4 backdrop-blur-sm sm:p-6` com `data-lenis-prevent` e bloqueio de `wheel`/`touchmove`.
- **Card modal:** `relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-neutral-950/55 bg-linear-to-b from-white/10 to-white/3 p-6 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_24px_64px_-12px_rgba(0,0,0,0.75)] sm:p-7`.
- **ErrorToast:** posicionado em `fixed bottom-5 z-70` com acabamento translúcido avermelhado (`border-red-400/25 bg-neutral-950/75 backdrop-blur-2xl`).
- **Tipografia e Estilização:** exclusivamente `JetBrains Mono` global e classes Tailwind CSS v4 (keyframes em `apps/web/src/styles.css`, liberando `user-select: text` em `input, textarea` e no valor do código em `ResumeCodeCard`).

---

## 3. Transições, Scroll e Acessibilidade

- Entrada e saída com `animate.enter` / `animate.leave` (`.auth-backdrop-enter`, `.auth-backdrop-leave`, `.auth-card-enter`, `.auth-card-leave`, `.fade-up-enter`, `.toast-enter`, `.toast-leave`), respeitando `@media (prefers-reduced-motion: reduce)`.
- `SmoothScrollService.cancelMomentum()` congela a inércia do Lenis ao abrir qualquer modal sem adicionar `.lenis-stopped { overflow: clip; }`.
- Foco inicial e restauração de foco usam `.focus({ preventScroll: true })`; assinaturas HTTP em andamento e timers são cancelados ao fechar ou destruir o componente.
- Diálogos semânticos com `role="dialog"`, `aria-modal="true"` e `aria-labelledby`.

---

## 4. Validação

Executar em `apps/web`:

```bash
npm run build
npm test
```

Testes unitários em `auth-card.spec.ts`, `resume-card.spec.ts`, `resume-code-card.spec.ts`, `error-toast.spec.ts`, `api-health.service.spec.ts`, `auth.service.spec.ts`, `resume.service.spec.ts` e `error-feedback.service.spec.ts`.
