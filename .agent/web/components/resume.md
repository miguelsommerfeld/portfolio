# Especificação do Componente: Resume (Prévia Animada de Currículo na Homepage)

Este documento descreve os requisitos visuais, estruturais, comportamentais e técnicos do componente **Resume** (`app-resume`), responsável pelo fechamento da **Homepage** (`apps/web`) com uma revelação 3D sincronizada ao scroll e acesso integrado ao currículo.

> **Obrigatório:** Qualquer alteração neste componente **DEVE** seguir [`AGENTS.md`](../../../AGENTS.md), [`.agent/rules/web.md`](../../rules/web.md), [`home.md`](../home.md) e [`auth.card.md`](./auth.card.md).

---

## 1. Visão Geral e Contexto na Homepage

Renderizado como `<app-resume />` logo após o último `<app-project-showcase />` em `apps/web/src/app/pages/home/home.html`:

1. **Gatilho natural pós-projetos:** ao liberar o *scroll pinning* do último projeto, uma **folha vertical A4 em papel branco** emerge pela base da viewport inclinada em perspectiva 3D.
2. **Subida e planificação sincronizadas ao scroll (`scrub: 0.6`):** conforme o usuário rola até o fim da página, a folha sobe, desfaz a inclinação 3D (`rotateX → 0deg`), atinge escala `1` e se estabiliza centralizada abaixo da navbar fixa (`56px`).
3. **Mistério e CTA integrado:** exibe o cabeçalho nítido **`Miguel L. Sommerfeld`**, corpo de currículo simulado borrado (`aria-hidden="true"`), um grande símbolo **`?`** com paralaxe interna e o botão **`Acessar currículo`** em estilo escuro na base da folha.
4. **Ação do CTA:** ao clicar em **`Acessar currículo`**, dispara `ResumeService.requestResumeAccess()` (validando a sessão em `GET /auth/me` com `withCredentials: true`), abrindo `ResumeCard` se autenticado ou `AuthCard` com intenção pós-login se retornar `401`.

---

## 2. Anatomia Visual da Folha de Currículo

- **Ambiente:** fundo `bg-neutral-950` contínuo com halo radial sutil (`#glowRef`, `pointer-events-none aria-hidden="true"`).
- **Proporção e superfície:** `aspect-[210/297]`, dimensionamento responsivo `h-[min(70svh,520px)] sm:h-[min(76svh,640px)] max-w-[88vw]`, gradiente de papel `bg-linear-to-b from-white via-neutral-50 to-neutral-100`, `rounded-2xl sm:rounded-[1.25rem]` e sombra profunda.
- **Camadas internas:**
  1. **Cabeçalho nítido:** `<h2>Miguel L. Sommerfeld</h2>` com borda inferior sutil.
  2. **Corpo simulado borrado (`aria-hidden="true"`):** blocos **RESUMO**, **EXPERIÊNCIA**, **FORMAÇÃO** e **STACK TÉCNICA** com `blur-[2.5px] sm:blur-[3px] opacity-65`, máscara radial clara ao centro e gradiente inferior branco.
  3. **Símbolo `?` (`aria-hidden="true"`):** SVG vetorial inline centralizado com sombra projetada suave e paralaxe própria.
  4. **Botão CTA (`#ctaWrapRef`):** `<button type="button">` com texto **`Acessar currículo`**, `[disabled]="isCheckingAccess()"`, estilo pill escuro com brilho especular interno e `hover:scale-105`. A animação GSAP atua no wrapper `#ctaWrapRef` para não conflitar com o `transform` do hover no botão.

---

## 3. Animação 3D no Scroll e Acessibilidade

- **Palco `sticky`:** wrapper externo com `overflow-x-clip` (sem `overflow-hidden`) e altura `min-h-[155vh] lg:min-h-[175vh]` (reduzida para `min-h-screen` sob `prefers-reduced-motion: reduce`), contendo palco interno `sticky top-0 h-svh [perspective:1200px]`.
- **Timeline GSAP (`afterNextRender` + `gsap.context` + `gsap.matchMedia`):**
  - Trigger na seção: `start: 'top 85%'`, `end: 'bottom bottom'`, `scrub: 0.6`, `invalidateOnRefresh: true`.
  - Desktop (`min-width: 1024px`): `yPercent: 48 → 0`, `rotateX: 26 → 0`; Mobile (`max-width: 1023px`): `yPercent: 34 → 0`, `rotateX: 20 → 0`.
  - Anima folha (`0 → 0.72`), halo (`0 → 0.72`), `?` (`0.15 → 0.75`) e `#ctaWrapRef` (`0.62 → 0.92`).
- **Foco por teclado (`onCtaFocus`):** quando o botão recebe foco visível (`:focus-visible`) antes do fim da rolagem, rola suavemente até enquadrar o final da seção — sem interferir em cliques de mouse.
- **Segurança em `jsdom` e limpeza:** valida `typeof win.matchMedia === 'function'` e `smoothScroll.registerScrollTrigger()`, revertendo o `gsap.Context` em `DestroyRef.onDestroy()`.

---

## 4. Organização de Arquivos e Validação

- `apps/web/src/app/components/resume/resume.ts`
- `apps/web/src/app/components/resume/resume.html`
- `apps/web/src/app/components/resume/resume.spec.ts`

```bash
# Em apps/web:
npm run build
npm test
```
