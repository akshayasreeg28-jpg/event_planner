export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'college_fest'
  | 'corporate'
  | 'festival'
  | 'community';

export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'in_progress' | 'completed';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  id: string;
  email: string;
  name: string;
  role: CollaboratorRole;
  avatar?: string;
  addedAt: string;
}

export interface PlanVersion {
  version: number;
  timestamp: string;
  content: string;
  summary?: string;
}

export interface PlanSection {
  id: string;
  sectionKey:
    | 'overview'
    | 'theme'
    | 'venue_requirements'
    | 'decor_concept'
    | 'catering_plan'
    | 'entertainment'
    | 'guest_experience'
    | 'preparation_schedule'
    | 'risks_contingencies';
  title: string;
  content: string;
  lastUpdated: string;
  versions: PlanVersion[];
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  vendorName?: string;
  estimatedAmountMinor: number; // in integer minor units (paise/cents)
  actualAmountMinor: number; // in integer minor units
  paidAmountMinor: number; // in integer minor units
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  dueDate?: string;
  receiptNote?: string;
}

export interface BudgetCategoryAllocation {
  category: string;
  targetPercentage: number;
}

export interface CostSavingSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedSavingMinor: number;
  tradeOff: string;
  applied?: boolean;
}

export type TimelinePhase =
  | 'Initial Planning'
  | 'Booking & Vendors'
  | 'Purchasing & Decor'
  | 'Final Confirmations'
  | 'Event Day';

export interface TimelineTask {
  id: string;
  title: string;
  deadline: string; // ISO date YYYY-MM-DD
  phase: TimelinePhase;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[]; // task IDs
  assignee?: string;
  notes?: string;
  isOverdue?: boolean;
}

export interface VendorQuote {
  id: string;
  vendorName: string;
  contactPerson: string;
  phone: string;
  email: string;
  quotedAmountMinor: number;
  packageDetails: string;
  rating?: number;
  isShortlisted?: boolean;
  notes?: string;
}

export interface Vendor {
  id: string;
  category: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  estimatedCostMinor: number; // clearly labeled AI estimate
  bookingStatus: 'not_contacted' | 'contacted' | 'quote_received' | 'booked' | 'rejected';
  requirements: string[];
  questionsToAsk: string[];
  quotes: VendorQuote[];
  linkedTasks: string[];
  notes?: string;
  isSustainable?: boolean;
  sustainabilityPractices?: string[];
  ecoCertifications?: string[];
}

export type RibbonTier = 'none' | 'bronze' | 'silver' | 'gold' | 'emerald';

export type BadgeCategory = 'sustainability' | 'budget' | 'efficiency' | 'planning';

export interface GamificationBadge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 - 100
  progressLabel: string;
  xpReward: number;
  tierLevel: 1 | 2 | 3; // 1 = Bronze, 2 = Silver, 3 = Gold
  criteriaDetails: string;
}

export interface EcoChampionRibbon {
  tier: RibbonTier;
  title: string;
  subtitle: string;
  color: string;
  gradient: string;
  unlocked: boolean;
  criteriaMet: string[];
  nextTierCriteria?: string;
}

export interface GamificationState {
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelXp: number;
  progressToNextLevel: number;
  ecoRibbon: EcoChampionRibbon;
  badges: GamificationBadge[];
  stats: {
    totalVendors: number;
    sustainableVendors: number;
    sustainabilityRatio: number;
    ecoScore: number;
    budgetStatus: 'surplus' | 'exact' | 'deficit';
    budgetVarianceMinor: number;
    savingsAppliedCount: number;
    totalSavingsMinor: number;
    completedTasksCount: number;
    totalTasksCount: number;
  };
  actionableTips: string[];
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  groupSide: 'bride' | 'groom' | 'general' | 'vip' | 'organizer' | 'student' | 'faculty';
  plusOnes: number;
  dietaryNeeds: 'standard' | 'vegetarian' | 'vegan' | 'jain' | 'halal' | 'gluten_free' | 'allergies';
  dietaryNotes?: string;
  allergies?: string[];
  accessibilityNeeds?: string;
  tableAssignment?: string;
  invitationStatus: 'unsent' | 'sent' | 'delivered';
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  rsvpToken: string;
  submittedAt?: string;
}

export type TableShape = 'round' | 'rectangular' | 'head_table';

export interface TableSeating {
  id: string;
  name: string;
  capacity: number;
  assignedGuestIds: string[];
  locationNote?: string;
  shape?: TableShape;
  x?: number; // 0 - 100 percentage inside floorplan canvas
  y?: number; // 0 - 100 percentage inside floorplan canvas
  color?: string;
}

export interface ThemeIdea {
  id: string;
  name: string;
  description: string;
  style: 'traditional' | 'royal' | 'modern' | 'minimalist' | 'rustic' | 'boho';
  colorPalette: {
    name: string;
    hex: string;
  }[];
  decorZones: {
    zone: 'entrance' | 'stage' | 'tables' | 'photobooth' | 'lighting';
    concept: string;
    materials: string;
  }[];
  flowersAndProps: string[];
  costTiers: {
    tier: 'DIY' | 'Rent' | 'Buy / Custom';
    estimatedCostMinor: number;
    description: string;
  }[];
  pinnedImage?: string;
}

export interface MenuItem {
  id: string;
  course: 'welcome_drinks' | 'starters' | 'mains' | 'desserts' | 'late_night';
  name: string;
  description: string;
  isVegetarian: boolean;
  isJainFriendly?: boolean;
  isVegan?: boolean;
  isHalal?: boolean;
  isGlutenFree?: boolean;
  allergens?: string[];
  perHeadPortionGramsOrUnits: number;
  unit: string;
}

export interface VenueRecommendation {
  id: string;
  name: string;
  type: string;
  address: string;
  capacity: number;
  indoorOutdoor: 'indoor' | 'outdoor' | 'hybrid';
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  distanceKm: number;
  features: string[];
  fitExplanation: string;
  requirementsChecklist: {
    parking: boolean;
    powerBackup: boolean;
    permissionsRequired: string[];
    accessibility: boolean;
    noiseCurfewHour: string;
  };
  shortlisted?: boolean;
  lat?: number;
  lng?: number;
}

export interface RunOfShowItem {
  id: string;
  time: string; // HH:MM
  durationMinutes: number;
  title: string;
  owner: string;
  vendorContact?: {
    vendorName: string;
    phone: string;
  };
  notes: string;
  completed: boolean;
  isEmergencyBackup?: boolean;
}

export interface IssueLogItem {
  id: string;
  timestamp: string;
  reportedBy: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  resolutionNotes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  actions?: {
    type: 'add_tasks' | 'apply_budget_saving' | 'save_idea';
    label: string;
    payload: any;
  }[];
}

export interface EventDetails {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  city: string;
  venueName?: string;
  venueType: 'indoor' | 'outdoor' | 'hybrid';
  estimatedGuestCount: number;
  totalBudgetMinor: number; // in integer minor units (e.g. 50000000 = ₹5,00,000.00)
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  themePreference?: string;
  dietaryPreferences: string[];
  culturalTraditions?: string;
  specialRequests?: string;
  ownerId: string;
  collaborators: Collaborator[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  ecoScore: {
    score: number; // 0 - 100
    rating: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    tips: string[];
  };
}

export interface EventFull {
  details: EventDetails;
  planSections: PlanSection[];
  budgetItems: BudgetItem[];
  budgetAllocations: BudgetCategoryAllocation[];
  savingsSuggestions: CostSavingSuggestion[];
  tasks: TimelineTask[];
  vendors: Vendor[];
  guests: Guest[];
  seatingTables: TableSeating[];
  themes: ThemeIdea[];
  menu: MenuItem[];
  venues: VenueRecommendation[];
  runOfShow: RunOfShowItem[];
  issues: IssueLogItem[];
  chatHistory: ChatMessage[];
}
