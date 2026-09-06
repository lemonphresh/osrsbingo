const ORIGINAL_GR_FLAG = process.env.REACT_APP_GR_ENABLED;

const loadFeatureFlags = (environmentValue) => {
  jest.resetModules();
  process.env.REACT_APP_GR_ENABLED = environmentValue;
  return require('./featureFlags');
};

describe('feature flag resolution', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterAll(() => {
    if (ORIGINAL_GR_FLAG === undefined) delete process.env.REACT_APP_GR_ENABLED;
    else process.env.REACT_APP_GR_ENABLED = ORIGINAL_GR_FLAG;
  });

  it('gives non-admins only the environment value', () => {
    const flags = loadFeatureFlags('false');
    const admin = { id: '1', admin: true };

    flags.setFeatureFlagOverride(
      flags.FEATURE_FLAG_KEYS.GIELINOR_RUSH,
      flags.FEATURE_FLAG_OVERRIDE.ENABLED,
      admin
    );

    expect(flags.isGielinorRushEnabled(admin)).toBe(true);
    expect(flags.isGielinorRushEnabled({ id: '1', admin: false })).toBe(false);
    expect(flags.isGielinorRushEnabled(null)).toBe(false);
  });

  it('lets an admin force a flag off and return to the environment value', () => {
    const flags = loadFeatureFlags('true');
    const admin = { id: '7', admin: true };

    expect(flags.isGielinorRushEnabled(admin)).toBe(true);

    flags.setFeatureFlagOverride(
      flags.FEATURE_FLAG_KEYS.GIELINOR_RUSH,
      flags.FEATURE_FLAG_OVERRIDE.DISABLED,
      admin
    );
    expect(flags.isGielinorRushEnabled(admin)).toBe(false);

    flags.setFeatureFlagOverride(
      flags.FEATURE_FLAG_KEYS.GIELINOR_RUSH,
      flags.FEATURE_FLAG_OVERRIDE.DEFAULT,
      admin
    );
    expect(flags.isGielinorRushEnabled(admin)).toBe(true);
  });

  it('scopes overrides to the admin account', () => {
    const flags = loadFeatureFlags('false');
    const firstAdmin = { id: '11', admin: true };
    const secondAdmin = { id: '12', admin: true };

    flags.setFeatureFlagOverride(
      flags.FEATURE_FLAG_KEYS.GIELINOR_RUSH,
      flags.FEATURE_FLAG_OVERRIDE.ENABLED,
      firstAdmin
    );

    expect(flags.isGielinorRushEnabled(firstAdmin)).toBe(true);
    expect(flags.isGielinorRushEnabled(secondAdmin)).toBe(false);
  });

  it('limits Whodunnit season to December 15 through December 31', () => {
    const flags = loadFeatureFlags('false');

    expect(flags.isWhodunnitSeason(new Date(2026, 11, 14))).toBe(false);
    expect(flags.isWhodunnitSeason(new Date(2026, 11, 15))).toBe(true);
    expect(flags.isWhodunnitSeason(new Date(2026, 11, 31))).toBe(true);
    expect(flags.isWhodunnitSeason(new Date(2027, 0, 1))).toBe(false);
  });
});
