export interface ProjectSlide {
  id: string;
  title: string;
  caption: string;
  imageUrl?: string;
  imageAlt: string;
  accentGradient?: string;
}

export interface ProjectShowcaseItem {
  id: string;
  category: string;
  title: string;
  objective: string;
  deliverables: string[];
  stacks: string[];
  slides: ProjectSlide[];
  repoUrl?: string;
  liveUrl?: string;
}
