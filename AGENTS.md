# Diretrizes para Agentes de IA (AGENTS.md)

Este documento define as regras globais do monorepo **Portfolio** que englobam tanto a **API** quanto o **Web**. Qualquer agente de IA trabalhando neste repositório **DEVE** seguir estas diretrizes à risca e consultar as regras específicas da camada em que estiver atuando.

---

## 1. Mapa de Documentação para Agentes

- **`AGENTS.md` (este arquivo):** regras globais do projeto, visão geral da arquitetura, stacks, estilo de código, código compartilhado (`shared/`) e comandos gerais.
- **`.agent/rules/api.md`:** regras, arquitetura, plugins, autenticação e convenções específicas do backend (`apps/api`).
- **`.agent/rules/web.md`:** regras, arquitetura Angular, estilização e convenções específicas do frontend (`apps/web`).
- **`.agent/web/`:** especificações descritivas de páginas inteiras (ex.: `.agent/web/home.md`) e componentes reutilizáveis (`.agent/web/components/`) do frontend. Consulte sempre antes de criar ou alterar telas e componentes.

---

## 2. Regras de Ouro (Princípios Não-Negociáveis)

1. **Foco Estrito na Tarefa (No Scope Creep):**
   - Execute apenas o que foi explicitamente solicitado.
   - Não refatore arquivos não relacionados, não altere formatação de arquivos inteiros e não adicione "melhorias" não pedidas.
   - Não adicione novas dependências (`npm install ...`) sem consentimento explícito.
   - Nunca sobrescreva o `.env` real do desenvolvedor; use `.env.example` para documentar variáveis e valores de teste.

2. **Evite Boilerplate e Sobre-Engenharia (KISS & YAGNI):**
   - Não crie camadas de abstração desnecessárias (ex.: Generic Repositories, Abstract Factories, DTOs manuais duplicados) se uma função simples, um contrato enxuto ou inferência do Zod resolver o problema.
   - Escreva código conciso, direto e idiomático para a stack.

3. **Inspecione Antes de Criar:**
   - Antes de criar um módulo, serviço, provider, página ou componente, inspecione os arquivos existentes e os documentos correspondentes em `.agent/rules/` e `.agent/web/` para seguir exatamente o mesmo padrão arquitetural e de sintaxe.
   - Reutilize o que já está configurado no repositório (aliases, schemas compartilhados, serviços e utilitários).

4. **Validação Obrigatória:**
   - Nunca considere uma tarefa finalizada sem garantir que o código compila sem erros de TypeScript e sem quebrar os comandos de build/test existentes.

---

## 3. Visão Geral da Arquitetura e Stacks

O projeto é um **Monorepo** gerenciado por **npm workspaces** com arquitetura **100% stateless (sem banco de dados)**:

```text
portfolio/
├── .agent/
│   ├── rules/
│   │   ├── api.md      # Regras específicas do backend (apps/api)
│   │   └── web.md      # Regras específicas do frontend (apps/web)
│   └── web/
│       ├── components/ # Especificações de componentes do frontend
│       └── *.md        # Especificações de páginas inteiras do frontend
├── apps/
│   ├── api/            # Backend (Node.js ESM, Fastify v5, TypeScript, Zod v4)
│   └── web/            # Frontend (Angular 22+, Standalone, Signals, Tailwind v4, Vitest)
├── shared/             # Código compartilhado (Schemas Zod, tipos inferidos, env)
├── .env.example        # Modelo com variáveis e URLs de teste para desenvolvimento
├── docker-compose.yml  # Orquestração local de containers
├── AGENTS.md           # Diretrizes globais para agentes de IA
└── package.json        # Configuração raiz e workspaces
```

### Resumo das Stacks e Ferramentas

| Escopo | Stack / Ferramentas | Porta Padrão |
| :--- | :--- | :---: |
| **Monorepo** | npm workspaces, TypeScript, Zod v4, Docker Compose | — |
| **API (`apps/api`)** | Node.js ESM, Fastify v5, `@fastify/type-provider-zod`, `tsx`, `tsc-alias` | `3333` |
| **Web (`apps/web`)** | Angular 22+ (Standalone + Signals), Tailwind CSS v4, Vitest | `4200` |
| **Compartilhado (`shared/`)** | Schemas Zod, tipos inferidos e validação de variáveis de ambiente | — |

---

## 4. Estilo e Sintaxe de Código

Siga o estilo limpo e compacto adotado no repositório, evitando quebras de linha verticais desnecessárias:

1. **Imports e chamadas em linha única:**
   - Mantenha imports, assinaturas de métodos/funções e chamadas de método em uma única linha sempre que continuarem legíveis.
   - Evite quebrar cada argumento ou cada símbolo importado em uma linha separada sem necessidade.
   - Agrupe declarações sequenciais relacionadas sem intercalar linhas em branco a cada instrução.

2. **Chaves (Braces):**
   - Em **classes**, **construtores** e **métodos de classe**, abra `{` na linha seguinte (estilo Allman).
   - Em estruturas de controle (`if`, `for`, `try/catch`), funções utilitárias e objetos literais, mantenha `{` na mesma linha.

3. **Objetos de configuração extensos:**
   - Quando uma configuração ou mapeamento ficar extenso dentro de um handler/componente, extraia uma função auxiliar com **tipo de retorno explícito** para manter o fluxo principal enxuto e evitar *type widening* de literais pelo TypeScript.

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

## 5. Padrões de Código Compartilhado (`shared/`)

- Coloque em `shared/` apenas o que precisa ser compartilhado entre workspaces:
  - Schemas Zod de contratos comuns (`shared/schemas/jwt.schema.ts`).
  - Tipos inferidos a partir desses schemas (`AuthProvider`, `UserPayload`).
  - Validação centralizada de variáveis de ambiente (`shared/config/env.ts`).
- Não coloque lógica específica de framework (decoradores Angular ou plugins Fastify) dentro de `shared/`.
- *Atenção ao Docker do web:* `apps/web/Dockerfile` usa contexto `./apps/web` e não copia `shared/`. Considere isso antes de importar arquivos de `shared/` no frontend.

---

## 6. Comandos e Validação de Trabalho

Antes de concluir uma tarefa, execute os comandos pertinentes ao workspace alterado:

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

## 7. O que NÃO fazer (Anti-Patterns Globais)

- ❌ Não use `any` no TypeScript. Use tipos estritos ou `unknown` validado com Zod.
- ❌ Não quebre chamadas, imports e assinaturas simples em múltiplas linhas sem necessidade.
- ❌ Não crie arquivos de "mock" ou "dummy" soltos fora de testes solicitados.
- ❌ Não apague comentários importantes, documentações ou licenças existentes nos arquivos editados.
- ❌ Não faça commits ou alterações de git sem o usuário solicitar.
- ❌ Não adicione novas dependências sem autorização explícita.
