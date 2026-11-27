# Regras do Frontend (`apps/web`)

Este documento define as convenções, arquitetura e restrições específicas do frontend (**Web**). Para diretrizes globais do monorepo (estilo de código, regras de ouro, `shared/`), consulte [`AGENTS.md`](../../AGENTS.md).

---

## 1. Stack e Ferramentas

- **Framework:** Angular v22+ (Modern Angular — Standalone + Signals + View Transitions).
- **Estilização:** Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Animações e Scroll:** Lenis + GSAP (`ScrollTrigger`) + `animate.enter` / `animate.leave` nativos.
- **Testes:** Vitest + `jsdom`.
- **Containerização:** Build multi-stage com Nginx 1.27 Alpine (`apps/web/nginx/`).
- **Porta padrão:** `4200`.

---

## 2. Estrutura do Frontend

```text
apps/web/
├── nginx/
│   ├── default.conf.template            # Gzip, headers de segurança, cache e fallback SPA
│   └── 40-generate-env-js.sh            # Gera /env.js em runtime a partir de API_BASE_URL
├── scripts/
│   └── run-ng.mts                       # Carrega .env da raiz e define __API_BASE_URL__
├── public/
│   ├── env.js                           # Placeholder de runtime env em desenvolvimento
│   ├── fonts/
│   │   └── JetBrainsMono-Medium.woff2   # Fonte padrão global da aplicação
│   ├── icons/                           # Ícones (github.png, google.png, linkedin.png)
│   └── projects/                        # Capturas de tela dos projetos da vitrine
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css                       # @import 'tailwindcss', @font-face, keyframes e View Transitions
    └── app/
        ├── core/                        # Infraestrutura global (singletons e configuração)
        │   ├── config/
        │   │   └── api.config.ts        # resolveApiBaseUrl() (runtime > build-time > fallback)
        │   └── services/
        │       ├── api-health.service.ts
        │       ├── auth.service.ts
        │       ├── error-feedback.service.ts
        │       ├── resume.service.ts
        │       └── smooth-scroll.service.ts
        ├── components/                  # Componentes de UI reutilizáveis e modais globais
        │   ├── auth-card/
        │   ├── error-toast/
        │   ├── navbar/
        │   ├── project-showcase/
        │   ├── resume/
        │   ├── resume-card/
        │   └── resume-code-card/
        ├── pages/                       # Páginas/rotas da aplicação (lazy-loaded)
        │   └── home/
        │       ├── home.ts / home.html / home.spec.ts
        │       └── home.projects.ts
        ├── app.ts                       # Componente raiz (shell da aplicação)
        ├── app.html
        ├── app.config.ts                # Providers globais (router, HttpClient, appInitializer)
        ├── app.routes.ts                # Definição de rotas
        └── app.spec.ts
```

- **Co-localização:** mantenha `.ts`, `.html` e `.spec.ts` juntos dentro da pasta do respectivo componente ou página (evite arquivos `.css` vazios quando Tailwind resolver o estilo).
- **Path Aliases configurados em `apps/web/tsconfig.json`:** `@config/*`, `@services/*`, `@components/*`, `@pages/*`, `@public/*`.
- **Novos recursos globais:** guards ou interceptors funcionais, quando necessários, devem ser adicionados dentro de `apps/web/src/app/core/`.

---

## 3. Especificações de Páginas e Componentes (`.agent/web/`)

O diretório `.agent/web/` concentra os documentos descritivos da interface do frontend:

- **`.agent/web/*.md`:** descrevem páginas inteiras da aplicação (ex.: `.agent/web/home.md`).
- **`.agent/web/components/*.md`:** descrevem componentes reutilizáveis do frontend.

Antes de criar ou modificar qualquer página ou componente em `apps/web`, consulte o respectivo arquivo em `.agent/web/` (quando existir) e siga fielmente a estrutura, o comportamento e os requisitos descritos nele.

---

## 4. Convenções no Angular

1. **Arquitetura 100% Standalone:**
   - **PROIBIDO** o uso de `NgModule` ou módulos legados do Angular.
   - Componentes, diretivas e pipes devem ser standalone e declarar suas dependências em `imports: [...]`.

2. **Reatividade com Signals:**
   - Dê preferência absoluta a **Signals** (`signal()`, `computed()`, `effect()`, `input()`, `output()`, `viewChild()`) para estado reativo e propriedades de componentes.
   - Use RxJS apenas para fluxos assíncronos (como `HttpClient` e eventos do `Router`), convertendo com `toSignal()` quando conveniente.

3. **Novo Fluxo de Controle de Templates:**
   - Use `@if (...)`, `@else`, `@for (... of ...; track ...)` e `@switch`.
   - **PROIBIDO** usar diretivas legadas (`*ngIf`, `*ngFor`, `*ngSwitch`).

4. **Injeção de Dependências:**
   - Prefira `inject(MeuServico)` em campos de classe em vez de construtores extensos.

5. **Estilização e Tipografia Global:**
   - Utilize classes utilitárias do Tailwind CSS. Evite CSS customizado desnecessário em arquivos `.css` individuais.
   - **Fonte padrão:** toda a interface utiliza a fonte local **`JetBrains Mono`**, localizada em `apps/web/public/fonts/` (servida em runtime em `/fonts/JetBrainsMono-Medium.woff2`, pois `apps/web/public` é copiado como raiz de assets no `angular.json`).
   - A declaração da fonte (`@font-face` com `format('woff2')`) e sua definição como fonte global (`@theme` do Tailwind v4 e `body`) devem ficar centralizadas em `apps/web/src/styles.css`.
   - Não carregue fontes externas (ex.: Google Fonts CDN) nem sobrescreva `font-family` manualmente em componentes individuais.

6. **Integração com a API:**
   - Utilize `API_BASE_URL` de `@config/api.config`, resolvido na ordem `window.__ENV__.API_BASE_URL` (runtime `/env.js`) → `__API_BASE_URL__` (build-time via `scripts/run-ng.mts`) → `http://localhost:3333`.
   - Requisições autenticadas (`GET /auth/me`, `POST /auth/logout`, `GET /resume`, `GET /resume/code`) devem enviar `withCredentials: true` para transportar o cookie `HttpOnly`.
   - *Atenção ao Docker:* `apps/web/Dockerfile` usa contexto `./apps/web` e não copia `shared/`. Considere isso antes de importar arquivos de `shared/` no frontend.

---

## 5. Validação

```bash
# Em apps/web:
npm run build     # Valida o build do Angular
npm test          # Executa a suíte de testes com Vitest
```

---

## 6. O que NÃO fazer (Anti-Patterns do Frontend)

- ❌ Não introduza bibliotecas de gerenciamento de estado pesadas (NgRx, Akita, Redux, etc.) sem ordem expressa.
- ❌ Não misture estilos legados do Angular (`@Input()`/`@Output()`, `NgModule`, `*ngIf`/`*ngFor`/`*ngSwitch`).
- ❌ Não armazene nem exponha tokens JWT em `localStorage`, `sessionStorage` ou query params.
- ❌ Não crie CSS customizado redundante quando classes utilitárias do Tailwind CSS resolverem o estilo.
- ❌ Não importe fontes externas via CDN nem redefina `font-family` isoladamente em componentes; utilize sempre a fonte global configurada a partir de `apps/web/public/fonts/`.
