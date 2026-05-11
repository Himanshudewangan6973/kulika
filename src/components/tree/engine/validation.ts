import { z } from 'zod';

export const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).default('other'),
  isDeceased: z.boolean().default(false),
  deathDate: z.string().optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;

export const relativeSchema = z.object({
  memberData: memberSchema,
  relationshipType: z.enum([
    'parent', 
    'spouse', 
    'child', 
    'sibling', 
    'unknown'
  ]),
  notes: z.string().optional(),
});

export type RelativeFormData = z.infer<typeof relativeSchema>;
