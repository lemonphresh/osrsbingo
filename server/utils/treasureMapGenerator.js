const { v4: uuidv4 } = require('uuid');
const { buildFormattedObjectives, getDefaultContentSelections } = require('./objectiveBuilder');

// OSRS locations for placing nodes on the map
const OSRS_LOCATIONS = [
  // Misthalin
  { name: 'Lumbridge', x: 3202, y: 3218 },
  { name: 'Draynor Village', x: 3092, y: 3243 },
  { name: 'Al Kharid', x: 3293, y: 3174 },

  // Asgarnia
  { name: 'Falador', x: 2965, y: 3348 },
  { name: 'Port Sarim', x: 3029, y: 3217 },
  { name: 'Rimmington', x: 2956, y: 3224 },
  { name: 'Taverley', x: 2917, y: 3441 },
  { name: 'Burthorpe', x: 2881, y: 3534 },
  { name: 'White Wolf Mountain', x: 2845, y: 3483 },
  { name: 'Goblin Village', x: 2958, y: 3504 },

  // Kandarin
  { name: 'Catherby', x: 2808, y: 3434 },
  { name: "Seers' Village", x: 2710, y: 3475 },
  { name: 'Ardougne', x: 2570, y: 3300 },
  { name: 'Yanille', x: 2554, y: 3094 },
  { name: 'Tree Gnome Stronghold', x: 2485, y: 3424 },
  { name: 'Fishing Guild', x: 2609, y: 3390 },
  { name: 'Barbarian Village', x: 3071, y: 3410 },
  { name: 'Grand Tree', x: 2485, y: 3485 },

  // Varrock & Surroundings
  { name: 'Varrock', x: 3213, y: 3424 },
  { name: 'Edgeville', x: 3084, y: 3482 },
  { name: 'Grand Exchange', x: 3154, y: 3477 },

  // Morytania
  { name: 'Canifis', x: 3443, y: 3468 },
  { name: 'Port Phasmatys', x: 3579, y: 3466 },
  { name: 'Burgh de Rott', x: 3452, y: 3210 },
  { name: 'Darkmeyer', x: 3578, y: 3352 },
  { name: 'Slepe', x: 3654, y: 3315 },
  { name: 'Barrows', x: 3485, y: 3280 },

  // Karamja
  { name: 'Brimhaven', x: 2760, y: 3178 },
  { name: 'Shilo Village', x: 2834, y: 2995 },
  { name: 'Tai Bwo Wannai', x: 2789, y: 3065 },
  { name: 'Musa Point', x: 2913, y: 3165 },

  // Desert (Kharidian)
  { name: 'Pollnivneach', x: 3320, y: 2973 },
  { name: 'Nardah', x: 3397, y: 2911 },
  { name: 'Sophanem', x: 3257, y: 2783 },
  { name: 'Menaphos', x: 3190, y: 2760 },
  { name: 'Uzer', x: 3450, y: 3075 },

  // Fremennik Province
  { name: 'Rellekka', x: 2670, y: 3620 },
  { name: 'Neitiznot', x: 2361, y: 3751 },
  { name: 'Jatizso', x: 2424, y: 3751 },
  { name: 'Miscellania', x: 2545, y: 3820 },
  { name: 'Waterbirth Island', x: 2546, y: 3720 },

  // Tirannwn (Elf Lands)
  { name: 'Prifddinas', x: 2297, y: 3264 },
  { name: 'Lletya', x: 2355, y: 3172 },
  { name: 'Zul-Andra', x: 2200, y: 3056 },

  // Kourend
  { name: 'Shayzien', x: 1600, y: 3604 },
  { name: 'Lovakengj', x: 1590, y: 3788 },
  { name: 'Arceuus', x: 1702, y: 3778 },
  { name: 'Hosidius', x: 1807, y: 3584 },
  { name: 'Piscarilius', x: 1864, y: 3725 },
  { name: 'Wintertodt Camp', x: 1710, y: 3933 },
  { name: 'Mount Karuulm', x: 1410, y: 3726 },

  // Varlamore
  { name: 'Civitas illa Fortis', x: 1776, y: 3088 },
  { name: 'Aldarin', x: 1476, y: 2938 },

  // Islands & Special Areas
  { name: 'Fossil Island', x: 3663, y: 3769 },
  { name: 'Crandor', x: 2834, y: 3253 },
  { name: 'Entrana', x: 2834, y: 3335 },
  { name: 'Lunar Isle', x: 2119, y: 3833 },
  { name: 'Ape Atoll', x: 2788, y: 2734 },
  { name: 'Duel Arena', x: 3336, y: 3237 }, // Emir's Arena
  { name: "Champions' Guild", x: 3160, y: 3335 },
  { name: "Warriors' Guild", x: 2877, y: 3546 },
  { name: "Myths' Guild", x: 2468, y: 2850 },
  { name: 'Corsair Cove', x: 2569, y: 2864 },
  { name: 'The Great Conch', x: 3104, y: 2450 },
  { name: 'Pandemonium', x: 2875, y: 3000 },
];

const DIFFICULTY_MULTIPLIERS = {
  easy: 0.8,
  normal: 1.0,
  hard: 1.4,
  sweatlord: 2.0,
};

// ============================================================
// INN BUFF POOLS — tiered by inn progression
// Names are stored alongside buffType so the frontend can
// display them without needing to call createBuff() at runtime.
// ============================================================
const INN_BUFF_POOL_BY_TIER = {
  1: [
    { buffType: 'kill_reduction_minor', buffName: "Slayer's Edge" },
    { buffType: 'xp_reduction_minor', buffName: 'Training Efficiency' },
    { buffType: 'item_reduction_minor', buffName: 'Efficient Gathering' },
  ],
  2: [
    { buffType: 'kill_reduction_minor', buffName: "Slayer's Edge" },
    { buffType: 'kill_reduction_moderate', buffName: "Slayer's Focus" },
    { buffType: 'xp_reduction_minor', buffName: 'Training Efficiency' },
    { buffType: 'xp_reduction_moderate', buffName: 'Training Momentum' },
    { buffType: 'item_reduction_minor', buffName: 'Efficient Gathering' },
    { buffType: 'item_reduction_moderate', buffName: 'Master Gatherer' },
  ],
  3: [
    { buffType: 'kill_reduction_moderate', buffName: "Slayer's Focus" },
    { buffType: 'kill_reduction_major', buffName: "Slayer's Mastery" },
    { buffType: 'xp_reduction_moderate', buffName: 'Training Momentum' },
    { buffType: 'xp_reduction_major', buffName: 'Training Enlightenment' },
    { buffType: 'item_reduction_moderate', buffName: 'Master Gatherer' },
    { buffType: 'item_reduction_major', buffName: 'Legendary Gatherer' },
    { buffType: 'universal_moderate', buffName: 'Versatile Training' },
  ],
};

/**
 * Injects buff rewards into inn availableRewards arrays.
 * Guarantees at least 40% of inns have a buff on one purchase option.
 * Higher-tier inns get access to stronger buffs.
 *
 * @param {Array} innNodes - All INN-type nodes with availableRewards already set
 */
function injectBuffsIntoInnRewards(innNodes) {
  if (!innNodes || innNodes.length === 0) return;

  const MIN_BUFF_RATIO = 0.4;
  const minInnsWithBuff = Math.ceil(innNodes.length * MIN_BUFF_RATIO);

  // Shuffle indices so guaranteed slots are spread randomly across all inns
  const shuffledIndices = innNodes.map((_, i) => i).sort(() => Math.random() - 0.5);

  let buffedCount = 0;

  shuffledIndices.forEach((innIndex, i) => {
    const inn = innNodes[innIndex];
    if (!inn.availableRewards || inn.availableRewards.length === 0) return;

    // Guaranteed for first minInnsWithBuff, 25% random chance for the rest
    const shouldBuff = i < minInnsWithBuff || Math.random() < 0.25;
    if (!shouldBuff) return;

    // Pick a random reward slot to attach the buff to
    const rewardIndex = Math.floor(Math.random() * inn.availableRewards.length);
    const reward = inn.availableRewards[rewardIndex];

    // Don't double-buff the same slot
    if (reward.buffs && reward.buffs.length > 0) return;

    // Select from tier-appropriate buff pool (clamp to max tier 3)
    const tier = Math.min(inn.innTier || 1, 3);
    const pool = INN_BUFF_POOL_BY_TIER[tier] || INN_BUFF_POOL_BY_TIER[1];
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    reward.buffs = [{ buffType: chosen.buffType, buffName: chosen.buffName }];
    buffedCount++;
  });

  console.log(
    `Inn buff injection: ${buffedCount}/${innNodes.length} inns received a buff (min was ${minInnsWithBuff})`
  );
}

function assignBuffRewards(nodes, { eventConfig, derivedValues }) {
  const standardNodes = nodes.filter((n) => n.nodeType === 'STANDARD');
  const numBuffNodes = Math.floor(standardNodes.length * 0.3);

  console.log(`Assigning buffs to ${numBuffNodes} of ${standardNodes.length} standard nodes`);

  const tier1_2_nodes = standardNodes.filter((n) => n.difficultyTier >= 1 && n.difficultyTier <= 2);
  const tier3_4_nodes = standardNodes.filter((n) => n.difficultyTier >= 3 && n.difficultyTier <= 4);
  const tier5_6_nodes = standardNodes.filter((n) => n.difficultyTier >= 5);

  console.log(
    `Tier distribution: T1-2: ${tier1_2_nodes.length}, T3-4: ${tier3_4_nodes.length}, T5-6: ${tier5_6_nodes.length}`
  );

  const buffAssignments = [
    ...selectRandomNodes(tier1_2_nodes, Math.floor(numBuffNodes * 0.5)).map((node) => ({
      node,
      buffs: [{ buffType: getRandomBuffType('minor'), tier: 'minor' }],
    })),
    ...selectRandomNodes(tier3_4_nodes, Math.floor(numBuffNodes * 0.35)).map((node) => ({
      node,
      buffs: [{ buffType: getRandomBuffType('moderate'), tier: 'moderate' }],
    })),
    ...selectRandomNodes(tier5_6_nodes, Math.floor(numBuffNodes * 0.15)).map((node, idx) => ({
      node,
      buffs:
        idx % 3 === 0
          ? [{ buffType: 'universal_reduction', tier: 'universal' }]
          : [{ buffType: getRandomBuffType('major'), tier: 'major' }],
    })),
  ];

  console.log(`Created ${buffAssignments.length} buff assignments`);

  buffAssignments.forEach(({ node, buffs }) => {
    if (!node.rewards) node.rewards = { gp: 0, keys: [] };
    node.rewards.buffs = buffs;
  });

  return nodes;
}

function getRandomBuffType(tier) {
  const types = ['kill_reduction', 'xp_reduction', 'item_reduction'];
  return `${types[Math.floor(Math.random() * types.length)]}_${tier}`;
}

function selectRandomNodes(nodes, count) {
  return [...nodes].sort(() => Math.random() - 0.5).slice(0, Math.min(count, nodes.length));
}

function generateObjective(
  difficulty,
  difficultyMultiplier = 1.0,
  formattedObjectives,
  objectiveUsageByDifficulty = null
) {
  const availableObjectiveTypes = formattedObjectives.filter(
    (objType) => objType.difficulties[difficulty] && objType.difficulties[difficulty].length > 0
  );

  if (availableObjectiveTypes.length === 0) {
    throw new Error(`No objectives available for difficulty: ${difficulty}`);
  }

  const allPossibleObjectives = [];
  availableObjectiveTypes.forEach((objType) => {
    objType.difficulties[difficulty].forEach((obj) => {
      allPossibleObjectives.push({
        type: objType.type,
        target: obj?.target,
        quantity: Math.ceil(obj?.quantity * difficultyMultiplier),
        contentId: obj?.contentId,
        _key: `${objType.type}:${obj?.target || obj?.contentId}`,
      });
    });
  });

  let availableObjectives = allPossibleObjectives;

  if (objectiveUsageByDifficulty) {
    const usageQueue = objectiveUsageByDifficulty[difficulty] || [];
    const dynamicCooldown = Math.max(3, Math.floor(allPossibleObjectives.length * 0.6));
    const recentlyUsed = new Set(usageQueue.slice(-dynamicCooldown));
    availableObjectives = allPossibleObjectives.filter((obj) => !recentlyUsed.has(obj._key));

    if (availableObjectives.length === 0) {
      console.warn(
        `All ${difficulty} objectives on cooldown (${allPossibleObjectives.length} total, cooldown ${dynamicCooldown}) - allowing all`
      );
      availableObjectives = allPossibleObjectives;
    }
  }

  const selected = availableObjectives[Math.floor(Math.random() * availableObjectives.length)];

  if (objectiveUsageByDifficulty) {
    if (!objectiveUsageByDifficulty[difficulty]) objectiveUsageByDifficulty[difficulty] = [];
    objectiveUsageByDifficulty[difficulty].push(selected._key);
  }

  return {
    type: selected.type,
    target: selected.target,
    quantity: selected.quantity,
    contentId: selected.contentId,
  };
}

function calculateGPReward(difficultyTier, avgGpPerNode) {
  const multipliers = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.25, 5: 1.5 };
  return Math.floor(avgGpPerNode * (multipliers[difficultyTier] || 1.0));
}

function generateInnRewards(innTier, avgGpPerInn) {
  const baseRewardPool = avgGpPerInn || 0;
  console.log('zzzzz', avgGpPerInn);
  if (baseRewardPool <= 0) {
    console.warn(`Warning: avgGpPerInn is ${avgGpPerInn} for inn tier ${innTier}`);
  }

  // Buffs are intentionally absent here — injectBuffsIntoInnRewards() adds them after
  return [
    {
      reward_id: `inn${innTier}_gp_small`,
      type: 'guaranteed_gp',
      description: 'Quick key trade',
      key_cost: [{ color: 'any', quantity: 2 }],
      payout: Math.floor(baseRewardPool * 0.8),
      buffs: [],
    },
    {
      reward_id: `inn${innTier}_gp_medium`,
      type: 'guaranteed_gp',
      description: 'Standard key trade',
      key_cost: [{ color: 'any', quantity: 4 }],
      payout: Math.floor(baseRewardPool * 1.0),
      buffs: [],
    },
    {
      reward_id: `inn${innTier}_combo`,
      type: 'guaranteed_gp',
      description: 'Diverse key bonus',
      key_cost: [
        { color: 'red', quantity: 2 },
        { color: 'blue', quantity: 2 },
        { color: 'green', quantity: 2 },
      ],
      payout: Math.floor(baseRewardPool * 1.2),
      buffs: [],
    },
  ];
}

function generateMap(eventConfig, derivedValues, contentSelections = null) {
  const { node_to_inn_ratio, difficulty = 'normal' } = eventConfig;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

  const { avg_gp_per_node, avg_gp_per_inn, num_of_inns, total_nodes } = derivedValues;

  const formattedObjectives = buildFormattedObjectives(
    contentSelections || getDefaultContentSelections()
  );

  console.log('=== MAP GENERATION START ===');
  console.log('Total nodes to generate:', total_nodes);
  console.log('Number of inns:', num_of_inns);
  console.log('Using custom content:', !!contentSelections);
  console.log({ contentSelections });

  const nodes = [];
  const edges = [];
  const locationGroups = [];
  const paths = [
    { path_id: 'mountain_path', key_color: 'red', difficulty: 'hard' },
    { path_id: 'trade_route', key_color: 'blue', difficulty: 'medium' },
    { path_id: 'coastal_path', key_color: 'green', difficulty: 'easy' },
  ];

  const locationUsageQueue = [];
  const generatedNodeIds = new Set();

  const objectiveUsageByDifficulty = { easy: [], medium: [], hard: [] };

  const LOCATION_COOLDOWN = Math.floor(OSRS_LOCATIONS.length * 0.6);

  const getRandomLocation = () => {
    const cooldownLocations = new Set(locationUsageQueue.slice(-LOCATION_COOLDOWN));
    const available = OSRS_LOCATIONS.filter((loc) => !cooldownLocations.has(loc.name));

    if (available.length === 0) {
      console.warn('All locations on cooldown - using oldest location');
      const oldestLocation = locationUsageQueue.shift();
      const location = OSRS_LOCATIONS.find((loc) => loc.name === oldestLocation);
      locationUsageQueue.push(location.name);
      return location;
    }

    const location = available[Math.floor(Math.random() * available.length)];
    locationUsageQueue.push(location.name);
    return location;
  };

  const eventPrefix = `evt_${Date.now().toString(36)}_`;
  const generateNodeId = (counter) => {
    const id = `${eventPrefix}node_${String(counter).padStart(3, '0')}`;
    if (generatedNodeIds.has(id)) {
      console.error(`DUPLICATE NODE ID DETECTED: ${id}`);
      throw new Error(`Duplicate node ID: ${id}`);
    }
    generatedNodeIds.add(id);
    return id;
  };

  const createLocationGroup = (location, pathInfo, prerequisiteNodeIds, nodeCounter) => {
    const groupId = `loc_${uuidv4().substring(0, 8)}`;
    const difficulties = [
      { name: 'easy', tier: 1 },
      { name: 'medium', tier: 3 },
      { name: 'hard', tier: 5 },
    ];

    const groupNodes = [];
    const groupNodeIds = [];
    const usedTargetsInGroup = new Set();

    difficulties.forEach(({ name, tier }) => {
      const nodeId = generateNodeId(nodeCounter.value++);

      let objective;
      let attempts = 0;
      const maxAttempts = 20;

      do {
        objective = generateObjective(
          name,
          difficultyMultiplier,
          formattedObjectives,
          objectiveUsageByDifficulty
        );
        attempts++;
      } while (usedTargetsInGroup.has(objective.target) && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        console.warn(
          `Could not find unique objective for ${name} at ${location.name} after ${maxAttempts} attempts`
        );
      }

      usedTargetsInGroup.add(objective.target);

      const node = {
        nodeId,
        nodeType: 'STANDARD',
        title: `${location.name} - ${objective?.target}`,
        description: `${name.charAt(0).toUpperCase() + name.slice(1)} challenge: ${
          objective?.target
        }`,
        coordinates: { x: location.x, y: location.y },
        mapLocation: location.name,
        locationGroupId: groupId,
        prerequisites: prerequisiteNodeIds,
        unlocks: [],
        paths: [pathInfo.path_id],
        objective,
        rewards: {
          gp: calculateGPReward(tier, avg_gp_per_node),
          keys: [{ color: pathInfo.key_color, quantity: name === 'hard' ? 2 : 1 }],
        },
        difficultyTier: tier,
        innTier: null,
        availableRewards: null,
      };

      groupNodes.push(node);
      groupNodeIds.push(nodeId);
    });

    locationGroups.push({ groupId, location: location.name, nodeIds: groupNodeIds });

    return groupNodes;
  };

  const startLocation = getRandomLocation();
  const startNodeId = generateNodeId(0);

  nodes.push({
    nodeId: startNodeId,
    nodeType: 'START',
    title: `${startLocation.name} - The Journey Begins`,
    description:
      'Your adventure starts here. This is a free tile to help you and your team get accustomed to the gameplay loop and how submissions work!',
    coordinates: { x: startLocation.x, y: startLocation.y },
    mapLocation: startLocation.name,
    locationGroupId: null,
    prerequisites: [],
    unlocks: [],
    paths: paths.map((p) => p.path_id),
    objective: null,
    rewards: { gp: 0, keys: [] },
    difficultyTier: null,
    innTier: null,
    availableRewards: null,
  });

  let nodeCounter = { value: 1 };
  let innCounter = 1;
  let nodesUntilNextInn = node_to_inn_ratio;

  const pathHeads = {
    mountain_path: [],
    trade_route: [],
    coastal_path: [],
  };

  paths.forEach((path) => {
    const location = getRandomLocation();
    const groupNodes = createLocationGroup(location, path, [startNodeId], nodeCounter);
    nodes.push(...groupNodes);

    const easyNode = groupNodes.find((n) => n.difficultyTier === 1);
    pathHeads[path.path_id].push(easyNode.nodeId);

    groupNodes.forEach((groupNode) => {
      nodes.find((n) => n.nodeId === startNodeId).unlocks.push(groupNode.nodeId);
      edges.push({ from: startNodeId, to: groupNode.nodeId, path: path.path_id });
    });
  });

  console.log(
    `Created start node and ${paths.length} initial location groups (counter at ${nodeCounter.value})`
  );

  let pathIndex = 0;
  while (nodeCounter.value < total_nodes) {
    if (nodesUntilNextInn <= 0 && innCounter <= num_of_inns) {
      const nodeId = generateNodeId(nodeCounter.value++);
      const location = getRandomLocation();
      const prerequisites = Object.values(pathHeads).flat();

      console.log(`Creating inn ${innCounter} at node ${nodeId} (counter: ${nodeCounter.value})`);

      nodes.push({
        nodeId,
        nodeType: 'INN',
        title: `${location.name} Inn - Checkpoint ${innCounter}`,
        description: 'Rest and trade your keys for rewards',
        coordinates: { x: location.x, y: location.y },
        mapLocation: location.name,
        locationGroupId: null,
        prerequisites,
        unlocks: [],
        paths: paths.map((p) => p.path_id),
        objective: null,
        rewards: null,
        difficultyTier: null,
        innTier: innCounter,
        availableRewards: generateInnRewards(innCounter, avg_gp_per_inn),
      });

      prerequisites.forEach((prereq) => {
        edges.push({ from: prereq, to: nodeId, path: 'all' });
      });

      paths.forEach((path) => {
        const loc = getRandomLocation();
        const groupNodes = createLocationGroup(loc, path, [nodeId], nodeCounter);
        nodes.push(...groupNodes);

        groupNodes.forEach((groupNode) => {
          edges.push({ from: nodeId, to: groupNode.nodeId, path: path.path_id });
        });

        const easyNode = groupNodes.find((n) => n.difficultyTier === 1);
        pathHeads[path.path_id] = [easyNode.nodeId];
      });

      innCounter++;
      nodesUntilNextInn = node_to_inn_ratio;
      continue;
    }

    nodesUntilNextInn -= 3;

    const path = paths[pathIndex % paths.length];
    const location = getRandomLocation();
    const prerequisites = pathHeads[path.path_id];

    if (prerequisites.length === 0) {
      console.error(`No path heads available for ${path.path_id}`);
      throw new Error(`Path ${path.path_id} has no available heads`);
    }

    const prerequisite = prerequisites[Math.floor(Math.random() * prerequisites.length)];
    const groupNodes = createLocationGroup(location, path, [prerequisite], nodeCounter);
    nodes.push(...groupNodes);

    groupNodes.forEach((groupNode) => {
      edges.push({ from: prerequisite, to: groupNode.nodeId, path: path.path_id });
    });

    const easyNode = groupNodes.find((n) => n.difficultyTier === 1);
    pathHeads[path.path_id].push(easyNode.nodeId);

    pathIndex++;
  }

  console.log(`Generated ${nodes.length} total nodes in ${locationGroups.length} location groups`);
  console.log(`Node IDs generated: ${generatedNodeIds.size} unique IDs`);
  console.log(
    `Location cooldown: ${LOCATION_COOLDOWN} (${locationUsageQueue.length} total location uses)`
  );
  console.log(
    `Objectives generated - Easy: ${objectiveUsageByDifficulty.easy.length}, Medium: ${objectiveUsageByDifficulty.medium.length}, Hard: ${objectiveUsageByDifficulty.hard.length}`
  );

  // Assign buffs to standard nodes
  console.log('Assigning buff rewards to standard nodes...');
  assignBuffRewards(nodes, { eventConfig, derivedValues });
  const nodesWithBuffs = nodes.filter((n) => n.rewards?.buffs && n.rewards.buffs.length > 0);
  console.log(`Assigned buffs to ${nodesWithBuffs.length} standard nodes`);

  // Inject buffs into inn purchase options (at least 40% of inns guaranteed)
  console.log('Injecting buffs into inn rewards...');
  const innNodes = nodes.filter((n) => n.nodeType === 'INN');
  injectBuffsIntoInnRewards(innNodes);

  // Update unlocks based on edges
  edges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.nodeId === edge.from);
    if (fromNode && !fromNode.unlocks.includes(edge.to)) {
      fromNode.unlocks.push(edge.to);
    }
  });

  // Sync unlocks across all nodes in each location group
  locationGroups.forEach((group) => {
    const groupNodesList = group.nodeIds.map((id) => nodes.find((n) => n.nodeId === id));

    const allUnlocks = new Set();
    groupNodesList.forEach((node) => {
      if (node?.unlocks) node.unlocks.forEach((u) => allUnlocks.add(u));
    });

    const unlocksArray = Array.from(allUnlocks);
    groupNodesList.forEach((node) => {
      if (node) node.unlocks = [...unlocksArray];
    });

    console.log(
      `Synced unlocks for location group ${group.groupId}: ${unlocksArray.length} unlocks`
    );
  });

  console.log('=== MAP GENERATION COMPLETE ===');

  return {
    mapStructure: {
      start_node: startNodeId,
      paths,
      edges,
      locationGroups,
    },
    nodes,
  };
}

module.exports = { generateMap };
