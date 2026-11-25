# Diretrizes para Agentes de IA (AGENTS.md)

Este documento define a arquitetura, convenções de código, estilo de sintaxe, regras de segurança e restrições do projeto **Portfolio**. Qualquer agente de IA trabalhando neste repositório **DEVE** seguir estas instruções à risca.

---

## 1. Regras de Ouro (Princípios Não-Negociáveis)

1. **Foco Estrito na Tarefa (No Scope Creep):**
   - Execute apenas o que foi explicitamente solicitado.
   - Não refatore arquivos não relacionados, não altere formatação de arquivos inteiros e não adicione "melhorias" não pedidas.
   - Não adicione novas dependências (`npm install ...`) sem consentimento explícito.
   - Nunca sobrescreva o `.env` real do desenvolvedor; use `.env.example` para documentar variáveis e valores de teste.

2. **Evite Boilerplate e Sobre-Engenharia (KISS & YAGNI):**
   - Não crie camadas de abstração desnecessárias (ex.: Generic Repositories, Abstract Factories, DTOs manuais duplicados) se uma função simples, um contrato enxuto ou inferência do Zod resolver o problema.
   - Escreva código conciso, direto e idiomático para a stack.

3. **Inspecione Antes de Criar:**
   - Antes de criar um módulo, serviço, provider ou componente, inspecione os arquivos existentes para seguir exatamente o mesmo padrão arquitetural e de sintaxe.
   - Reutilize o que já está configurado (aliases, schemas compartilhados, plugins Fastify, `AuthError`, `buildServer`).

4. **Validação Obrigatória:**
   - Nunca considere uma tarefa finalizada sem garantir que o código compila sem erros de TypeScript e sem quebrar os comandos de build/test existentes.

---

## 2. Visão Geral da Arquitetura

O projeto é um **Monorepo** gerenciado por **npm workspaces** com arquitetura **100% stateless (sem banco de dados)**:

```text
portfolio/
├── apps/
│   ├── api/            # Backend (Node.js ESM, Fastify v5, TypeScript, Zod v4)
│   └── web/            # Frontend (Angular 22+, Standalone, Signals, Tailwind v4)
├── shared/             # Código compartilhado (Schemas Zod, tipos inferidos, env)
├── .env.example        # Modelo com variáveis e URLs de teste para desenvolvimento
├── docker-compose.yml  # Orquestração local de containers
└── package.json        # Configuração raiz e workspaces
```

### Path Aliases configurados
- **Na API (`apps/api`):**
  - `@/*` aponta para `apps/api/src/*`
  - `@shared/*` aponta para `shared/*`
- Utilize sempre os aliases configurados em vez de caminhos relativos profundos (evite `../../../../`).

---

## 3. Estilo e Sintaxe de Código

Siga o estilo limpo e compacto adotado no repositório, evitando quebras de linha verticais desnecessárias:

1. **Imports e chamadas em linha única:**
   - Mantenha imports, assinaturas de métodos/funções e chamadas de método em uma única linha sempre que continuarem legíveis.
   - Evite quebrar cada argumento ou cada símbolo importado em uma linha separada sem necessidade.
   - Agrupe declarações sequenciais relacionadas sem intercalar linhas em branco a cada instrução.

2. **Chaves (Braces):**
   - Em **classes**, **construtores** e **métodos de classe**, abra `{` na linha seguinte (estilo Allman).
   - Em estruturas de controle (`if`, `for`, `try/catch`), funções utilitárias e objetos literais, mantenha `{` na mesma linha.

3. **Objetos de configuração fora das rotas:**
   - Quando uma configuração de plugin ou mapeamento ficar extensa dentro de uma rota/handler, extraia uma função auxiliar com **tipo de retorno explícito** (ex.: `toProviderResponse(provider: OAuthProvider): FastifyOAuth2Options`). Isso mantém a rota enxuta e evita *type widening* de literais pelo TypeScript.

### Exemplo do estilo esperado

```ts
import { AuthError, type OAuthProvider } from "@/modules/auth/providers/oauth-provider";

export class AuthService
{
  public async authenticateWithProvider(providerName: AuthProvider, accessToken: string): Promise<UserPayload>
  {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new AuthError("UNSUPPORTED_PROVIDER", `OAuth provider "${providerName}" is not registered.`);
    }

    return provider.fetchUserProfile(accessToken);
  }
}
```

---

## 4. Padrões do Backend (`apps/api`)

- **Runtime e Build:** Node.js ESM (`"type": "module"`), `tsx` em dev com `--env-file=../../.env` (não instalar `dotenv`) e build via `tsc && tsc-alias --resolve-full-paths`.
- **Framework:** Fastify v5 + `@fastify/type-provider-zod` + Zod v4.
- **Plugins já instalados:** `@fastify/cors`, `@fastify/cookie`, `@fastify/jwt`, `@fastify/oauth2`, `@fastify/rate-limit`.
- **Porta padrão:** `3333`.

### Estrutura Atual da API

```text
apps/api/src/
├── server.ts                            # Factory buildServer() + bootstrap condicional (listen)
├── types/
│   └── fastify.d.ts                     # FastifyTypedInstance, FastifyJWT e decorators
└── modules/
    └── auth/
        ├── auth.routes.ts               # Rotas (FastifyPluginAsyncZod) e registro dinâmico de providers
        ├── auth.service.ts              # Orquestração de provedores e helpers de domínio
        ├── auth.schema.ts               # Schemas Zod comuns às rotas do módulo
        ├── token.service.ts             # Assinatura JWT stateless e política de cookies
        ├── middlewares/
        │   └── auth.middleware.ts       # Hook preHandler (authenticate via cookie JWT)
        └── providers/
            ├── oauth-provider.ts        # Contrato OAuthProvider, toProviderResponse() e AuthError
            ├── google.provider.ts       # Adaptador específico do Google OAuth2
            └── index.ts                 # Registro central dos provedores ativos (oauthProviders)
```

### Arquitetura de Autenticação Stateless (OAuth2 + JWT)

1. **Apenas Access Token (sem Refresh Token e sem Banco de Dados):**
   - A sessão é 100% stateless via JWT assinado armazenado no cookie `HttpOnly` chamado `access_token`.
   - **Não implemente refresh tokens** nem persistência de sessão em banco. O tempo de vida da sessão é controlado por `JWT_EXPIRES_IN` (com `maxAge` do cookie sincronizado em `TokenService`).
   - A validação em rotas protegidas usa `authenticate` (`preHandler`) com `request.jwtVerify({ onlyCookie: true })` e validação do payload via `userPayloadSchema`.
   - Logout é sempre via `POST /auth/logout` (nunca `GET`) limpando o cookie com os mesmos atributos (`httpOnly`, `sameSite`, `secure`, `path`).

2. **Padrão Extensível de Provedores OAuth2 (`providers/`):**
   - Todo provedor implementa o contrato `OAuthProvider<P>` em `modules/auth/providers/oauth-provider.ts` e encapsula sua própria configuração OAuth2, schema Zod de resposta da API externa e normalização para `UserPayload`.
   - As rotas `/auth/<provider>` e `/auth/<provider>/callback` são registradas dinamicamente em `auth.routes.ts` a partir de `server.authService.getProviders()`.
   - Cada provedor usa cookies de estado/PKCE isolados (`oauth2-${provider.name}-state` e `oauth2-${provider.name}-verifier`, assinados via `@fastify/cookie`) para evitar colisões.
   - O nome do plugin segue `oauth2${Capitalize<AuthProvider>}` (ex.: `oauth2Google`, `oauth2Github`), aproveitando a tipagem dinâmica nativa do `@fastify/oauth2` sem precisar editar `fastify.d.ts` a cada novo provedor.

3. **Como adicionar um novo provedor OAuth2 (ex.: GitHub):**
   1. Adicionar as credenciais e callback URL em `shared/config/env.ts` e valores teste em `.env.example`.
   2. Incluir o identificador do provedor em `authProviderSchema` (`shared/schemas/jwt.schema.ts`).
   3. Criar `apps/api/src/modules/auth/providers/<nome>.provider.ts` implementando `OAuthProvider<"<nome>">` e validando o perfil externo com Zod.
   4. Exportá-lo no array `oauthProviders` em `apps/api/src/modules/auth/providers/index.ts`.
   - *Não deve ser necessário alterar `auth.routes.ts`, `auth.service.ts`, `token.service.ts`, `auth.middleware.ts` ou `fastify.d.ts`.*

### Convenções Gerais na API

1. **Bootstrap (`server.ts`):**
   - Mantenha a criação do servidor isolada em `buildServer()` e chame `server.listen()` apenas quando o arquivo for o entrypoint principal. Isso permite testar a aplicação diretamente com `server.inject()`.
   - Preserve a ordem de registro de plugins: `cors` (`credentials: true` e origem normalizada via `new URL(env.FRONTEND_URL).origin`) → `cookie` → `rate-limit` → `jwt` → `decorate(...)` → rotas com prefixo.

2. **Rotas e Schemas (`*.routes.ts` e `*.schema.ts`):**
   - Use sempre `FastifyPluginAsyncZod` e `FastifyTypedInstance`.
   - Defina schemas Zod explícitos para `querystring`, `params`, `body` e `response`.
   - Para respostas sem corpo (`204`, `302`), use `z.undefined()` no schema de `response`.
   - Derive tipos com `z.infer<typeof schema>` em vez de duplicar interfaces manualmente.
   - Em erros de callback OAuth2, registre detalhes apenas no `request.log.error` e redirecione o cliente com códigos de erro controlados (`AuthError.code` ou `auth_failed`), nunca vazando stack traces ou tokens na URL.

3. **Serviços (`*.service.ts`):**
   - Contêm apenas regras de negócio e integrações externas (use `fetch` nativo do Node com `AbortSignal.timeout`).
   - **Nunca** acoplar serviços a `FastifyRequest` ou `FastifyReply`.
   - Use `AuthError(code, message)` para erros de domínio esperados no módulo de autenticação.

4. **Decorações e Tipagem (`apps/api/src/types/fastify.d.ts`):**
   - Serviços injetados via `server.decorate()` devem ser tipados em `FastifyInstance`.
   - A tipagem do payload/user JWT é centralizada em `declare module "@fastify/jwt"` apontando para `UserPayload`.

5. **Variáveis de Ambiente:**
   - **Nunca** acesse `process.env` diretamente na aplicação. Importe sempre de `@shared/config/env`.
   - Cookies `secure` devem ser condicionados a `env.NODE_ENV === "production"` para não quebrar o fluxo em `http://localhost`.

---

## 5. Padrões do Frontend (`apps/web`)

- **Framework:** Angular v22 (Modern Angular).
- **Estilização:** Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Testes:** Vitest.
- **Porta padrão:** `4200`.

### Convenções no Angular
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

---

## 6. Padrões de Código Compartilhado (`shared/`)

- Coloque em `shared/` apenas o que precisa ser compartilhado entre workspaces:
  - Schemas Zod de contratos comuns (`shared/schemas/jwt.schema.ts`).
  - Tipos inferidos a partir desses schemas (`AuthProvider`, `UserPayload`).
  - Validação centralizada de variáveis de ambiente (`shared/config/env.ts`).
- Não coloque lógica específica de framework (decoradores Angular ou plugins Fastify) dentro de `shared/`.
- *Atenção ao Docker do web:* `apps/web/Dockerfile` usa contexto `./apps/web` e não copia `shared/`. Considere isso antes de importar arquivos de `shared/` no front-end.

---

## 7. Comandos e Validação de Trabalho

Antes de concluir uma tarefa, execute os comandos pertinentes:

```bash
# Na API (apps/api):
npm run build     # Executa tsc && tsc-alias --resolve-full-paths
npm run dev       # Inicia com tsx watch --env-file=../../.env src/server.ts

# No Frontend (apps/web):
npm run build     # Valida o build do Angular
npm test          # Executa a suíte de testes com Vitest

# Execução local via Docker Compose (se aplicável):
docker compose up --build
```

---

## 8. O que NÃO fazer (Anti-Patterns)

- ❌ Não use `any` no TypeScript. Use tipos estritos ou `unknown` validado com Zod.
- ❌ Não acesse `process.env` fora de `shared/config/env.ts`.
- ❌ Não implemente refresh tokens, persistência de sessão em banco ou exposição de JWT em query params/`localStorage`.
- ❌ Não quebre chamadas, imports e assinaturas simples em múltiplas linhas sem necessidade.
- ❌ Não crie arquivos de "mock" ou "dummy" soltos fora de testes solicitados.
- ❌ Não introduza bibliotecas de gerenciamento de estado pesadas (NgRx, Akita, Redux, etc.) sem ordem expressa.
- ❌ Não misture estilos legados do Angular (`@Input()`/`@Output()`, `NgModule`, `*ngIf`/`*ngFor`).
- ❌ Não apague comentários importantes, documentações ou licenças existentes nos arquivos editados.
- ❌ Não faça commits ou alterações de git sem o usuário solicitar.
