const OBJECTIVE_TYPES = {
  boss_kc: 'Boss Kill Count',
  xp_gain: 'XP Gain',
  minigame: 'Mini Game',
  item_collection: 'Item Collection',
  clue_scrolls: 'Clue Scrolls',
};

const formatGP = (gp) => {
  if (!gp) return '0';
  return (gp / 1000000).toFixed(1) + 'M';
};

const formatObjectiveAmount = (node) => {
  if (!node?.objective) return '—';
  const q = node.objective.quantity ?? 0;
  switch (node.objective.type) {
    case 'xp_gain':
      return `${q.toLocaleString()} XP`;
    case 'boss_kc':
      return `${q.toLocaleString()} KC`;
    case 'minigame':
      return `${q.toLocaleString()} runs`;
    case 'item_collection':
      return `${q.toLocaleString()} collected`;
    case 'clue_scrolls':
      return `${q.toLocaleString()} clues`;
    default:
      return `${q.toLocaleString()}`;
  }
};

function applyTeamBuffToNode(node, nodeBuffs) {
  if (!node || !nodeBuffs) return node;
  const buffEntry = nodeBuffs[node.nodeId];
  if (!buffEntry?.appliedBuff) return node;
  return {
    ...node,
    objective: {
      ...node.objective,
      quantity: buffEntry.quantity,
      appliedBuff: buffEntry.appliedBuff,
    },
  };
}

function userHasNeverSubmitted(team, currentUser) {
  if (!currentUser?.discordUserId || !team?.submissions?.length) return true;
  return !team.submissions.some(
    (s) => s.submittedBy?.toString() === currentUser.discordUserId?.toString()
  );
}

export {
  OBJECTIVE_TYPES,
  applyTeamBuffToNode,
  userHasNeverSubmitted,
  formatGP,
  formatObjectiveAmount,
};
