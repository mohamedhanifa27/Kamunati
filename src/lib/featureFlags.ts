/**
 * Feature Flags — Space Gradients Edition
 * All flags default OFF. Enable via env vars or site settings.
 * In development (NODE_ENV=development) all flags default ON.
 */

const isDev = process.env.NODE_ENV === 'development';

function flag(envKey: string): boolean {
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] === 'true' || process.env[envKey] === '1';
  }
  return isDev; // ON in dev, OFF in production unless explicitly set
}

export const featureFlags = {
  ambientBackground:  flag('FLAG_AMBIENT_BACKGROUND'),
  cardSounds:         flag('FLAG_CARD_SOUNDS'),
  hoverBanner:        flag('FLAG_HOVER_BANNER'),
  categoryNav:        flag('FLAG_CATEGORY_NAV'),
  newBottomNav:       flag('FLAG_NEW_BOTTOM_NAV'),
  singleProfile:      flag('FLAG_SINGLE_PROFILE'),
  searchCard:         flag('FLAG_SEARCH_CARD'),
  reviews:            flag('FLAG_REVIEWS'),
  adminUserTools:     flag('FLAG_ADMIN_USER_TOOLS'),
  settingsPage:       flag('FLAG_SETTINGS_PAGE'),
  profilePage:        flag('FLAG_PROFILE_PAGE'),
} as const;

export type FeatureFlags = typeof featureFlags;
export type FeatureFlagKey = keyof FeatureFlags;
