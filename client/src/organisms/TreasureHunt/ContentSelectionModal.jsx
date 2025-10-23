import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  parseItemSources,
} from '../../utils/objectiveCollections';

// Helper functions to organize content
function getBossKCOptions() {
  const bosses = Object.values(SOLO_BOSSES);

  return {
    raids: Object.values(RAIDS).map((raid) => ({
      id: raid.id,
      name: raid.name,
      shortName: raid.shortName,
    })),
    gwd: bosses.filter((b) => b.tags?.includes('gwd')).map((b) => ({ id: b.id, name: b.name })),
    wilderness: bosses
      .filter((b) => b.category === 'wilderness')
      .map((b) => ({ id: b.id, name: b.name })),
    slayerBosses: bosses
      .filter((b) => b.tags?.some((tag) => tag.includes('slayer')))
      .map((b) => ({ id: b.id, name: b.name })),
    other: bosses
      .filter(
        (b) =>
          !b.tags?.includes('gwd') &&
          b.category !== 'wilderness' &&
          !b.tags?.some((tag) => tag.includes('slayer'))
      )
      .map((b) => ({ id: b.id, name: b.name })),
  };
}

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

function getItemOptions(contentSelections) {
  const items = Object.values(COLLECTIBLE_ITEMS);

  return {
    basic: items
      .filter((i) => i.category === 'basic')
      .map((i) => ({
        id: i.id,
        name: i.name,
        available: parseItemSources(i, contentSelections),
      })),
    resources: items
      .filter((i) => ['logs', 'ores', 'bones'].includes(i.category))
      .map((i) => ({
        id: i.id,
        name: i.name,
        available: parseItemSources(i, contentSelections),
      })),
    valuable: items
      .filter((i) => ['seeds', 'runes'].includes(i.category))
      .map((i) => ({
        id: i.id,
        name: i.name,
        available: parseItemSources(i, contentSelections),
      })),
    bossDrops: items
      .filter((i) => i.category === 'boss-drops')
      .map((i) => ({
        id: i.id,
        name: i.name,
        available: parseItemSources(i, contentSelections),
      })),
    minigameRewards: items
      .filter((i) => i.category === 'minigame-rewards')
      .map((i) => ({
        id: i.id,
        name: i.name,
        available: parseItemSources(i, contentSelections),
      })),
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

  const bossOptions = getBossKCOptions();
  const skillOptions = getSkillOptions();
  const minigameOptions = getMinigameOptions();
  const itemOptions = getItemOptions(selections);

  const handleToggle = (category, id) => {
    setSelections((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [id]: !(prev[category]?.[id] ?? true), // Default to enabled
      },
    }));
  };

  const handleToggleAll = (category, items, enabled) => {
    const updates = {};
    items.forEach((item) => {
      updates[item.id] = enabled;
    });
    setSelections((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        ...updates,
      },
    }));
  };

  const handleSave = () => {
    onSave(selections);
    onClose();
  };

  const isSelected = (category, id) => {
    return selections[category]?.[id] ?? true; // Default to enabled
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
            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
              Toggle content on/off to customize what appears in your event. Disabled content won't
              be used when generating objectives.
            </Text>

            <Accordion allowMultiple defaultIndex={[0]}>
              {/* BOSSES & RAIDS */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        🏆 Bosses & Raids
                      </Text>
                      <Badge colorScheme="purple">
                        {getSelectedCount('bosses', [
                          ...bossOptions.gwd,
                          ...bossOptions.wilderness,
                          ...bossOptions.slayerBosses,
                          ...bossOptions.other,
                        ]) + getSelectedCount('raids', bossOptions.raids)}{' '}
                        selected
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color={currentColors.textColor} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* Raids */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                          Raids
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAll('raids', bossOptions.raids, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAll('raids', bossOptions.raids, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        {bossOptions.raids.map((raid) => (
                          <Checkbox
                            key={raid.id}
                            isChecked={isSelected('raids', raid.id)}
                            onChange={() => handleToggle('raids', raid.id)}
                            colorScheme="purple"
                          >
                            <Text fontSize="sm" color={currentColors.textColor}>
                              {raid.name} ({raid.shortName})
                            </Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </Box>

                    <Divider />

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
                            onClick={() => handleToggleAll('bosses', bossOptions.gwd, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAll('bosses', bossOptions.gwd, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        {bossOptions.gwd.map((boss) => (
                          <Checkbox
                            key={boss.id}
                            isChecked={isSelected('bosses', boss.id)}
                            onChange={() => handleToggle('bosses', boss.id)}
                            colorScheme="purple"
                          >
                            <Text fontSize="sm" color={currentColors.textColor}>
                              {boss.name}
                            </Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
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
                            onClick={() => handleToggleAll('bosses', bossOptions.wilderness, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAll('bosses', bossOptions.wilderness, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        {bossOptions.wilderness.map((boss) => (
                          <Checkbox
                            key={boss.id}
                            isChecked={isSelected('bosses', boss.id)}
                            onChange={() => handleToggle('bosses', boss.id)}
                            colorScheme="purple"
                          >
                            <Text fontSize="sm" color={currentColors.textColor}>
                              {boss.name}
                            </Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
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
                            onClick={() =>
                              handleToggleAll('bosses', bossOptions.slayerBosses, true)
                            }
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() =>
                              handleToggleAll('bosses', bossOptions.slayerBosses, false)
                            }
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        {bossOptions.slayerBosses.map((boss) => (
                          <Checkbox
                            key={boss.id}
                            isChecked={isSelected('bosses', boss.id)}
                            onChange={() => handleToggle('bosses', boss.id)}
                            colorScheme="purple"
                          >
                            <Text fontSize="sm" color={currentColors.textColor}>
                              {boss.name}
                            </Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
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
                            onClick={() => handleToggleAll('bosses', bossOptions.other, true)}
                          >
                            All
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleAll('bosses', bossOptions.other, false)}
                          >
                            None
                          </Button>
                        </HStack>
                      </HStack>
                      <SimpleGrid columns={2} spacing={2}>
                        {bossOptions.other.map((boss) => (
                          <Checkbox
                            key={boss.id}
                            isChecked={isSelected('bosses', boss.id)}
                            onChange={() => handleToggle('bosses', boss.id)}
                            colorScheme="purple"
                          >
                            <Text fontSize="sm" color={currentColors.textColor}>
                              {boss.name}
                            </Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </Box>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* SKILLS */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        ⚔️ Skills
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

              {/* MINIGAMES */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        🎮 Minigames
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
                        <HStack justify="space-between" mb={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color={currentColors.textColor}
                            textTransform="capitalize"
                          >
                            {category} Minigames
                          </Text>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleToggleAll('minigames', minigames, true)}
                            >
                              All
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleToggleAll('minigames', minigames, false)}
                            >
                              None
                            </Button>
                          </HStack>
                        </HStack>
                        <SimpleGrid columns={2} spacing={2}>
                          {minigames.map((minigame) => (
                            <Checkbox
                              key={minigame.id}
                              isChecked={isSelected('minigames', minigame.id)}
                              onChange={() => handleToggle('minigames', minigame.id)}
                              colorScheme="purple"
                            >
                              <Text fontSize="sm" color={currentColors.textColor}>
                                {minigame.name}
                              </Text>
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* ITEMS */}
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="bold" color={currentColors.textColor}>
                        📦 Collectible Items
                      </Text>
                      <Badge colorScheme="purple">
                        {getSelectedCount(
                          'items',
                          [
                            ...itemOptions.basic,
                            ...itemOptions.resources,
                            ...itemOptions.valuable,
                            ...itemOptions.bossDrops,
                            ...itemOptions.minigameRewards,
                          ].filter((item) => item.available)
                        )}{' '}
                        available
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon color={currentColors.textColor} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {Object.entries(itemOptions).map(([category, items]) => {
                      const availableItems = items.filter((item) => item.available);

                      if (availableItems.length === 0) {
                        return null;
                      }

                      return (
                        <Box key={category}>
                          <HStack justify="space-between" mb={2}>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color={currentColors.textColor}
                              textTransform="capitalize"
                            >
                              {category.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleToggleAll('items', availableItems, true)}
                              >
                                All
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleToggleAll('items', availableItems, false)}
                              >
                                None
                              </Button>
                            </HStack>
                          </HStack>
                          <SimpleGrid columns={2} spacing={2}>
                            {items.map((item) => (
                              <Checkbox
                                key={item.id}
                                isChecked={isSelected('items', item.id) && item.available}
                                onChange={() => handleToggle('items', item.id)}
                                colorScheme="purple"
                                isDisabled={!item.available}
                              >
                                <Text
                                  fontSize="sm"
                                  color={item.available ? currentColors.textColor : 'gray.500'}
                                >
                                  {item.name}
                                  {!item.available && (
                                    <Tooltip label="Source not available (enable required boss/skill/minigame)">
                                      <Badge ml={2} colorScheme="red" fontSize="xs">
                                        Locked
                                      </Badge>
                                    </Tooltip>
                                  )}
                                </Text>
                              </Checkbox>
                            ))}
                          </SimpleGrid>
                        </Box>
                      );
                    })}

                    {/* Info box explaining dependencies */}
                    <Box
                      mt={4}
                      p={3}
                      bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'}
                      borderRadius="md"
                    >
                      <HStack spacing={2} align="flex-start">
                        <Icon as={InfoIcon} color="blue.400" mt={0.5} />
                        <Text fontSize="xs" color={currentColors.textColor}>
                          <strong>Smart Filtering:</strong> Items are automatically disabled if
                          their source (boss, skill, or minigame) is disabled. For example,
                          disabling Vorkath will disable Vorkath's Head as a collectible item.
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

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
