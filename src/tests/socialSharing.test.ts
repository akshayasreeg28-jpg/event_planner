import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSocialShareUrls,
  getDefaultShareCaption,
  generateEventSchemaJsonLd,
  getEventPublicUrl,
} from '../lib/socialSharing.ts';
import { EventFull } from '../types/index.ts';

function createMockEvent(overrides: Partial<EventFull> = {}): EventFull {
  return {
    details: {
      id: 'evt_sample_01',
      title: 'Aarav & Meera — Garden Engagement Ceremony',
      type: 'wedding',
      date: '2026-12-10',
      startTime: '10:00',
      endTime: '16:00',
      city: 'Hyderabad',
      venueName: 'Taj Falaknuma Palace',
      venueType: 'hybrid',
      estimatedGuestCount: 180,
      totalBudgetMinor: 35000000,
      currency: 'INR',
      dietaryPreferences: ['Strict Vegetarian'],
      ownerId: 'usr_sample',
      collaborators: [],
      status: 'planning',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552',
      ecoScore: { score: 85, rating: 'Gold', tips: ['Natural decor'] },
      ...overrides.details,
    },
    planSections: [
      {
        id: 'sec_1',
        sectionKey: 'overview',
        title: 'Executive Summary',
        content: 'A vibrant garden engagement in Hyderabad with authentic Telugu delicacies.',
        lastUpdated: '2026-10-01T00:00:00Z',
        versions: [],
      },
    ],
    budgetAllocations: [],
    budgetItems: [],
    savingsSuggestions: [],
    tasks: [],
    vendors: [],
    guests: [],
    seatingTables: [],
    themes: [],
    menu: [],
    venues: [],
    runOfShow: [],
    issues: [],
    chatHistory: [],
    ...overrides,
  };
}

describe('Social Media Sharing & Preview Card URL Engine', () => {
  test('generates valid Twitter / X intent URL with title, URL, and hashtags', () => {
    const event = createMockEvent();
    const urls = generateSocialShareUrls({
      event,
      baseUrl: 'https://event-ai.app',
    });

    assert.ok(urls.twitter.startsWith('https://twitter.com/intent/tweet?'));
    const parsed = new URL(urls.twitter);
    assert.equal(parsed.searchParams.get('url'), 'https://event-ai.app/share/evt_sample_01');
    assert.ok(parsed.searchParams.get('text')?.includes('Aarav & Meera'));
    assert.ok(parsed.searchParams.get('hashtags')?.includes('wedding'));
  });

  test('generates valid Facebook share dialog URL with public link and quote', () => {
    const event = createMockEvent();
    const urls = generateSocialShareUrls({
      event,
      baseUrl: 'https://event-ai.app',
    });

    assert.ok(urls.facebook.startsWith('https://www.facebook.com/sharer/sharer.php?'));
    const parsed = new URL(urls.facebook);
    assert.equal(parsed.searchParams.get('u'), 'https://event-ai.app/share/evt_sample_01');
    assert.ok(parsed.searchParams.get('quote')?.includes('Aarav & Meera'));
  });

  test('generates valid WhatsApp intent URL with caption and link included', () => {
    const event = createMockEvent();
    const urls = generateSocialShareUrls({
      event,
      baseUrl: 'https://event-ai.app',
    });

    assert.ok(urls.whatsapp.startsWith('https://api.whatsapp.com/send?text='));
    const encodedText = urls.whatsapp.replace('https://api.whatsapp.com/send?text=', '');
    const decoded = decodeURIComponent(encodedText);
    assert.ok(decoded.includes('Aarav & Meera'));
    assert.ok(decoded.includes('https://event-ai.app/share/evt_sample_01'));
  });

  test('generates valid LinkedIn share dialog URL', () => {
    const event = createMockEvent();
    const urls = generateSocialShareUrls({
      event,
      baseUrl: 'https://event-ai.app',
    });

    assert.ok(urls.linkedin.startsWith('https://www.linkedin.com/sharing/share-offsite/?'));
    const parsed = new URL(urls.linkedin);
    assert.equal(parsed.searchParams.get('url'), 'https://event-ai.app/share/evt_sample_01');
  });

  test('supports custom host message override for social captions', () => {
    const event = createMockEvent();
    const customMessage = 'We cannot wait to celebrate with everyone! Save the date.';
    const urls = generateSocialShareUrls({
      event,
      customMessage,
      baseUrl: 'https://event-ai.app',
    });

    const parsedTwitter = new URL(urls.twitter);
    assert.equal(parsedTwitter.searchParams.get('text'), customMessage);

    const parsedFb = new URL(urls.facebook);
    assert.equal(parsedFb.searchParams.get('quote'), customMessage);
  });

  test('generates valid Schema.org JSON-LD structured data for Event', () => {
    const event = createMockEvent();
    const jsonLd = generateEventSchemaJsonLd(event, 'https://event-ai.app');

    const parsed = JSON.parse(jsonLd);
    assert.equal(parsed['@context'], 'https://schema.org');
    assert.equal(parsed['@type'], 'Event');
    assert.equal(parsed.name, 'Aarav & Meera — Garden Engagement Ceremony');
    assert.equal(parsed.location.name, 'Taj Falaknuma Palace');
    assert.equal(parsed.location.address.addressLocality, 'Hyderabad');
    assert.equal(parsed.offers.url, 'https://event-ai.app/share/evt_sample_01');
    assert.ok(parsed.startDate.includes('2026-12-10'));
  });
});
