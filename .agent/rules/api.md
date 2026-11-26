# Regras do Backend (`apps/api`)

Este documento define as convenções, arquitetura e restrições específicas do backend (**API**). Para diretrizes globais do monorepo (estilo de código, regras de ouro, `shared/`), consulte [`AGENTS.md`](../../AGENTS.md).

---

## 1. Stack, Runtime e Path Aliases

- **Runtime e Build:** Node.js ESM (`"type": "module"`), `tsx` em dev com `--env-file=../../.env` (não instalar `dotenv`) e build via `tsc && tsc-alias --resolve-full-paths`.
- **Framework:** Fastify v5 + `@fastify/type-provider-zod` + Zod v4.
- **Plugins já instalados:** `@fastify/cors`, `@fastify/cookie`, `@fastify/jwt`, `@fastify/oauth2`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui`.
- **Porta padrão:** `3333`.
- **Path Aliases configurados:**
  - `@/*` aponta para `apps/api/src/*`
  - `@shared/*` aponta para `shared/*`
  - Utilize sempre os aliases configurados em vez de caminhos relativos profundos (evite `../../../../`).

---

## 2. Estrutura Atual da API

```text
apps/api/src/
├── server.ts                            # Factory buildServer() + bootstrap condicional (listen)
├── config/
│   └── swagger.ts                       # Configuração OpenAPI/Swagger (/docs)
├── types/
│   └── fastify.d.ts                     # FastifyTypedInstance, FastifyJWT e decorators
└── modules/
    ├── auth/
    │   ├── auth.routes.ts               # Rotas (FastifyPluginAsyncZod) e registro dinâmico de providers
    │   ├── auth.service.ts              # Orquestração de provedores e helpers de domínio
    │   ├── auth.schema.ts               # Schemas Zod comuns às rotas do módulo
    │   ├── token.service.ts             # Assinatura JWT stateless e política de cookies
    │   ├── middlewares/
    │   │   └── auth.middleware.ts       # Hook preHandler (authenticate via cookie JWT)
    │   └── providers/
    │       ├── oauth-provider.ts        # Contrato OAuthProvider, toProviderResponse() e AuthError
    │       ├── google.provider.ts       # Adaptador específico do Google OAuth2
    │       ├── github.provider.ts       # Adaptador específico do GitHub OAuth2
    │       └── index.ts                 # Registro central dos provedores ativos (oauthProviders)
    └── resume/
        ├── resume.routes.ts             # Rotas de entrega controlada de currículo em PDF
        ├── resume.schema.ts             # Schemas Zod do módulo resume
        └── resume.service.ts            # Regras de negócio do módulo resume
```

---

## 3. Arquitetura de Autenticação Stateless (OAuth2 + JWT)

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

3. **Como adicionar um novo provedor OAuth2:**
   1. Adicionar as credenciais e callback URL em `shared/config/env.ts` e valores teste em `.env.example`.
   2. Incluir o identificador do provedor em `authProviderSchema` (`shared/schemas/jwt.schema.ts`).
   3. Criar `apps/api/src/modules/auth/providers/<nome>.provider.ts` implementando `OAuthProvider<"<nome>">` e validando o perfil externo com Zod.
   4. Exportá-lo no array `oauthProviders` em `apps/api/src/modules/auth/providers/index.ts`.
   - *Não deve ser necessário alterar `auth.routes.ts`, `auth.service.ts`, `token.service.ts`, `auth.middleware.ts` ou `fastify.d.ts`.*

---

## 4. Convenções Gerais na API

1. **Bootstrap (`server.ts`):**
   - Mantenha a criação do servidor isolada em `buildServer()` e chame `server.listen()` apenas quando o arquivo for o entrypoint principal. Isso permite testar a aplicação diretamente com `server.inject()`.
   - Preserve a ordem de registro de plugins: `cors` (`credentials: true` e origem normalizada via `new URL(env.FRONTEND_URL).origin`) → `cookie` → `rate-limit` → `jwt` → `swagger` → `swaggerUi` → `decorate(...)` → rotas com prefixo.

2. **Rotas e Schemas (`*.routes.ts` e `*.schema.ts`):**
   - Use sempre `FastifyPluginAsyncZod` e `FastifyTypedInstance`.
   - Defina schemas Zod explícitos para `querystring`, `params`, `body` e `response`, mantendo compatibilidade com a geração OpenAPI/Swagger (`/docs`).
   - Para respostas sem corpo (`204`, `302`), use `z.undefined()` no schema de `response`.
   - Derive tipos com `z.infer<typeof schema>` em vez de duplicar interfaces manualmente.
   - Quando uma configuração de plugin ou mapeamento ficar extensa dentro de uma rota/handler, extraia uma função auxiliar com tipo de retorno explícito (ex.: `toProviderResponse(provider: OAuthProvider): FastifyOAuth2Options`).
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

## 5. Validação

```bash
# Em apps/api:
npm run build     # Executa tsc && tsc-alias --resolve-full-paths
npm run dev       # Inicia com tsx watch --env-file=../../.env src/server.ts
```

---

## 6. O que NÃO fazer (Anti-Patterns da API)

- ❌ Não acesse `process.env` fora de `shared/config/env.ts`.
- ❌ Não instale `dotenv` (o projeto usa `--env-file=../../.env` nativo do Node/tsx).
- ❌ Não implemente refresh tokens, persistência de sessão em banco ou exposição de JWT em query params.
- ❌ Não acople serviços (`*.service.ts`) a `FastifyRequest` ou `FastifyReply`.
- ❌ Não faça logout via `GET` (use sempre `POST /auth/logout`).
