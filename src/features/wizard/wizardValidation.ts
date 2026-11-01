import { z } from 'zod';

export const step1Schema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(120, { message: 'Title must not exceed 120 characters' }),
  type: z.enum([
    'wedding',
    'birthday',
    'anniversary',
    'college_fest',
    'corporate',
    'festival',
    'community',
  ]),
  date: z
    .string()
    .min(1, { message: 'Please select a valid event date' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  durationHours: z
    .number({ message: 'Duration must be a number' })
    .min(1, { message: 'Duration must be at least 1 hour' })
    .max(72, { message: 'Duration cannot exceed 72 hours' }),
});

export const step2Schema = z.object({
  city: z
    .string()
    .min(2, { message: 'City/Region must be at least 2 characters' })
    .max(100, { message: 'City name too long' }),
  venueType: z.enum(['indoor', 'outdoor', 'hybrid']),
  venueName: z.string().optional(),
});

export const step3Schema = z.object({
  guestCount: z
    .number({ message: 'Guest count must be a number' })
    .min(1, { message: 'Minimum 1 attendee required' })
    .max(50000, { message: 'Maximum 50,000 attendees supported' }),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  budgetInput: z
    .string()
    .min(1, { message: 'Please enter a target budget' })
    .refine(
      (val) => {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        return !isNaN(num) && num > 0;
      },
      { message: 'Budget must be a positive number' }
    ),
});

export const step4Schema = z.object({
  themePreference: z
    .string()
    .min(3, { message: 'Theme description must be at least 3 characters' }),
});

export const step5Schema = z.object({
  dietaryPreferences: z
    .array(z.string())
    .min(1, { message: 'Select at least one dining/dietary preference' }),
});

export const step6Schema = z.object({
  culturalTraditions: z.string().optional(),
  specialRequests: z.string().optional(),
  weddingFunctionsCount: z.number().optional(),
  corporateAVNeeds: z.string().optional(),
  collegePermissionsNeeded: z.string().optional(),
});

export const fullWizardSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema);

export type WizardFormData = z.infer<typeof fullWizardSchema>;
