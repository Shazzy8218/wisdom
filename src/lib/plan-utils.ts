// Plan utilities — centralized plan checks
// TEMP MODE: All users treated as Pro until real subscriptions are implemented

/**
 * Always returns true during temp mode.
 * When real subscriptions are added, this will check the user's actual plan.
 */
export function isProUser(_plan?: string): boolean {
  // TEMP MODE — all features unlocked for all users
  return true;
}

/**
 * Returns the effective plan label for display purposes.
 */
export function getEffectivePlan(_plan?: string): string {
  return "Operator";
}
