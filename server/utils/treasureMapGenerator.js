const { v4: uuidv4 } = require('uuid');
const { buildFormattedObjectives, getDefaultContentSelections } = require('./objectiveBuilder');

// OSRS locations for placing nodes on the map
const OSRS_LOCATIONS = [
  // Misthalin
  { name: 'Lumbridge', x: 3222, y: 3218 },
  { name: 'Draynor Village', x: 3093, y: 3244 },
  { name: 'Al Kharid', x: 3293, y: 3174 },

  // Asgarnia
  { name: 'Falador', x: 2965, y: 3378 },
  { name: 'Port Sarim', x: 3012, y: 3217 },
  { name: 'Rimmington', x: 2957, y: 3214 },
  { name: 'Taverly', x: 2933, y: 3450 },
  { name: 'Burthorpe', x: 2899, y: 3544 },
  { name: 'White Wolf Mountain', x: 2849, y: 3543 },
  { name: 'Goblin Village', x: 2956, y: 3502 },

  // Kandarin
  { name: 'Catherby', x: 2809, y: 3436 },
  { name: 'Seers Village', x: 2725, y: 3484 },
  { name: 'Ardougne', x: 2662, y: 3305 },
  { name: 'Yanille', x: 2606, y: 3093 },
  { name: 'Tree Gnome Stronghold', x: 2461, y: 3444 },
  { name: 'Tree Gnome Village', x: 2542, y: 3169 },
  { name: 'Fishing Guild', x: 2611, y: 3393 },
  { name: 'Barbarian Village', x: 3082, y: 3420 },
  { name: 'Grand Tree', x: 2465, y: 3495 },

  // Varrock & Surroundings
  { name: 'Varrock', x: 3213, y: 3424 },
  { name: 'Edgeville', x: 3087, y: 3496 },
  { name: 'Grand Exchange', x: 3164, y: 3464 },
  { name: 'Varrock Palace', x: 3211, y: 3458 },

  // Wilderness
  { name: 'Wilderness - Edgeville', x: 3089, y: 3520 },
  { name: 'Wilderness - Bandit Camp', x: 3039, y: 3652 },
  { name: 'Wilderness - Lava Maze', x: 3060, y: 3880 },
  { name: 'Wilderness - Mage Arena', x: 3105, y: 3933 },
  { name: 'Wilderness - Dark Warriors Fortress', x: 3028, y: 3628 },
  { name: 'Wilderness - Resource Area', x: 3184, y: 3944 },

  // Morytania
  { name: 'Morytania - Canifis', x: 3493, y: 3488 },
  { name: 'Morytania - Port Phasmatys', x: 3686, y: 3502 },
  { name: 'Morytania - Burgh de Rott', x: 3496, y: 3211 },
  { name: 'Morytania - Darkmeyer', x: 3623, y: 3367 },
  { name: 'Morytania - Slepe', x: 3747, y: 3375 },
  { name: 'Morytania - Barrows', x: 3565, y: 3289 },
  { name: "Morytania - Mos Le'Harmless", x: 3686, y: 2973 },

  // Karamja
  { name: 'Karamja - Brimhaven', x: 2758, y: 3151 },
  { name: 'Karamja - Shilo Village', x: 2852, y: 2953 },
  { name: 'Karamja - Tai Bwo Wannai', x: 2789, y: 3065 },
  { name: 'Karamja - Musa Point', x: 2914, y: 3176 },

  // Desert (Kharidian)
  { name: 'Pollnivneach', x: 3359, y: 2963 },
  { name: 'Nardah', x: 3428, y: 2916 },
  { name: 'Sophanem', x: 3285, y: 2771 },
  { name: 'Menaphos', x: 3233, y: 2813 },
  { name: 'Uzer', x: 3493, y: 3090 },
  { name: 'Bedabin Camp', x: 3180, y: 3044 },
  { name: 'Desert Bandit Camp', x: 3176, y: 2987 },

  // Fremennik Province
  { name: 'Rellekka', x: 2660, y: 3660 },
  { name: 'Neitiznot', x: 2331, y: 3804 },
  { name: 'Jatizso', x: 2416, y: 3802 },
  { name: 'Miscellania', x: 2512, y: 3860 },
  { name: 'Waterbirth Island', x: 2527, y: 3740 },
  { name: 'Mountain Camp', x: 2808, y: 3672 },

  // Tirannwn (Elf Lands)
  { name: 'Prifddinas', x: 2225, y: 3300 },
  { name: 'Lletya', x: 2353, y: 3172 },
  { name: 'Zul-Andra', x: 2199, y: 3056 },
  { name: 'Port Tyras', x: 2150, y: 3125 },
  { name: 'Tirannwn - Gwenith', x: 2203, y: 3406 },

  // KOUREND (Great Kourend)
  { name: 'Kourend - Shayzien', x: 1504, y: 3615 },
  { name: 'Kourend - Lovakengj', x: 1488, y: 3812 },
  { name: 'Kourend - Arceuus', x: 1698, y: 3788 },
  { name: 'Kourend - Hosidius', x: 1752, y: 3600 },
  { name: 'Kourend - Piscarilius', x: 1824, y: 3726 },
  { name: 'Kourend - Kourend Castle', x: 1612, y: 3681 },
  { name: 'Kourend - Woodcutting Guild', x: 1591, y: 3479 },
  { name: 'Kourend - Farming Guild', x: 1248, y: 3719 },
  { name: "Kourend - Land's End", x: 1510, y: 3421 },
  { name: 'Kourend - Wintertodt Camp', x: 1630, y: 3944 },
  { name: 'Kourend - Mount Karuulm', x: 1310, y: 3817 },

  // VARLAMORE
  { name: 'Varlamore - Aldarin', x: 1528, y: 3087 },
  { name: 'Varlamore - Civitas illa Fortis', x: 1728, y: 3149 },
  { name: 'Varlamore - Hunter Guild', x: 1567, y: 3066 },
  { name: 'Varlamore - Sunset Coast', x: 1419, y: 3050 },
  { name: 'Varlamore - Cam Torum', x: 1444, y: 3184 },
  { name: 'Varlamore - Fortis Colosseum', x: 1808, y: 3209 },
  { name: 'Varlamore - The Teomat', x: 1572, y: 3222 },

  // Fossil Island & Misc Islands
  { name: 'Fossil Island', x: 3724, y: 3808 },
  { name: 'Crandor', x: 2834, y: 3259 },
  { name: 'Entrana', x: 2831, y: 3351 },
  { name: 'Pest Control', x: 2658, y: 2660 },
  { name: 'Lunar Isle', x: 2111, y: 3915 },
  { name: 'Ape Atoll', x: 2755, y: 2784 },

  // Dungeons & Special Areas (surface entrances)
  { name: 'Duel Arena', x: 3366, y: 3266 },
  { name: 'Champions Guild', x: 3191, y: 3364 },
  { name: "Warrior's Guild", x: 2876, y: 3546 },
  { name: 'Myths Guild', x: 2458, y: 2845 },
  { name: 'Corsair Cove', x: 2570, y: 2862 },
];

const DIFFICULTY_MULTIPLIERS = {
  easy: 0.8,
  normal: 1.0,
  hard: 1.4,
  sweatlord: 2.0,
};

function assignBuffRewards(nodes, { eventConfig, derivedValues }) {
  const { total_nodes } = derivedValues;

  // Calculate how many nodes should have buffs (30% of standard nodes only)
  const standardNodes = nodes.filter((n) => n.nodeType === 'STANDARD');
  const numBuffNodes = Math.floor(standardNodes.length * 0.3);

  console.log(`Assigning buffs to ${numBuffNodes} of ${standardNodes.length} standard nodes`);

  // Categorize standard nodes by tier for buff distribution
  const tier1_2_nodes = standardNodes.filter((n) => n.difficultyTier >= 1 && n.difficultyTier <= 2);
  const tier3_4_nodes = standardNodes.filter((n) => n.difficultyTier >= 3 && n.difficultyTier <= 4);
  const tier5_6_nodes = standardNodes.filter((n) => n.difficultyTier >= 5);

  console.log(
    `Tier distribution: T1-2: ${tier1_2_nodes.length}, T3-4: ${tier3_4_nodes.length}, T5-6: ${tier5_6_nodes.length}`
  );

  // Assign buffs
  const buffAssignments = [
    // Tier 1-2: Minor buffs (25% reduction)
    ...selectRandomNodes(tier1_2_nodes, Math.floor(numBuffNodes * 0.5)).map((node) => ({
      node,
      buffs: [
        {
          buffType: getRandomBuffType('minor'),
          tier: 'minor',
        },
      ],
    })),

    // Tier 3-4: Moderate buffs (50% reduction)
    ...selectRandomNodes(tier3_4_nodes, Math.floor(numBuffNodes * 0.35)).map((node) => ({
      node,
      buffs: [
        {
          buffType: getRandomBuffType('moderate'),
          tier: 'moderate',
        },
      ],
    })),

    // Tier 5-6: Major buffs (75% reduction) + Universal
    ...selectRandomNodes(tier5_6_nodes, Math.floor(numBuffNodes * 0.15)).map((node, idx) => ({
      node,
      buffs:
        idx % 3 === 0
          ? [{ buffType: 'universal_reduction', tier: 'universal' }]
          : [{ buffType: getRandomBuffType('major'), tier: 'major' }],
    })),
  ];

  console.log(`Created ${buffAssignments.length} buff assignments`);

  // Apply buff rewards to nodes
  buffAssignments.forEach(({ node, buffs }) => {
    if (!node.rewards) node.rewards = { gp: 0, keys: [] };
    node.rewards.buffs = buffs;
  });

  return nodes;
}

function getRandomBuffType(tier) {
  const types = ['kill_reduction', 'xp_reduction', 'item_reduction'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return `${randomType}_${tier}`;
}

function selectRandomNodes(nodes, count) {
  const shuffled = [...nodes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, nodes.length));
}

// generate a random objective based on difficulty
function generateObjective(difficulty, difficultyMultiplier = 1.0, formattedObjectives) {
  const availableObjectiveTypes = formattedObjectives.filter(
    (objType) => objType.difficulties[difficulty] && objType.difficulties[difficulty].length > 0
  );

  if (availableObjectiveTypes.length === 0) {
    throw new Error(`No objectives available for difficulty: ${difficulty}`);
  }

  const objectiveType =
    availableObjectiveTypes[Math.floor(Math.random() * availableObjectiveTypes.length)];
  const objectives = objectiveType.difficulties[difficulty];
  const objective = objectives[Math.floor(Math.random() * objectives.length)];

  return {
    type: objectiveType.type,
    target: objective?.target,
    quantity: Math.ceil(objective?.quantity * difficultyMultiplier),
    contentId: objective?.contentId,
  };
}

// calculate GP reward based on difficulty and event config
function calculateGPReward(difficultyTier, avgGpPerNode) {
  const multipliers = {
    1: 0.5, // Easy nodes
    2: 0.75,
    3: 1.0, // Medium nodes
    4: 1.25,
    5: 1.5, // Hard nodes
  };

  return Math.floor(avgGpPerNode * (multipliers[difficultyTier] || 1.0));
}

// generate inn rewards based on tier
function generateInnRewards(innTier, avgGpPerNode, nodeToInnRatio) {
  const baseRewardPool = avgGpPerNode * nodeToInnRatio * 2;

  return [
    {
      reward_id: `inn${innTier}_gp_small`,
      type: 'guaranteed_gp',
      description: 'Trade keys for guaranteed GP',
      key_cost: [{ color: 'any', quantity: 3 }],
      payout: Math.floor(baseRewardPool * 0.3),
    },
    {
      reward_id: `inn${innTier}_gp_medium`,
      type: 'guaranteed_gp',
      description: 'Better key trade',
      key_cost: [{ color: 'any', quantity: 5 }],
      payout: Math.floor(baseRewardPool * 0.5),
    },
    {
      reward_id: `inn${innTier}_combo`,
      type: 'guaranteed_gp',
      description: 'Special combo reward for diverse keys',
      key_cost: [
        { color: 'red', quantity: 2 },
        { color: 'blue', quantity: 2 },
        { color: 'green', quantity: 2 },
      ],
      payout: Math.floor(baseRewardPool * 0.8),
    },
  ];
}

// main map generation function
function generateMap(eventConfig, derivedValues, contentSelections = null) {
  const { node_to_inn_ratio, difficulty = 'normal' } = eventConfig;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

  const { avg_gp_per_node, num_of_inns, total_nodes } = derivedValues;

  // NEW: Build formatted objectives
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
  const locationGroups = []; // NEW: Track location groups
  const paths = [
    { path_id: 'mountain_path', key_color: 'red', difficulty: 'hard' },
    { path_id: 'trade_route', key_color: 'blue', difficulty: 'medium' },
    { path_id: 'coastal_path', key_color: 'green', difficulty: 'easy' },
  ];

  const usedLocations = new Set();
  const generatedNodeIds = new Set(); // Track generated IDs

  // helper to get a random unused location
  const getRandomLocation = () => {
    const available = OSRS_LOCATIONS.filter((loc) => !usedLocations.has(loc.name));
    if (available.length === 0) {
      // Reset if we run out
      usedLocations.clear();
      return OSRS_LOCATIONS[Math.floor(Math.random() * OSRS_LOCATIONS.length)];
    }
    const location = available[Math.floor(Math.random() * available.length)];
    usedLocations.add(location.name);
    return location;
  };

  // Helper to generate unique node ID with event prefix
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

  // NEW: Helper to create a location group with 3 difficulty nodes
  const createLocationGroup = (location, pathInfo, prerequisiteNodeIds, nodeCounter) => {
    const groupId = `loc_${uuidv4().substring(0, 8)}`;
    const difficulties = [
      { name: 'easy', tier: 1 },
      { name: 'medium', tier: 3 },
      { name: 'hard', tier: 5 },
    ];

    const groupNodes = [];
    const groupNodeIds = [];

    difficulties.forEach(({ name, tier }) => {
      const nodeId = generateNodeId(nodeCounter.value++);

      const objective = generateObjective(name, difficultyMultiplier, formattedObjectives);

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

    // Track the group so we can sync unlocks later
    locationGroups.push({
      groupId,
      location: location.name,
      nodeIds: groupNodeIds,
    });

    return groupNodes;
  };

  // create start node
  const startLocation = getRandomLocation();
  const startNodeId = generateNodeId(0);

  // Generate the initial path node IDs (will be location groups)
  const initialPathNodeIds = [];

  nodes.push({
    nodeId: startNodeId,
    nodeType: 'START',
    title: `${startLocation.name} - The Journey Begins`,
    description: 'Your adventure starts here',
    coordinates: { x: startLocation.x, y: startLocation.y },
    mapLocation: startLocation.name,
    locationGroupId: null, // Start node is not part of a group
    prerequisites: [],
    unlocks: [], // Will be filled after creating initial location groups
    paths: paths.map((p) => p.path_id),
    objective: null,
    rewards: { gp: 0, keys: [] },
    difficultyTier: null,
    innTier: null,
    availableRewards: null,
  });

  let nodeCounter = { value: 1 }; // Use object to pass by reference
  let innCounter = 1;
  let nodesUntilNextInn = node_to_inn_ratio;

  // track current nodes per path (now tracks location groups)
  const pathHeads = {
    mountain_path: [],
    trade_route: [],
    coastal_path: [],
  };

  // Create initial location groups (one for each path)
  paths.forEach((path) => {
    const location = getRandomLocation();
    const groupNodes = createLocationGroup(location, path, [startNodeId], nodeCounter);

    nodes.push(...groupNodes);

    // All nodes in the group are potential heads, but we'll track the easy one as the primary head
    const easyNode = groupNodes.find((n) => n.difficultyTier === 1);
    pathHeads[path.path_id].push(easyNode.nodeId);

    // Add all nodes from this group to start node's unlocks
    groupNodes.forEach((groupNode) => {
      nodes.find((n) => n.nodeId === startNodeId).unlocks.push(groupNode.nodeId);

      edges.push({
        from: startNodeId,
        to: groupNode.nodeId,
        path: path.path_id,
      });
    });
  });

  console.log(
    `Created start node and ${paths.length} initial location groups (counter at ${nodeCounter.value})`
  );

  // Generate remaining nodes as location groups
  let pathIndex = 0;
  while (nodeCounter.value < total_nodes) {
    // Time for an inn?
    if (nodesUntilNextInn <= 0 && innCounter <= num_of_inns) {
      const nodeId = generateNodeId(nodeCounter.value++);
      const location = getRandomLocation();

      // Inn is available from all current path heads
      const prerequisites = Object.values(pathHeads).flat();

      console.log(`Creating inn ${innCounter} at node ${nodeId} (counter: ${nodeCounter.value})`);

      nodes.push({
        nodeId,
        nodeType: 'INN',
        title: `${location.name} Inn - Checkpoint ${innCounter}`,
        description: 'Rest and trade your keys for rewards',
        coordinates: { x: location.x, y: location.y },
        mapLocation: location.name,
        locationGroupId: null, // Inns are not part of location groups
        prerequisites,
        unlocks: [],
        paths: paths.map((p) => p.path_id),
        objective: null,
        rewards: null,
        difficultyTier: null,
        innTier: innCounter,
        availableRewards: generateInnRewards(innCounter, avg_gp_per_node, node_to_inn_ratio),
      });

      // All paths connect to this inn
      prerequisites.forEach((prereq) => {
        edges.push({
          from: prereq,
          to: nodeId,
          path: 'all',
        });
      });

      // Update path heads to this inn
      paths.forEach((path) => {
        const location = getRandomLocation();
        const groupNodes = createLocationGroup(location, path, [nodeId], nodeCounter);
        nodes.push(...groupNodes);

        // Connect inn to all nodes in this location group
        groupNodes.forEach((groupNode) => {
          edges.push({
            from: nodeId,
            to: groupNode.nodeId,
            path: path.path_id,
          });
        });

        // Update path head (only easy node as representative)
        const easyNode = groupNodes.find((n) => n.difficultyTier === 1);
        pathHeads[path.path_id] = [easyNode.nodeId];
      });

      innCounter++;
      nodesUntilNextInn = node_to_inn_ratio;
      continue;
    }

    // Decrement counter for this location group (3 nodes)
    nodesUntilNextInn -= 3;

    // Create location group for current path
    const path = paths[pathIndex % paths.length];
    const location = getRandomLocation();

    // Pick a random prerequisite from this path's heads
    const prerequisites = pathHeads[path.path_id];
    if (prerequisites.length === 0) {
      console.error(`No path heads available for ${path.path_id}`);
      throw new Error(`Path ${path.path_id} has no available heads`);
    }

    const prerequisite = prerequisites[Math.floor(Math.random() * prerequisites.length)];

    const groupNodes = createLocationGroup(location, path, [prerequisite], nodeCounter);
    nodes.push(...groupNodes);

    // Connect prerequisite to all nodes in this location group
    groupNodes.forEach((groupNode) => {
      edges.push({
        from: prerequisite,
        to: groupNode.nodeId,
        path: path.path_id,
      });
    });

    // FIXED: Only add the easy node as the path head (representative for the location group)
    // But we'll handle the unlocks properly later when we connect the next location
    const easyNode = groupNodes.find((n) => n.difficultyTier === 1);
    pathHeads[path.path_id].push(easyNode.nodeId);

    pathIndex++; // Move to next path
  }

  console.log(`Generated ${nodes.length} total nodes in ${locationGroups.length} location groups`);
  console.log(`Node IDs generated: ${generatedNodeIds.size} unique IDs`);

  // Assign buffs to nodes AFTER all nodes are generated
  console.log('Assigning buff rewards to nodes...');
  assignBuffRewards(nodes, { eventConfig, derivedValues });

  const nodesWithBuffs = nodes.filter((n) => n.rewards?.buffs && n.rewards.buffs.length > 0);
  console.log(`Assigned buffs to ${nodesWithBuffs.length} nodes`);

  // Update unlocks based on edges
  edges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.nodeId === edge.from);
    if (fromNode && !fromNode.unlocks.includes(edge.to)) {
      fromNode.unlocks.push(edge.to);
    }
  });

  // CRITICAL FIX: Make all nodes in a location group share the same unlocks
  // This ensures completing ANY difficulty unlocks the next location group
  locationGroups.forEach((group) => {
    const groupNodesList = group.nodeIds.map((id) => nodes.find((n) => n.nodeId === id));

    // Collect all unique unlocks from all nodes in the group
    const allUnlocks = new Set();
    groupNodesList.forEach((node) => {
      if (node && node.unlocks) {
        node.unlocks.forEach((unlock) => allUnlocks.add(unlock));
      }
    });

    // Apply all unlocks to all nodes in the group
    const unlocksArray = Array.from(allUnlocks);
    groupNodesList.forEach((node) => {
      if (node) {
        node.unlocks = [...unlocksArray];
      }
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
      locationGroups, // NEW: Include location groups in map structure
    },
    nodes,
  };
}

module.exports = { generateMap };
