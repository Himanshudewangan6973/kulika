import { unifiedMemberSchema, submissionSchema } from './memberSchema'
import { ZodError } from 'zod'

/**
 * Validates inbox submission data
 * Returns { valid: boolean, errors?: string[], data?: unknown }
 */
export function validateInboxSubmission(submission: any) {
  const { submission_type, raw_data } = submission

  try {
    if (submission_type === 'New Member') {
      const validated = raw_data?.submitterName && raw_data?.submitterEmail
        ? submissionSchema.parse(raw_data)
        : unifiedMemberSchema.parse(raw_data)

      return { valid: true, data: validated }
    } else {
      return { valid: false, errors: [`Unknown submission type: ${submission_type}`] }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.')
        return `${path}: ${e.message}`
      })
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}

/**
 * Formats validation errors for user-friendly display
 */
export function formatValidationErrors(errors: string[]): string {
  return errors.join('\n• ')
}
