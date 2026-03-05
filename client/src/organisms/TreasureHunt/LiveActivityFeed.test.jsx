// organisms/TreasureHunt/LiveActivityFeed.test.jsx
// Tests for the pure helper functions inside LiveActivityFeed:
//   getTeamInitials, formatGP, formatTimeAgo, getActivityTitle, getActivityDescription

// ── Pure-function extraction ───────────────────────────────────────────────────
//
// These helpers are defined inside the component and are not exported.  We
// reproduce their exact implementations here so we can unit-test the logic
// independently from React rendering.

const getTeamInitials = (teamName) => {
  const words = teamName.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return teamName.substring(0, 2).toUpperCase();
};

const formatGP = (gp) => {
  if (!gp) return '0';
  if (gp >= 1000000) return (gp / 1000000).toFixed(1) + 'M';
  if (gp >= 1000) return (gp / 1000).toFixed(0) + 'K';
  return gp.toString();
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return timestamp.toLocaleDateString();
};

const getActivityTitle = (activity) => {
  switch (activity.type) {
    case 'team_victory':
      return `⚡ ${activity.team.teamName} HAS FINISHED ALL NODES!`;
    case 'node_completed':
      return `🎯 ${activity.team.teamName} completed a node!`;
    case 'inn_visited':
      return `🏪 ${activity.team.teamName} visited an Inn!`;
    case 'gp_gained':
      return `💰 ${activity.team.teamName} earned GP!`;
    case 'submission_approved':
      return `✅ ${activity.team.teamName} submission approved!`;
    case 'submission_denied':
      return `❌ ${activity.team.teamName} submission denied`;
    case 'team_created':
      return `👥 ${activity.team.teamName} joined!`;
    case 'buff_applied':
      return `✨ ${activity.team.teamName} used a buff!`;
    default:
      return `⚡ ${activity.team.teamName} activity`;
  }
};

const getActivityDescription = (activity) => {
  switch (activity.type) {
    case 'node_completed': {
      const diffText =
        activity.difficulty === 1
          ? 'Easy'
          : activity.difficulty === 3
          ? 'Medium'
          : activity.difficulty === 5
          ? 'Hard'
          : '';
      return `${diffText} ${activity.nodeTitle} (+${formatGP(activity.reward)} GP)`;
    }
    case 'inn_visited': {
      const keysText = Array.isArray(activity.keysSpent)
        ? `${activity.keysSpent.reduce((sum, k) => sum + k.quantity, 0)} keys`
        : null;
      if (!keysText) return undefined;
      return `Spent ${keysText} for ${formatGP(activity.gpEarned)} GP`;
    }
    case 'submission_approved':
      return `${activity.nodeTitle} submission approved by ${activity.reviewedBy}`;
    case 'submission_denied':
      return `${activity.nodeTitle} - ${activity.denialReason || 'No reason provided'}`;
    case 'team_created':
      return `Joined the competition with ${activity.memberCount} members`;
    case 'buff_applied':
      return `Applied ${activity.buffName} to ${activity.nodeName}`;
    case 'gp_gained':
      return `+${formatGP(activity.amount)} GP (Total: ${formatGP(activity.newTotal)})`;
    case 'team_victory':
      return `Completed all nodes with ${formatGP(activity.finalGP)} GP! ${
        activity.isFirstToFinish ? '🥇 First to finish!' : ''
      }`;
    default:
      return '';
  }
};

// ── getTeamInitials ───────────────────────────────────────────────────────────

describe('getTeamInitials', () => {
  it('returns first two letters of single-word name (uppercased)', () => {
    expect(getTeamInitials('Dragons')).toBe('DR');
  });

  it('returns initials of first two words for multi-word name', () => {
    expect(getTeamInitials('Dragon Slayers')).toBe('DS');
  });

  it('handles three-word names (uses first two words)', () => {
    expect(getTeamInitials('Red Dragon Warriors')).toBe('RD');
  });

  it('uppercases result', () => {
    expect(getTeamInitials('alpha beta')).toBe('AB');
  });
});

// ── formatGP ─────────────────────────────────────────────────────────────────

describe('formatGP', () => {
  it('returns "0" for falsy values', () => {
    expect(formatGP(0)).toBe('0');
    expect(formatGP(null)).toBe('0');
    expect(formatGP(undefined)).toBe('0');
  });

  it('returns raw number for values under 1K', () => {
    expect(formatGP(500)).toBe('500');
    expect(formatGP(999)).toBe('999');
  });

  it('returns K-suffixed value for thousands', () => {
    expect(formatGP(1000)).toBe('1K');
    expect(formatGP(50000)).toBe('50K');
    expect(formatGP(999999)).toBe('1000K');
  });

  it('returns M-suffixed value for millions', () => {
    expect(formatGP(1000000)).toBe('1.0M');
    expect(formatGP(2500000)).toBe('2.5M');
    expect(formatGP(10000000)).toBe('10.0M');
  });
});

// ── formatTimeAgo ─────────────────────────────────────────────────────────────

describe('formatTimeAgo', () => {
  it('returns "just now" for timestamps less than 1 minute ago', () => {
    const ts = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    expect(formatTimeAgo(ts)).toBe('just now');
  });

  it('returns "Xm ago" for timestamps between 1 and 59 minutes ago', () => {
    const ts = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    expect(formatTimeAgo(ts)).toBe('5m ago');
  });

  it('returns "Xh ago" for timestamps between 1 and 23 hours ago', () => {
    const ts = new Date(Date.now() - 3 * 3600 * 1000); // 3 hours ago
    expect(formatTimeAgo(ts)).toBe('3h ago');
  });

  it('returns localeDateString for timestamps older than 24 hours', () => {
    const ts = new Date(Date.now() - 2 * 24 * 3600 * 1000); // 2 days ago
    expect(formatTimeAgo(ts)).toBe(ts.toLocaleDateString());
  });
});

// ── getActivityTitle ──────────────────────────────────────────────────────────

describe('getActivityTitle', () => {
  const team = { teamName: 'Dragon Slayers' };

  it('team_victory', () => {
    expect(getActivityTitle({ type: 'team_victory', team })).toBe(
      '⚡ Dragon Slayers HAS FINISHED ALL NODES!'
    );
  });

  it('node_completed', () => {
    expect(getActivityTitle({ type: 'node_completed', team })).toBe(
      '🎯 Dragon Slayers completed a node!'
    );
  });

  it('inn_visited', () => {
    expect(getActivityTitle({ type: 'inn_visited', team })).toBe(
      '🏪 Dragon Slayers visited an Inn!'
    );
  });

  it('submission_approved', () => {
    expect(getActivityTitle({ type: 'submission_approved', team })).toBe(
      '✅ Dragon Slayers submission approved!'
    );
  });

  it('submission_denied', () => {
    expect(getActivityTitle({ type: 'submission_denied', team })).toBe(
      '❌ Dragon Slayers submission denied'
    );
  });

  it('team_created', () => {
    expect(getActivityTitle({ type: 'team_created', team })).toBe(
      '👥 Dragon Slayers joined!'
    );
  });

  it('buff_applied', () => {
    expect(getActivityTitle({ type: 'buff_applied', team })).toBe(
      '✨ Dragon Slayers used a buff!'
    );
  });

  it('unknown type falls back to generic', () => {
    expect(getActivityTitle({ type: 'other', team })).toBe(
      '⚡ Dragon Slayers activity'
    );
  });
});

// ── getActivityDescription ────────────────────────────────────────────────────

describe('getActivityDescription', () => {
  it('node_completed — easy', () => {
    const result = getActivityDescription({
      type: 'node_completed',
      difficulty: 1,
      nodeTitle: 'Rat Catcher',
      reward: 50000,
    });
    expect(result).toBe('Easy Rat Catcher (+50K GP)');
  });

  it('node_completed — medium', () => {
    const result = getActivityDescription({
      type: 'node_completed',
      difficulty: 3,
      nodeTitle: 'Barrows',
      reward: 200000,
    });
    expect(result).toBe('Medium Barrows (+200K GP)');
  });

  it('node_completed — hard', () => {
    const result = getActivityDescription({
      type: 'node_completed',
      difficulty: 5,
      nodeTitle: 'Zulrah',
      reward: 1500000,
    });
    expect(result).toBe('Hard Zulrah (+1.5M GP)');
  });

  it('inn_visited — sums keys and shows GP', () => {
    const result = getActivityDescription({
      type: 'inn_visited',
      keysSpent: [{ quantity: 3 }, { quantity: 2 }],
      gpEarned: 100000,
    });
    expect(result).toBe('Spent 5 keys for 100K GP');
  });

  it('inn_visited — returns undefined when keysSpent is not an array', () => {
    const result = getActivityDescription({
      type: 'inn_visited',
      keysSpent: null,
      gpEarned: 50000,
    });
    expect(result).toBeUndefined();
  });

  it('submission_approved', () => {
    const result = getActivityDescription({
      type: 'submission_approved',
      nodeTitle: 'Zulrah KC',
      reviewedBy: 'AdminUser',
    });
    expect(result).toBe('Zulrah KC submission approved by AdminUser');
  });

  it('submission_denied — with reason', () => {
    const result = getActivityDescription({
      type: 'submission_denied',
      nodeTitle: 'Corp Beast',
      denialReason: 'Wrong screenshot',
    });
    expect(result).toBe('Corp Beast - Wrong screenshot');
  });

  it('submission_denied — no reason falls back', () => {
    const result = getActivityDescription({
      type: 'submission_denied',
      nodeTitle: 'Corp Beast',
      denialReason: null,
    });
    expect(result).toBe('Corp Beast - No reason provided');
  });

  it('team_created', () => {
    const result = getActivityDescription({ type: 'team_created', memberCount: 4 });
    expect(result).toBe('Joined the competition with 4 members');
  });

  it('buff_applied', () => {
    const result = getActivityDescription({
      type: 'buff_applied',
      buffName: 'Speed Boost',
      nodeName: 'Vorkath',
    });
    expect(result).toBe('Applied Speed Boost to Vorkath');
  });

  it('gp_gained', () => {
    const result = getActivityDescription({
      type: 'gp_gained',
      amount: 500000,
      newTotal: 3000000,
    });
    expect(result).toBe('+500K GP (Total: 3.0M)');
  });

  it('team_victory — first to finish', () => {
    const result = getActivityDescription({
      type: 'team_victory',
      finalGP: 5000000,
      isFirstToFinish: true,
    });
    expect(result).toBe('Completed all nodes with 5.0M GP! 🥇 First to finish!');
  });

  it('team_victory — not first to finish', () => {
    const result = getActivityDescription({
      type: 'team_victory',
      finalGP: 2000000,
      isFirstToFinish: false,
    });
    expect(result).toBe('Completed all nodes with 2.0M GP! ');
  });

  it('unknown type returns empty string', () => {
    expect(getActivityDescription({ type: 'other' })).toBe('');
  });
});
