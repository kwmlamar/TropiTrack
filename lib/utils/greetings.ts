/**
 * Greeting Utilities
 * 
 * Provides time-based greeting functions for personalized user experiences.
 * Used primarily in mobile dashboard to create a native app feel.
 */

/**
 * Gets a time-based greeting based on the current time of day.
 * 
 * Time ranges:
 * - Good morning: 5:00 AM - 11:59 AM
 * - Good afternoon: 12:00 PM - 4:59 PM
 * - Good evening: 5:00 PM - 8:59 PM
 * - Good night: 9:00 PM - 4:59 AM
 * 
 * @param date - Optional date object (defaults to current time)
 * @returns A greeting string: "Good morning", "Good afternoon", "Good evening", or "Good night"
 */
export function getTimeBasedGreeting(date?: Date): string {
  const now = date || new Date()
  const hour = now.getHours()

  // Good morning: 5:00 AM - 11:59 AM
  if (hour >= 5 && hour < 12) {
    return 'Good morning'
  }

  // Good afternoon: 12:00 PM - 4:59 PM
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  }

  // Good evening: 5:00 PM - 8:59 PM
  if (hour >= 17 && hour < 21) {
    return 'Good evening'
  }

  // Good night: 9:00 PM - 4:59 AM
  return 'Good night'
}

/**
 * Gets a personalized greeting with the user's first name.
 * 
 * @param firstName - The user's first name
 * @param date - Optional date object (defaults to current time)
 * @returns A personalized greeting string, e.g., "Good morning, Lamar"
 */
export function getPersonalizedGreeting(firstName: string, date?: Date): string {
  const greeting = getTimeBasedGreeting(date)
  return `${greeting}, ${firstName}`
}

/**
 * Extracts the first name from a full name string.
 * Handles various name formats and edge cases.
 * 
 * @param fullName - The user's full name
 * @returns The first name, or the full name if it's a single word
 * 
 * @example
 * getFirstName("Lamar Smith") // "Lamar"
 * getFirstName("John") // "John"
 * getFirstName("Mary Jane Watson") // "Mary"
 * getFirstName("") // "there"
 */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim().length === 0) {
    return 'there' // Fallback for users without a name
  }

  // Split by spaces and get the first part
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0]

  // Return the first name, or fallback if empty
  return firstName || 'there'
}

