// organisms/TreasureHunt/CreateTreasureTeamModal.test.jsx
// Tests for CreateTreasureTeamModal validation helpers:
//   isValidDiscordId, getMemberConflict, getDuplicateInForm

// ── Pure-function extraction ───────────────────────────────────────────────────
//
// isValidDiscordId is a module-level function in CreateTreasureTeamModal.jsx.
// getMemberConflict and getDuplicateInForm are closures over existingTeams /
// formData respectively.  We reproduce them here so we can test the logic
// without rendering the full modal (which requires Apollo, toasts, images, etc.)

function isValidDiscordId(id) {
  return /^\d{17,19}$/.test(id);
}

function buildMemberMap(existingTeams) {
  const map = new Map();
  existingTeams.forEach((team) => {
    team.members?.forEach((member) => {
      map.set(member.discordUserId, team.teamName);
    });
  });
  return map;
}

function getMemberConflict(memberId, existingMemberMap) {
  if (!memberId || !isValidDiscordId(memberId)) return null;
  return existingMemberMap.get(memberId) || null;
}

function getDuplicateInForm(memberId, currentIndex, members) {
  if (!memberId || !isValidDiscordId(memberId)) return false;
  return members.some((m, idx) => idx !== currentIndex && m === memberId);
}

// ── isValidDiscordId ──────────────────────────────────────────────────────────

describe('isValidDiscordId', () => {
  it('accepts a valid 17-digit ID', () => {
    expect(isValidDiscordId('12345678901234567')).toBe(true);
  });

  it('accepts a valid 18-digit ID', () => {
    expect(isValidDiscordId('123456789012345678')).toBe(true);
  });

  it('accepts a valid 19-digit ID', () => {
    expect(isValidDiscordId('1234567890123456789')).toBe(true);
  });

  it('rejects a 16-digit ID (too short)', () => {
    expect(isValidDiscordId('1234567890123456')).toBe(false);
  });

  it('rejects a 20-digit ID (too long)', () => {
    expect(isValidDiscordId('12345678901234567890')).toBe(false);
  });

  it('rejects IDs with non-numeric characters', () => {
    expect(isValidDiscordId('1234567890123456a')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidDiscordId('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidDiscordId(null)).toBe(false);
  });

  it('rejects a username-style string', () => {
    expect(isValidDiscordId('CoolUser#1234')).toBe(false);
  });
});

// ── getMemberConflict ─────────────────────────────────────────────────────────

describe('getMemberConflict', () => {
  const existingTeams = [
    { teamName: 'Alpha', members: [{ discordUserId: '111111111111111111' }] },
    { teamName: 'Beta', members: [{ discordUserId: '222222222222222222' }] },
  ];
  const memberMap = buildMemberMap(existingTeams);

  it('returns null for an ID not on any team', () => {
    expect(getMemberConflict('333333333333333333', memberMap)).toBeNull();
  });

  it('returns the team name when the ID is already on a team', () => {
    expect(getMemberConflict('111111111111111111', memberMap)).toBe('Alpha');
  });

  it('returns the correct team for a second existing member', () => {
    expect(getMemberConflict('222222222222222222', memberMap)).toBe('Beta');
  });

  it('returns null for an invalid (non-numeric) ID — not looked up', () => {
    expect(getMemberConflict('notanid', memberMap)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getMemberConflict('', memberMap)).toBeNull();
  });

  it('returns null for null', () => {
    expect(getMemberConflict(null, memberMap)).toBeNull();
  });

  it('returns null when existingTeams is empty', () => {
    expect(getMemberConflict('111111111111111111', new Map())).toBeNull();
  });
});

// ── getDuplicateInForm ────────────────────────────────────────────────────────

describe('getDuplicateInForm', () => {
  const members = [
    '111111111111111111',
    '222222222222222222',
    '111111111111111111', // duplicate of index 0
  ];

  it('returns false for a unique member at index 0', () => {
    // ID '222...' appears only at index 1
    expect(getDuplicateInForm('222222222222222222', 1, members)).toBe(false);
  });

  it('returns true when the same ID appears at another index', () => {
    // ID at index 2 duplicates index 0
    expect(getDuplicateInForm('111111111111111111', 2, members)).toBe(true);
  });

  it('returns true when the same ID appears earlier in the list', () => {
    expect(getDuplicateInForm('111111111111111111', 0, members)).toBe(true);
  });

  it('returns false for an empty-string member', () => {
    expect(getDuplicateInForm('', 0, members)).toBe(false);
  });

  it('returns false for null', () => {
    expect(getDuplicateInForm(null, 0, members)).toBe(false);
  });

  it('returns false for an invalid (short) ID', () => {
    expect(getDuplicateInForm('123', 0, members)).toBe(false);
  });

  it('does not flag self when comparing at same index', () => {
    // Index 0 checks against everyone except index 0, so '111...' at index 0
    // is NOT a duplicate of itself — but it IS duplicated at index 2.
    // Testing with a list where the ID appears only once:
    const uniqueMembers = ['111111111111111111', '222222222222222222'];
    expect(getDuplicateInForm('111111111111111111', 0, uniqueMembers)).toBe(false);
  });
});
