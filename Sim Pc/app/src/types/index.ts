export interface PCComponent {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  fullDescription: string;
  specs: ComponentSpec[];
  compatibility: string[];
  image: string;
  installStep: number;
  installOrder: number;
  color: string;
  dimensions: string;
}

export interface ComponentSpec {
  label: string;
  value: string;
}

export interface BuildStep {
  step: number;
  componentId: string;
  title: string;
  instruction: string;
  warning?: string;
  completed: boolean;
}

export interface AssemblyState {
  currentStep: number;
  completedSteps: string[];
  installedComponents: string[];
  isComplete: boolean;
}

export type AppMode = 'explore' | 'learn' | 'assemble';

export interface ParticleSystem {
  particles: unknown;
  update: () => void;
}
