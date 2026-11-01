import { EventFull } from '../types';
import { HERO_IMAGES } from './constants';

const STORAGE_KEY = 'event_ai_events_v2';
const CURRENT_USER_KEY = 'event_ai_user_v2';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'planner' | 'admin' | 'collaborator';
}

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr_priya_rohan',
    name: 'Priya & Rohan',
    email: 'priya.rohan@weddingdemo.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'planner',
  },
  {
    id: 'usr_techfest_lead',
    name: 'Karthik Raja (Convenor)',
    email: 'karthik@collegefestdemo.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'planner',
  },
  {
    id: 'usr_ananya_mom',
    name: 'Meera Sharma',
    email: 'meera.sharma@familydemo.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'planner',
  },
];

export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEMO_USERS[0];
}

export function setCurrentUser(user: UserProfile): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('event_ai_user_changed'));
}

export const INITIAL_DEMO_EVENTS: EventFull[] = [
  {
    details: {
      id: 'evt_wedding_01',
      title: 'Priya & Rohan — Temple & Garden Wedding',
      type: 'wedding',
      date: '2026-11-28',
      endDate: '2026-11-29',
      startTime: '08:00',
      endTime: '22:30',
      durationHours: 14,
      city: 'Chennai',
      venueName: 'The Leela Palace Sea Pavilion',
      venueType: 'hybrid',
      estimatedGuestCount: 280,
      totalBudgetMinor: 85000000, // ₹8,50,000.00
      currency: 'INR',
      themePreference: 'Royal Temple Heritage (Marigold, Jasmine & Antique Brass)',
      dietaryPreferences: ['Strict Vegetarian', 'Traditional Feast on Banana Leaf', 'Jain Options', 'Filter Coffee Lounge'],
      culturalTraditions: 'Traditional South Indian Muhurtham followed by Sunset Cocktail Reception',
      specialRequests: 'Elder-friendly ramp access, live Carnatic fusion orchestra, dedicated kids play lounge',
      ownerId: 'usr_priya_rohan',
      collaborators: [
        {
          id: 'collab_1',
          name: 'Meera (Sister / Maid of Honor)',
          email: 'meera.s@gmail.com',
          role: 'editor',
          addedAt: '2026-09-01',
        },
        {
          id: 'collab_2',
          name: 'Uncle Sundaram (Financial Overseer)',
          email: 'sundaram.c@family.com',
          role: 'viewer',
          addedAt: '2026-09-10',
        },
      ],
      status: 'planning',
      createdAt: '2026-08-15T10:00:00Z',
      updatedAt: '2026-10-18T14:30:00Z',
      coverImage: HERO_IMAGES.wedding,
      ecoScore: {
        score: 84,
        rating: 'Gold',
        tips: [
          'Banana leaf plating eliminates 98% single-use banquet tableware waste.',
          'Local temple jasmine strings sourced directly from Koyambedu flower market within 12km.',
          'Surplus food donation partnered with Robin Hood Army Chennai.',
        ],
      },
    },
    planSections: [
      {
        id: 'sec_1',
        sectionKey: 'overview',
        title: 'Executive Summary & Vision',
        content:
          'A two-day celebration harmonizing sacred Dravidian temple traditions with an elegant twilight garden reception overlooking the Bay of Bengal. The event accommodates 280 guests with seamless hospitality, authentic vegetarian gastronomy, and conscious sustainable decor.',
        lastUpdated: '2026-10-15T09:00:00Z',
        versions: [
          {
            version: 1,
            timestamp: '2026-08-15T10:05:00Z',
            content: 'Initial wedding draft plan for Chennai wedding with 250 guests.',
            summary: 'Initial auto-generation from wizard',
          },
          {
            version: 2,
            timestamp: '2026-10-15T09:00:00Z',
            content:
              'A two-day celebration harmonizing sacred Dravidian temple traditions with an elegant twilight garden reception overlooking the Bay of Bengal. The event accommodates 280 guests with seamless hospitality, authentic vegetarian gastronomy, and conscious sustainable decor.',
            summary: 'Refined guest count and sea pavilion alignment',
          },
        ],
      },
      {
        id: 'sec_2',
        sectionKey: 'theme',
        title: 'Theme & Aesthetic Direction',
        content:
          'Dravidian Royal Heritage: Deep royal violet (#4B2A7B), temple saffron (#E67E22), raw ivory (#FBF7F0), and antique brass (#C59B27). Hand-carved wooden mandap pillars wrapped in fragrant night-blooming jasmine, tuberoses, and marigold garlands with warm brass urlis holding floating terracotta lotus candles.',
        lastUpdated: '2026-10-12T11:00:00Z',
        versions: [],
      },
      {
        id: 'sec_3',
        sectionKey: 'venue_requirements',
        title: 'Venue Logistics & Space Allocation',
        content:
          'Morning Muhurtham requires east-facing covered sanctum for homam with high-volume smoke extraction. Dining wing configured with 4 parallel 70-seater rows for simultaneous banana leaf service. Evening lawn needs acoustic baffling compliant with Chennai CRZ 10:00 PM sound curfews.',
        lastUpdated: '2026-10-12T11:00:00Z',
        versions: [],
      },
      {
        id: 'sec_4',
        sectionKey: 'decor_concept',
        title: 'Zone-by-Zone Decor Concepts',
        content:
          '• Grand Entrance: 12ft traditional brass kuthuvilakku archway with cascading temple bells.\n• Main Mandap: Handloom Kanchipuram silk drapes in ivory and violet with brass floral bells.\n• Photo Pavilion: Vintage chettinad wooden swing with floral lattice and antique brass mirrors.\n• Dining Hall: Hand-block printed runners with copper drinkware and organic lotus centerpieces.',
        lastUpdated: '2026-10-12T11:00:00Z',
        versions: [],
      },
      {
        id: 'sec_5',
        sectionKey: 'catering_plan',
        title: 'Gastronomy & Beverage Plan',
        content:
          'Morning: 24-item traditional Tamil Brahmin virundhu served on pristine banana leaves (Vada, Payasam, Mor Kozhambu, Mysore Pak, fresh tender coconut water).\nEvening: Live chaat station, artisanal wood-fired sourdough pizzas, coastal Chettinad veg delicacies, and a signature Kumbakonam degree filter coffee bar.',
        lastUpdated: '2026-10-12T11:00:00Z',
        versions: [],
      },
      {
        id: 'sec_6',
        sectionKey: 'entertainment',
        title: 'Performances & Music',
        content:
          'Muhurtham: Renowned Nadaswaram and Thavil virtuosos playing traditional Mangala Isai.\nEvening: Carnatic fusion 5-piece instrumental band (Violin, Mridangam, Flute, Bass, Keyboard) blending classical ragas with contemporary melodic songs.',
        lastUpdated: '2026-10-12T11:00:00Z',
        versions: [],
      },
      {
        id: 'sec_7',
        sectionKey: 'risks_contingencies',
        title: 'Contingency & Weather Risk Plan',
        content:
          'November in Chennai carries sporadic coastal showers. The Sea Pavilion lawn has a motorized waterproof transparent canopy on standby. Secondary diesel generator (125 kVA) reserved for uncompromised stage sound and ceremonial fire lighting.',
        lastUpdated: '2026-10-12T11:00:00Z',
        versions: [],
      },
    ],
    budgetAllocations: [
      { category: 'Venue & Lodging', targetPercentage: 30 },
      { category: 'Catering & Dining', targetPercentage: 25 },
      { category: 'Decor & Florals', targetPercentage: 15 },
      { category: 'Attire & Makeup', targetPercentage: 10 },
      { category: 'Photography & Film', targetPercentage: 8 },
      { category: 'Music & Entertainment', targetPercentage: 7 },
      { category: 'Invitations & Favors', targetPercentage: 3 },
      { category: 'Contingency Fund', targetPercentage: 2 },
    ],
    budgetItems: [
      {
        id: 'b1',
        category: 'Venue & Lodging',
        name: 'The Leela Palace Sea Pavilion (2 Days)',
        vendorName: 'The Leela Group',
        estimatedAmountMinor: 25500000, // ₹2,55,000
        actualAmountMinor: 25000000,
        paidAmountMinor: 15000000,
        status: 'partially_paid',
        dueDate: '2026-11-15',
        receiptNote: 'Advance paid via NEFT. Final balance due on check-in.',
      },
      {
        id: 'b2',
        category: 'Catering & Dining',
        name: 'Traditional Virundhu + Evening Buffet (280 Pax)',
        vendorName: 'Sri Balaji Catering Services',
        estimatedAmountMinor: 21250000, // ₹2,12,500
        actualAmountMinor: 21000000,
        paidAmountMinor: 10000000,
        status: 'partially_paid',
        dueDate: '2026-11-20',
        receiptNote: 'Food tasting approved on Oct 10.',
      },
      {
        id: 'b3',
        category: 'Decor & Florals',
        name: 'Mandap Floral Architecture & Fairy Lighting',
        vendorName: 'Chennai Artisanal Florals',
        estimatedAmountMinor: 12750000, // ₹1,27,500
        actualAmountMinor: 13200000,
        paidAmountMinor: 13200000,
        status: 'paid',
        dueDate: '2026-10-05',
        receiptNote: 'Full settlement made with early booking discount.',
      },
      {
        id: 'b4',
        category: 'Photography & Film',
        name: 'Candid Photography & Cinematic 4K Film',
        vendorName: 'Light & Raga Studios',
        estimatedAmountMinor: 6800000, // ₹68,000
        actualAmountMinor: 6500000,
        paidAmountMinor: 3000000,
        status: 'partially_paid',
        dueDate: '2026-11-10',
        receiptNote: 'Teaser reel + full 30-min documentary film included.',
      },
      {
        id: 'b5',
        category: 'Music & Entertainment',
        name: 'Nadaswaram Troupe + Carnatic Fusion Band',
        vendorName: 'Raghavan & Co. Melodies',
        estimatedAmountMinor: 5950000, // ₹59,500
        actualAmountMinor: 5500000,
        paidAmountMinor: 5500000,
        status: 'paid',
        dueDate: '2026-10-15',
      },
      {
        id: 'b6',
        category: 'Invitations & Favors',
        name: 'Eco Seed-Paper Cards & Brass Brass Urli Favors',
        vendorName: 'GreenPrints India',
        estimatedAmountMinor: 2550000, // ₹25,500
        actualAmountMinor: 2400000,
        paidAmountMinor: 2400000,
        status: 'paid',
        dueDate: '2026-09-25',
      },
    ],
    savingsSuggestions: [
      {
        id: 'sav_1',
        title: 'Direct Koyambedu Wholesale Floral Procurement',
        description: 'Partner with local wholesale jasmine/marigold cooperatives instead of agency markup.',
        category: 'Decor & Florals',
        estimatedSavingMinor: 2200000, // ₹22,000
        tradeOff: 'Requires early morning 4 AM pickup by family volunteer coordinator.',
        applied: false,
      },
      {
        id: 'sav_2',
        title: 'Digital Eco-Invites with Seed Paper for Elders Only',
        description: 'Distribute animated WhatsApp video invites to friends and reserve physical cards for family elders.',
        category: 'Invitations & Favors',
        estimatedSavingMinor: 850000, // ₹8,500
        tradeOff: 'Fewer keepsake paper cards distributed.',
        applied: true,
      },
    ],
    tasks: [
      {
        id: 'tsk_1',
        title: 'Confirm Sea Pavilion Mandap Dimensions & Fire Safety Clearance',
        deadline: '2026-10-25',
        phase: 'Initial Planning',
        priority: 'high',
        status: 'completed',
        dependencies: [],
        assignee: 'Priya & Rohan',
        notes: 'Fire safety approved homam permit with resort manager.',
      },
      {
        id: 'tsk_2',
        title: 'Finalize Traditional Virundhu Menu Tasting & Plate Count',
        deadline: '2026-10-30',
        phase: 'Booking & Vendors',
        priority: 'critical',
        status: 'completed',
        dependencies: ['tsk_1'],
        assignee: 'Meera',
        notes: 'Payasam sweetness calibrated; Jain garlic-free counters confirmed.',
      },
      {
        id: 'tsk_3',
        title: 'Review Candid Video Shot List and Drone Aerial Permit',
        deadline: '2026-11-08',
        phase: 'Booking & Vendors',
        priority: 'medium',
        status: 'in_progress',
        dependencies: [],
        assignee: 'Light & Raga Studios',
        notes: 'CRZ drone zone clearance submitted to local station.',
      },
      {
        id: 'tsk_4',
        title: 'Assemble Brass Urli & Organic Seed-Paper Return Gift Hampers',
        deadline: '2026-11-15',
        phase: 'Purchasing & Decor',
        priority: 'medium',
        status: 'not_started',
        dependencies: [],
        assignee: 'Family Volunteers',
      },
      {
        id: 'tsk_5',
        title: 'Pre-Event Sound Check with Carnatic Fusion Band at 4:00 PM',
        deadline: '2026-11-27',
        phase: 'Final Confirmations',
        priority: 'high',
        status: 'not_started',
        dependencies: ['tsk_3'],
        assignee: 'Raghavan & Co.',
      },
      {
        id: 'tsk_6',
        title: 'Oversee Early Morning 6:00 AM Fresh Jasmine Garlands Arrival',
        deadline: '2026-11-28',
        phase: 'Event Day',
        priority: 'critical',
        status: 'not_started',
        dependencies: ['tsk_4'],
        assignee: 'Meera (Maid of Honor)',
      },
    ],
    vendors: [
      {
        id: 'vnd_1',
        category: 'Venue & Lodging',
        name: 'The Leela Palace Sea Pavilion',
        contactPerson: 'Suresh Kumar (Banquet Director)',
        phone: '+91 98401 23456',
        email: 'events.chennai@theleela.com',
        estimatedCostMinor: 25000000,
        bookingStatus: 'booked',
        requirements: ['Sea view lawn', 'East-facing mandap clearance', 'Power backup 125kVA', 'Valet parking for 150 cars'],
        questionsToAsk: [
          'What is the sound curfew on the lawn?',
          'Is open flame permitted for the Muhurtham homam?',
          'What is the cancellation and rain backup policy?',
        ],
        quotes: [
          {
            id: 'q1',
            vendorName: 'The Leela Palace Sea Pavilion',
            contactPerson: 'Suresh Kumar',
            phone: '+91 98401 23456',
            email: 'events.chennai@theleela.com',
            quotedAmountMinor: 25000000,
            packageDetails: 'Includes ocean lawn, royal suite for couple, valet service, and generator fuel.',
            rating: 4.9,
            isShortlisted: true,
          },
        ],
        linkedTasks: ['tsk_1'],
        isSustainable: true,
        sustainabilityPractices: [
          'Solar-powered lighting for lawn pavilion',
          'On-site wet waste composting facility',
          'Battery electric guest shuttle carts',
        ],
      },
      {
        id: 'vnd_2',
        category: 'Catering',
        name: 'Sri Balaji Traditional Caterers',
        contactPerson: 'Venkatesh Iyer',
        phone: '+91 94440 98765',
        email: 'balajicatering@chennaifood.in',
        estimatedCostMinor: 21000000,
        bookingStatus: 'booked',
        requirements: ['Trained banana leaf servers in traditional veshti', 'Hot filter coffee live dispensers', 'Clean potable mineral water'],
        questionsToAsk: [
          'Can you accommodate 25 strict Jain meals without onion/garlic?',
          'Do you supply copper jugs and organic banana leaves?',
        ],
        quotes: [],
        linkedTasks: ['tsk_2'],
        isSustainable: true,
        sustainabilityPractices: [
          '100% biodegradable banana leaf service',
          'Zero single-use plastic water bottles / copper dispensers',
          'Surplus food donation partnered with Robin Hood Army',
        ],
      },
      {
        id: 'vnd_3',
        category: 'Photography',
        name: 'Light & Raga Candid Studios',
        contactPerson: 'Arun Prakash',
        phone: '+91 97890 54321',
        email: 'arun@lightandraga.com',
        estimatedCostMinor: 6500000,
        bookingStatus: 'booked',
        requirements: ['2 candid photographers', '1 traditional photographer', '1 cinema gimbal videographer', 'Same-day edit teaser'],
        questionsToAsk: ['How soon is the 1-minute Instagram teaser delivered?', 'Do you provide raw uncompressed footage?'],
        quotes: [],
        linkedTasks: ['tsk_3'],
        isSustainable: false,
        sustainabilityPractices: [],
      },
    ],
    guests: [
      {
        id: 'gst_1',
        name: 'Dr. K. Swaminathan & Family',
        email: 'k.swami@apollohospitals.org',
        phone: '+91 98410 11111',
        groupSide: 'bride',
        plusOnes: 3,
        dietaryNeeds: 'standard',
        dietaryNotes: 'Strict South Indian vegetarian only',
        tableAssignment: 'Table 1 — Family Elders',
        invitationStatus: 'delivered',
        rsvpStatus: 'confirmed',
        rsvpToken: 'rsvp_priya_swami',
      },
      {
        id: 'gst_2',
        name: 'Anand & Divya Narayanan',
        email: 'anand.n@techcorp.com',
        phone: '+91 98840 22222',
        groupSide: 'groom',
        plusOnes: 1,
        dietaryNeeds: 'gluten_free',
        dietaryNotes: 'Gluten sensitivity, prefers idlis and fresh fruits',
        tableAssignment: 'Table 3 — College Friends',
        invitationStatus: 'delivered',
        rsvpStatus: 'confirmed',
        rsvpToken: 'rsvp_priya_anand',
      },
      {
        id: 'gst_3',
        name: 'Raghuveer & Sangeetha',
        email: 'raghuveer.s@gmail.com',
        phone: '+91 99400 33333',
        groupSide: 'bride',
        plusOnes: 2,
        dietaryNeeds: 'jain',
        dietaryNotes: 'Strict Jain (no root vegetables, no garlic/onion)',
        tableAssignment: 'Table 2 — Relatives',
        invitationStatus: 'sent',
        rsvpStatus: 'pending',
        rsvpToken: 'rsvp_priya_raghu',
      },
      {
        id: 'gst_4',
        name: 'Siddharth Rao',
        email: 'sid.rao@startup.co',
        phone: '+91 98405 44444',
        groupSide: 'groom',
        plusOnes: 0,
        dietaryNeeds: 'vegan',
        tableAssignment: 'Table 3 — College Friends',
        invitationStatus: 'delivered',
        rsvpStatus: 'confirmed',
        rsvpToken: 'rsvp_priya_sid',
      },
    ],
    seatingTables: [
      {
        id: 'tbl_1',
        name: 'Table 1 — Family Elders',
        capacity: 8,
        assignedGuestIds: ['gst_1'],
        locationNote: 'Front row near the Mandap, ramp-accessible',
      },
      {
        id: 'tbl_2',
        name: 'Table 2 — Relatives & Cousins',
        capacity: 10,
        assignedGuestIds: ['gst_3'],
        locationNote: 'Central canopy row',
      },
      {
        id: 'tbl_3',
        name: 'Table 3 — College Friends & Colleagues',
        capacity: 8,
        assignedGuestIds: ['gst_2', 'gst_4'],
        locationNote: 'Garden patio adjacent to mocktail bar',
      },
    ],
    themes: [
      {
        id: 'thm_1',
        name: 'Royal Dravidian Heritage',
        description: 'Intricate temple brass, royal purple silk, fresh Madurai malli jasmine, and warm candlelight.',
        style: 'royal',
        colorPalette: [
          { name: 'Royal Velvet Purple', hex: '#4B2A7B' },
          { name: 'Temple Gold', hex: '#D4AF37' },
          { name: 'Warm Ivory', hex: '#FBF7F0' },
          { name: 'Koyambedu Marigold', hex: '#FF9900' },
          { name: 'Lotus Coral', hex: '#FF7A6B' },
        ],
        decorZones: [
          { zone: 'entrance', concept: '10ft brass Urlis with lotus floats & bell torans', materials: 'Antique brass, tuberoses, terracotta' },
          { zone: 'stage', concept: 'Hand-carved wooden pillar Mandap draped in ivory silk', materials: 'Kanchipuram raw silk, jasmine strings' },
          { zone: 'tables', concept: 'Brass candle lanterns with banana leaf runner accents', materials: 'Brass, linen, fresh marigolds' },
          { zone: 'photobooth', concept: 'Chettinad vintage wood carved swing with floral mesh', materials: 'Teakwood, marigolds, fairy lights' },
          { zone: 'lighting', concept: 'Warm 2700K tungsten fairy canopies & diya clusters', materials: 'Edison filament, brass diyas' },
        ],
        flowersAndProps: ['Madurai Malli (Jasmine)', 'Orange & Yellow Marigolds', 'Pink Lotus Buds', 'Brass Urlis', 'Temple Bells'],
        costTiers: [
          { tier: 'DIY', estimatedCostMinor: 4500000, description: 'Family procures flowers directly; simple brass lanterns rented' },
          { tier: 'Rent', estimatedCostMinor: 8500000, description: 'Full rental of carved pillars, urlis, and ambient lighting' },
          { tier: 'Buy / Custom', estimatedCostMinor: 14000000, description: 'Bespoke custom painted backdrops and hand-woven floral chandeliers' },
        ],
        pinnedImage: HERO_IMAGES.moodboard,
      },
    ],
    menu: [
      {
        id: 'mn_1',
        course: 'welcome_drinks',
        name: 'Elaneer Payasam Shot & Spiced Panakam',
        description: 'Chilled tender coconut pulp with jaggery water & cardamom in clay kulhads',
        isVegetarian: true,
        isVegan: true,
        isJainFriendly: true,
        perHeadPortionGramsOrUnits: 150,
        unit: 'ml',
      },
      {
        id: 'mn_2',
        course: 'starters',
        name: 'Vazhaipoo (Banana Blossom) Vadai & Medu Vada',
        description: 'Crispy lentil patties with ginger, curry leaf, and trio of fresh coconut chutneys',
        isVegetarian: true,
        isVegan: true,
        isJainFriendly: false,
        perHeadPortionGramsOrUnits: 2,
        unit: 'pieces',
      },
      {
        id: 'mn_3',
        course: 'mains',
        name: 'Traditional 24-Item Virundhu on Banana Leaf',
        description: 'Steamed ponni rice, drumstick sambar, arachuvitta rasam, avial, poriyal, mor kozhambu & appalam',
        isVegetarian: true,
        isVegan: false,
        isJainFriendly: true,
        perHeadPortionGramsOrUnits: 550,
        unit: 'grams',
      },
      {
        id: 'mn_4',
        course: 'desserts',
        name: 'Akkaravadisal & Warm Mysore Pak with Kulfi',
        description: 'Slow-cooked ghee-rich temple rice pudding sweetened with organic palm jaggery',
        isVegetarian: true,
        isVegan: false,
        isJainFriendly: true,
        perHeadPortionGramsOrUnits: 120,
        unit: 'grams',
      },
    ],
    venues: [
      {
        id: 'vn_1',
        name: 'The Leela Palace Sea Pavilion',
        type: '5-Star Luxury Resort Lawn',
        address: 'Adyar Sea Face, MRC Nagar, Chennai, Tamil Nadu 600028',
        capacity: 450,
        indoorOutdoor: 'hybrid',
        priceLevel: '$$$$',
        rating: 4.9,
        distanceKm: 4.2,
        features: ['Private beach access', 'Helipad', 'Dedicated ceremonial fire zone', 'Valet for 200 cars'],
        fitExplanation: 'Matches the 280-guest headcount with ample space for traditional mandap and separate dining pavilion.',
        requirementsChecklist: {
          parking: true,
          powerBackup: true,
          permissionsRequired: ['CRZ sound permit for 10 PM', 'Fire NOC for ceremonial homam'],
          accessibility: true,
          noiseCurfewHour: '22:00',
        },
        shortlisted: true,
        lat: 13.0163,
        lng: 80.2778,
      },
    ],
    runOfShow: [
      {
        id: 'ros_1',
        time: '06:30',
        durationMinutes: 60,
        title: 'Nadaswaram Ensemble Welcomes Guests & Homam Sanctum Prep',
        owner: 'Meera (Maid of Honor)',
        vendorContact: {
          vendorName: 'Raghavan & Co. Melodies',
          phone: '+91 97890 54321',
        },
        notes: 'Priests confirm homam wood, ghee, and coconut supplies in mandap.',
        completed: false,
      },
      {
        id: 'ros_2',
        time: '07:30',
        durationMinutes: 90,
        title: 'Groom & Bride Arrival, Oonjal (Swing Ceremony) & Floral Exchange',
        owner: 'Priya & Rohan',
        vendorContact: {
          vendorName: 'Light & Raga Candid Studios',
          phone: '+91 97890 54321',
        },
        notes: 'Candid video team ready with 50mm portrait prime lenses.',
        completed: false,
      },
      {
        id: 'ros_3',
        time: '09:00',
        durationMinutes: 45,
        title: 'Sacred Muhurtham & Mangalyadharanam',
        owner: 'Chief Priest Shastri',
        notes: 'Tied at auspicious lagna at 09:12 AM sharp. Live flowers showering.',
        completed: false,
      },
      {
        id: 'ros_4',
        time: '10:00',
        durationMinutes: 120,
        title: 'Traditional Banana Leaf Virundhu Banquet (Batches of 70)',
        owner: 'Sri Balaji Catering Staff',
        vendorContact: {
          vendorName: 'Sri Balaji Traditional Caterers',
          phone: '+91 94440 98765',
        },
        notes: 'VIP and elder seating prioritized in Hall Wing A.',
        completed: false,
      },
      {
        id: 'ros_5',
        time: '18:30',
        durationMinutes: 180,
        title: 'Sunset Garden Cocktail & Carnatic Fusion Performance',
        owner: 'Rohan (Groom)',
        notes: 'Canopy lighting switch-on at 18:15. Warm filter coffee bar operational.',
        completed: false,
      },
    ],
    issues: [
      {
        id: 'iss_1',
        timestamp: '2026-10-18T16:20:00Z',
        reportedBy: 'Meera (Maid of Honor)',
        description: 'East lawn sprinkler system turned on unexpectedly during decor layout test.',
        severity: 'low',
        status: 'resolved',
        resolutionNotes: 'Resort engineering team disabled automated timer for the entire wedding week.',
      },
    ],
    chatHistory: [
      {
        id: 'msg_1',
        sender: 'user',
        timestamp: '2026-10-18T17:00:00Z',
        text: 'How can we reduce our decor expenses by ₹20,000 without losing the traditional royal mandap look?',
      },
      {
        id: 'msg_2',
        sender: 'assistant',
        timestamp: '2026-10-18T17:01:00Z',
        text: 'Here are 3 verified ways to save approximately **₹22,000** on your Chennai wedding decor:\n\n1. **Direct Flower Wholesale Procurement**: Buy fresh jasmine and marigold strings directly from Koyambedu wholesale market early morning instead of paying agency markups (Saving ~₹14,000).\n2. **Cluster Styling Instead of Full Canopy**: Concentrate lush floral chandeliers strictly over the Mandap and couple entrance; use warm 2700K tungsten fairy string nets over the open guest lawn.\n3. **Brass Diya Heirlooms**: Invite family elders to contribute ancestral brass Kuthuvilakku lamps instead of renting prop brass replicas (Saving ~₹8,000).',
        actions: [
          {
            type: 'apply_budget_saving',
            label: 'Apply ₹22,000 Floral Wholesale Saving',
            payload: { category: 'Decor & Florals', savingMinor: 2200000 },
          },
        ],
      },
    ],
  },
  {
    details: {
      id: 'evt_college_fest_02',
      title: 'IGNITE 2026 — Annual Tech & Cultural Symposium',
      type: 'college_fest',
      date: '2026-11-14',
      endDate: '2026-11-15',
      startTime: '09:00',
      endTime: '22:00',
      durationHours: 13,
      city: 'Bengaluru',
      venueName: 'Open Air Amphitheater & Campus Quad',
      venueType: 'hybrid',
      estimatedGuestCount: 1200,
      totalBudgetMinor: 45000000, // ₹4,50,000.00
      currency: 'INR',
      themePreference: 'Cyberpunk Odyssey (Neon Violet, Cyan, and Industrial Black)',
      dietaryPreferences: ['Campus Food Stalls', 'Grab-and-Go Snack Boxes', 'Energy Drinks Lounge'],
      culturalTraditions: 'National Robowars, 24-hr Hackathon, Battle of the Bands & Pro-Night Concert',
      specialRequests: 'High-speed 10Gbps fiber backbone, police permission for 10 PM sound curfew, medical first aid station',
      ownerId: 'usr_techfest_lead',
      collaborators: [],
      status: 'planning',
      createdAt: '2026-09-01T09:00:00Z',
      updatedAt: '2026-10-19T11:00:00Z',
      coverImage: HERO_IMAGES.collegeFest,
      ecoScore: {
        score: 78,
        rating: 'Silver',
        tips: [
          'Digital QR event passes save over 4,500 plastic badges.',
          'Campus recycling bins color-coded at every 20 meters across the quadrangle.',
        ],
      },
    },
    planSections: [
      {
        id: 'sec_c1',
        sectionKey: 'overview',
        title: 'Symposium Overview',
        content: 'IGNITE 2026 convenes over 1,200 students across 40 engineering institutes for hackathons, gaming tournaments, and a flagship live music concert.',
        lastUpdated: '2026-10-18T10:00:00Z',
        versions: [],
      },
    ],
    budgetAllocations: [
      { category: 'Stage & Pro-Audio/AV', targetPercentage: 35 },
      { category: 'Celebrity/Artist Honorarium', targetPercentage: 25 },
      { category: 'Marketing & Merchandise', targetPercentage: 12 },
      { category: 'Food & Refreshments', targetPercentage: 10 },
      { category: 'Prizes & Mementos', targetPercentage: 8 },
      { category: 'Security & Campus Logistics', targetPercentage: 6 },
      { category: 'Permissions & Licenses', targetPercentage: 4 },
    ],
    budgetItems: [
      {
        id: 'bc1',
        category: 'Stage & Pro-Audio/AV',
        name: 'JBL VTX Line Array Sound Rig + Moving Head Stage Lights',
        vendorName: 'Bengaluru Audio Rigs Pro',
        estimatedAmountMinor: 15750000, // ₹1,57,500
        actualAmountMinor: 15000000,
        paidAmountMinor: 8000000,
        status: 'partially_paid',
        dueDate: '2026-11-10',
      },
      {
        id: 'bc2',
        category: 'Celebrity/Artist Honorarium',
        name: 'Headline Indie Rock Band Performance',
        vendorName: 'Echoes Artist Collective',
        estimatedAmountMinor: 11250000, // ₹1,12,500
        actualAmountMinor: 11000000,
        paidAmountMinor: 5500000,
        status: 'partially_paid',
        dueDate: '2026-11-12',
      },
    ],
    savingsSuggestions: [
      {
        id: 'sav_c1',
        title: 'Partner with Sound Engineering Student Club for Stage Assistants',
        description: 'Utilize trained in-house audio tech students to reduce contractor crew headcount by 4 members.',
        category: 'Stage & Pro-Audio/AV',
        estimatedSavingMinor: 2500000,
        tradeOff: 'Requires faculty coordinator supervision during live concert.',
        applied: false,
      },
    ],
    tasks: [
      {
        id: 'tsk_c1',
        title: 'Submit City Police Sound Permit & Campus Dean Clearance',
        deadline: '2026-10-28',
        phase: 'Initial Planning',
        priority: 'critical',
        status: 'in_progress',
        dependencies: [],
        assignee: 'Karthik Raja',
      },
      {
        id: 'tsk_c2',
        title: 'Install Dedicated 10Gbps Wi-Fi Access Points for Hackathon Hall',
        deadline: '2026-11-05',
        phase: 'Booking & Vendors',
        priority: 'high',
        status: 'not_started',
        dependencies: [],
        assignee: 'Network Team',
      },
    ],
    vendors: [],
    guests: [
      {
        id: 'gst_c1',
        name: 'Keynote Speaker: Dr. Arvind Natarajan',
        email: 'arvind@ai-research.org',
        groupSide: 'faculty',
        plusOnes: 1,
        dietaryNeeds: 'standard',
        invitationStatus: 'delivered',
        rsvpStatus: 'confirmed',
        rsvpToken: 'rsvp_fest_arvind',
      },
    ],
    seatingTables: [],
    themes: [],
    menu: [],
    venues: [],
    runOfShow: [
      {
        id: 'rc_1',
        time: '09:00',
        durationMinutes: 60,
        title: 'Inauguration Ceremony & Keynote Address in Auditorium',
        owner: 'Karthik Raja',
        notes: 'Dean, Chief Guest & sponsors lighting lamp.',
        completed: false,
      },
      {
        id: 'rc_2',
        time: '18:00',
        durationMinutes: 210,
        title: 'Pro-Night Concert in Amphitheater',
        owner: 'Echoes Artist Collective',
        notes: 'Security check at entry gates with metal detectors.',
        completed: false,
      },
    ],
    issues: [],
    chatHistory: [],
  },
  {
    details: {
      id: 'evt_birthday_03',
      title: "Ananya's 1st Safari Adventure Birthday",
      type: 'birthday',
      date: '2026-11-08',
      startTime: '16:00',
      endTime: '20:00',
      durationHours: 4,
      city: 'Mumbai',
      venueName: 'The Palm Grove Club Lawn & Hall',
      venueType: 'indoor',
      estimatedGuestCount: 65,
      totalBudgetMinor: 9500000, // ₹95,000.00
      currency: 'INR',
      themePreference: 'Handcrafted Boho Safari (Sage Green, Coral & Wooden Elements)',
      dietaryPreferences: ['Child-Friendly Finger Food', 'Eggless Chocolate Cake', 'Jain Options Available'],
      culturalTraditions: 'Traditional 1st birthday blessings, cake smashing photo session, puppet show',
      specialRequests: 'Soft play ball pit for toddlers under 3, diaper changing station',
      ownerId: 'usr_ananya_mom',
      collaborators: [],
      status: 'planning',
      createdAt: '2026-09-10T12:00:00Z',
      updatedAt: '2026-10-18T18:00:00Z',
      coverImage: HERO_IMAGES.birthday,
      ecoScore: {
        score: 91,
        rating: 'Platinum',
        tips: [
          'Biodegradable organic balloon garlands without plastic micro-clips.',
          'Custom wooden animal toy favors replace cheap plastic trinkets.',
        ],
      },
    },
    planSections: [
      {
        id: 'sec_b1',
        sectionKey: 'overview',
        title: 'Party Vision',
        content: "A gentle, toddler-friendly 1st birthday party celebrating Ananya with warm earthy tones, wooden animal decor, and organic treats.",
        lastUpdated: '2026-10-18T14:00:00Z',
        versions: [],
      },
    ],
    budgetAllocations: [
      { category: 'Food & Cake', targetPercentage: 35 },
      { category: 'Venue / Rental', targetPercentage: 25 },
      { category: 'Theme Decor & Balloons', targetPercentage: 18 },
      { category: 'Entertainment & Games', targetPercentage: 12 },
      { category: 'Return Gifts & Favors', targetPercentage: 10 },
    ],
    budgetItems: [
      {
        id: 'bb1',
        category: 'Food & Cake',
        name: '3-Tier Eggless Safari Themed Cake + Mini Cupcakes',
        vendorName: 'The Sweet Studio Bandra',
        estimatedAmountMinor: 3325000, // ₹33,250
        actualAmountMinor: 3200000,
        paidAmountMinor: 3200000,
        status: 'paid',
        dueDate: '2026-11-01',
      },
    ],
    savingsSuggestions: [],
    tasks: [
      {
        id: 'tsk_b1',
        title: 'Confirm Soft Play Mat & Toddler Ball Pit Rental Delivery',
        deadline: '2026-11-02',
        phase: 'Booking & Vendors',
        priority: 'high',
        status: 'not_started',
        dependencies: [],
        assignee: 'Meera Sharma',
      },
    ],
    vendors: [],
    guests: [],
    seatingTables: [],
    themes: [],
    menu: [],
    venues: [],
    runOfShow: [],
    issues: [],
    chatHistory: [],
  },
];

export function getStoredEvents(): EventFull[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read from localStorage, using initial demo data', err);
  }
  saveEvents(INITIAL_DEMO_EVENTS);
  return INITIAL_DEMO_EVENTS;
}

export function saveEvents(events: EventFull[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event('event_ai_data_updated'));
  } catch (err) {
    console.error('Failed to save events to localStorage', err);
  }
}

export function getEventById(id: string): EventFull | undefined {
  const events = getStoredEvents();
  return events.find((e) => e.details.id === id);
}

export function upsertEvent(event: EventFull): void {
  const events = getStoredEvents();
  const idx = events.findIndex((e) => e.details.id === event.details.id);
  if (idx >= 0) {
    events[idx] = {
      ...event,
      details: {
        ...event.details,
        updatedAt: new Date().toISOString(),
      },
    };
  } else {
    events.unshift(event);
  }
  saveEvents(events);
}

export function deleteEventById(id: string): EventFull | undefined {
  const events = getStoredEvents();
  const target = events.find((e) => e.details.id === id);
  const filtered = events.filter((e) => e.details.id !== id);
  saveEvents(filtered);
  return target;
}

export function resetDemoEvents(): void {
  saveEvents(INITIAL_DEMO_EVENTS);
}
