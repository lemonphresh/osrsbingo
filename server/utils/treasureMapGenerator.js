const { v4: uuidv4 } = require('uuid');

// OSRS locations for placing nodes on the map
const OSRS_LOCATIONS = [
  { name: 'Lumbridge', x: 3222, y: 3218 },
  { name: 'Varrock', x: 3213, y: 3424 },
  { name: 'Falador', x: 2965, y: 3378 },
  { name: 'Draynor Village', x: 3093, y: 3244 },
  { name: 'Edgeville', x: 3087, y: 3496 },
  { name: 'Ardougne', x: 2662, y: 3305 },
  { name: 'Catherby', x: 2809, y: 3436 },
  { name: 'Seers Village', x: 2725, y: 3484 },
  { name: 'Yanille', x: 2606, y: 3093 },
  { name: 'Port Sarim', x: 3012, y: 3217 },
  { name: 'Rimmington', x: 2957, y: 3214 },
  { name: 'Taverly', x: 2933, y: 3450 },
  { name: 'Burthorpe', x: 2899, y: 3544 },
  { name: 'Wilderness - Edgeville', x: 3089, y: 3520 },
  { name: 'Wilderness - Bandit Camp', x: 3039, y: 3652 },
  { name: 'Wilderness - Lava Maze', x: 3060, y: 3880 },
  { name: 'Morytania - Canifis', x: 3493, y: 3488 },
  { name: 'Morytania - Port Phasmatys', x: 3686, y: 3502 },
  { name: 'Morytania - Burgh de Rott', x: 3496, y: 3211 },
  { name: 'Karamja - Brimhaven', x: 2758, y: 3151 },
  { name: 'Karamja - Shilo Village', x: 2852, y: 2953 },
  { name: 'Al Kharid', x: 3293, y: 3174 },
  { name: 'Pollnivneach', x: 3359, y: 2963 },
  { name: 'Neitiznot', x: 2331, y: 3804 },
  { name: 'Jatizso', x: 2416, y: 3802 },
  { name: 'Prifddinas', x: 2225, y: 3300 },
  { name: 'Gnome Stronghold', x: 2461, y: 3444 },
  { name: 'Tree Gnome Village', x: 2542, y: 3169 },
];

const DIFFICULTY_MULTIPLIERS = {
  easy: 0.8,
  normal: 1.0,
  hard: 1.4,
  sweatlord: 2.0,
};

// objective types with difficulty ratings
const OBJECTIVE_TYPES = [
  {
    type: 'kills',
    difficulties: {
      easy: [
        { target: 'Hill Giants', quantity: 100 },
        { target: 'Lesser Demons', quantity: 75 },
        { target: 'Blue Dragons', quantity: 50 },
      ],
      medium: [
        { target: 'Black Dragons', quantity: 100 },
        { target: 'Abyssal Demons', quantity: 100 },
        { target: 'Gargoyles', quantity: 150 },
      ],
      hard: [
        { target: 'Nechryael', quantity: 200 },
        { target: 'Dark Beasts', quantity: 150 },
        { target: 'Smoke Devils', quantity: 200 },
      ],
    },
  },
  {
    type: 'boss_kc',
    difficulties: {
      easy: [
        { target: 'Giant Mole', quantity: 10 },
        { target: 'Sarachnis', quantity: 10 },
        { target: 'Obor', quantity: 5 },
      ],
      medium: [
        { target: 'Vorkath', quantity: 25 },
        { target: 'Zulrah', quantity: 25 },
        { target: 'Barrows', quantity: 50 },
      ],
      hard: [
        { target: 'Venenatis', quantity: 25 },
        { target: 'Callisto', quantity: 25 },
        { target: 'Corporeal Beast', quantity: 10 },
      ],
    },
  },
  {
    type: 'xp_gain',
    difficulties: {
      easy: [
        { target: 'Fishing', quantity: 500000 },
        { target: 'Woodcutting', quantity: 500000 },
        { target: 'Mining', quantity: 500000 },
      ],
      medium: [
        { target: 'Runecrafting', quantity: 750000 },
        { target: 'Agility', quantity: 750000 },
        { target: 'Thieving', quantity: 750000 },
      ],
      hard: [
        { target: 'Slayer', quantity: 1000000 },
        { target: 'Herblore', quantity: 1000000 },
        { target: 'Construction', quantity: 1000000 },
      ],
    },
  },
  {
    type: 'minigame',
    difficulties: {
      easy: [
        { target: 'Tempoross', quantity: 10 },
        { target: 'Guardians of the Rift', quantity: 10 },
        { target: 'Wintertodt', quantity: 10 },
      ],
      medium: [
        { target: 'Barbarian Assault', quantity: 15 },
        { target: 'Pest Control', quantity: 25 },
        { target: 'Castle Wars', quantity: 10 },
      ],
      hard: [
        { target: 'Theatre of Blood', quantity: 5 },
        { target: 'Chambers of Xeric', quantity: 10 },
        { target: 'Tombs of Amascut', quantity: 5 },
      ],
    },
  },
  {
    type: 'item_collection',
    difficulties: {
      easy: [
        { target: 'Feathers', quantity: 1000 },
        { target: 'Oak Logs', quantity: 500 },
        { target: 'Iron Ore', quantity: 500 },
      ],
      medium: [
        { target: 'Runite Ore', quantity: 100 },
        { target: 'Magic Logs', quantity: 200 },
        { target: 'Dragon Bones', quantity: 200 },
      ],
      hard: [
        { target: 'Ranarr Seeds', quantity: 100 },
        { target: 'Death Runes', quantity: 1000 },
        { target: 'Blood Runes', quantity: 1000 },
      ],
    },
  },
  {
    type: 'clue_scrolls',
    difficulties: {
      easy: [
        { target: 'Easy', quantity: 25 },
        { target: 'Medium', quantity: 15 },
      ],
      medium: [
        { target: 'Hard', quantity: 15 },
        { target: 'Elite', quantity: 10 },
      ],
      hard: [{ target: 'Master', quantity: 5 }],
    },
  },
];

// generate a random objective based on difficulty
function generateObjective(difficulty, difficultyMultiplier = 1.0) {
  const objectiveType = OBJECTIVE_TYPES[Math.floor(Math.random() * OBJECTIVE_TYPES.length)];
  const objectives = objectiveType.difficulties[difficulty];
  const objective = objectives[Math.floor(Math.random() * objectives.length)];

  return {
    type: objectiveType.type,
    target: objective.target,
    quantity: Math.ceil(objective.quantity * difficultyMultiplier),
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
function generateMap(eventConfig, derivedValues) {
  const { node_to_inn_ratio, difficulty = 'normal' } = eventConfig;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

  const { avg_gp_per_node, num_of_inns, total_nodes } = derivedValues;

  console.log('=== MAP GENERATION START ===');
  console.log('Total nodes to generate:', total_nodes);
  console.log('Number of inns:', num_of_inns);
  console.log('Node to inn ratio:', node_to_inn_ratio);

  const nodes = [];
  const edges = [];
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

  // create start node
  const startLocation = getRandomLocation();
  const startNodeId = generateNodeId(0);

  // Generate the initial path node IDs
  const initialPathNodeIds = [generateNodeId(1), generateNodeId(2), generateNodeId(3)];

  nodes.push({
    nodeId: startNodeId,
    nodeType: 'START',
    title: `${startLocation.name} - The Journey Begins`,
    description: 'Your adventure starts here',
    coordinates: { x: startLocation.x, y: startLocation.y },
    mapLocation: startLocation.name,
    prerequisites: [],
    unlocks: initialPathNodeIds,
    paths: paths.map((p) => p.path_id),
    objective: null,
    rewards: { gp: 0, keys: [] },
    difficultyTier: null,
    innTier: null,
    availableRewards: null,
  });

  let nodeCounter = 1;
  let innCounter = 1;
  let nodesUntilNextInn = node_to_inn_ratio;

  // track current nodes per path
  const pathHeads = {
    mountain_path: [],
    trade_route: [],
    coastal_path: [],
  };

  // create initial path nodes (one for each path)
  let initialNodeIndex = 0;
  paths.forEach((path, pathIndex) => {
    const nodeId = initialPathNodeIds[initialNodeIndex];
    const location = getRandomLocation();
    const difficulty = path.difficulty === 'hard' ? 5 : path.difficulty === 'medium' ? 3 : 1;
    const objective = generateObjective(path.difficulty, difficultyMultiplier);

    nodes.push({
      nodeId,
      nodeType: 'STANDARD',
      title: `${location.name} - ${objective.target || 'Challenge'}`,
      description: `A challenge awaits on the ${path.path_id.replace('_', ' ')}`,
      coordinates: { x: location.x, y: location.y },
      mapLocation: location.name,
      prerequisites: [startNodeId],
      unlocks: [],
      paths: [path.path_id],
      objective,
      rewards: {
        gp: calculateGPReward(difficulty, avg_gp_per_node),
        keys: [{ color: path.key_color, quantity: 1 }],
      },
      difficultyTier: difficulty,
      innTier: null,
      availableRewards: null,
    });

    edges.push({
      from: startNodeId,
      to: nodeId,
      path: path.path_id,
    });

    pathHeads[path.path_id].push(nodeId);
    initialNodeIndex++;
  });

  nodeCounter = 4; // Start after the 3 initial path nodes

  console.log(
    `Created start node and ${paths.length} initial path nodes (counter at ${nodeCounter})`
  );

  // generate remaining nodes
  let pathIndex = 0;
  while (nodeCounter < total_nodes) {
    nodesUntilNextInn--;

    // time for an inn?
    if (nodesUntilNextInn <= 0 && innCounter <= num_of_inns) {
      const nodeId = generateNodeId(nodeCounter);
      const location = getRandomLocation();

      // inn is available from all current path heads
      const prerequisites = Object.values(pathHeads).flat();

      console.log(`Creating inn ${innCounter} at node ${nodeId} (counter: ${nodeCounter})`);

      nodes.push({
        nodeId,
        nodeType: 'INN',
        title: `${location.name} Inn - Checkpoint ${innCounter}`,
        description: 'Rest and trade your keys for rewards',
        coordinates: { x: location.x, y: location.y },
        mapLocation: location.name,
        prerequisites,
        unlocks: [],
        paths: paths.map((p) => p.path_id),
        objective: null,
        rewards: null,
        difficultyTier: null,
        innTier: innCounter,
        availableRewards: generateInnRewards(innCounter, avg_gp_per_node, node_to_inn_ratio),
      });

      // all paths connect to this inn
      prerequisites.forEach((prereq) => {
        edges.push({
          from: prereq,
          to: nodeId,
          path: 'all',
        });
      });

      // update path heads to this inn
      paths.forEach((path) => {
        pathHeads[path.path_id] = [nodeId];
      });

      innCounter++;
      nodesUntilNextInn = node_to_inn_ratio;
      nodeCounter++;
      continue;
    }

    // create regular node for current path
    const path = paths[pathIndex % paths.length];
    const nodeId = generateNodeId(nodeCounter);
    const location = getRandomLocation();
    const difficulty = path.difficulty === 'hard' ? 5 : path.difficulty === 'medium' ? 3 : 1;
    const objective = generateObjective(path.difficulty, difficultyMultiplier);

    // pick a random prerequisite from this path's heads
    const prerequisites = pathHeads[path.path_id];
    if (prerequisites.length === 0) {
      console.error(`No path heads available for ${path.path_id}`);
      throw new Error(`Path ${path.path_id} has no available heads`);
    }

    const prerequisite = prerequisites[Math.floor(Math.random() * prerequisites.length)];

    nodes.push({
      nodeId,
      nodeType: 'STANDARD',
      title: `${location.name} - ${objective.target || 'Challenge'}`,
      description: `Continue your journey on the ${path.path_id.replace('_', ' ')}`,
      coordinates: { x: location.x, y: location.y },
      mapLocation: location.name,
      prerequisites: [prerequisite],
      unlocks: [],
      paths: [path.path_id],
      objective,
      rewards: {
        gp: calculateGPReward(difficulty, avg_gp_per_node),
        keys: [{ color: path.key_color, quantity: 1 }],
      },
      difficultyTier: difficulty,
      innTier: null,
      availableRewards: null,
    });

    edges.push({
      from: prerequisite,
      to: nodeId,
      path: path.path_id,
    });

    // add to path heads
    pathHeads[path.path_id].push(nodeId);

    nodeCounter++;
    pathIndex++; // Move to next path
  }

  console.log(`Generated ${nodes.length} total nodes`);
  console.log(`Node IDs generated: ${generatedNodeIds.size} unique IDs`);

  // update unlocks based on edges
  edges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.nodeId === edge.from);
    if (fromNode && !fromNode.unlocks.includes(edge.to)) {
      fromNode.unlocks.push(edge.to);
    }
  });

  console.log('=== MAP GENERATION COMPLETE ===');

  return {
    mapStructure: {
      start_node: startNodeId,
      paths,
      edges,
    },
    nodes,
  };
}

module.exports = { generateMap };
