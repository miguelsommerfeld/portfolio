# Especificação do Componente: Navbar

Este documento descreve os requisitos visuais, estruturais, comportamentais e técnicos da barra de navegação global (**Navbar**) do frontend (`apps/web`), alinhados ao estado atual da aplicação. Consulte também [`AGENTS.md`](../../../AGENTS.md), [`.agent/rules/web.md`](../../rules/web.md) e [`auth.card.md`](./auth.card.md).

---

## 1. Visão Geral e Persistência

- **Papel:** barra de navegação global minimalista presente em toda a aplicação.
- **Persistência:** renderizada no componente raiz (`apps/web/src/app/app.html`) acima de `<router-outlet />`, permanecendo fixa durante toda a navegação.
- **Posicionamento e Dimensão:** largura total (`w-full`), fixa no topo (`fixed top-0 inset-x-0 z-50`) e altura compacta (`h-14` / `56px`).

---

## 2. Direção Visual — Liquid Glass (Dark Mode Fixo)

- **Superfície translúcida:** `bg-neutral-950/35 bg-linear-to-b from-white/8 to-white/2`.
- **Refração / Desfoque:** `backdrop-blur-xl backdrop-saturate-150`.
- **Acabamento especular:** borda inferior `border-b border-white/10` e brilho interno `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_24px_-4px_rgba(0,0,0,0.28)]`.
- **Estilização:** exclusivamente classes utilitárias do Tailwind CSS v4 e fonte local `JetBrains Mono`.

---

## 3. Estrutura e Conteúdo

Layout horizontal (`flex h-full w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-12`), dividido em duas áreas:

### 3.1. Canto Esquerdo — Identidade

- Exibe o texto estático **`Miguel L. Sommerfeld`** (`text-sm sm:text-base font-semibold tracking-tight text-white/95 select-none truncate`).

### 3.2. Canto Direito — Redes Sociais e Ações

Container horizontal (`flex shrink-0 items-center gap-4 sm:gap-6`) com efeito hover estilo dock do macOS (`transform: scale` via `hover:scale-110` nos ícones e `hover:scale-105` nos botões pill, respeitando `motion-reduce:transition-none motion-reduce:hover:scale-100`):

1. **Ícone do LinkedIn:** link externo (`https://www.linkedin.com/in/miguelsommerfeld/`) com `/icons/linkedin.png`, `target="_blank" rel="noopener noreferrer"` e `aria-label="Perfil no LinkedIn"`.
2. **Ícone do GitHub:** link externo (`https://github.com/miguelsommerfeld`) com `/icons/github.png`, `target="_blank" rel="noopener noreferrer"` e `aria-label="Perfil no GitHub"`.
3. **Botão `Code` (condicional para owners autenticados):**
   - Exibido apenas quando `isAuthenticated() && canAccessResumeCode()`.
   - `<button type="button">` em estilo pill *liquid glass* que chama `ResumeService.openCodeCard()` para abrir o [`ResumeCodeCard`](./auth.card.md).
4. **Ação de Autenticação (`Auth` / `Logout`):**
   - Alternada via `@if (isAuthenticated()) { ... } @else { ... }`:
   - **Não autenticado — `Auth`:** `<button type="button">` que chama `AuthService.openAuthCard()`, abrindo o modal `AuthCard` no centro da viewport.
   - **Autenticado — `Logout`:** `<button type="button">` que chama `AuthService.logout()` (`POST /auth/logout` com `withCredentials: true`), desabilitado durante a requisição (`[disabled]="isLoggingOut()"`).

---

## 4. Arquitetura Angular e Integração

- **Componente standalone:** `apps/web/src/app/components/navbar/` (`navbar.ts`, `navbar.html`, `navbar.spec.ts`), seletor `app-navbar`, injetando `AuthService` e `ResumeService` via `inject(...)`.
- **Estado reativo (`AuthService`):**
  - `user`, `isAuthenticated`, `canAccessResumeCode`, `isLoggingOut`, `isAuthCardOpen` e `pendingResumeAccess` expostos como Signals somente leitura.
  - Checagem inicial de sessão via `provideAppInitializer()` em `app.config.ts` chamando `GET /auth/me` (`withCredentials: true`), que retorna `{ user, canAccessResumeCode }`.
  - Nunca armazena ou lê JWT em `localStorage`, `sessionStorage` ou query params.

---

## 5. Acessibilidade e Validação

- Marcação semântica `<header>` + `<nav aria-label="Navegação principal">`.
- Navegação por teclado com `focus-visible:ring-2 focus-visible:ring-white/40` e respeito a `prefers-reduced-motion`.
- Testes unitários em `navbar.spec.ts` cobrindo marca, links externos de LinkedIn/GitHub, botão condicional `Code` para owners, abertura do `AuthCard` e acionamento de `Logout`.

```bash
# Em apps/web:
npm run build
npm test
```
