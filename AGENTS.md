# Diretrizes para Agentes de IA (AGENTS.md)

Este documento define o contexto arquitetural, convenções de código, restrições e boas práticas do projeto **Portfolio**. Qualquer agente de IA trabalhando neste repositório **DEVE** seguir estas instruções à risca.

---

## 1. Regras de Ouro (Princípios Não-Negociáveis)

1. **Foco Estrito na Tarefa (No Scope Creep):**
   - Execute apenas o que foi explicitamente solicitado.
   - Não refatore arquivos não relacionados, não altere formatação de arquivos inteiros e não adicione "melhorias" não pedidas.
   - Não adicione novas dependências (`npm install ...`) sem consentimento explícito.

2. **Evite Boilerplate e Sobre-Engenharia (KISS & YAGNI):**
   - Não crie camadas de abstração desnecessárias (ex.: Generic Repositories, Abstract Factories, DTOs manuais duplicados) se uma função simples ou inferência do Zod resolver o problema.
   - Escreva código conciso, direto e idiomático para a stack escolhida.

3. **Inspecione Antes de Criar:**
   - Antes de criar um componente, serviço ou função, inspecione os arquivos existentes para seguir o mesmo estilo e padrão de nomenclatura.
   - Reutilize o que já está configurado (aliases, schemas compartilhados, plugins Fastify).

4. **Validação Obrigatória:**
   - Nunca considere uma tarefa finalizada sem garantir que o código compila sem erros de TypeScript e sem quebrar os comandos de build existentes.

---

## 2. Visão Geral da Arquitetura

O projeto é um **Monorepo** gerenciado por **npm workspaces**:

```text
portfolio/
├── apps/
│   ├── api/            # Backend (Node.js, Fastify, TypeScript, Zod)
│   └── web/            # Frontend (Angular 22+, Standalone, Signals, Tailwind v4)
├── shared/             # Código compartilhado entre apps (Schemas Zod, configs, env)
├── docker-compose.yml  # Orquestração local de containers
└── package.json        # Configuração raiz e workspaces
```

### Path Aliases configurados:
- **Na API (`apps/api`):**
  - `@/*` aponta para `apps/api/src/*`
  - `@shared/*` aponta para `shared/*`
- Utilize sempre os aliases configurados em vez de caminhos relativos profundos (evite `../../../../`).

---

## 3. Padrões do Backend (`apps/api`)

- **Framework:** Fastify v5 com TypeScript.
- **Validação e Tipagem:** `@fastify/type-provider-zod` + `zod`.
- **Porta padrão:** `3333`.

### Estrutura Modular
O backend é organizado por módulos de domínio dentro de `apps/api/src/modules/<dominio>/`:

```text
apps/api/src/modules/auth/
├── auth.routes.ts              # Definição das rotas (FastifyPluginAsyncZod)
├── auth.service.ts             # Regras de negócio da funcionalidade
├── auth.schema.ts              # Schemas Zod de validação (body, query, params, response)
├── middlewares/                # Hooks ou middlewares específicos do módulo
└── [outros].service.ts         # Serviços auxiliares específicos
```

### Convenções na API:
1. **Rotas e Schemas:**
   - Todas as rotas devem usar `FastifyTypedInstance` e ter schemas Zod explícitos para validação de entrada e respostas esperadas (ex.: status 200, 400, etc.).
   - Aproveite a inferência do Zod: use `z.infer<typeof schema>` para derivar tipos em vez de duplicar interfaces TypeScript manualmente.
2. **Serviços (`*.service.ts`):**
   - Conter apenas regras de negócio e integrações. Não acoplar diretamente com objetos de requisição/resposta do Fastify (`FastifyRequest`, `FastifyReply`).
3. **Decorações do Fastify:**
   - Se um serviço for injetado no Fastify via `server.decorate()`, lembre-se de tipá-lo na interface em `apps/api/src/types/fastify.d.ts`.
4. **Variáveis de Ambiente:**
   - Nunca use `process.env.VARIAVEL` diretamente no código da aplicação. Importe sempre do schema centralizado em `@shared/config/env`.

---

## 4. Padrões do Frontend (`apps/web`)

- **Framework:** Angular v22 (Modern Angular).
- **Estilização:** Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Testes:** Vitest.
- **Porta padrão:** `4200`.

### Convenções no Angular:
1. **Arquitetura 100% Standalone:**
   - **PROIBIDO** o uso de `NgModule` ou módulos legados do Angular.
   - Componentes, diretivas e pipes devem ser `standalone: true` (padrão no Angular moderno) e importar suas próprias dependências no array `imports: [...]`.
2. **Reatividade com Signals:**
   - Dê preferência absoluta a **Signals** (`signal()`, `computed()`, `effect()`, `input()`, `output()`) para gerenciar estado reativo e propriedades de componentes.
   - Evite RxJS para estados locais simples ou fluxos síncronos. Use RxJS apenas para fluxos assíncronos complexos (como chamadas HTTP via `HttpClient`), convertendo com `toSignal()` quando conveniente para a view.
3. **Novo Fluxo de Controle de Templates:**
   - Use a sintaxe de controle embutida: `@if (...)`, `@else`, `@for (... of ...; track ...)` e `@switch`.
   - **PROIBIDO** o uso de diretivas estruturais legadas como `*ngIf`, `*ngFor` ou `*ngSwitch`.
4. **Injeção de Dependências:**
   - Prefira a função `inject(MeuServico)` em campos de classe ao invés de construtores com muitos parâmetros.
5. **Estilização:**
   - Utilize as classes utilitárias do Tailwind CSS. Evite CSS personalizado desnecessário em arquivos `.css` individuais se classes utilitárias resolverem.

---

## 5. Padrões de Código Compartilhado (`shared/`)

- Coloque em `shared/` apenas o que realmente precisa ser compartilhado entre API e Frontend (ou múltiplos serviços futuros):
  - Schemas Zod de validação de dados comuns.
  - Tipos e DTOs inferidos a partir desses schemas.
  - Configurações de ambiente compartilhadas (`shared/config/env.ts`).
- Não coloque lógica de framework específica (ex.: decoradores Angular ou plugins Fastify) dentro de `shared/`.

---

## 6. Comandos e Validação de Trabalho

Antes de dar uma tarefa como concluída, execute os comandos pertinentes para garantir a integridade do código:

```bash
# Na API:
cd apps/api
npm run build     # Verifica compilação do TypeScript

# No Frontend:
cd apps/web
npm run build     # Valida o build do Angular
npm test          # Executa a suíte de testes com Vitest

# Execução local via Docker Compose (se aplicável):
docker compose up --build
```

---

## 7. O que NÃO fazer (Anti-Patterns)

- ❌ Não crie arquivos de "mock" ou "dummy" soltos se não forem requisitados para testes.
- ❌ Não use o tipo `any` do TypeScript. Use tipos estritos ou `unknown` com asserção de schema Zod.
- ❌ Não introduza bibliotecas de gerenciamento de estado pesadas (NgRx, Akita, Redux, etc.) sem ordem expressa.
- ❌ Não misture estilos de código legados do Angular (como `@Input()`/`@Output()` legados ou `NgModules`).
- ❌ Não apague comentários importantes, documentações ou licenças existentes nos arquivos editados.
- ❌ Não faça commits ou instruções de git sem o usuário solicitar.
