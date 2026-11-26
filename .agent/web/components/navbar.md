# Especificação do Componente: Navbar

Este documento descreve os requisitos visuais, estruturais, comportamentais e técnicos da barra de navegação global (**Navbar**) do frontend (`apps/web`). Antes de implementar, consulte também [`AGENTS.md`](../../../AGENTS.md) e [`.agent/rules/web.md`](../../rules/web.md).

---

## 1. Visão Geral e Persistência

- **Papel:** barra de navegação global minimalista presente em toda a aplicação.
- **Persistência entre páginas:** deve ser renderizada no componente raiz (`apps/web/src/app/app.html`) **acima** do `<router-outlet />`, garantindo que nunca desapareça nem seja recriada durante a navegação entre rotas.
- **Largura e Posicionamento:**
  - Ocupa **100% da largura da página** (`w-full`).
  - Permanece **fixa no topo** (`fixed top-0 inset-x-0 z-50`), sobrepondo o conteúdo da página para que o efeito *liquid glass* atue sobre o fundo desde o topo e durante toda a rolagem.
- **Altura:** compacta e discreta verticalmente — **`56px` (`h-14`)**, evitando peso visual excessivo.
- *Nota para páginas consumidoras:* por ser `fixed`, o fundo/hero das páginas passa por trás da navbar. Conteúdos textuais no topo das páginas devem prever espaçamento superior compensatório (ex.: `pt-14` ou maior) quando não puderem ficar sob a barra.

---

## 2. Direção Visual — Liquid Glass (Dark Mode Fixo)

O portfólio adota **Dark mode fixo**. A navbar deve entregar um acabamento **liquid glass** que deixa transparecer parcialmente a cor e os elementos do fundo atual da página, mantendo alta legibilidade:

- **Superfície translúcida:** fundo escuro bem leve e semitransparente (ex.: `bg-neutral-950/35` combinado com um reflexo superior muito sutil como `bg-gradient-to-b from-white/[0.08] to-white/[0.02]`), permitindo que o tom real do fundo da página influencie a aparência da barra.
- **Refração / Desfoque:** `backdrop-blur-xl backdrop-saturate-150` para borrar suavemente o conteúdo que passa por trás e preservar a vivacidade das cores do fundo.
- **Acabamento especular (bordas e luz):**
  - Borda inferior fina e luminosa (`border-b border-white/10`).
  - Brilho interno discreto na aresta superior e sombra suave inferior (ex.: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_24px_-4px_rgba(0,0,0,0.28)]`).
- **Estilização:** priorizar classes utilitárias do Tailwind CSS v4. Evitar CSS customizado desnecessário em arquivo `.css` dedicado.

---

## 3. Estrutura e Conteúdo

Layout em uma única linha horizontal (`flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8`), dividido estritamente em duas áreas:

### 3.1. Canto Esquerdo — Identidade do Sistema

- Exibe exatamente o texto: **`Miguel L. Sommerfeld`**
- Atua como o nome/marca do sistema (elemento textual estático, como `<span>`, sem link obrigatório).
- Tipografia limpa e legível em dark mode (ex.: `text-sm sm:text-base font-semibold tracking-tight text-white/95 whitespace-nowrap select-none`).

### 3.2. Canto Direito — Ações (Exatamente Duas Opções)

Container horizontal alinhado à direita (`flex items-center gap-3 sm:gap-4`) contendo **apenas** os dois itens abaixo (não exibir avatar, nome do usuário logado ou itens extras):

- **Efeito Hover estilo Dock do macOS (aplicado a ambas as opções da direita):**
  - Ao passar o mouse sobre qualquer uma das opções da direita (ícone do GitHub ou botão `Auth` / `Logout`), o item em foco deve aumentar sutilmente de tamanho, reproduzindo a ampliação suave e orgânica da dock do macOS.
  - Implementar exclusivamente via `transform` (`scale`), nunca alterando `font-size`, `width` ou `padding`, para evitar deslocamento de layout (*layout shift*) ou alteração na altura da navbar.
  - Ampliação sutil e proporcional: ex. `hover:scale-110` no ícone do GitHub e `hover:scale-105` (ou `hover:scale-[1.08]`) no botão/link `Auth` / `Logout`.
  - Transição fluida com curva suave tipo macOS: ex. `origin-center transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform`.
  - Respeitar acessibilidade de movimento reduzido (`motion-reduce:transition-none motion-reduce:hover:scale-100`) e não aplicar ampliação quando o botão `Logout` estiver desabilitado (`disabled:hover:scale-100`).

1. **Ícone do GitHub (Link Externo):**
   - Renderiza o logo do GitHub usando **SVG inline** com `fill="currentColor"` (não instalar bibliotecas de ícones; tamanho sugerido `w-5 h-5`).
   - Elemento `<a>` apontando para: `https://github.com/miguelsommerfeld/portfolio`
   - Deve abrir em nova aba com segurança: `target="_blank" rel="noopener noreferrer"`.
   - Acessibilidade: `aria-label="Repositório no GitHub"` no link e `aria-hidden="true"` no `<svg>`.
   - Interação: botão/ícone limpo com ampliação sutil estilo dock no hover, transição suave de cor/superfície (ex.: `inline-flex items-center justify-center text-white/75 hover:text-white hover:scale-110 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]`) e estado de foco visível (`focus-visible`).

2. **Opção de Autenticação (`Auth` / `Logout`):**
   - Alterna reativamente conforme o estado de autenticação do usuário usando `@if (...) { ... } @else { ... }`:
   - **Usuário não autenticado — `Auth`:**
     - Texto: `Auth`
     - Elemento `<a routerLink="/login">` redirecionando para a rota `/login` (alinhada ao redirecionamento de erro do callback OAuth2 já implementado em `apps/api/src/modules/auth/auth.routes.ts`).
   - **Usuário autenticado — `Logout`:**
     - Substitui completamente a opção `Auth` pelo texto: `Logout`
     - Elemento `<button type="button">` que aciona o encerramento da sessão (`POST /auth/logout`).
     - Durante o envio da requisição de logout, desabilitar o botão (`[disabled]`) para prevenir múltiplos cliques simultâneos.
   - **Visual da opção (`Auth` / `Logout`):** acabamento integrado ao *liquid glass* com ampliação sutil estilo dock no hover — ex.: botão/pill compacto e translúcido (`inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-sm font-medium text-white/90 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-white/[0.14] hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`).

---

## 4. Arquitetura Angular e Integração com Autenticação

### 4.1. Componente

- **Arquitetura:** componente **100% standalone** (sem `NgModule`), usando Signals e o novo fluxo de controle (`@if` / `@else`), com `inject(...)` para dependências.
- **Localização:** `apps/web/src/app/components/navbar/` (`navbar.ts`, `navbar.html`, `navbar.spec.ts`), com seletor `app-navbar`.
- **Importação no root:** incluir `Navbar` em `imports` de `App` (`apps/web/src/app/app.ts`) e posicioná-lo acima de `<router-outlet />` em `apps/web/src/app/app.html`.

### 4.2. Serviço de Autenticação (`AuthService`)

Caso ainda não exista, criar um serviço singleton (`providedIn: 'root'`) em `apps/web/src/app/core/services/auth.service.ts` para centralizar o estado da sessão e reutilizá-lo na navbar e nas demais páginas:

- **HttpClient:** garantir `provideHttpClient()` registrado em `apps/web/src/app/app.config.ts`.
- **Estado reativo com Signals:**
  - `user = signal<AuthUser | null>(null)` (exposto como `readonly` via `.asReadonly()`).
  - `isAuthenticated = computed(() => this.user() !== null)`.
  - `isLoggingOut = signal(false)` (exposto como `readonly`) para proteger o botão `Logout` contra duplo clique.
- **Tipagem local (atenção ao Docker):** não importar arquivos diretamente de `shared/`, pois `apps/web/Dockerfile` usa contexto `./apps/web` e não copia `shared/`. Definir localmente o contrato compatível com o retorno de `GET /auth/me`:
  ```ts
  export type AuthProvider = 'google' | 'github';

  export interface AuthUser {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    provider: AuthProvider;
  }
  ```
- **URL base da API:** centralizar a URL base (padrão local `http://localhost:3333`) em `apps/web/src/app/core/config/` em vez de espalhar strings pela navbar.
- **Verificação de sessão (`GET /auth/me`):**
  - Deve enviar obrigatoriamente `{ withCredentials: true }` para trafegar o cookie `HttpOnly` (`access_token`).
  - Em `200 OK` (`{ user: AuthUser }`), atualiza `user.set(response.user)`.
  - Em `401 Unauthorized` ou falha de rede, define `user.set(null)` sem interromper a renderização da navbar.
  - Disparar a checagem inicial ao iniciar a aplicação (ex.: `checkSession()` chamado via `provideAppInitializer` ou na inicialização do serviço).
- **Logout (`POST /auth/logout`):**
  - Usar sempre `POST` (nunca `GET`) com `{ withCredentials: true }`.
  - Resposta esperada: `204 No Content`.
  - Ao finalizar com sucesso, executar `user.set(null)` para que a navbar troque reativamente de `Logout` para `Auth`, mantendo o usuário na página atual (sem redirecionamento forçado).
- **Restrições de segurança:** nunca armazenar ou ler JWT em `localStorage`, `sessionStorage` ou query params.

---

## 5. Acessibilidade e Responsividade

- Utilizar marcação semântica: `<header>` externo e `<nav aria-label="Navegação principal">` interno.
- Garantir navegação por teclado e indicador de foco visível (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`) no link do GitHub e na ação `Auth` / `Logout`.
- Respeitar `prefers-reduced-motion` nas transições de escala do efeito hover (`motion-reduce:transition-none motion-reduce:hover:scale-100`).
- Em telas estreitas (ex.: `360px`), manter os elementos em uma única linha sem overflow horizontal (`min-w-0` e `truncate` no texto da marca apenas se necessário).

---

## 6. Critérios de Aceite e Validação

- [ ] A navbar ocupa 100% da largura, permanece fixa no topo (`fixed top-0`) com altura compacta (`h-14`) e não desaparece ao trocar de rota.
- [ ] O visual implementa *liquid glass* em dark mode com transparência, `backdrop-blur`, saturação e borda/reflexo especular sutil.
- [ ] Exibe `Miguel L. Sommerfeld` no canto esquerdo.
- [ ] Exibe apenas duas opções no canto direito: ícone SVG inline do GitHub (`https://github.com/miguelsommerfeld/portfolio`, nova aba com `rel="noopener noreferrer"`) e `Auth` / `Logout`.
- [ ] Ambas as opções da direita possuem efeito hover sutil estilo dock do macOS (ampliação fluida via `transform: scale` sem causar *layout shift* e respeitando `prefers-reduced-motion`).
- [ ] Exibe `Auth` apontando para `/login` quando deslogado e substitui por `Logout` (`POST /auth/logout` com `withCredentials: true`) quando autenticado.
- [ ] Testes unitários com Vitest (`apps/web/src/app/components/navbar/navbar.spec.ts`) cobrindo renderização da marca, atributos do link do GitHub, alternância entre `Auth` e `Logout` conforme o estado de autenticação e acionamento de logout.
- [ ] `npm run build` e `npm test` em `apps/web` executam sem erros.
