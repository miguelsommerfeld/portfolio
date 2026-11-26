import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProjectShowcase } from './project-showcase';
import { type ProjectShowcaseItem } from './project-showcase.models';

const MOCK_PROJECT: ProjectShowcaseItem = {
  id: 'alpha-system',
  category: 'Fullstack',
  title: 'Alpha System',
  objective: 'Construir uma plataforma modular com baixa latência.',
  deliverables: ['API REST tipada', 'Interface reativa com Signals'],
  stacks: ['Angular 22', 'Fastify v5', 'TypeScript'],
  repoUrl: 'https://github.com/miguelsommerfeld/alpha',
  liveUrl: 'https://alpha.example.com',
  slides: [
    {
      id: 'slide-1',
      title: 'Painel Inicial',
      caption: 'Resumo das métricas principais do sistema.',
      imageUrl: '/projects/alpha/slide-1.webp',
      imageAlt: 'Tela inicial do Alpha System',
    },
    {
      id: 'slide-2',
      title: 'Detalhamento Operacional',
      caption: 'Visualização granular de eventos em tempo real.',
      imageAlt: 'Detalhamento operacional sem imagem definida',
      accentGradient: 'radial-gradient(circle, rgba(56, 189, 248, 0.35), rgba(10, 10, 10, 0.95))',
    },
    {
      id: 'slide-3',
      title: 'Configurações de Segurança',
      caption: 'Gestão de permissões e auditoria de sessão.',
      imageAlt: 'Configurações de segurança do Alpha System',
    },
  ],
};

describe('ProjectShowcase', () => {
  let doc: Document;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectShowcase],
      providers: [provideRouter([])],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    originalMatchMedia = doc.defaultView?.matchMedia;
  });

  afterEach(() => {
    const win = doc.defaultView;
    if (win) {
      Object.defineProperty(win, 'matchMedia', { value: originalMatchMedia, configurable: true, writable: true });
    }
    vi.restoreAllMocks();
  });

  it('should render project metadata, deliverables, stacks, links and numbered slides', async () => {
    const fixture = TestBed.createComponent(ProjectShowcase);
    fixture.componentRef.setInput('project', MOCK_PROJECT);
    fixture.componentRef.setInput('projectIndex', 0);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(text).toContain('01 / Fullstack');
    expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Alpha System');
    expect(text).toContain('Construir uma plataforma modular com baixa latência.');
    expect(text).toContain('API REST tipada');
    expect(text).toContain('Interface reativa com Signals');
    expect(text).toContain('Angular 22');
    expect(text).toContain('Fastify v5');
    expect(compiled.querySelectorAll('ol li button').length).toBe(3);

    const repoLink = compiled.querySelector<HTMLAnchorElement>('a[href="https://github.com/miguelsommerfeld/alpha"]');
    expect(repoLink?.getAttribute('target')).toBe('_blank');
    expect(repoLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should render the initial slide image with overlay text and switch to styled fallback when selecting a slide without imageUrl', async () => {
    const fixture = TestBed.createComponent(ProjectShowcase);
    fixture.componentRef.setInput('project', MOCK_PROJECT);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const frame = compiled.querySelector<HTMLElement>('[data-testid="slide-frame"]');
    const counter = compiled.querySelector<HTMLElement>('[data-testid="slide-counter"]');

    expect(frame?.className).toContain('rounded-2xl');
    expect(counter?.textContent?.trim()).toBe('01 / 03');

    const initialImage = frame?.querySelector<HTMLImageElement>('img');
    expect(initialImage?.getAttribute('src')).toBe('/projects/alpha/slide-1.webp');
    expect(initialImage?.getAttribute('alt')).toBe('Tela inicial do Alpha System');
    expect(initialImage?.className).toContain('opacity-80');
    expect(initialImage?.className).toContain('object-cover');
    expect(frame?.textContent).toContain('Painel Inicial');
    expect(frame?.textContent).toContain('Resumo das métricas principais do sistema.');

    const slideButtons = compiled.querySelectorAll<HTMLButtonElement>('ol li button');
    slideButtons[1].click();
    await fixture.whenStable();

    expect(counter?.textContent?.trim()).toBe('02 / 03');
    expect(slideButtons[1].getAttribute('aria-current')).toBe('step');
    expect(frame?.querySelector('img')).toBeNull();
    expect(frame?.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Detalhamento operacional sem imagem definida');
    expect(frame?.textContent).toContain('Detalhamento Operacional');
  });

  it('should render styled fallback when an image fails to load', async () => {
    const fixture = TestBed.createComponent(ProjectShowcase);
    fixture.componentRef.setInput('project', MOCK_PROJECT);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const frame = compiled.querySelector<HTMLElement>('[data-testid="slide-frame"]');
    const img = frame?.querySelector<HTMLImageElement>('img');

    expect(img).toBeTruthy();
    img!.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(frame?.querySelector('img')).toBeNull();
    expect(frame?.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Tela inicial do Alpha System');
  });

  it('should safely handle jsdom without window.matchMedia and clean up on destroy', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: undefined, configurable: true, writable: true });

    const fixture = TestBed.createComponent(ProjectShowcase);
    fixture.componentRef.setInput('project', MOCK_PROJECT);
    await fixture.whenStable();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
