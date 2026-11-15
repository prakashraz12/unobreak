/**
 * Generates a random user ID between 0 and 999,999,999
 * @returns A random 9-digit user ID
 */
export function generateUserId(): number {
  return Math.floor(Math.random() * 1000000000);
}
