import { EventType } from '../types';

export interface EventThemeConfig {
  id: EventType;
  name: string;
  tagline: string;
  primary: string; // main brand / primary button / prominent header
  primaryLight: string;
  secondary: string; // accent / badges / highlights
  accent: string;
  bgLight: string;
  surfaceLight: string;
  surfaceSubtleLight: string;
  textLight: string;
  mutedLight: string;
  borderLight: string;
  gradient: string;
  badgeVariant: 'purple' | 'coral' | 'neutral' | 'success' | 'warning';
  cardRing: string;
}

export const EVENT_THEMES: Record<EventType, EventThemeConfig> = {
  wedding: {
    id: 'wedding',
    name: 'Temple Heritage & Royal Gold',
    tagline: 'Deep Maroon, Luminous Gold & Ivory Silk',
    primary: '#721C24',
    primaryLight: '#8B1E2D',
    secondary: '#D4AF37',
    accent: '#C0392B',
    bgLight: '#FDFBF7',
    surfaceLight: '#FFFFFF',
    surfaceSubtleLight: '#FAF3EB',
    textLight: '#2C1810',
    mutedLight: '#6B5E57',
    borderLight: 'rgba(114, 28, 36, 0.18)',
    gradient: 'from-[#721C24] via-[#8B1E2D] to-[#D4AF37]',
    badgeVariant: 'coral',
    cardRing: 'ring-[#721C24]/20',
  },
  college_fest: {
    id: 'college_fest',
    name: 'Cyber Horizon & Pulse',
    tagline: 'Electric Violet, Cyan Laser & Deep Void',
    primary: '#6C5CE7',
    primaryLight: '#8274ED',
    secondary: '#00CEC9',
    accent: '#FD79A8',
    bgLight: '#0F0E17',
    surfaceLight: '#1A1926',
    surfaceSubtleLight: '#222133',
    textLight: '#FFFFFE',
    mutedLight: '#A7A9BE',
    borderLight: 'rgba(108, 92, 231, 0.3)',
    gradient: 'from-[#6C5CE7] via-[#00CEC9] to-[#FD79A8]',
    badgeVariant: 'purple',
    cardRing: 'ring-[#6C5CE7]/30',
  },
  birthday: {
    id: 'birthday',
    name: 'Festive Pastel Confetti',
    tagline: 'Playful Coral, Sunlight Ochre & Mint Green',
    primary: '#E84393',
    primaryLight: '#FD79A8',
    secondary: '#FDCB6E',
    accent: '#00B894',
    bgLight: '#FFFBFB',
    surfaceLight: '#FFFFFF',
    surfaceSubtleLight: '#FFF0F3',
    textLight: '#2D3436',
    mutedLight: '#636E72',
    borderLight: 'rgba(232, 67, 147, 0.2)',
    gradient: 'from-[#E84393] via-[#FF7675] to-[#FDCB6E]',
    badgeVariant: 'coral',
    cardRing: 'ring-[#E84393]/20',
  },
  corporate: {
    id: 'corporate',
    name: 'Executive Platinum & Azure',
    tagline: 'Clean Navy, Steel Teal & Precision White',
    primary: '#1E272E',
    primaryLight: '#2C3E50',
    secondary: '#0FB9B1',
    accent: '#4BCFFA',
    bgLight: '#F8F9FA',
    surfaceLight: '#FFFFFF',
    surfaceSubtleLight: '#EEF2F5',
    textLight: '#1E272E',
    mutedLight: '#57606F',
    borderLight: 'rgba(30, 39, 46, 0.18)',
    gradient: 'from-[#1E272E] via-[#2C3E50] to-[#0FB9B1]',
    badgeVariant: 'neutral',
    cardRing: 'ring-[#0FB9B1]/20',
  },
  anniversary: {
    id: 'anniversary',
    name: 'Vintage Velvet & Champagne',
    tagline: 'Royal Wine, Ruby & Warm Amber',
    primary: '#4A235A',
    primaryLight: '#6C3483',
    secondary: '#F39C12',
    accent: '#C0392B',
    bgLight: '#FDFBFA',
    surfaceLight: '#FFFFFF',
    surfaceSubtleLight: '#F9F1F0',
    textLight: '#261C14',
    mutedLight: '#5F5B66',
    borderLight: 'rgba(74, 35, 90, 0.18)',
    gradient: 'from-[#4A235A] via-[#6C3483] to-[#F39C12]',
    badgeVariant: 'purple',
    cardRing: 'ring-[#4A235A]/20',
  },
  festival: {
    id: 'festival',
    name: 'Utsav Saffron & Lanterns',
    tagline: 'Saffron Flame, Golden Marigold & Night Amethyst',
    primary: '#D35400',
    primaryLight: '#E67E22',
    secondary: '#F39C12',
    accent: '#8E44AD',
    bgLight: '#FFFDF9',
    surfaceLight: '#FFFFFF',
    surfaceSubtleLight: '#FFF6EC',
    textLight: '#211B14',
    mutedLight: '#64584C',
    borderLight: 'rgba(211, 84, 0, 0.2)',
    gradient: 'from-[#D35400] via-[#E67E22] to-[#F39C12]',
    badgeVariant: 'warning',
    cardRing: 'ring-[#D35400]/25',
  },
  community: {
    id: 'community',
    name: 'Emerald Grove & Solidarity',
    tagline: 'Forest Emerald, Mint Glow & Warm Slate',
    primary: '#218C74',
    primaryLight: '#33D9B2',
    secondary: '#33D9B2',
    accent: '#706FD3',
    bgLight: '#F7FAF8',
    surfaceLight: '#FFFFFF',
    surfaceSubtleLight: '#EBF5F0',
    textLight: '#1C2826',
    mutedLight: '#576574',
    borderLight: 'rgba(33, 140, 116, 0.2)',
    gradient: 'from-[#218C74] via-[#33D9B2] to-[#706FD3]',
    badgeVariant: 'success',
    cardRing: 'ring-[#218C74]/20',
  },
};

export function getEventTheme(type?: EventType | string): EventThemeConfig {
  if (type && type in EVENT_THEMES) {
    return EVENT_THEMES[type as EventType];
  }
  return EVENT_THEMES.wedding;
}

export function getEventThemeStyle(type?: EventType | string): React.CSSProperties {
  const theme = getEventTheme(type);
  return {
    ['--event-primary' as any]: theme.primary,
    ['--event-primary-light' as any]: theme.primaryLight,
    ['--event-secondary' as any]: theme.secondary,
    ['--event-accent' as any]: theme.accent,
    ['--event-surface' as any]: theme.surfaceLight,
    ['--event-surface-subtle' as any]: theme.surfaceSubtleLight,
    ['--event-text' as any]: theme.textLight,
    ['--event-muted' as any]: theme.mutedLight,
    ['--event-border' as any]: theme.borderLight,
  };
}
