import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Checkbox,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  SimpleGrid,
  Box,
  Divider,
  Button,
  Tooltip,
  Icon,
  Alert,
  Collapse,
} from '@chakra-ui/react';
import { InfoIcon, AlertIcon, ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  CLUE_TIERS,
  parseItemSources,
} from '../../utils/objectiveCollections';

// Helper to sort items alphabetically by name
function sortByName(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

// Helper to group items by their source boss/raid
function groupItemsBySource(items) {
  const grouped = { bosses: {}, raids: {}, minigames: {}, other: [] };

  Object.values(items).forEach((item) => {
    if (!item.sources || item.sources.length === 0) {
      grouped.other.push(item);
      return;
    }

    item.sources.forEach((source) => {
      const [type, id] = source.split(':');
      if (type === 'bosses') {
        if (!grouped.bosses[id]) grouped.bosses[id] = [];
        grouped.bosses[id].push(item);
      } else if (type === 'raids') {
        if (!grouped.raids[id]) grouped.raids[id] = [];
        grouped.raids[id].push(item);
      } else if (type === 'minigames') {
        if (!grouped.minigames[id]) grouped.minigames[id] = [];
        grouped.minigames[id].push(item);
      } else {
        grouped.other.push(item);
      }
    });
  });

  // Sort drops within each boss/raid/minigame alphabetically
  Object.keys(grouped.bosses).forEach((key) => {
    grouped.bosses[key] = sortByName(grouped.bosses[key]);
  });
  Object.keys(grouped.raids).forEach((key) => {
    grouped.raids[key] = sortByName(grouped.raids[key]);
  });
  Object.keys(grouped.minigames).forEach((key) => {
    grouped.minigames[key] = sortByName(grouped.minigames[key]);
  });
  grouped.other = sortByName(grouped.other);

  return grouped;
}

// Get tag badge color scheme
function getTagColorScheme(tag) {
  if (tag === 'pet') return 'pink';
  if (tag === 'unique') return 'purple';
  if (tag === 'jar') return 'orange';
  if (tag === 'consumable') return 'green';
  return 'gray';
}

// Get clue tier color scheme
function getClueColorScheme(color) {
  const colorMap = {
    green: 'green',
    blue: 'blue',
    purple: 'purple',
    orange: 'orange',
    red: 'red',
  };
  return colorMap[color] || 'gray';
}

// Component for a boss/raid with its drops
function BossDropsRow({
  entity,
  entityType,
  drops,
  selections,
  onToggleEntity,
  onToggleDrop,
  onToggleAllDrops,
}) {
  const [expanded, setExpanded] = useState(false);
  const category =
    entityType === 'raids' ? 'raids' : entityType === 'minigames' ? 'minigames' : 'bosses';
  const entityEnabled = selections[category]?.[entity.id] !== false;
  const enabledDropCount = drops.filter(
    (d) => selections.items?.[d.id] !== false && entityEnabled
  ).length;

  const hasDrops = drops.length > 0;

  return (
    <Box
      borderWidth={1}
      borderColor={entityEnabled ? 'gray.600' : 'gray.700'}
      borderRadius="md"
      mb={2}
      opacity={entityEnabled ? 1 : 0.6}
      transition="all 0.2s"
    >
      <HStack
        p={3}
        justify="space-between"
        cursor={hasDrops ? 'pointer' : 'default'}
        onClick={() => hasDrops && setExpanded(!expanded)}
        _hover={hasDrops ? { bg: 'whiteAlpha.50' } : {}}
      >
        <HStack spacing={3}>
          {hasDrops && (
            <Icon as={expanded ? ChevronDownIcon : ChevronRightIcon} color="gray.500" boxSize={4} />
          )}
          {!hasDrops && <Box w={4} />}

          <Checkbox
            isChecked={entityEnabled}
            onChange={(e) => {
              e.stopPropagation();
              onToggleEntity(category, entity.id);
            }}
            colorScheme="purple"
            onClick={(e) => e.stopPropagation()}
          />

          <VStack align="start" spacing={0}>
            <Text fontWeight="medium" color="gray.100" fontSize="sm">
              {entity.name}
              {entity.shortName && ` (${entity.shortName})`}
            </Text>
            {hasDrops && (
              <Text fontSize="xs" color="gray.500">
                {enabledDropCount}/{drops.length} drops enabled
              </Text>
            )}
          </VStack>
        </HStack>
      </HStack>

      <Collapse in={expanded && hasDrops}>
        <Box borderTopWidth={1} borderColor="gray.600" p={3} bg="whiteAlpha.50">
          {/* All | None buttons inside the expanded section */}
          {entityEnabled && drops.length > 1 && (
            <HStack justify="flex-end" mb={2}>
              <Text fontSize="xs" color="gray.500">
                Drops:
              </Text>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="purple"
                onClick={() => onToggleAllDrops(drops, true)}
              >
                All
              </Button>
              <Text color="gray.500" fontSize="xs">
                |
              </Text>
              <Button
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={() => onToggleAllDrops(drops, false)}
              >
                None
              </Button>
            </HStack>
          )}

          <SimpleGrid columns={2} spacing={2}>
            {drops.map((drop) => {
              const dropEnabled = selections.items?.[drop.id] !== false && entityEnabled;
              return (
                <Checkbox
                  key={drop.id}
                  isChecked={dropEnabled}
                  isDisabled={!entityEnabled}
                  onChange={() => onToggleDrop(drop.id)}
                  colorScheme="purple"
                  size="sm"
                >
                  <HStack spacing={1}>
                    <Text fontSize="sm" color={entityEnabled ? 'gray.100' : 'gray.500'}>
                      {drop.name}
                    </Text>
                    {drop.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        colorScheme={getTagColorScheme(tag)}
                        fontSize="xs"
                        variant="subtle"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </HStack>
                </Checkbox>
              );
            })}
          </SimpleGrid>
          {!entityEnabled && (
            <Text fontSize="xs" color="gray.500" mt={2} fontStyle="italic">
              Enable {entity.name} to configure individual drops
            </Text>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// Helper functions to organize content
function getSkillOptions() {
  const skills = Object.values(SKILLS);
  return {
    gathering: sortByName(
      skills
        .filter((s) => s.category === 'gathering')
        .map((s) => ({ id: s.id, name: s.name, icon: s.icon }))
    ),
    artisan: sortByName(
      skills
        .filter((s) => s.category === 'artisan')
        .map((s) => ({ id: s.id, name: s.name, icon: s.icon }))
    ),
    support: sortByName(
      skills
        .filter((s) => s.category === 'support')
        .map((s) => ({ id: s.id, name: s.name, icon: s.icon }))
    ),
    combat: sortByName(
      skills
        .filter((s) => s.category === 'combat')
        .map((s) => ({ id: s.id, name: s.name, icon: s.icon }))
    ),
  };
}

function getMinigameOptions() {
  const minigames = Object.values(MINIGAMES);
  return {
    skilling: sortByName(
      minigames.filter((m) => m.category === 'skilling').map((m) => ({ id: m.id, name: m.name }))
    ),
    combat: sortByName(
      minigames.filter((m) => m.category === 'combat').map((m) => ({ id: m.id, name: m.name }))
    ),
    pvp: sortByName(
      minigames.filter((m) => m.category === 'pvp').map((m) => ({ id: m.id, name: m.name }))
    ),
  };
}

function getBossCategories() {
  const bosses = Object.values(SOLO_BOSSES);
  return {
    gwd: sortByName(bosses.filter((b) => b.tags?.includes('gwd'))),
    wilderness: sortByName(bosses.filter((b) => b.category === 'wilderness')),
    slayer: sortByName(bosses.filter((b) => b.tags?.some((tag) => tag.includes('slayer')))),
    other: sortByName(
      bosses.filter(
        (b) =>
          !b.tags?.includes('gwd') &&
          b.category !== 'wilderness' &&
          !b.tags?.some((tag) => tag.includes('slayer'))
      )
    ),
  };
}

function getClueOptions() {
  return sortByName(
    Object.values(CLUE_TIERS).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
    }))
  );
}

function getRaidOptions() {
  return sortByName(Object.values(RAIDS));
}

export default function ContentSelectionModal({ isOpen, onClose, currentSelections, onSave }) {
  const [selections, setSelections] = useState(
    currentSelections || {
      bosses: {},
      raids: {},
      skills: {},
      minigames: {},
      items: {},
      clues: {},
    }
  );

  const MIN_CONTENT_REQUIRED = 6;

  const totalContentAltogether =
    Object.values(SOLO_BOSSES).length +
    Object.values(RAIDS).length +
    Object.values(SKILLS).length +
    Object.values(MINIGAMES).length +
    Object.values(CLUE_TIERS).length;

  const totalEnabledContent = useMemo(() => {
    const enabledBosses = Object.keys(SOLO_BOSSES).filter(
      (id) => SOLO_BOSSES[id].enabled && selections.bosses?.[id] !== false
    ).length;

    const enabledRaids = Object.keys(RAIDS).filter(
      (id) => RAIDS[id].enabled && selections.raids?.[id] !== false
    ).length;

    const enabledSkills = Object.keys(SKILLS).filter(
      (id) => SKILLS[id].enabled !== false && selections.skills?.[id] !== false
    ).length;

    const enabledMinigames = Object.keys(MINIGAMES).filter(
      (id) => MINIGAMES[id].enabled && selections.minigames?.[id] !== false
    ).length;

    const enabledClues = Object.keys(CLUE_TIERS).filter(
      (id) => CLUE_TIERS[id].enabled !== false && selections.clues?.[id] !== false
    ).length;

    return enabledBosses + enabledRaids + enabledSkills + enabledMinigames + enabledClues;
  }, [selections]);

  const canSave = totalEnabledContent >= MIN_CONTENT_REQUIRED;

  // Group items by source
  const groupedItems = useMemo(() => groupItemsBySource(COLLECTIBLE_ITEMS), []);
  const bossCategories = useMemo(() => getBossCategories(), []);
  const skillOptions = useMemo(() => getSkillOptions(), []);
  const minigameOptions = useMemo(() => getMinigameOptions(), []);
  const clueOptions = useMemo(() => getClueOptions(), []);
  const raidOptions = useMemo(() => getRaidOptions(), []);

  // Calculate stats
  const stats = useMemo(() => {
    const enabledBosses = Object.keys(SOLO_BOSSES).filter(
      (id) => SOLO_BOSSES[id].enabled && selections.bosses?.[id] !== false
    ).length;
    const enabledRaids = Object.keys(RAIDS).filter(
      (id) => RAIDS[id].enabled && selections.raids?.[id] !== false
    ).length;
    const enabledD = Object.values(COLLECTIBLE_ITEMS).filter((item) => {
      if (!item.enabled) return false;
      if (selections.items?.[item.id] === false) return false;
      return parseItemSources(item, selections);
    });
    const enabledDrops = enabledD.length;
    const enabledClues = Object.keys(CLUE_TIERS).filter(
      (id) => CLUE_TIERS[id].enabled !== false && selections.clues?.[id] !== false
    ).length;
    return { enabledBosses, enabledRaids, enabledDrops, enabledClues };
  }, [selections]);

  const handleToggle = (category, id) => {
    setSelections((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [id]: !(prev[category]?.[id] ?? true),
      },
    }));
  };

  const handleToggleDrop = (itemId) => {
    setSelections((prev) => ({
      ...prev,
      items: {
        ...(prev.items || {}),
        [itemId]: !(prev.items?.[itemId] ?? true),
      },
    }));
  };

  const handleToggleAllDrops = (drops, enabled) => {
    const updates = {};
    drops.forEach((drop) => {
      updates[drop.id] = enabled;
    });
    setSelections((prev) => ({
      ...prev,
      items: { ...(prev.items || {}), ...updates },
    }));
  };

  const handleToggleAllBosses = (bosses, enabled) => {
    const updates = {};
    bosses.forEach((boss) => {
      updates[boss.id] = enabled;
    });
    setSelections((prev) => ({
      ...prev,
      bosses: { ...(prev.bosses || {}), ...updates },
    }));
  };

  const handleToggleAll = (category, items, enabled) => {
    const updates = {};
    items.forEach((item) => {
      updates[item.id] = enabled;
    });
    setSelections((prev) => ({
      ...prev,
      [category]: { ...(prev[category] || {}), ...updates },
    }));
  };

  const handleSave = () => {
    onSave(selections);
    onClose();
  };

  const isSelected = (category, id) => {
    return selections[category]?.[id] ?? true;
  };

  const getSelectedCount = (category, items) => {
    return items.filter((item) => isSelected(category, item.id)).length;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.800" color="white" maxH="90vh">
        <ModalHeader color="white">
          <HStack spacing={2}>
            <Text>Customize Event Content</Text>
            <Tooltip
              label="Select which bosses, skills, and activities will be available in your event's objectives"
              placement="right"
            >
              <Icon as={InfoIcon} boxSize={4} color="gray.500" />
            </Tooltip>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />

        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Stats bar */}
            <HStack spacing={6} p={3} bg="purple.900" borderRadius="md" justify="center">
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="semibold" color="purple.300">
                  {stats.enabledBosses}
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Bosses
                </Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="semibold" color="purple.300">
                  {stats.enabledRaids}
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Raids
                </Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="semibold" color="purple.300">
                  {stats.enabledDrops}
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Drops
                </Text>
              </VStack>
            </HStack>

            <Text fontSize="sm" color="gray.400">
              Toggle content on/off to customize what appears in your event. Disabling a boss will
              also disable all its unique drops.
            </Text>

            <Box p={3} bg="blue.900" borderRadius="md">
              <HStack spacing={2} align="flex-start">
                <Icon as={InfoIcon} color="blue.400" mt={0.5} />
                <Text fontSize="xs" color="gray.200">
                  <strong>Smart Filtering:</strong> Disabling a boss will exclude both kill count
                  objectives AND item collection objectives for that boss's drops. You can keep a
                  boss enabled for KC objectives but disable specific drops.
                </Text>
              </HStack>
            </Box>

            <Accordion allowMultiple defaultIndex={[0]}>
              {/* BOSSES & DROPS */}
              <AccordionItem borderColor="gray.600">
                <AccordionButton _hover={{ bg: 'whiteAlpha.100' }}>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="semibold" color="white">
                        ⚔️ Bosses & Unique Drops
                      </Text>
                      <Badge colorScheme="purple">{stats.enabledBosses} bosses</Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color="white" />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* All/None for all bosses */}
                    <HStack justify="flex-end">
                      <Text fontSize="xs" color="gray.500">
                        All Bosses:
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => handleToggleAllBosses(Object.values(SOLO_BOSSES), true)}
                      >
                        All
                      </Button>
                      <Text color="gray.500" fontSize="xs">
                        |
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        onClick={() => handleToggleAllBosses(Object.values(SOLO_BOSSES), false)}
                      >
                        None
                      </Button>
                    </HStack>

                    {/* God Wars Dungeon */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.100" mb={2}>
                        God Wars Dungeon
                      </Text>
                      {bossCategories.gwd.map((boss) => (
                        <BossDropsRow
                          key={boss.id}
                          entity={boss}
                          entityType="bosses"
                          drops={groupedItems.bosses[boss.id] || []}
                          selections={selections}
                          onToggleEntity={handleToggle}
                          onToggleDrop={handleToggleDrop}
                          onToggleAllDrops={handleToggleAllDrops}
                        />
                      ))}
                    </Box>

                    <Divider borderColor="gray.600" />

                    {/* Slayer Bosses */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.100" mb={2}>
                        Slayer Bosses
                      </Text>
                      {bossCategories.slayer.map((boss) => (
                        <BossDropsRow
                          key={boss.id}
                          entity={boss}
                          entityType="bosses"
                          drops={groupedItems.bosses[boss.id] || []}
                          selections={selections}
                          onToggleEntity={handleToggle}
                          onToggleDrop={handleToggleDrop}
                          onToggleAllDrops={handleToggleAllDrops}
                        />
                      ))}
                    </Box>

                    <Divider borderColor="gray.600" />

                    {/* Wilderness Bosses */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.100" mb={2}>
                        Wilderness Bosses
                      </Text>
                      {bossCategories.wilderness.map((boss) => (
                        <BossDropsRow
                          key={boss.id}
                          entity={boss}
                          entityType="bosses"
                          drops={groupedItems.bosses[boss.id] || []}
                          selections={selections}
                          onToggleEntity={handleToggle}
                          onToggleDrop={handleToggleDrop}
                          onToggleAllDrops={handleToggleAllDrops}
                        />
                      ))}
                    </Box>

                    <Divider borderColor="gray.600" />

                    {/* Other Bosses */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.100" mb={2}>
                        Other Bosses
                      </Text>
                      {bossCategories.other.map((boss) => (
                        <BossDropsRow
                          key={boss.id}
                          entity={boss}
                          entityType="bosses"
                          drops={groupedItems.bosses[boss.id] || []}
                          selections={selections}
                          onToggleEntity={handleToggle}
                          onToggleDrop={handleToggleDrop}
                          onToggleAllDrops={handleToggleAllDrops}
                        />
                      ))}
                    </Box>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* RAIDS & DROPS */}
              <AccordionItem borderColor="gray.600">
                <AccordionButton _hover={{ bg: 'whiteAlpha.100' }}>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="semibold" color="white">
                        🏛️ Raids & Unique Drops
                      </Text>
                      <Badge colorScheme="purple">{stats.enabledRaids} raids</Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color="white" />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={2} align="stretch">
                    {/* All/None for all raids */}
                    <HStack justify="flex-end" mb={2}>
                      <Text fontSize="xs" color="gray.500">
                        All Raids:
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => handleToggleAll('raids', Object.values(RAIDS), true)}
                      >
                        All
                      </Button>
                      <Text color="gray.500" fontSize="xs">
                        |
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        onClick={() => handleToggleAll('raids', Object.values(RAIDS), false)}
                      >
                        None
                      </Button>
                    </HStack>

                    {raidOptions.map((raid) => (
                      <BossDropsRow
                        key={raid.id}
                        entity={raid}
                        entityType="raids"
                        drops={groupedItems.raids[raid.id] || []}
                        selections={selections}
                        onToggleEntity={handleToggle}
                        onToggleDrop={handleToggleDrop}
                        onToggleAllDrops={handleToggleAllDrops}
                      />
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* SKILLS */}
              <AccordionItem borderColor="gray.600">
                <AccordionButton _hover={{ bg: 'whiteAlpha.100' }}>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="semibold" color="white">
                        📊 Skills
                      </Text>
                      <Badge colorScheme="purple">
                        {getSelectedCount('skills', [
                          ...skillOptions.gathering,
                          ...skillOptions.artisan,
                          ...skillOptions.support,
                          ...skillOptions.combat,
                        ])}{' '}
                        selected
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color="white" />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* All/None for all skills */}
                    <HStack justify="flex-end">
                      <Text fontSize="xs" color="gray.500">
                        All Skills:
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() =>
                          handleToggleAll(
                            'skills',
                            [
                              ...skillOptions.gathering,
                              ...skillOptions.artisan,
                              ...skillOptions.support,
                              ...skillOptions.combat,
                            ],
                            true
                          )
                        }
                      >
                        All
                      </Button>
                      <Text color="gray.500" fontSize="xs">
                        |
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        onClick={() =>
                          handleToggleAll(
                            'skills',
                            [
                              ...skillOptions.gathering,
                              ...skillOptions.artisan,
                              ...skillOptions.support,
                              ...skillOptions.combat,
                            ],
                            false
                          )
                        }
                      >
                        None
                      </Button>
                    </HStack>

                    {Object.entries(skillOptions).map(([category, skills]) => (
                      <Box key={category}>
                        <HStack justify="space-between" mb={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color="gray.100"
                            textTransform="capitalize"
                          >
                            {category} Skills
                          </Text>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="purple"
                              onClick={() => handleToggleAll('skills', skills, true)}
                            >
                              All
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              color="gray.400"
                              onClick={() => handleToggleAll('skills', skills, false)}
                            >
                              None
                            </Button>
                          </HStack>
                        </HStack>
                        <SimpleGrid columns={3} spacing={2}>
                          {skills.map((skill) => (
                            <Checkbox
                              key={skill.id}
                              isChecked={isSelected('skills', skill.id)}
                              onChange={() => handleToggle('skills', skill.id)}
                              colorScheme="purple"
                            >
                              <Text fontSize="sm" color="gray.100">
                                {skill.icon} {skill.name}
                              </Text>
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* MINIGAMES & REWARDS */}
              <AccordionItem borderColor="gray.600">
                <AccordionButton _hover={{ bg: 'whiteAlpha.100' }}>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="semibold" color="white">
                        🎮 Minigames & Rewards
                      </Text>
                      <Badge colorScheme="purple">
                        {getSelectedCount('minigames', [
                          ...minigameOptions.skilling,
                          ...minigameOptions.combat,
                          ...minigameOptions.pvp,
                        ])}{' '}
                        selected
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color="white" />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* All/None for all minigames */}
                    <HStack justify="flex-end">
                      <Text fontSize="xs" color="gray.500">
                        All Minigames:
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() =>
                          handleToggleAll(
                            'minigames',
                            [
                              ...minigameOptions.skilling,
                              ...minigameOptions.combat,
                              ...minigameOptions.pvp,
                            ],
                            true
                          )
                        }
                      >
                        All
                      </Button>
                      <Text color="gray.500" fontSize="xs">
                        |
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        onClick={() =>
                          handleToggleAll(
                            'minigames',
                            [
                              ...minigameOptions.skilling,
                              ...minigameOptions.combat,
                              ...minigameOptions.pvp,
                            ],
                            false
                          )
                        }
                      >
                        None
                      </Button>
                    </HStack>

                    {Object.entries(minigameOptions).map(([category, minigames]) => (
                      <Box key={category}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.100"
                          textTransform="capitalize"
                          mb={2}
                        >
                          {category} Minigames
                        </Text>
                        {minigames.map((minigame) => {
                          const minigameData = MINIGAMES[minigame.id];
                          const drops = groupedItems.minigames[minigame.id] || [];
                          return (
                            <BossDropsRow
                              key={minigame.id}
                              entity={minigameData}
                              entityType="minigames"
                              drops={drops}
                              selections={selections}
                              onToggleEntity={handleToggle}
                              onToggleDrop={handleToggleDrop}
                              onToggleAllDrops={handleToggleAllDrops}
                            />
                          );
                        })}
                        {category !== 'pvp' && <Divider mt={2} borderColor="gray.600" />}
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* CLUE SCROLLS */}
              <AccordionItem borderColor="gray.600">
                <AccordionButton _hover={{ bg: 'whiteAlpha.100' }}>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="semibold" color="white">
                        📜 Clue Scrolls
                      </Text>
                      <Badge colorScheme="purple">{stats.enabledClues} selected</Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color="white" />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* All/None for all clues */}
                    <HStack justify="flex-end">
                      <Text fontSize="xs" color="gray.500">
                        All Clues:
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => handleToggleAll('clues', clueOptions, true)}
                      >
                        All
                      </Button>
                      <Text color="gray.500" fontSize="xs">
                        |
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        onClick={() => handleToggleAll('clues', clueOptions, false)}
                      >
                        None
                      </Button>
                    </HStack>

                    <Text fontSize="sm" color="gray.400">
                      Select which clue scroll tiers can appear as objectives.
                    </Text>

                    <SimpleGrid columns={3} spacing={3}>
                      {clueOptions.map((clue) => (
                        <Checkbox
                          key={clue.id}
                          isChecked={isSelected('clues', clue.id)}
                          onChange={() => handleToggle('clues', clue.id)}
                          colorScheme="purple"
                        >
                          <HStack spacing={2}>
                            <Badge colorScheme={getClueColorScheme(clue.color)} fontSize="xs">
                              {clue.name}
                            </Badge>
                          </HStack>
                        </Checkbox>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            <Divider borderColor="gray.600" />

            {/* Validation Warning */}
            {!canSave && (
              <Alert status="error" borderRadius="md" bg="red.900">
                <AlertIcon color="red.300" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="red.200">
                    Not enough content enabled
                  </Text>
                  <Text fontSize="xs" color="red.300">
                    At least {MIN_CONTENT_REQUIRED} content items must be enabled to generate a
                    meaningful map. Currently enabled: {totalEnabledContent}
                  </Text>
                </VStack>
              </Alert>
            )}

            {/* Content Stats Summary */}
            <Box p={3} bg="gray.700" borderRadius="md">
              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                <Text fontSize="xs" color="gray.200">
                  <strong>Total Enabled:</strong> {totalEnabledContent}/{totalContentAltogether}{' '}
                  bits of content
                </Text>
                <Badge colorScheme={canSave ? 'green' : 'red'} fontSize="xs">
                  {canSave
                    ? '✓ Ready to save'
                    : `Need ${MIN_CONTENT_REQUIRED - totalEnabledContent} more`}
                </Badge>
              </HStack>
            </Box>

            <HStack justify="flex-end" spacing={3}>
              <Button variant="ghost" color="gray.400" onClick={onClose}>
                Cancel
              </Button>
              <Tooltip
                label={!canSave ? `Enable at least ${MIN_CONTENT_REQUIRED} bits of content` : ''}
                isDisabled={canSave}
              >
                <Button
                  colorScheme="purple"
                  onClick={handleSave}
                  isDisabled={!canSave}
                  opacity={canSave ? 1 : 0.6}
                  cursor={canSave ? 'pointer' : 'not-allowed'}
                >
                  Save Selections
                </Button>
              </Tooltip>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
