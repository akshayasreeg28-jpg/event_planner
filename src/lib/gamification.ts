import { EventFull, GamificationBadge, GamificationState, EcoChampionRibbon, RibbonTier } from '../types';

export const SUSTAINABLE_PRACTICE_OPTIONS = [
  'Zero single-use plastics & compostable cutlery',
  'Biodegradable natural leaf / areca nut tableware',
  '100% locally sourced organic produce (<30km)',
  'Solar or battery hybrid power generation',
  'Surplus food rescue & charitable donation tie-up',
  'Locally grown seasonal flowers without floral foam',
  'Digital invitations & QR-code dynamic seating',
  'Eco-certified non-toxic dye & natural fabric decor',
  'Electric shuttle or mass-transit proximity',
];

export function calculateGamification(event: EventFull): GamificationState {
  const totalVendors = event.vendors?.length || 0;
  const sustainableVendors = (event.vendors || []).filter((v) => Boolean(v.isSustainable)).length;
  const sustainabilityRatio = totalVendors > 0 ? sustainableVendors / totalVendors : 0;

  const ecoScore = event.details.ecoScore?.score || 0;

  // Budget calculations
  const totalBudgetMinor = event.details.totalBudgetMinor || 0;
  const totalActualMinor = (event.budgetItems || []).reduce((acc, i) => acc + i.actualAmountMinor, 0);
  const budgetVarianceMinor = totalBudgetMinor - totalActualMinor; // positive = surplus/under budget
  const budgetStatus: 'surplus' | 'exact' | 'deficit' =
    budgetVarianceMinor > 0 ? 'surplus' : budgetVarianceMinor === 0 ? 'exact' : 'deficit';

  const savingsApplied = (event.savingsSuggestions || []).filter((s) => s.applied);
  const savingsAppliedCount = savingsApplied.length;
  const totalSavingsMinor = savingsApplied.reduce((acc, s) => acc + s.estimatedSavingMinor, 0);

  // Quotes comparison check
  const totalQuotes = (event.vendors || []).reduce((acc, v) => acc + (v.quotes?.length || 0), 0);

  // Tasks
  const completedTasksCount = (event.tasks || []).filter((t) => t.status === 'completed').length;
  const totalTasksCount = event.tasks?.length || 0;
  const todayIso = new Date().toISOString().split('T')[0];
  const overdueTasksCount = (event.tasks || []).filter(
    (t) => t.status !== 'completed' && t.deadline < todayIso
  ).length;

  // Determine Eco-Champion Ribbon Tier
  let ribbonTier: RibbonTier = 'none';
  let ribbonTitle = 'Eco-Aspirant';
  let ribbonSubtitle = 'Tag eco-friendly vendors and optimize your score to earn an official ribbon.';
  let ribbonColor = '#71717A';
  let ribbonGradient = 'from-zinc-500 to-zinc-700';
  let criteriaMet: string[] = [];
  let nextTierCriteria: string | undefined = undefined;

  const hasHighEco = ecoScore >= 85;
  const hasDecentEco = ecoScore >= 70;
  const hasBasicEco = ecoScore >= 50;

  if (ecoScore >= 90 && (sustainableVendors >= 3 || (totalVendors > 0 && sustainabilityRatio >= 0.5))) {
    ribbonTier = 'emerald';
    ribbonTitle = 'Emerald Eco-Champion';
    ribbonSubtitle = 'Pinnacle of Environmental Excellence & Zero-Waste Stewardship';
    ribbonColor = '#059669';
    ribbonGradient = 'from-emerald-600 via-teal-500 to-green-700';
    criteriaMet = [
      `Outstanding Eco Score: ${ecoScore}/100`,
      `${sustainableVendors} Sustainable Vendors engaged (≥50% ratio)`,
      'Comprehensive circular waste & local sourcing commitments',
    ];
  } else if (ecoScore >= 75 && (sustainableVendors >= 2 || (totalVendors > 0 && sustainabilityRatio >= 0.33))) {
    ribbonTier = 'gold';
    ribbonTitle = 'Gold Eco-Champion';
    ribbonSubtitle = 'Distinguished Sustainability — Extensive Green Procurement';
    ribbonColor = '#D97706';
    ribbonGradient = 'from-amber-500 via-yellow-400 to-amber-700';
    criteriaMet = [
      `Eco Score: ${ecoScore}/100 (Threshold ≥ 75)`,
      `${sustainableVendors} Eco-Friendly Vendors committed`,
      'Active local sourcing & eco-friendly materials',
    ];
    nextTierCriteria = 'Reach Eco Score 90+ and ≥3 sustainable vendors (or 50% vendor ratio) to unlock the Emerald Ribbon.';
  } else if (ecoScore >= 60 || sustainableVendors >= 1) {
    ribbonTier = 'silver';
    ribbonTitle = 'Silver Eco-Advocate';
    ribbonSubtitle = 'Proactive Green Sourcing & Sustainable Planning Discipline';
    ribbonColor = '#4B5563';
    ribbonGradient = 'from-slate-400 via-gray-300 to-zinc-600';
    criteriaMet = [
      sustainableVendors >= 1
        ? `${sustainableVendors} Eco-Friendly Vendor verified`
        : `Eco Score reached ${ecoScore}/100`,
      'Sustainable principles actively incorporated into event scope',
    ];
    nextTierCriteria = 'Partner with 2+ sustainable vendors and reach an Eco Score of 75+ for the Gold Ribbon.';
  } else if (hasBasicEco) {
    ribbonTier = 'bronze';
    ribbonTitle = 'Bronze Eco-Pioneer';
    ribbonSubtitle = 'Foundational Environmental Care & Conscious Event Design';
    ribbonColor = '#B45309';
    ribbonGradient = 'from-amber-700 via-amber-600 to-amber-900';
    criteriaMet = [`Eco Score: ${ecoScore}/100 (Baseline achieved)`];
    nextTierCriteria = 'Engage at least 1 sustainable vendor to ascend to the Silver Eco Ribbon.';
  } else {
    nextTierCriteria = 'Boost your Eco Score above 50 or tag your first eco-certified vendor to unlock Bronze.';
  }

  const ecoRibbon: EcoChampionRibbon = {
    tier: ribbonTier,
    title: ribbonTitle,
    subtitle: ribbonSubtitle,
    color: ribbonColor,
    gradient: ribbonGradient,
    unlocked: ribbonTier !== 'none',
    criteriaMet,
    nextTierCriteria,
  };

  // Badges Definitions
  const badges: GamificationBadge[] = [
    {
      id: 'green_sourcing_pioneer',
      title: 'Green Sourcing Pioneer',
      category: 'sustainability',
      description: 'Engage verified sustainable vendors who practice zero-waste or local ethical sourcing.',
      iconName: 'Leaf',
      unlocked: sustainableVendors >= 1,
      unlockedAt: sustainableVendors >= 1 ? 'Current Event' : undefined,
      progress: Math.min(100, Math.round((sustainableVendors / Math.max(1, Math.min(3, totalVendors || 1))) * 100)),
      progressLabel: `${sustainableVendors} of ${totalVendors} vendors marked eco-friendly`,
      xpReward: 80 + (sustainableVendors > 1 ? (sustainableVendors - 1) * 25 : 0),
      tierLevel: sustainableVendors >= 3 ? 3 : sustainableVendors >= 2 ? 2 : 1,
      criteriaDetails: 'Awarded when at least 1 vendor is tagged as Eco-Friendly / Sustainable.',
    },
    {
      id: 'eco_champion_ribbon_award',
      title: 'Eco-Champion Ribbon',
      category: 'sustainability',
      description: 'Achieve Gold or Emerald Ribbon rank through holistic environmental performance.',
      iconName: 'Award',
      unlocked: ribbonTier === 'gold' || ribbonTier === 'emerald',
      unlockedAt: ribbonTier === 'gold' || ribbonTier === 'emerald' ? 'Current Event' : undefined,
      progress:
        ribbonTier === 'emerald'
          ? 100
          : ribbonTier === 'gold'
          ? 100
          : ribbonTier === 'silver'
          ? 65
          : ribbonTier === 'bronze'
          ? 35
          : 10,
      progressLabel:
        ribbonTier === 'emerald'
          ? 'Emerald Rank Unlocked'
          : ribbonTier === 'gold'
          ? 'Gold Rank Unlocked'
          : 'Pending Gold/Emerald',
      xpReward: 150,
      tierLevel: ribbonTier === 'emerald' ? 3 : ribbonTier === 'gold' ? 2 : 1,
      criteriaDetails: 'Earn Gold (Eco Score ≥75 & 2+ green vendors) or Emerald (Score ≥90 & 3+ green vendors).',
    },
    {
      id: 'prudent_custodian',
      title: 'Prudent Custodian',
      category: 'budget',
      description: 'Zero budget overrun! Total committed expenses are strictly within or equal to the total budget pool.',
      iconName: 'ShieldCheck',
      unlocked: totalBudgetMinor > 0 && totalActualMinor <= totalBudgetMinor && event.budgetItems.length > 0,
      unlockedAt: totalActualMinor <= totalBudgetMinor ? 'Active' : undefined,
      progress:
        totalBudgetMinor > 0
          ? totalActualMinor <= totalBudgetMinor
            ? 100
            : Math.max(0, Math.round(100 - ((totalActualMinor - totalBudgetMinor) / totalBudgetMinor) * 100))
          : 0,
      progressLabel:
        budgetVarianceMinor >= 0
          ? 'Under Budget (Zero Overrun)'
          : 'Overrun detected (Variance negative)',
      xpReward: 100,
      tierLevel: budgetVarianceMinor >= Math.round(totalBudgetMinor * 0.1) ? 3 : 2,
      criteriaDetails: 'Total actual expenses must not exceed total allocated budget.',
    },
    {
      id: 'budget_mastermind',
      title: 'Budget Mastermind',
      category: 'efficiency',
      description: 'High financial efficiency: Secured ≥5% budget surplus without sacrificing essential experiences.',
      iconName: 'TrendingDown',
      unlocked:
        totalBudgetMinor > 0 &&
        budgetVarianceMinor >= Math.round(totalBudgetMinor * 0.05) &&
        event.budgetItems.length >= 2,
      unlockedAt:
        budgetVarianceMinor >= Math.round(totalBudgetMinor * 0.05) ? 'Surplus Active' : undefined,
      progress:
        totalBudgetMinor > 0
          ? Math.min(100, Math.round((Math.max(0, budgetVarianceMinor) / (totalBudgetMinor * 0.05 || 1)) * 100))
          : 0,
      progressLabel:
        budgetVarianceMinor >= Math.round(totalBudgetMinor * 0.05)
          ? `Surplus ≥ 5% achieved`
          : `Current surplus: ${Math.max(0, Math.round((budgetVarianceMinor / (totalBudgetMinor || 1)) * 100))}% / 5% target`,
      xpReward: 120,
      tierLevel: budgetVarianceMinor >= Math.round(totalBudgetMinor * 0.15) ? 3 : 2,
      criteriaDetails: 'Maintain an uncommitted financial reserve of at least 5% across comprehensive budget line items.',
    },
    {
      id: 'deal_hunter',
      title: 'Deal Hunter & Negotiator',
      category: 'efficiency',
      description: 'Applied intelligent AI cost-saving trade-offs or benchmarked competitive vendor quotes.',
      iconName: 'Sparkles',
      unlocked: savingsAppliedCount >= 1 || totalQuotes >= 2,
      unlockedAt: savingsAppliedCount >= 1 || totalQuotes >= 2 ? 'Negotiations Applied' : undefined,
      progress: Math.min(100, (savingsAppliedCount * 50) + (totalQuotes * 25)),
      progressLabel: `${savingsAppliedCount} AI savings applied · ${totalQuotes} vendor quotes compared`,
      xpReward: 90,
      tierLevel: savingsAppliedCount >= 2 ? 3 : 2,
      criteriaDetails: 'Apply 1+ AI savings suggestions or collect 2+ vendor quotes for price comparison.',
    },
    {
      id: 'zero_waste_visionary',
      title: 'Zero-Waste Visionary',
      category: 'sustainability',
      description: 'Catering and service design eliminating single-use materials and reducing food waste.',
      iconName: 'CheckCircle2',
      unlocked:
        Boolean(event.details.ecoScore?.tips?.length) ||
        (event.menu || []).some((m) => m.isVegetarian || m.isVegan || m.isJainFriendly),
      unlockedAt: 'Incorporated',
      progress: 100,
      progressLabel: 'Biodegradable plating & conscious catering active',
      xpReward: 75,
      tierLevel: 2,
      criteriaDetails: 'Plant-forward menu, traditional leaf service, or designated food donation logistics.',
    },
    {
      id: 'carbon_guardian',
      title: 'Carbon Conscious Planner',
      category: 'sustainability',
      description: 'Chose a local or transit-accessible venue reducing attendee travel emissions.',
      iconName: 'MapPin',
      unlocked:
        (event.venues || []).some((v) => v.shortlisted && v.distanceKm <= 25) ||
        event.details.venueType === 'hybrid' ||
        Boolean(event.details.venueName),
      unlockedAt: 'Venue Verified',
      progress: 100,
      progressLabel: 'Low transit footprint (<25km / hybrid accessible)',
      xpReward: 70,
      tierLevel: 1,
      criteriaDetails: 'Shortlist a venue within 25 km of city center or support hybrid/remote participation.',
    },
    {
      id: 'flawless_orchestrator',
      title: 'Flawless Orchestrator',
      category: 'planning',
      description: 'Execute timeline milestones on schedule without overdue blockers.',
      iconName: 'CheckSquare',
      unlocked: completedTasksCount >= 3 && overdueTasksCount === 0,
      unlockedAt: completedTasksCount >= 3 && overdueTasksCount === 0 ? 'Active Milestone Record' : undefined,
      progress: Math.min(100, Math.round((completedTasksCount / Math.max(3, totalTasksCount || 1)) * 100)),
      progressLabel: `${completedTasksCount} completed · ${overdueTasksCount} overdue`,
      xpReward: 85,
      tierLevel: completedTasksCount >= 8 ? 3 : 2,
      criteriaDetails: 'Complete at least 3 tasks with 0 overdue milestones.',
    },
  ];

  // Calculate XP
  let totalXp = 0;

  // Points from unlocked badges
  badges.forEach((b) => {
    if (b.unlocked) {
      totalXp += b.xpReward;
    }
  });

  // Dynamic Multipliers & Extras
  totalXp += sustainableVendors * 40;
  if (sustainabilityRatio >= 0.5 && totalVendors >= 2) {
    totalXp += 75; // Green majority bonus
  }
  if (budgetVarianceMinor > 0) {
    totalXp += 60; // Surplus bonus
  }
  if (totalBudgetMinor > 0 && budgetVarianceMinor >= Math.round(totalBudgetMinor * 0.1)) {
    totalXp += 50; // Super-frugal 10% bonus
  }
  totalXp += savingsAppliedCount * 30;
  totalXp += Math.round(ecoScore * 0.6); // Up to 60 XP for eco score
  totalXp += completedTasksCount * 8;

  // Level Progression:
  // Level 1: 0 - 249 XP ("Novice Planner")
  // Level 2: 250 - 499 XP ("Conscious Organizer")
  // Level 3: 500 - 799 XP ("Eco-Strategic Host")
  // Level 4: 800 - 1149 XP ("Sustainable Architect")
  // Level 5: 1150+ XP ("Grand Eco-Champion & Master")
  let currentLevel = 1;
  let levelTitle = 'Novice Planner';
  let currentLevelXp = 0;
  let nextLevelXp = 250;

  if (totalXp >= 1150) {
    currentLevel = 5;
    levelTitle = 'Grand Eco-Champion & Master';
    currentLevelXp = 1150;
    nextLevelXp = 1150;
  } else if (totalXp >= 800) {
    currentLevel = 4;
    levelTitle = 'Sustainable Architect';
    currentLevelXp = 800;
    nextLevelXp = 1150;
  } else if (totalXp >= 500) {
    currentLevel = 3;
    levelTitle = 'Eco-Strategic Host';
    currentLevelXp = 500;
    nextLevelXp = 800;
  } else if (totalXp >= 250) {
    currentLevel = 2;
    levelTitle = 'Conscious Organizer';
    currentLevelXp = 250;
    nextLevelXp = 500;
  } else {
    currentLevel = 1;
    levelTitle = 'Novice Planner';
    currentLevelXp = 0;
    nextLevelXp = 250;
  }

  const progressToNextLevel =
    currentLevel === 5
      ? 100
      : Math.min(100, Math.max(0, Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)));

  // Generate dynamic, actionable tips
  const actionableTips: string[] = [];
  if (sustainableVendors < 1) {
    actionableTips.push('🌱 Mark at least 1 vendor as Sustainable to unlock the Green Sourcing Pioneer badge (+80 XP).');
  } else if (sustainableVendors < 2) {
    actionableTips.push('🌱 Add a 2nd sustainable vendor (e.g. eco floral decor or local catering) to unlock the Gold Eco Ribbon.');
  }

  if (budgetVarianceMinor < 0) {
    actionableTips.push('⚠️ Rebalance budget line items to eliminate overrun and activate the Prudent Custodian badge (+100 XP).');
  } else if (savingsAppliedCount === 0) {
    actionableTips.push('💡 Apply an AI Cost-Saving suggestion in the Budget tab to unlock the Deal Hunter badge (+90 XP).');
  }

  if (ribbonTier === 'bronze' || ribbonTier === 'none') {
    actionableTips.push('🏆 Review the Eco score checklist to reach a 70+ score for the Silver Eco-Advocate Ribbon.');
  }

  if (completedTasksCount < 3) {
    actionableTips.push('📋 Complete initial timeline milestones to unlock the Flawless Orchestrator badge (+85 XP).');
  }

  return {
    totalXp,
    currentLevel,
    levelTitle,
    nextLevelXp,
    currentLevelXp,
    progressToNextLevel,
    ecoRibbon,
    badges,
    stats: {
      totalVendors,
      sustainableVendors,
      sustainabilityRatio,
      ecoScore,
      budgetStatus,
      budgetVarianceMinor,
      savingsAppliedCount,
      totalSavingsMinor,
      completedTasksCount,
      totalTasksCount,
    },
    actionableTips,
  };
}
