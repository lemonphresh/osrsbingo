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
  useColorMode,
  Tooltip,
  Icon,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { InfoIcon, ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  parseItemSources,
} from '../../utils/objectiveCollections';

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

// Component for a boss/raid with its drops
function BossDropsRow({
  entity,
  entityType,
  drops,
  selections,
  onToggleEntity,
  onToggleDrop,
  onToggleAllDrops,
  colorMode,
  currentColors,
}) {
  const [expanded, setExpanded] = useState(false);
  // Map entityType to the correct selections category
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
      borderColor={entityEnabled ? (colorMode === 'dark' ? 'gray.600' : 'gray.200') : 'gray.100'}
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
        _hover={hasDrops ? { bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50' } : {}}
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
            <Text fontWeight="medium" color={currentColors.textColor} fontSize="sm">
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

        {hasDrops && entityEnabled && (
          <HStack spacing={2} onClick={(e) => e.stopPropagation()}>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="purple"
              onClick={() => onToggleAllDrops(drops, true)}
            >
              All
            </Button>
            <Text color="gray.400">|</Text>
            <Button size="xs" variant="ghost" onClick={() => onToggleAllDrops(drops, false)}>
              None
            </Button>
          </HStack>
        )}
      </HStack>

      <Collapse in={expanded && hasDrops}>
        <Box
          borderTopWidth={1}
          borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
          p={3}
          bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50'}
        >
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
                    <Text
                      fontSize="sm"
                      color={entityEnabled ? currentColors.textColor : 'gray.500'}
                    >
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
    gathering: skills
      .filter((s) => s.category === 'gathering')
      .map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
    artisan: skills
      .filter((s) => s.category === 'artisan')
      .map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
    support: skills
      .filter((s) => s.category === 'support')
      .map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
    combat: skills
      .filter((s) => s.category === 'combat')
      .map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
  };
}

function getMinigameOptions() {
  const minigames = Object.values(MINIGAMES);
  return {
    skilling: minigames
      .filter((m) => m.category === 'skilling')
      .map((m) => ({ id: m.id, name: m.name })),
    combat: minigames
      .filter((m) => m.category === 'combat')
      .map((m) => ({ id: m.id, name: m.name })),
    pvp: minigames.filter((m) => m.category === 'pvp').map((m) => ({ id: m.id, name: m.name })),
  };
}

function getBossCategories() {
  const bosses = Object.values(SOLO_BOSSES);
  return {
    gwd: bosses.filter((b) => b.tags?.includes('gwd')),
    wilderness: bosses.filter((b) => b.category === 'wilderness'),
    slayer: bosses.filter((b) => b.tags?.some((tag) => tag.includes('slayer'))),
    other: bosses.filter(
      (b) =>
        !b.tags?.includes('gwd') &&
        b.category !== 'wilderness' &&
        !b.tags?.some((tag) => tag.includes('slayer'))
    ),
  };
}

export default function ContentSelectionModal({ isOpen, onClose, currentSelections, onSave }) {
  const [selections, setSelections] = useState(
    currentSelections || {
      bosses: {},
      raids: {},
      skills: {},
      minigames: {},
      items: {},
    }
  );
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  // Group items by source
  const groupedItems = useMemo(() => groupItemsBySource(COLLECTIBLE_ITEMS), []);
  const bossCategories = useMemo(() => getBossCategories(), []);
  const skillOptions = getSkillOptions();
  const minigameOptions = getMinigameOptions();

  // Calculate stats
  const stats = useMemo(() => {
    const enabledBosses = Object.keys(SOLO_BOSSES).filter(
      (id) => selections.bosses?.[id] !== false
    ).length;
    const enabledRaids = Object.keys(RAIDS).filter((id) => selections.raids?.[id] !== false).length;
    const enabledDrops = Object.values(COLLECTIBLE_ITEMS).filter((item) => {
      if (selections.items?.[item.id] === false) return false;
      return parseItemSources(item, selections);
    }).length;
    return { enabledBosses, enabledRaids, enabledDrops };
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
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg} maxH="90vh">
        <ModalHeader color={currentColors.textColor}>
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
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Stats bar */}
            <HStack
              spacing={6}
              p={3}
              bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
              borderRadius="md"
              justify="center"
            >
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={currentColors.purple.base}>
                  {stats.enabledBosses}
                </Text>
                <Text fontSize="xs" color={currentColors.textColor}>
                  Bosses
                </Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={currentColors.purple.base}>
                  {stats.enabledRaids}
                </Text>
                <Text fontSize="xs" color={currentColors.textColor}>
                  Raids
                </Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={currentColors.purple.base}>
                  {stats.enabledDrops}
                </Text>
                <Text fontSize="xs" color={currentColors.textColor}>
                  Drops
                </Text>
              </VStack>
            </HStack>

            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
              Toggle content on/off to customize what appears in your event. Disabling a boss will
              also disable all its unique drops.
            </Text>

            <Accordion allowMultiple defaultIndex={[0]}>
              {/* BOSSES & DROPS */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        ⚔️ Bosses & Unique Drops
                      </Text>
                      <Badge colorScheme="purple">{stats.enabledBosses} bosses</Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color={currentColors.textColor} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* God Wars Dungeon */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                          God Wars Dungeon
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.gwd, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.gwd, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
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
                          colorMode={colorMode}
                          currentColors={currentColors}
                        />
                      ))}
                    </Box>

                    <Divider />

                    {/* Slayer Bosses */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                          Slayer Bosses
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.slayer, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.slayer, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
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
                          colorMode={colorMode}
                          currentColors={currentColors}
                        />
                      ))}
                    </Box>

                    <Divider />

                    {/* Wilderness Bosses */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                          Wilderness Bosses
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.wilderness, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.wilderness, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
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
                          colorMode={colorMode}
                          currentColors={currentColors}
                        />
                      ))}
                    </Box>

                    <Divider />

                    {/* Other Bosses */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                          Other Bosses
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.other, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAllBosses(bossCategories.other, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
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
                          colorMode={colorMode}
                          currentColors={currentColors}
                        />
                      ))}
                    </Box>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* RAIDS & DROPS */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        🏛️ Raids & Unique Drops
                      </Text>
                      <Badge colorScheme="purple">{stats.enabledRaids} raids</Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color={currentColors.textColor} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={2} align="stretch">
                    {Object.values(RAIDS).map((raid) => (
                      <BossDropsRow
                        key={raid.id}
                        entity={raid}
                        entityType="raids"
                        drops={groupedItems.raids[raid.id] || []}
                        selections={selections}
                        onToggleEntity={handleToggle}
                        onToggleDrop={handleToggleDrop}
                        onToggleAllDrops={handleToggleAllDrops}
                        colorMode={colorMode}
                        currentColors={currentColors}
                      />
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* SKILLS */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
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
                  <AccordionIcon color={currentColors.textColor} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {Object.entries(skillOptions).map(([category, skills]) => (
                      <Box key={category}>
                        <HStack justify="space-between" mb={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color={currentColors.textColor}
                            textTransform="capitalize"
                          >
                            {category} Skills
                          </Text>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleToggleAll('skills', skills, true)}
                            >
                              All
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
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
                              <Text fontSize="sm" color={currentColors.textColor}>
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
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
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
                  <AccordionIcon color={currentColors.textColor} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {Object.entries(minigameOptions).map(([category, minigames]) => (
                      <Box key={category}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color={currentColors.textColor}
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
                              colorMode={colorMode}
                              currentColors={currentColors}
                            />
                          );
                        })}
                        {category !== 'pvp' && <Divider mt={2} />}
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {/* Info box */}
            <Box p={3} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md">
              <HStack spacing={2} align="flex-start">
                <Icon as={InfoIcon} color="blue.400" mt={0.5} />
                <Text fontSize="xs" color={currentColors.textColor}>
                  <strong>Smart Filtering:</strong> Disabling a boss will exclude both kill count
                  objectives AND item collection objectives for that boss's drops. You can keep a
                  boss enabled for KC objectives but disable specific drops.
                </Text>
              </HStack>
            </Box>

            <Divider />

            <HStack justify="flex-end" spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                bg={currentColors.purple.base}
                color="white"
                _hover={{ bg: currentColors.purple.light }}
                onClick={handleSave}
              >
                Save Selections
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
