import { useEffect, useReducer } from 'react';

export const FEATURE_FLAG_KEYS = Object.freeze({
  GIELINOR_RUSH: 'gielinorRush',
  BLIND_DRAFT: 'blindDraft',
  CHAMPION_FORGE: 'championForge',
  GROUP_DASHBOARD: 'groupDashboard',
  BATTLESHIP: 'battleship',
  WHODUNNIT: 'whodunnit',
});

export const FEATURE_FLAG_OVERRIDE = Object.freeze({
  DEFAULT: 'default',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
});

export const FEATURE_FLAG_CHANGED_EVENT = 'osrsbingo:feature-flags-changed';

const STORAGE_PREFIX = 'osrsbingo:feature-flag-overrides:v1';

// Keep the environment references explicit so Create React App includes them in the bundle.
export const FEATURE_FLAGS = Object.freeze([
  {
    key: FEATURE_FLAG_KEYS.GIELINOR_RUSH,
    label: 'Gielinor Rush',
    envName: 'REACT_APP_GR_ENABLED',
    envValue: process.env.REACT_APP_GR_ENABLED,
    effects: [
      'Shows Gielinor Rush creation and Active Events links in navigation, the profile creation card, and its FAQ/About/release content.',
      'Enables the full /gielinor-rush dashboard plus /active, event, and team routes. Disabled operational routes redirect home.',
      'The /gielinor-rush overview and /gielinor-rush/guide remain public as Learn More content when this is off.',
    ],
  },
  {
    key: FEATURE_FLAG_KEYS.BLIND_DRAFT,
    label: 'Blind Draft',
    envName: 'REACT_APP_DRAFT_ENABLED',
    envValue: process.env.REACT_APP_DRAFT_ENABLED,
    effects: [
      'Shows Blind Draft on the homepage, in the Tools navigation/profile sections, and in the FAQ.',
      'Enables the dashboard, room creation, live room, and results routes under /blind-draft.',
      'When off, every /blind-draft route redirects home, including shared room and results links.',
    ],
  },
  {
    key: FEATURE_FLAG_KEYS.CHAMPION_FORGE,
    label: 'Champion Forge',
    envName: 'REACT_APP_CF_ENABLED',
    envValue: process.env.REACT_APP_CF_ENABLED,
    effects: [
      'Changes Champion Forge from a Soon/Learn More preview to an available feature across navigation, profile, stats, FAQ, About, changelog, and promotional banners.',
      'Enables event, barracks, battle, refs, and Battle Gallery routes. Disabled operational routes redirect to the Champion Forge overview.',
      'The /champion-forge overview and /champion-forge/guide remain public as preview content when this is off.',
    ],
  },
  {
    key: FEATURE_FLAG_KEYS.GROUP_DASHBOARD,
    label: 'Group Dashboard',
    envName: 'REACT_APP_GROUP_ENABLED',
    envValue: process.env.REACT_APP_GROUP_ENABLED,
    effects: [
      'Shows Group Dashboard on the homepage, navigation, profile, site stats, and FAQ, and enables unread group-notification polling.',
      'Enables group listing, creation, dashboards, management, competitions, activity, and embedded widget routes.',
      'When off, every /group route redirects home, including public dashboards and embedded widgets.',
    ],
  },
  {
    key: FEATURE_FLAG_KEYS.BATTLESHIP,
    label: 'Battleship',
    envName: 'REACT_APP_BS_ENABLED',
    envValue: process.env.REACT_APP_BS_ENABLED,
    effects: [
      'Changes Battleship from a Soon/Learn More preview to an available feature across navigation, profile, changelog, support copy, and promotional banners.',
      'Enables event creation and event, refs, and admin routes. Disabled operational routes redirect home.',
      'The /battleship overview and /battleship/guide remain public as Learn More content when this is off.',
    ],
  },
  {
    key: FEATURE_FLAG_KEYS.WHODUNNIT,
    label: 'A Gielinor Whodunnit',
    envName: 'REACT_APP_WHODUNNIT_ENABLED',
    envValue: process.env.REACT_APP_WHODUNNIT_ENABLED,
    effects: [
      'Enables all authenticated Whodunnit landing, creation, campaign, completion, admin, and playground routes.',
      'For non-admins, navigation and profile promotion only appear December 15–31, but direct authenticated access works year-round while enabled.',
      'A site admin who forces it on sees the seasonal navigation year-round; forcing it off hides promotion and blocks every Whodunnit route.',
    ],
  },
]);

const flagsByKey = Object.fromEntries(FEATURE_FLAGS.map((flag) => [flag.key, flag]));

const parseEnvironmentFlag = (value) => String(value).toLowerCase() === 'true';

const storageKeyFor = (user) => `${STORAGE_PREFIX}:${user?.id}`;

const readOverrides = (user) => {
  if (!user?.admin || !user?.id || typeof window === 'undefined') return {};

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKeyFor(user)) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
};

const writeOverrides = (user, overrides) => {
  if (!user?.admin || !user?.id || typeof window === 'undefined') return false;

  const key = storageKeyFor(user);
  try {
    if (Object.keys(overrides).length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(overrides));
  } catch {
    return false;
  }

  window.dispatchEvent(
    new CustomEvent(FEATURE_FLAG_CHANGED_EVENT, { detail: { userId: user.id } })
  );
  return true;
};

export const isEnvironmentFeatureEnabled = (flagKey) => {
  const flag = flagsByKey[flagKey];
  if (!flag) return false;
  return parseEnvironmentFlag(flag.envValue);
};

export const getFeatureFlagOverride = (flagKey, user) => {
  if (!flagsByKey[flagKey] || !user?.admin) return FEATURE_FLAG_OVERRIDE.DEFAULT;

  const override = readOverrides(user)[flagKey];
  return Object.values(FEATURE_FLAG_OVERRIDE).includes(override)
    ? override
    : FEATURE_FLAG_OVERRIDE.DEFAULT;
};

export const setFeatureFlagOverride = (flagKey, override, user) => {
  if (!flagsByKey[flagKey] || !user?.admin) return false;
  if (!Object.values(FEATURE_FLAG_OVERRIDE).includes(override)) return false;

  const overrides = readOverrides(user);
  if (override === FEATURE_FLAG_OVERRIDE.DEFAULT) delete overrides[flagKey];
  else overrides[flagKey] = override;
  return writeOverrides(user, overrides);
};

export const clearFeatureFlagOverrides = (user) => {
  if (!user?.admin) return false;
  return writeOverrides(user, {});
};

export const isFeatureEnabled = (flagKey, user) => {
  const environmentEnabled = isEnvironmentFeatureEnabled(flagKey);

  // Non-admins always receive exactly the value bundled into this environment.
  if (!user?.admin) return environmentEnabled;

  const override = getFeatureFlagOverride(flagKey, user);
  if (override === FEATURE_FLAG_OVERRIDE.ENABLED) return true;
  if (override === FEATURE_FLAG_OVERRIDE.DISABLED) return false;
  return environmentEnabled;
};

// Subscribe wherever an already-mounted surface needs to update immediately
// after an override changes in this or another browser tab.
export const useFeatureFlagRevision = () => {
  const [, refresh] = useReducer((value) => value + 1, 0);

  useEffect(() => {
    const handleChange = () => refresh();
    window.addEventListener(FEATURE_FLAG_CHANGED_EVENT, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener(FEATURE_FLAG_CHANGED_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);
};

export const isGielinorRushEnabled = (user) =>
  isFeatureEnabled(FEATURE_FLAG_KEYS.GIELINOR_RUSH, user);

export const isBlindDraftEnabled = (user) => isFeatureEnabled(FEATURE_FLAG_KEYS.BLIND_DRAFT, user);

export const isChampionForgeEnabled = (user) =>
  isFeatureEnabled(FEATURE_FLAG_KEYS.CHAMPION_FORGE, user);

export const isGroupDashboardEnabled = (user) =>
  isFeatureEnabled(FEATURE_FLAG_KEYS.GROUP_DASHBOARD, user);

export const isBattleshipEnabled = (user) => isFeatureEnabled(FEATURE_FLAG_KEYS.BATTLESHIP, user);

export const isWhodunnitEnabled = (user) => isFeatureEnabled(FEATURE_FLAG_KEYS.WHODUNNIT, user);
