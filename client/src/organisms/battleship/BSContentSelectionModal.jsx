import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  AlertIcon,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import useContentRegistry from '../../hooks/useContentRegistry';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sortByName(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function getClueColorScheme(color) {
  return { green: 'green', blue: 'blue', purple: 'purple', orange: 'orange', red: 'red' }[color] ?? 'gray';
}

const DT2_IDS = new Set(['dukeSucellus', 'leviathan', 'whisperer', 'vardorvis']);

function getBossCategories(soloBosses) {
  const bosses = Object.values(soloBosses);
  return {
    gwd:       sortByName(bosses.filter((b) => b.tags?.includes('gwd'))),
    wilderness: sortByName(bosses.filter((b) => b.category === 'wilderness' && !DT2_IDS.has(b.id))),
    dt2:       sortByName(bosses.filter((b) => DT2_IDS.has(b.id))),
    slayer:    sortByName(bosses.filter((b) => !DT2_IDS.has(b.id) && b.tags?.some((t) => t.includes('slayer')))),
    other:     sortByName(bosses.filter(
      (b) => !DT2_IDS.has(b.id) && !b.tags?.includes('gwd') && b.category !== 'wilderness' && !b.tags?.some((t) => t.includes('slayer'))
    )),
  };
}

function getSkillOptions(skills) {
  const list = Object.values(skills);
  return {
    gathering: sortByName(list.filter((s) => s.category === 'gathering').map((s) => ({ id: s.id, name: s.name, icon: s.icon }))),
    artisan:   sortByName(list.filter((s) => s.category === 'artisan').map((s) => ({ id: s.id, name: s.name, icon: s.icon }))),
    support:   sortByName(list.filter((s) => s.category === 'support').map((s) => ({ id: s.id, name: s.name, icon: s.icon }))),
    combat:    sortByName(list.filter((s) => s.category === 'combat').map((s) => ({ id: s.id, name: s.name, icon: s.icon }))),
  };
}

function getMinigameOptions(minigames) {
  const list = Object.values(minigames);
  return {
    skilling: sortByName(list.filter((m) => m.category === 'skilling').map((m) => ({ id: m.id, name: m.name }))),
    combat:   sortByName(list.filter((m) => m.category === 'combat').map((m) => ({ id: m.id, name: m.name }))),
    pvp:      sortByName(list.filter((m) => m.category === 'pvp').map((m) => ({ id: m.id, name: m.name }))),
  };
}

// Bosses/raids whose contentIds are hardcoded to ship cells — they always appear on ships
// regardless of ocean content selection, so we note this in the UI.
const SHIP_CONTENT_IDS = new Set([
  'chambersOfXeric', 'theatreOfBlood', 'tombsOfAmascut', 'nightmare', 'crystallineHunllef',
  'nex', 'corporealBeast', 'leviathan', 'whisperer',
  'cerberus', 'vorkath', 'zulrah',
  'alchemicalHydra', 'vardorvis', 'dukeSucellus',
  'chaosElemental', 'scorpia',
]);

const MIN_CONTENT_REQUIRED = 10;

// ── Checkbox row for a single boss/raid/minigame ──────────────────────────────

function EntityRow({ id, name, isSelected, onChange, isShipContent }) {
  return (
    <HStack
      py={1}
      px={2}
      borderRadius="sm"
      opacity={isSelected ? 1 : 0.55}
      _hover={{ bg: 'whiteAlpha.50' }}
      transition="opacity 0.15s"
    >
      <Checkbox
        isChecked={isSelected}
        onChange={onChange}
        colorScheme="cyan"
        size="sm"
      />
      <Text fontSize="sm" color={isSelected ? '#e2e8f0' : '#64748b'} flex="1">
        {name}
      </Text>
      {isShipContent && (
        <Tooltip label="Always appears on ship tiles regardless of this setting" placement="top">
          <Badge fontSize="9px" colorScheme="blue" variant="outline">ship</Badge>
        </Tooltip>
      )}
    </HStack>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BSContentSelectionModal({ isOpen, onClose, currentSelections, onSave, isLoading = false }) {
  const { soloBosses, raids, skills, minigames, clueTiers, loading: registryLoading } = useContentRegistry();

  const [selections, setSelections] = useState(
    currentSelections ?? { bosses: {}, raids: {}, skills: {}, minigames: {}, clues: {} }
  );

  // Re-sync internal state every time the modal opens, so currentSelections changes are picked up.
  const currentSelectionsRef = useRef(currentSelections);
  currentSelectionsRef.current = currentSelections;
  useEffect(() => {
    if (isOpen) {
      setSelections(
        currentSelectionsRef.current ?? { bosses: {}, raids: {}, skills: {}, minigames: {}, clues: {} }
      );
    }
  }, [isOpen]);

  const isSelected = (category, id) => selections[category]?.[id] ?? true;

  const handleToggle = (category, id) => {
    setSelections((prev) => ({
      ...prev,
      [category]: { ...(prev[category] ?? {}), [id]: !isSelected(category, id) },
    }));
  };

  const handleToggleAll = (category, items, enabled) => {
    const updates = {};
    items.forEach((item) => { updates[item.id] = enabled; });
    setSelections((prev) => ({ ...prev, [category]: { ...(prev[category] ?? {}), ...updates } }));
  };

  const getSelectedCount = (category, items) => items.filter((item) => isSelected(category, item.id)).length;

  const bossCategories = useMemo(() => soloBosses ? getBossCategories(soloBosses) : null, [soloBosses]);
  const skillOptions   = useMemo(() => skills ? getSkillOptions(skills) : null, [skills]);
  const minigameOptions = useMemo(() => minigames ? getMinigameOptions(minigames) : null, [minigames]);
  const raidList       = useMemo(() => raids ? sortByName(Object.values(raids)) : [], [raids]);
  const clueList       = useMemo(() => clueTiers ? sortByName(Object.values(clueTiers).map((c) => ({ id: c.id, name: c.name, color: c.color }))) : [], [clueTiers]);

  const totalEnabled = useMemo(() => {
    if (!soloBosses) return 0;
    return (
      Object.keys(soloBosses).filter((id) => soloBosses[id].enabled && isSelected('bosses', id)).length +
      Object.keys(raids).filter((id) => raids[id].enabled && isSelected('raids', id)).length +
      Object.keys(skills).filter((id) => skills[id].enabled !== false && isSelected('skills', id)).length +
      Object.keys(minigames).filter((id) => minigames[id].enabled && isSelected('minigames', id)).length +
      Object.keys(clueTiers).filter((id) => clueTiers[id].enabled !== false && isSelected('clues', id)).length
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloBosses, raids, skills, minigames, clueTiers, selections]);

  const canSave = totalEnabled >= MIN_CONTENT_REQUIRED;

  const headerStyle = {
    fontFamily: 'mono',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const sectionLabel = (label) => (
    <Text {...headerStyle} mb={2}>{label}</Text>
  );

  const allNoneButtons = (category, items) => (
    <HStack justify="flex-end" mb={2} spacing={1}>
      <Text fontSize="xs" color="#475569">Select:</Text>
      <Button size="xs" variant="ghost" colorScheme="cyan" onClick={() => handleToggleAll(category, items, true)}>All</Button>
      <Text color="#475569" fontSize="xs">|</Text>
      <Button size="xs" variant="ghost" color="#64748b" onClick={() => handleToggleAll(category, items, false)}>None</Button>
    </HStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#0d2137" color="#e2e8f0" border="1px solid" borderColor="#1e4976" maxH="90vh">
        <ModalHeader fontFamily="mono" fontSize="sm" letterSpacing="widest" textTransform="uppercase" color="#e2e8f0">
          <HStack spacing={2}>
            <Text>Customize Ocean Content</Text>
            <Tooltip label="Controls which bosses, skills, and activities appear on ocean tiles. Ship tiles are assigned separately." placement="right">
              <Icon as={InfoIcon} boxSize={4} color="#475569" />
            </Tooltip>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="#64748b" _hover={{ color: '#e2e8f0' }} />

        <ModalBody pb={6}>
          {registryLoading || !bossCategories ? (
            <Text color="#64748b" fontFamily="mono" fontSize="sm" py={8} textAlign="center">Loading registry...</Text>
          ) : (
            <VStack spacing={4} align="stretch">

              {/* Info banner */}
              <Box p={3} bg="#071523" borderRadius="md" border="1px solid" borderColor="#1e4976">
                <HStack spacing={2} align="flex-start">
                  <Icon as={InfoIcon} color="#0ea5e9" mt={0.5} flexShrink={0} />
                  <Text fontSize="xs" color="#94a3b8" fontFamily="mono">
                    Disabled content won't appear on ocean tiles. Bosses marked{' '}
                    <Badge fontSize="9px" colorScheme="blue" variant="outline">ship</Badge>{' '}
                    always appear on ship cells regardless — you can reassign individual ship tile
                    tasks in the next step if you'd like.
                  </Text>
                </HStack>
              </Box>

              <Accordion allowMultiple defaultIndex={[0]}>

                {/* BOSSES */}
                <AccordionItem borderColor="#1e4976">
                  <AccordionButton _hover={{ bg: 'whiteAlpha.50' }}>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#e2e8f0">⚔️ Bosses</Text>
                        <Badge colorScheme="cyan" variant="subtle">
                          {getSelectedCount('bosses', Object.values(soloBosses).map((b) => ({ id: b.id })))} selected
                        </Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon color="#64748b" />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3} align="stretch">
                      {allNoneButtons('bosses', Object.values(soloBosses).map((b) => ({ id: b.id })))}
                      {Object.entries(bossCategories).map(([cat, bosses]) => bosses.length === 0 ? null : (
                        <Box key={cat}>
                          {sectionLabel({ gwd: 'God Wars Dungeon', wilderness: 'Wilderness', dt2: 'DT2 Bosses', slayer: 'Slayer', other: 'Other' }[cat])}
                          {bosses.map((boss) => (
                            <EntityRow
                              key={boss.id}
                              id={boss.id}
                              name={boss.name + (boss.shortName ? ` (${boss.shortName})` : '')}
                              isSelected={isSelected('bosses', boss.id)}
                              onChange={() => handleToggle('bosses', boss.id)}
                              isShipContent={SHIP_CONTENT_IDS.has(boss.id)}
                            />
                          ))}
                        </Box>
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* RAIDS */}
                <AccordionItem borderColor="#1e4976">
                  <AccordionButton _hover={{ bg: 'whiteAlpha.50' }}>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#e2e8f0">🏛️ Raids</Text>
                        <Badge colorScheme="cyan" variant="subtle">{getSelectedCount('raids', raidList)} selected</Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon color="#64748b" />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={1} align="stretch">
                      {allNoneButtons('raids', raidList)}
                      {raidList.map((raid) => (
                        <EntityRow
                          key={raid.id}
                          id={raid.id}
                          name={raid.name}
                          isSelected={isSelected('raids', raid.id)}
                          onChange={() => handleToggle('raids', raid.id)}
                          isShipContent={SHIP_CONTENT_IDS.has(raid.id)}
                        />
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* SKILLS */}
                <AccordionItem borderColor="#1e4976">
                  <AccordionButton _hover={{ bg: 'whiteAlpha.50' }}>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#e2e8f0">📊 Skills</Text>
                        <Badge colorScheme="cyan" variant="subtle">
                          {getSelectedCount('skills', Object.values(skillOptions).flat())} selected
                        </Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon color="#64748b" />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3} align="stretch">
                      {allNoneButtons('skills', Object.values(skillOptions).flat())}
                      {Object.entries(skillOptions).map(([cat, catSkills]) => (
                        <Box key={cat}>
                          <HStack justify="space-between" mb={1}>
                            {sectionLabel(`${cat} Skills`)}
                            <HStack spacing={1}>
                              <Button size="xs" variant="ghost" colorScheme="cyan" onClick={() => handleToggleAll('skills', catSkills, true)}>All</Button>
                              <Button size="xs" variant="ghost" color="#64748b" onClick={() => handleToggleAll('skills', catSkills, false)}>None</Button>
                            </HStack>
                          </HStack>
                          <SimpleGrid columns={3} spacing={1}>
                            {catSkills.map((skill) => (
                              <Checkbox
                                key={skill.id}
                                isChecked={isSelected('skills', skill.id)}
                                onChange={() => handleToggle('skills', skill.id)}
                                colorScheme="cyan"
                                size="sm"
                              >
                                <Text fontSize="sm" color={isSelected('skills', skill.id) ? '#e2e8f0' : '#475569'}>
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

                {/* MINIGAMES */}
                <AccordionItem borderColor="#1e4976">
                  <AccordionButton _hover={{ bg: 'whiteAlpha.50' }}>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#e2e8f0">🎮 Minigames</Text>
                        <Badge colorScheme="cyan" variant="subtle">
                          {getSelectedCount('minigames', Object.values(minigameOptions).flat())} selected
                        </Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon color="#64748b" />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3} align="stretch">
                      {allNoneButtons('minigames', Object.values(minigameOptions).flat())}
                      {Object.entries(minigameOptions).map(([cat, mgs]) => (
                        <Box key={cat}>
                          {sectionLabel(`${cat} Minigames`)}
                          {mgs.map((mg) => (
                            <EntityRow
                              key={mg.id}
                              id={mg.id}
                              name={mg.name}
                              isSelected={isSelected('minigames', mg.id)}
                              onChange={() => handleToggle('minigames', mg.id)}
                              isShipContent={false}
                            />
                          ))}
                          {cat !== 'pvp' && <Divider mt={2} borderColor="#1e4976" />}
                        </Box>
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* CLUE SCROLLS */}
                <AccordionItem borderColor="#1e4976">
                  <AccordionButton _hover={{ bg: 'whiteAlpha.50' }}>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#e2e8f0">📜 Clue Scrolls</Text>
                        <Badge colorScheme="cyan" variant="subtle">{getSelectedCount('clues', clueList)} selected</Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon color="#64748b" />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={2} align="stretch">
                      {allNoneButtons('clues', clueList)}
                      <SimpleGrid columns={3} spacing={2}>
                        {clueList.map((clue) => (
                          <Checkbox
                            key={clue.id}
                            isChecked={isSelected('clues', clue.id)}
                            onChange={() => handleToggle('clues', clue.id)}
                            colorScheme="cyan"
                            size="sm"
                          >
                            <Badge colorScheme={getClueColorScheme(clue.color)} fontSize="xs">{clue.name}</Badge>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

              </Accordion>

              <Divider borderColor="#1e4976" />

              {/* Validation */}
              {!canSave && (
                <Alert status="error" borderRadius="md" bg="#1a0a0a" border="1px solid" borderColor="#7f1d1d">
                  <AlertIcon color="#f87171" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="semibold" color="#fca5a5" fontFamily="mono">Not enough content</Text>
                    <Text fontSize="xs" color="#f87171" fontFamily="mono">
                      At least {MIN_CONTENT_REQUIRED} items required. Currently: {totalEnabled}
                    </Text>
                  </VStack>
                </Alert>
              )}

              {/* Footer */}
              <HStack justify="space-between">
                <Text fontSize="xs" color="#475569" fontFamily="mono">{totalEnabled} items enabled</Text>
                <HStack spacing={3}>
                  <Button
                    variant="ghost"
                    color="#64748b"
                    fontFamily="mono"
                    fontSize="xs"
                    onClick={onClose}
                    _hover={{ color: '#e2e8f0' }}
                  >
                    Cancel
                  </Button>
                  <Tooltip label={!canSave ? `Enable at least ${MIN_CONTENT_REQUIRED} items` : ''} isDisabled={canSave}>
                    <Button
                      bg={canSave ? '#0ea5e9' : '#1e4976'}
                      color={canSave ? '#071523' : '#475569'}
                      fontFamily="mono"
                      fontSize="xs"
                      fontWeight="bold"
                      letterSpacing="widest"
                      textTransform="uppercase"
                      isDisabled={!canSave || isLoading}
                      isLoading={isLoading}
                      loadingText="Saving..."
                      onClick={() => onSave(selections)}
                      _hover={{ bg: canSave ? '#38bdf8' : '#1e4976' }}
                    >
                      Save Selections
                    </Button>
                  </Tooltip>
                </HStack>
              </HStack>

            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
