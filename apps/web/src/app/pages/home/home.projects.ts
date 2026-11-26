import { type ProjectShowcaseItem } from '@components/project-showcase/project-showcase.models';

/**
 * Projetos exibidos na vitrine da Homepage.
 * Para exibir capturas reais, adicione os arquivos em `apps/web/public/projects/<id>/`
 * e informe `imageUrl: '/projects/<id>/<arquivo>.webp'` em cada slide.
 */
export const HOME_PROJECTS: readonly ProjectShowcaseItem[] = [
  {
    id: 'portfolio-platform',
    category: 'Fullstack',
    title: 'Portfolio',
    objective: 'Arquitetura fullstack stateless em monorepo combinando autenticação OAuth2 segura por cookies HttpOnly e interface interativa em dark mode.',
    deliverables: [
      'API Fastify v5 tipada de ponta a ponta com Zod v4 e JWT stateless',
      'Autenticação OAuth2 desacoplada para provedores Google e GitHub',
      'Experiência fluida em Angular 22 com Lenis, GSAP ScrollTrigger e View Transitions',
    ],
    stacks: ['Angular 22', 'Tailwind v4', 'Fastify v5', 'TypeScript', 'Zod v4', 'Docker'],
    repoUrl: 'https://github.com/miguelsommerfeld/portfolio',
    slides: [
      {
        id: 'portfolio-architecture',
        title: 'Monorepo & Arquitetura Stateless',
        caption: 'Separação limpa entre apps/api, apps/web e schemas compartilhados sem dependência de banco de dados.',
        imageAlt: 'Visão geral da arquitetura em monorepo do Portfolio',
        accentGradient: 'radial-gradient(circle at 22% 24%, rgba(56, 189, 248, 0.42), rgba(15, 23, 42, 0.85) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'portfolio-oauth',
        title: 'Fluxo OAuth2 & Cookies HttpOnly',
        caption: 'Login federado com emissão de sessão assinada em cookie HttpOnly e validação automática no carregamento.',
        imageAlt: 'Fluxo de autenticação OAuth2 e proteção de sessão com cookies HttpOnly',
        accentGradient: 'radial-gradient(circle at 78% 28%, rgba(129, 140, 248, 0.42), rgba(24, 24, 38, 0.86) 56%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'portfolio-interface',
        title: 'Interface Liquid Glass & Scroll Pinning',
        caption: 'Superfícies translúcidas em dark mode sincronizadas com rolagem suave e transições nativas entre rotas.',
        imageAlt: 'Interface em dark mode com acabamento liquid glass e vitrine sincronizada ao scroll',
        accentGradient: 'radial-gradient(circle at 50% 72%, rgba(45, 212, 191, 0.36), rgba(17, 24, 28, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'portfolio-deploy',
        title: 'Build Multi-Stage & Orquestração',
        caption: 'Containers otimizados via Docker Compose com validação automatizada em TypeScript e suíte Vitest.',
        imageAlt: 'Pipeline de build e containers Docker do Portfolio',
        accentGradient: 'radial-gradient(circle at 30% 65%, rgba(251, 146, 60, 0.34), rgba(28, 20, 18, 0.88) 56%, rgba(10, 10, 10, 0.96) 100%)',
      },
    ],
  },
  {
    id: 'Noiseless',
    category: 'Frontend & DevOps',
    title: 'Noiseless',
    objective: 'Site oficial e informativo do Noiseless, software open-source de processamento digital de sinais em tempo real voltado ao auxílio de pessoas com misofonia.',
    deliverables: [
      'Interface responsiva em Vue 3, TypeScript e Tailwind CSS v4 com rolagem suave via Lenis',
      'Páginas institucionais, documentação e fluxo de doações integrado a gateways de pagamento',
      'SEO automatizado com sitemap/robots.txt, containerização Docker e pipeline CI no GitHub Actions',
    ],
    stacks: ['Vue 3', 'TypeScript', 'Tailwind v4', 'Vite', 'Lenis', 'Docker', 'GitHub Actions'],
    repoUrl: 'https://github.com/NoiselessOfficial/noiseless-frontend',
    slides: [
      {
        id: 'noiseless-hero',
        title: 'Landing Page & Hero com Vídeo',
        caption: 'Apresentação da proposta do software de auxílio à misofonia com navegação responsiva e rolagem suave via Lenis.',
        imageUrl: '/projects/noiseless/noiseless-1.png',
        imageAlt: 'Seção inicial do site Noiseless apresentando o software voltado à misofonia',
        accentGradient: 'radial-gradient(circle at 26% 28%, rgba(52, 211, 153, 0.4), rgba(15, 28, 24, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'noiseless-misophonia',
        title: 'Misofonia & Stack do Software',
        caption: 'Seções educativas sobre atenuação de gatilhos sonoros em tempo real e vitrine das tecnologias do projeto (Java, Spring, JavaFX e C++).',
        imageUrl: '/projects/noiseless/noiseless-2.png',
        imageAlt: 'Seção informativa sobre misofonia e tecnologias do software Noiseless',
        accentGradient: 'radial-gradient(circle at 74% 34%, rgba(129, 140, 248, 0.38), rgba(22, 22, 36, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'noiseless-donation',
        title: 'Doações (pausado)',
        caption: 'Rotas dedicadas em Vue Router (/donate) com serviço preparado para Mercado Pago, PayPal, Stripe e Pix.',
        imageUrl: '/projects/noiseless/noiseless-3.png',
        imageAlt: 'Página de doações e rotas de documentação do site Noiseless',
        accentGradient: 'radial-gradient(circle at 48% 68%, rgba(56, 189, 248, 0.36), rgba(14, 24, 34, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'noiseless-devops',
        title: 'SEO, Docker & GitHub Actions',
        caption: 'Geração automática de sitemap e robots.txt no Vite, ambiente containerizado em Node Alpine e validação contínua de build e tipagem.',
        imageUrl: '/projects/noiseless/noiseless-4.png',
        imageAlt: 'Configuração de SEO, Docker e pipeline de integração contínua do Noiseless',
        accentGradient: 'radial-gradient(circle at 52% 24%, rgba(250, 204, 21, 0.32), rgba(30, 26, 16, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
    ],
  },
  {
    id: 'cadastro-clientes',
    category: 'Fullstack & Observability',
    title: 'Cadastro de Clientes',
    objective: 'Aplicação fullstack em monorepo para cadastro e gestão de clientes PF e PJ com arquitetura multi-tenant, RBAC, contratos Zod compartilhados e observabilidade centralizada.',
    deliverables: [
      'API REST em Fastify 5, Prisma e PostgreSQL 18 com autenticação JWT em cookies HttpOnly, RBAC e documentação Swagger',
      'Interface React 19 + Vite com wizard de cadastro em 4 etapas, busca de endereço por CEP, soft delete e restauração na lixeira',
      'Testes E2E com Playwright e stack de observabilidade em Docker com logs centralizados via Grafana Alloy, Loki e Grafana',
    ],
    stacks: ['React 19', 'Fastify 5', 'PostgreSQL', 'Prisma', 'TypeScript', 'Zod', 'Playwright', 'Grafana', 'Docker'],
    repoUrl: 'https://github.com/miguelsommerfeld/cadastro-clientes',
    slides: [
      {
        id: 'cadastro-clientes-dashboard',
        title: 'Painel de Clientes PF & PJ',
        caption: 'Listagem paginada com busca por nome, e-mail ou documento, ordenação, edição rápida e ações guiadas por permissões.',
        imageUrl: '/projects/cc/clientes.png',
        imageAlt: 'Painel principal do Cadastro de Clientes exibindo a listagem de clientes pessoa física e jurídica',
        accentGradient: 'radial-gradient(circle at 24% 26%, rgba(16, 185, 129, 0.4), rgba(14, 28, 26, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'cadastro-clientes-wizard',
        title: 'Wizard de Cadastro em 4 Etapas',
        caption: 'Fluxo guiado para identificação (CPF/CNPJ), contato, endereço com busca por CEP e revisão final com validação por etapa.',
        imageUrl: '/projects/cc/cadastro.png',
        imageAlt: 'Primeira etapa do wizard de cadastro de novo cliente pessoa física ou jurídica',
        accentGradient: 'radial-gradient(circle at 72% 30%, rgba(20, 184, 166, 0.38), rgba(15, 26, 30, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'cadastro-clientes-trash',
        title: 'Lixeira, Restauração & Exclusão Segura',
        caption: 'Remoção lógica de cadastros com rota dedicada para restauração ou exclusão definitiva protegida por confirmação explícita.',
        imageUrl: '/projects/cc/lixeira.png',
        imageAlt: 'Modal de confirmação para exclusão definitiva sobre a tela de lixeira de clientes',
        accentGradient: 'radial-gradient(circle at 50% 62%, rgba(244, 63, 94, 0.34), rgba(30, 18, 24, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
      {
        id: 'cadastro-clientes-observability',
        title: 'Multi-tenant, RBAC & Observabilidade',
        caption: 'Isolamento por tenant no JWT, papéis de acesso, Swagger, testes E2E em Playwright e logs unificados no Grafana com Alloy e Loki.',
        imageUrl: '/projects/cc/administrador.png',
        imageAlt: 'Arquitetura multi-tenant com RBAC, testes Playwright e logs centralizados em Grafana Alloy e Loki',
        accentGradient: 'radial-gradient(circle at 30% 68%, rgba(249, 115, 22, 0.36), rgba(28, 20, 16, 0.88) 58%, rgba(10, 10, 10, 0.96) 100%)',
      },
    ],
  },
];
