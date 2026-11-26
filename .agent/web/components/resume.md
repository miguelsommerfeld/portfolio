# Especificação do Componente: Resume (Prévia Animada de Currículo na Homepage)

Este documento define os requisitos visuais, estruturais, comportamentais e técnicos do componente **Resume** (`app-resume`), responsável por substituir a seção estática final do botão `"Acessar currículo"` na **Homepage** (`apps/web`) por uma revelação 3D sincronizada ao scroll inspirada no **FlowOS**.

> **Obrigatório:** Qualquer agente responsável por implementar esta feature **DEVE** seguir integralmente todas as diretrizes de [`AGENTS.md`](../../../AGENTS.md) e [`.agent/rules/web.md`](../../rules/web.md), mantendo coerência visual e arquitetural com a página definida em [`.agent/web/home.md`](../home.md) e com a barra de navegação definida em [`.agent/web/components/navbar.md`](./navbar.md).

---

## 1. Visão Geral e Contexto na Homepage

Atualmente, a Seção 3 da Homepage (`apps/web/src/app/pages/home/home.html`) renderiza apenas um botão solitário `"Acessar currículo"` após o último `<app-project-showcase />`.

Esta especificação substitui essa seção por um componente standalone reutilizável (`Resume`, seletor `app-resume`) que entrega um fechamento memorável para a rolagem da página:

1. **Gatilho natural pós-projetos:** imediatamente após o último `<app-project-showcase />` liberar o *scroll pinning* e o usuário continuar descendo, a borda superior de uma **folha vertical de currículo em papel branco** começa a emergir pela base da viewport, inclinada em perspectiva 3D — reproduzindo a sensação espacial da revelação de tela do **FlowOS**.
2. **Subida e planificação sincronizadas ao scroll (`scrub`):** conforme o usuário rola até o fim da página, a folha sobe suavemente, desfaz a inclinação 3D (`rotateX → 0deg`), atinge escala `1` e se estabiliza perfeitamente centralizada na viewport (abaixo da navbar fixa de `56px`).
3. **Mistério e CTA de acesso:** a folha exibe o nome **`Miguel L. Sommerfeld`** nítido no topo, uma estrutura realista de currículo intencionalmente borrada e esmaecida no corpo, um grande símbolo **`?`** centralizado com sombra suave e, ao concluir a subida, o botão **`Acessar currículo`** em **liquid glass escuro** ganha destaque suave na base da folha, navegando para `/curriculo` com `withViewTransitions()`.

---

## 2. Direção Visual e Contraste

- **Ambiente da seção (Dark Mode contínuo):**
  - Mantém o fundo escuro `bg-neutral-950` contínuo com o final do último projeto, sem divisórias rígidas.
  - Um brilho radial ambiente sutil atrás da folha (`bg-[radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.10),transparent_56%)]`, `pointer-events-none select-none aria-hidden="true"`) cria profundidade atmosférica e realça a silhueta clara do papel durante a elevação.
- **Compensação da Navbar fixa:**
  - Como `app-navbar` ocupa `fixed top-0 h-14 z-50`, o palco da seção deve reservar espaço superior seguro (`pt-14`, preferencialmente `pt-16 pb-6`) para que a folha nunca encoste nem fique encoberta pela barra no estado final.
- **Tipografia:**
  - Utilizar exclusivamente a fonte global **`JetBrains Mono`** já configurada em `apps/web/src/styles.css` (proibido carregar fontes externas ou redefinir `font-family` manualmente no componente).
- **Estilização:**
  - Priorizar classes utilitárias do **Tailwind CSS v4**. Evitar criar arquivo `.css` dedicado desnecessário para o componente.

---

## 3. Anatomia Visual da Folha de Currículo

### 3.1. Formato, Dimensões e Acabamento de Papel

- **Proporção vertical A4:** manter proporção de documento real (`aspect-[210/297]`).
- **Dimensionamento seguro em `100vh`:** dimensionar prioritariamente pela altura útil da viewport com trava de largura para que a folha caiba **inteira** em desktops (inclusive telas `1366×768`) e dispositivos móveis sem corte vertical nem overflow horizontal:
  - Sugestão responsiva: `h-[min(74svh,620px)] max-w-[88vw] aspect-[210/297]` (em telas pequenas, `h-[min(70svh,520px)] sm:h-[min(76svh,640px)]`).
- **Superfície estilo papel branco:**
  - Fundo claro suave com leve gradiente vertical natural para não estourar no ambiente escuro: `bg-linear-to-b from-white via-neutral-50 to-neutral-100`.
  - Cantos suavemente arredondados (`rounded-2xl sm:rounded-[1.25rem]`), `overflow-hidden`, contorno fino (`ring-1 ring-black/10`) e sombra profunda combinada a leve brilho especular no topo do papel (`shadow-[0_32px_90px_-16px_rgba(0,0,0,0.85),0_0_64px_-16px_rgba(255,255,255,0.14),inset_0_1px_0_0_rgba(255,255,255,0.95)]`).

### 3.2. Camadas Internas da Folha (de cima para baixo)

1. **Cabeçalho Nítido (Topo da Folha):**
   - Exibe centralizado o nome **`Miguel L. Sommerfeld`** (`<h2>`, nítido e sem blur, em tom grafite elegante como `text-neutral-800 text-base sm:text-lg font-semibold tracking-tight`).
   - Pode incluir uma linha divisória sutil abaixo do cabeçalho (`border-b border-neutral-200/80`) para reforçar imediatamente a leitura visual de documento de currículo.

2. **Corpo — Estrutura Realista de Currículo Borrada (`aria-hidden="true"`):**
   - Conteúdo puramente visual/decorativo (`aria-hidden="true" select-none pointer-events-none`) organizado como um currículo real em escala reduzida (sem texto aleatório/gibberish e sem expor dados pessoais reais como telefone ou endereço):
     - Blocos simulados com hierarquia realista: **RESUMO**, **EXPERIÊNCIA**, **FORMAÇÃO** e **STACK TÉCNICA** (títulos curtos em caixa alta, datas/cargos simulados e linhas curtas de descrição).
   - **Desfoque e esmaecimento ("efeito mistério"):**
     - Aplicar desfoque no corpo textual (`blur-[2.5px] sm:blur-[3px] opacity-65 text-neutral-600`) para que a estrutura seja reconhecível como um currículo real, mas propositalmente ilegível.
     - Sobrepor uma **máscara radial clara** no centro (`bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0.34)_44%,rgba(255,255,255,0.08)_100%)]`) para abrir respiro óptico atrás do `?`.
     - Sobrepor um **gradiente inferior suave** (`bg-linear-to-t from-white/95 via-white/60 to-transparent`) na porção final da folha, preparando uma base limpa e contrastada para o botão CTA.

3. **Elemento Central — Símbolo de Interrogação (`?`):**
   - Posicionado no centro óptico da folha sobre o conteúdo borrado (`pointer-events-none select-none aria-hidden="true"`).
   - Deve ter presença forte e limpa (SVG vetorial inline ou caractere tipográfico de grande porte com `JetBrains Mono`, em cinza grafite `text-neutral-700/90`) acompanhado de sombra projetada suave (`drop-shadow-[0_14px_22px_rgba(0,0,0,0.30)]`), remetendo diretamente ao rascunho de referência.
   - Durante a animação de scroll, o `?` recebe uma leve elevação paralaxe independente (`y: 18 → 0`, `scale: 0.90 → 1`) para enfatizar profundidade entre o papel e o ícone.

4. **Base da Folha — Botão `"Acessar currículo"` (Liquid Glass Escuro):**
   - **Texto exato:** **`Acessar currículo`** (mantendo compatibilidade semântica e com a expectativa de teste existente).
   - **Elemento e navegação:** `<a routerLink="/curriculo">`, aproveitando nativamente `withViewTransitions()` já habilitado em `apps/web/src/app/app.config.ts`.
   - **Adaptação visual Liquid Glass Escuro (alto contraste sobre papel branco):**
     - Como a folha é clara, o botão **não** deve usar o vidro claro transparente com texto branco da antiga seção (que ficaria ilegível sobre papel branco). Em vez disso, adota **liquid glass escuro** coerente com a linguagem do portfólio:
     - Formato pill arredondado: `inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm sm:text-base font-medium tracking-tight`.
     - Superfície translúcida escura com refração sobre o papel borrado: `border border-neutral-950/20 bg-neutral-950/80 bg-linear-to-b from-neutral-800/85 to-neutral-950/92 text-white/95 backdrop-blur-xl backdrop-saturate-150`.
     - Brilho especular interno superior + sombra realista sobre o papel: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.26),0_12px_30px_-6px_rgba(0,0,0,0.45)]`.
     - Hover orgânico consistente com a navbar: `origin-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:scale-105 hover:border-neutral-950/35 hover:bg-neutral-900/92 hover:text-white`.
     - Foco acessível de alto contraste sobre papel claro: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white`.
     - Respeito a movimento reduzido: `motion-reduce:transition-none motion-reduce:hover:scale-100`.

---

## 4. Comportamento da Animação 3D no Scroll (Referência FlowOS)

### 4.1. Estrutura do Palco (Solução para a Última Seção da Página)

Por ser a **última seção da homepage** (sem conteúdo abaixo dela), a seção precisa de uma pista vertical de rolagem suficiente para que a animação complete **100% do trajeto** antes de o scroll atingir o limite inferior da página:

- **Wrapper externo (`<section #sectionRef>`):**
  - Usa `relative w-full bg-neutral-950 overflow-x-clip` (importante: **não** usar `overflow-hidden` no wrapper externo, pois isso quebra `position: sticky` no palco interno).
  - Altura de pista de scroll quando movimento normal estiver ativo: `min-h-[155vh] lg:min-h-[175vh]` (reduzida para `min-h-screen` sob `prefers-reduced-motion: reduce`).
- **Palco interno fixado na viewport (`sticky`):**
  - `sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden px-5 pt-16 pb-6 sm:px-8 lg:px-12` com perspectiva 3D (`[perspective:1200px]`).
  - Isso garante que a folha comece a despontar pela borda inferior assim que a seção entra em tela e termine **inteiramente enquadrada e estável** no centro da viewport quando o usuário chega ao final da página.

### 4.2. Timeline GSAP + `ScrollTrigger` (`scrub`)

Registrar toda a animação dentro de `afterNextRender()` usando `gsap.context(() => { ... }, section)` e `gsap.matchMedia()`, limpando no `DestroyRef.onDestroy()` com `ctx.revert()`:

- **Condição de ativação:** `(prefers-reduced-motion: no-preference)`.
- **Trigger da timeline:**
  - `trigger: section`
  - `start: 'top 85%'` (a folha já começa a aparecer na base da tela logo após a liberação do último projeto)
  - `end: 'bottom bottom'` (a timeline completa exatamente quando o usuário atinge o fim da pista de scroll)
  - `scrub: 0.6` (suavização fluida acoplada ao `Lenis` do `SmoothScrollService`, sem `snap` forçado)
  - `invalidateOnRefresh: true`
- **Estágios coreografados na timeline (progresso `0 → 1`):**
  1. **Fase 1 — Ascensão e planificação 3D da folha (`0% → 72%` da timeline):**
     - **Estado inicial (`from`):** folha deslocada para baixo (`yPercent: 48` em desktop / `yPercent: 34` em mobile), inclinada para trás em 3D (`rotateX: 26`, `transformOrigin: '50% 100%'`), reduzida (`scale: 0.84`) e levemente esmaecida (`opacity: 0.35`).
     - **Estado final (`to`):** `yPercent: 0`, `rotateX: 0`, `scale: 1`, `opacity: 1`, com `ease: 'power2.out'`.
     - O halo radial atrás da folha pode acompanhar suavemente (`opacity: 0.35 → 1`, `scale: 0.85 → 1`).
  2. **Fase 2 — Profundidade do `?` (`15% → 75%` da timeline):**
     - O símbolo `?` acompanha com leve paralaxe interna (`y: 20 → 0`, `scale: 0.9 → 1`, `opacity: 0.4 → 1`, `ease: 'power2.out'`), criando separação espacial sobre o papel borrado.
  3. **Fase 3 — Destaque do botão `"Acessar currículo"` (`62% → 92%` da timeline):**
     - À medida que a folha se aproxima da posição reta final, o container do botão (`#ctaWrapRef`) ganha destaque suave (`opacity: 0 → 1`, `y: 16 → 0`, `scale: 0.94 → 1`, `ease: 'power2.out'`).
     - *Nota de acessibilidade:* **não** aplicar `visibility: hidden`, `display: none` ou `pointer-events: none` no link `<a>` em seu estado inicial, garantindo que a navegação via teclado (`Tab`) e leitores de tela consigam alcançar o botão a qualquer momento. Caso o link receba foco por teclado antes do final da rolagem, manter foco visível e acessível.
     - *Nota de animação vs. hover:* animar `y`/`scale`/`opacity` no wrapper `#ctaWrapRef` e **nunca** diretamente no `<a routerLink="/curriculo">`, evitando conflito de `transform` com o `hover:scale-105` do Tailwind no botão!

### 4.3. Comportamento sob `prefers-reduced-motion: reduce` e `jsdom`

- **Quando `prefers-reduced-motion: reduce` estiver ativo:**
  - Não criar `ScrollTrigger` nem aplicar inclinação 3D.
  - O sinal `reducedMotion()` altera a seção externa para `min-h-screen` (sem pista extra de scroll) e renderiza a folha imediatamente reta, centralizada, com o `?` e o botão **`Acessar currículo`** em `opacity-100`.
- **Segurança em `jsdom` / SSR:**
  - Verificar `win && typeof win.matchMedia === 'function'` e `this.smoothScroll.registerScrollTrigger()` antes de registrar qualquer animação GSAP (mesmo padrão seguro de `ProjectShowcase` e `Home`).

---

## 5. Arquitetura Angular e Integração

### 5.1. Organização de Arquivos

Seguindo [`.agent/rules/web.md`](../../rules/web.md) e os aliases já configurados em `apps/web/tsconfig.json` (`@components/*`, `@services/*`):

```text
apps/web/src/app/
├── components/
│   └── resume/                      # Novo componente standalone
│       ├── resume.ts                # Classe Resume (seletor app-resume), Signals e GSAP ScrollTrigger
│       ├── resume.html              # Palco 3D sticky, folha A4 branca borrada, "?" e CTA liquid glass escuro
│       └── resume.spec.ts           # Testes unitários (Vitest)
└── pages/
    └── home/
        ├── home.ts                  # Importa Resume e remove refs/animação da antiga CTA estática
        ├── home.html                # Substitui a antiga <section #ctaSectionRef> por <app-resume />
        └── home.spec.ts             # Atualiza/mantém validação de <app-resume /> e link /curriculo
```

### 5.2. Integração na Página `Home`

- Em `apps/web/src/app/pages/home/home.html`:
  - Substituir toda a `<section #ctaSectionRef ...>` atual por `<app-resume />` logo após o bloco `@for (project of projects; ...)`.
- Em `apps/web/src/app/pages/home/home.ts`:
  - Importar `Resume` via `@components/resume/resume` em `imports: [ProjectShowcase, Resume]`.
  - Remover `RouterLink` (se não for mais utilizado em `home.html`), `ctaSectionRef`, `ctaContentRef` e o bloco `if (ctaSection && ctaContent)` de `setupScrollAnimations()`.
  - Manter `scheduleScrollTriggerRefresh()` em `Home`, pois o `ScrollTrigger.refresh()` pós-render recalcula corretamente a posição de início de `<app-resume />` após o `pinSpacing` de todos os `<app-project-showcase />`.

### 5.3. Convenções Obrigatórias (`AGENTS.md` + `.agent/rules/web.md`)

- **Sem novas dependências:** utilizar exclusivamente `gsap` (`ScrollTrigger`), `lenis` (`SmoothScrollService`) e Tailwind CSS v4 já instalados no workspace.
- **Angular 22 Moderno:**
  - Componente 100% standalone (proibido `NgModule`).
  - Estado e referências exclusivamente com Signals (`signal()`, `viewChild()`).
  - Fluxo de controle moderno (`@if`, `@for`) se necessário — proibido `*ngIf` / `*ngFor`.
  - Injeção via `inject(...)` (sem injeção via parâmetros de construtor).
- **Estilo de código (`AGENTS.md`):**
  - Chaves estilo Allman (`{` na linha seguinte) em classes, construtores e métodos de classe.
  - Chaves na mesma linha em `if`, `for`, `try/catch`, funções utilitárias e objetos literais.
  - Imports, chamadas e assinaturas em linha única sempre que legíveis.
  - Proibido o uso de `any`.
- **Escopo estrito:** esta feature cobre apenas o componente de prévia animada na homepage e o link `<a routerLink="/curriculo">`. Não criar a rota/página `/curriculo` nem modificar componentes não relacionados.

---

## 6. Estratégia de Testes e Validação

### 6.1. Testes Unitários (Vitest)

1. **`apps/web/src/app/components/resume/resume.spec.ts`:**
   - Renderiza a seção semântica `<section aria-label="Acesso ao currículo">`.
   - Exibe o cabeçalho nítido **`Miguel L. Sommerfeld`** e marca o conteúdo simulado borrado e o símbolo `?` como `aria-hidden="true"`.
   - Renderiza o link `<a href="/curriculo">` com texto exato **`Acessar currículo`**, estilo arredondado (`rounded-full`) e acabamento *liquid glass* (`backdrop-blur-xl`).
   - Aplica o modo estático (sem pista extra de scroll) quando `prefers-reduced-motion: reduce` está ativo.
   - Executa e destrói com segurança em `jsdom` (inclusive quando `window.matchMedia` não está disponível), sem lançar erros.
2. **`apps/web/src/app/pages/home/home.spec.ts`:**
   - Garante que a página `Home` renderiza `<app-resume />` após os `<app-project-showcase />` e mantém o teste do link `/curriculo` (`Acessar currículo`) passando.

### 6.2. Validação Obrigatória

Antes de finalizar a implementação, executar em `apps/web`:

```bash
npm run build
npm test
```

---

## 7. Critérios de Aceite

- [ ] A implementação segue integralmente [`AGENTS.md`](../../../AGENTS.md) e [`.agent/rules/web.md`](../../rules/web.md) (standalone, signals, Tailwind v4, `JetBrains Mono`, estilo de chaves Allman em classes/métodos, sem `any`, sem novas dependências).
- [ ] O componente `Resume` (`app-resume`) está criado em `apps/web/src/app/components/resume/` e substitui a antiga seção final estática em `apps/web/src/app/pages/home/home.html`.
- [ ] Após rolar além do último `<app-project-showcase />`, uma folha vertical (proporção A4) em estilo papel branco surge pela base da viewport inclinada em perspectiva 3D e sobe até ficar reta e centralizada abaixo da navbar fixa, sincronizada livremente ao scroll (`ScrollTrigger` com `scrub`), completando 100% da animação ao atingir o fim da página.
- [ ] A folha exibe **`Miguel L. Sommerfeld`** nítido no topo, estrutura realista de currículo borrada e esmaecida no corpo (`aria-hidden="true"`), um **`?`** central proeminente com sombra suave e o botão **`Acessar currículo`** em **liquid glass escuro** na base.
- [ ] O botão **`Acessar currículo`** aponta para `/curriculo` via `routerLink`, ganha destaque suave ao final da subida da folha (animado no wrapper para não conflitar com `hover:scale-105`) e mantém alto contraste, foco visível e acessibilidade por teclado.
- [ ] Sob `prefers-reduced-motion: reduce`, a pista extra de scroll e a animação 3D são desativadas, exibindo a folha já reta e o botão totalmente visível.
- [ ] Os testes unitários em `resume.spec.ts` e `home.spec.ts` passam e os comandos `npm run build` e `npm test` em `apps/web` executam sem erros.
