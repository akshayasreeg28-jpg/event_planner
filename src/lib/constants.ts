import { EventType } from '../types';

export const HERO_IMAGES = {
  wedding: '/src/assets/images/hero_wedding_reception_1792501089802.jpg',
  collegeFest: '/src/assets/images/hero_college_fest_1792501091446.jpg',
  birthday: '/src/assets/images/hero_birthday_celebration_1792501091471.jpg',
  moodboard: '/src/assets/images/decor_moodboard_palette_1792501091939.jpg',
};

export const EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
  description: string;
  iconName: string;
}[] = [
  {
    value: 'wedding',
    label: 'Wedding & Reception',
    description: 'Multi-day celebrations, rituals, sangeet, and luxury banquets',
    iconName: 'HeartHandshake',
  },
  {
    value: 'college_fest',
    label: 'College Fest / Symposium',
    description: 'Sponsorships, permissions, stage/AV, student registrations & competitions',
    iconName: 'GraduationCap',
  },
  {
    value: 'birthday',
    label: 'Birthday Celebration',
    description: 'Themes, handcrafted decor, kids entertainment, cake and party favors',
    iconName: 'Cake',
  },
  {
    value: 'anniversary',
    label: 'Anniversary Party',
    description: 'Intimate gatherings, photo nostalgia, curated dining & toasts',
    iconName: 'Wine',
  },
  {
    value: 'corporate',
    label: 'Corporate Gathering / Conference',
    description: 'Keynotes, keynote AV, lunch catering, badges and networking',
    iconName: 'Briefcase',
  },
  {
    value: 'festival',
    label: 'Festival / Cultural Night',
    description: 'Community festivities, food stalls, traditional artists & crowd logistics',
    iconName: 'Sparkles',
  },
  {
    value: 'community',
    label: 'Community / Charity Gala',
    description: 'Fundraisers, volunteer management, community halls & silent auctions',
    iconName: 'Users',
  },
];

export const DEFAULT_BUDGET_CATEGORIES: Record<EventType, { category: string; defaultPercent: number }[]> = {
  wedding: [
    { category: 'Venue & Lodging', defaultPercent: 30 },
    { category: 'Catering & Dining', defaultPercent: 25 },
    { category: 'Decor & Florals', defaultPercent: 15 },
    { category: 'Attire & Makeup', defaultPercent: 10 },
    { category: 'Photography & Film', defaultPercent: 8 },
    { category: 'Music & Entertainment', defaultPercent: 7 },
    { category: 'Invitations & Favors', defaultPercent: 3 },
    { category: 'Contingency Fund', defaultPercent: 2 },
  ],
  college_fest: [
    { category: 'Stage & Pro-Audio/AV', defaultPercent: 35 },
    { category: 'Celebrity/Artist Honorarium', defaultPercent: 25 },
    { category: 'Marketing & Merchandise', defaultPercent: 12 },
    { category: 'Food & Refreshments', defaultPercent: 10 },
    { category: 'Prizes & Mementos', defaultPercent: 8 },
    { category: 'Security & Campus Logistics', defaultPercent: 6 },
    { category: 'Permissions & Licenses', defaultPercent: 4 },
  ],
  birthday: [
    { category: 'Venue / Rental', defaultPercent: 25 },
    { category: 'Food & Cake', defaultPercent: 35 },
    { category: 'Theme Decor & Balloons', defaultPercent: 18 },
    { category: 'Entertainment & Games', defaultPercent: 12 },
    { category: 'Return Gifts & Favors', defaultPercent: 10 },
  ],
  anniversary: [
    { category: 'Fine Dining & Bar', defaultPercent: 40 },
    { category: 'Venue & Lighting', defaultPercent: 25 },
    { category: 'Live Music & Acoustics', defaultPercent: 15 },
    { category: 'Photography & Mementos', defaultPercent: 12 },
    { category: 'Floral & Table Decor', defaultPercent: 8 },
  ],
  corporate: [
    { category: 'Venue & Conference Hall', defaultPercent: 35 },
    { category: 'AV & Technical Rigging', defaultPercent: 25 },
    { category: 'Executive Catering', defaultPercent: 20 },
    { category: 'Badges, Kits & Swag', defaultPercent: 10 },
    { category: 'Keynote Speaker Honorarium', defaultPercent: 10 },
  ],
  festival: [
    { category: 'Sound, Stage & Lighting', defaultPercent: 30 },
    { category: 'Performers & Cultural Acts', defaultPercent: 25 },
    { category: 'Food Stalls & Hospitality', defaultPercent: 20 },
    { category: 'Permissions & Emergency Services', defaultPercent: 15 },
    { category: 'Branding & Signage', defaultPercent: 10 },
  ],
  community: [
    { category: 'Community Hall Hire', defaultPercent: 30 },
    { category: 'Refreshments & Snacks', defaultPercent: 30 },
    { category: 'Audio System & Seating', defaultPercent: 20 },
    { category: 'Brochures & Awareness Kits', defaultPercent: 10 },
    { category: 'Emergency & First Aid', defaultPercent: 10 },
  ],
};

export const EVENT_TEMPLATES = [
  {
    id: 'tpl_south_indian_wedding',
    name: 'Intimate South Indian Wedding',
    type: 'wedding' as EventType,
    city: 'Chennai',
    durationHours: 12,
    guestCount: 280,
    budgetMinor: 85000000, // ₹8.5 Lakh
    theme: 'Traditional Temple Heritage with Jasmine, Marigold & Antique Brass',
    dietary: ['Vegetarian', 'Traditional South Indian Feast on Banana Leaf', 'Filter Coffee'],
    coverImage: HERO_IMAGES.wedding,
    description: 'Muhurtham, traditional nadaswaram, grand banana leaf feast, and warm evening reception.',
  },
  {
    id: 'tpl_college_tech_fest',
    name: 'IGNITE 2026 — College Tech Fest',
    type: 'college_fest' as EventType,
    city: 'Bengaluru',
    durationHours: 16,
    guestCount: 1200,
    budgetMinor: 45000000, // ₹4.5 Lakh
    theme: 'Futuristic Cyberpunk & Neon Glow with Pro Audio Amphitheater',
    dietary: ['Campus Food Trucks', 'Snack Boxes', 'Vegan Options'],
    coverImage: HERO_IMAGES.collegeFest,
    description: 'Hackathon, robowars, stage concerts, sponsor exhibits, and inter-college cultural competitions.',
  },
  {
    id: 'tpl_kids_safari_birthday',
    name: "Ananya's 1st Safari Adventure",
    type: 'birthday' as EventType,
    city: 'Mumbai',
    durationHours: 4,
    guestCount: 65,
    budgetMinor: 9500000, // ₹95,000
    theme: 'Handcrafted Boho Jungle Safari (Sage Green, Peach & Warm Gold)',
    dietary: ['Kids Finger Food', 'Artisanal Dessert Bar', 'Jain Options Available'],
    coverImage: HERO_IMAGES.birthday,
    description: 'Wooden picnic tables, soft play area, puppet show, photo booth, and bespoke wildlife favors.',
  },
];
