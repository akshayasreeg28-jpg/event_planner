import { EventType } from '../types';

export interface ParsedEventSentence {
  title: string;
  type: EventType;
  city: string;
  guestCount?: number;
  budgetMinor?: number;
  budgetDisplay?: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  date?: string; // YYYY-MM-DD
  monthName?: string;
  missingFields: ('guestCount' | 'budget' | 'date' | 'city')[];
}

export function parseEventSentence(sentence: string): ParsedEventSentence {
  const text = sentence.trim();
  const lower = text.toLowerCase();

  // 1. Detect Event Type
  let type: EventType = 'wedding';
  if (lower.includes('wedding') || lower.includes('marriage') || lower.includes('sangeet') || lower.includes('mehendi') || lower.includes('reception') || lower.includes('engagement')) {
    type = 'wedding';
  } else if (lower.includes('fest') || lower.includes('symposium') || lower.includes('hackathon') || lower.includes('college') || lower.includes('campus')) {
    type = 'college_fest';
  } else if (lower.includes('birthday') || lower.includes('bday') || lower.includes('1st year') || lower.includes('kids party')) {
    type = 'birthday';
  } else if (lower.includes('anniversary') || lower.includes('silver jubilee') || lower.includes('golden jubilee')) {
    type = 'anniversary';
  } else if (lower.includes('conference') || lower.includes('corporate') || lower.includes('keynote') || lower.includes('summit') || lower.includes('annual meeting')) {
    type = 'corporate';
  } else if (lower.includes('diwali') || lower.includes('holi') || lower.includes('festival') || lower.includes('dandiya') || lower.includes('eid') || lower.includes('christmas')) {
    type = 'festival';
  } else if (lower.includes('charity') || lower.includes('community') || lower.includes('fundraiser') || lower.includes('ngo')) {
    type = 'community';
  }

  // 2. Detect City
  const knownCities = [
    'Chennai', 'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'New Delhi', 'Hyderabad',
    'Kolkata', 'Pune', 'Goa', 'Jaipur', 'Udaipur', 'Kochi', 'Cochin', 'Coimbatore',
    'Ahmedabad', 'Lucknow', 'Chandigarh', 'Indore', 'Bhopal', 'Nagpur', 'Varanasi',
    'London', 'New York', 'Dubai', 'Singapore', 'San Francisco', 'Paris'
  ];
  let foundCity = '';
  for (const c of knownCities) {
    const reg = new RegExp(`\\b${c}\\b`, 'i');
    if (reg.test(text)) {
      foundCity = c === 'Bangalore' ? 'Bengaluru' : c === 'Cochin' ? 'Kochi' : c;
      break;
    }
  }

  // 3. Detect Guests
  let guestCount: number | undefined;
  const guestMatch = text.match(/(\d+)\s*(guests?|people|pax|attendees|members|invitees)\b/i) ||
                     text.match(/\b(for|with)\s+(\d+)\s*(people|guests|pax)?/i);
  if (guestMatch) {
    const num = parseInt(guestMatch[1] || guestMatch[2], 10);
    if (!isNaN(num) && num > 0) guestCount = num;
  }

  // 4. Detect Budget & Currency
  let budgetMinor: number | undefined;
  let budgetDisplay: string | undefined;
  let currency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR';

  // Check currency
  if (text.includes('$') || lower.includes('usd') || lower.includes('dollar')) currency = 'USD';
  else if (text.includes('€') || lower.includes('eur') || lower.includes('euro')) currency = 'EUR';
  else if (text.includes('£') || lower.includes('gbp') || lower.includes('pound')) currency = 'GBP';

  // Check Indian Lakh / Cr formats e.g. "8 lakh", "₹8L", "1.5 crore", "15L", "₹50,000", "$10,000"
  const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)\b/i);
  const crMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i);
  const kMatch = text.match(/(?:₹|\$|€|£|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/i);
  const plainCurrencyMatch = text.match(/(?:₹|\$|€|£|rs\.?)\s*([\d,]+)/i);

  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    budgetMinor = Math.round(val * 100000 * 100);
    budgetDisplay = `₹${val} Lakh`;
  } else if (crMatch) {
    const val = parseFloat(crMatch[1]);
    budgetMinor = Math.round(val * 10000000 * 100);
    budgetDisplay = `₹${val} Crore`;
  } else if (kMatch) {
    const val = parseFloat(kMatch[1]);
    budgetMinor = Math.round(val * 1000 * 100);
    budgetDisplay = currency === 'INR' ? `₹${val}k` : `${currency} ${val}k`;
  } else if (plainCurrencyMatch) {
    const clean = plainCurrencyMatch[1].replace(/,/g, '');
    const val = parseInt(clean, 10);
    if (!isNaN(val)) {
      budgetMinor = val * 100;
      budgetDisplay = `${currency} ${val.toLocaleString()}`;
    }
  }

  // 5. Detect Date or Month
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  let monthName = '';
  let date: string | undefined;

  for (let m = 0; m < months.length; m++) {
    const mon = months[m];
    const shortMon = mon.slice(0, 3);
    const reg = new RegExp(`\\b(${mon}|${shortMon})\\b`, 'i');
    if (reg.test(text)) {
      monthName = mon.charAt(0).toUpperCase() + mon.slice(1);
      // Pick middle of next matching month
      const currentYear = new Date().getFullYear();
      const monthIndex = m;
      const targetYear = monthIndex < new Date().getMonth() ? currentYear + 1 : currentYear;
      const padM = String(monthIndex + 1).padStart(2, '0');
      date = `${targetYear}-${padM}-15`;
      break;
    }
  }

  // Fallback title cleaning
  let title = text.split(/[,;.]/)[0].trim();
  if (title.length < 5) {
    title = `${foundCity ? foundCity + ' ' : ''}${type.replace('_', ' ').toUpperCase()} Celebration`;
  }

  // Determine missing fields to ask user
  const missingFields: ('guestCount' | 'budget' | 'date' | 'city')[] = [];
  if (!foundCity) missingFields.push('city');
  if (!guestCount) missingFields.push('guestCount');
  if (!budgetMinor) missingFields.push('budget');
  if (!date) missingFields.push('date');

  return {
    title,
    type,
    city: foundCity || 'Chennai',
    guestCount,
    budgetMinor,
    budgetDisplay,
    currency,
    date,
    monthName,
    missingFields,
  };
}
