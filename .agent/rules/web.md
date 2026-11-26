# Regras do Frontend (`apps/web`)

Este documento define as convenções, arquitetura e restrições específicas do frontend (**Web**). Para diretrizes globais do monorepo (estilo de código, regras de ouro, `shared/`), consulte [`AGENTS.md`](../../AGENTS.md).

---

## 1. Stack e Ferramentas

- **Framework:** Angular v22+ (Modern Angular).
- **Estilização:** Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Testes:** Vitest.
- **Porta padrão:** `4200`.

---

## 2. Especificações de Páginas e Componentes (`.agent/web/`)

O diretório `.agent/web/` concentra os documentos descritivos da interface do frontend:

- **`.agent/web/*.md`:** descrevem páginas inteiras da aplicação (ex.: `.agent/web/home.md`).
- **`.agent/web/components/*.md`:** descrevem componentes reutilizáveis do frontend.

Antes de criar ou modificar qualquer página ou componente em `apps/web`, consulte o respectivo arquivo em `.agent/web/` (quando existir) e siga fielmente a estrutura, o comportamento e os requisitos descritos nele.

---

## 3. Convenções no Angular

1. **Arquitetura 100% Standalone:**
   - **PROIBIDO** o uso de `NgModule` ou módulos legados do Angular.
   - Componentes, diretivas e pipes devem ser standalone e declarar suas dependências em `imports: [...]`.

2. **Reatividade com Signals:**
   - Dê preferência absoluta a **Signals** (`signal()`, `computed()`, `effect()`, `input()`, `output()`) para estado reativo e propriedades de componentes.
   - Use RxJS apenas para fluxos assíncronos (como `HttpClient`), convertendo com `toSignal()` quando conveniente.

3. **Novo Fluxo de Controle de Templates:**
   - Use `@if (...)`, `@else`, `@for (... of ...; track ...)` e `@switch`.
   - **PROIBIDO** usar diretivas legadas (`*ngIf`, `*ngFor`, `*ngSwitch`).

4. **Injeção de Dependências:**
   - Prefira `inject(MeuServico)` em campos de classe em vez de construtores extensos.

5. **Estilização:**
   - Utilize classes utilitárias do Tailwind CSS. Evite CSS customizado desnecessário em arquivos `.css` individuais.

6. **Integração com a API:**
   - Requisições autenticadas (ex.: `GET /auth/me`, `POST /auth/logout`) devem enviar `withCredentials: true` para transportar o cookie `HttpOnly`.
   - *Atenção ao Docker:* `apps/web/Dockerfile` usa contexto `./apps/web` e não copia `shared/`. Considere isso antes de importar arquivos de `shared/` no frontend.

---

## 4. Validação

```bash
# Em apps/web:
npm run build     # Valida o build do Angular
npm test          # Executa a suíte de testes com Vitest
```

---

## 5. O que NÃO fazer (Anti-Patterns do Frontend)

- ❌ Não introduza bibliotecas de gerenciamento de estado pesadas (NgRx, Akita, Redux, etc.) sem ordem expressa.
- ❌ Não misture estilos legados do Angular (`@Input()`/`@Output()`, `NgModule`, `*ngIf`/`*ngFor`/`*ngSwitch`).
- ❌ Não armazene nem exponha tokens JWT em `localStorage`, `sessionStorage` ou query params.
- ❌ Não crie CSS customizado redundante quando classes utilitárias do Tailwind CSS resolverem o estilo.
