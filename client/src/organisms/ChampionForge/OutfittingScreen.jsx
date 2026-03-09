import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Center,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tooltip,
} from '@chakra-ui/react';
import {
  GET_CLAN_WARS_WAR_CHEST,
  SAVE_OFFICIAL_LOADOUT,
  LOCK_CLAN_WARS_LOADOUT,
  UPDATE_CLAN_WARS_EVENT_STATUS,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';

const RARITY_COLORS = { common: '#888', uncommon: '#2ecc71', rare: '#3498db', epic: '#9b59b6' };
const RARITY_LABELS = { common: 'gray', uncommon: 'green', rare: 'blue', epic: 'purple' };

const GEAR_SLOTS = [
  'weapon',
  'helm',
  'chest',
  'legs',
  'gloves',
  'boots',
  'shield',
  'ring',
  'amulet',
  'cape',
];
const SLOT_EMOJI = {
  weapon: '⚔️',
  helm: '🪖',
  chest: '🛡️',
  legs: '🩲',
  gloves: '🧤',
  boots: '👢',
  shield: '🛡',
  ring: '💍',
  amulet: '📿',
  cape: '🧣',
  consumable: '🧪',
};

// ---------------------------------------------------------------------------
// Paperdoll layout
// ---------------------------------------------------------------------------

const PAPERDOLL_POSITIONS = [
  { slot: 'helm',   row: 1, col: 2 },
  { slot: 'cape',   row: 2, col: 1 },
  { slot: 'amulet', row: 2, col: 2 },
  { slot: 'weapon', row: 3, col: 1 },
  { slot: 'shield', row: 3, col: 3 },
  { slot: 'chest',  row: 4, col: 2 },
  { slot: 'legs',   row: 5, col: 2 },
  { slot: 'gloves', row: 6, col: 1 },
  { slot: 'ring',   row: 6, col: 2 },
  { slot: 'boots',  row: 6, col: 3 },
];

const SLOT_W = 52;
const SLOT_GAP = 4;
const GRID_W = 3 * SLOT_W + 2 * SLOT_GAP;
const GRID_H = 6 * SLOT_W + 5 * SLOT_GAP;

function PaperdollSlot({ slot, equippedItem, isActive, onClick }) {
  const border = equippedItem ? (RARITY_COLORS[equippedItem.rarity] ?? '#888') : undefined;
  return (
    <Tooltip
      label={equippedItem ? `${slot}: ${equippedItem.name}` : slot}
      placement="top"
      hasArrow
    >
      <Box
        w={`${SLOT_W}px`}
        h={`${SLOT_W}px`}
        border="2px solid"
        borderColor={isActive ? 'yellow.400' : border ?? 'gray.600'}
        borderRadius="md"
        bg={isActive ? 'yellow.900' : 'gray.800'}
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={onClick}
        boxShadow={
          isActive
            ? '0 0 8px rgba(236,201,75,0.4)'
            : equippedItem
            ? `0 0 5px ${border}44`
            : 'none'
        }
        transition="all 0.1s"
        _hover={{ borderColor: 'yellow.300' }}
        position="relative"
      >
        <Text fontSize="xl" lineHeight={1}>{SLOT_EMOJI[slot]}</Text>
        {equippedItem && (
          <Box
            position="absolute"
            bottom="2px"
            right="2px"
            w="6px"
            h="6px"
            borderRadius="full"
            bg={border}
          />
        )}
      </Box>
    </Tooltip>
  );
}

function Paperdoll({ draftLoadout, items, activeSlot, onSlotClick }) {
  const itemById = Object.fromEntries(items.map((i) => [i.itemId, i]));
  return (
    <Box position="relative" w={`${GRID_W}px`} h={`${GRID_H}px`} flexShrink={0}>
      {/* Character sprite placeholder — sits behind the center column slots */}
      <Box
        position="absolute"
        top={`${SLOT_W + SLOT_GAP}px`}
        left={`${SLOT_W + SLOT_GAP}px`}
        w={`${SLOT_W}px`}
        h={`${4 * SLOT_W + 3 * SLOT_GAP}px`}
        bg="gray.900"
        border="1px dashed"
        borderColor="gray.700"
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={0}
      >
        <Text fontSize="3xl" userSelect="none" opacity={0.3}>🧍</Text>
      </Box>

      {/* Gear slots */}
      <Box
        position="absolute"
        top={0}
        left={0}
        display="grid"
        gridTemplateColumns={`repeat(3, ${SLOT_W}px)`}
        gridTemplateRows={`repeat(6, ${SLOT_W}px)`}
        gap={`${SLOT_GAP}px`}
        zIndex={1}
      >
        {PAPERDOLL_POSITIONS.map(({ slot, row, col }) => {
          const equippedId = draftLoadout[slot];
          const equippedItem = equippedId ? itemById[equippedId] : null;
          return (
            <Box key={slot} gridRow={row} gridColumn={col}>
              <PaperdollSlot
                slot={slot}
                equippedItem={equippedItem}
                isActive={activeSlot === slot}
                onClick={() => onSlotClick(slot)}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------

function StatRow({ label, value, color = 'inherit' }) {
  if (!value) return null;
  return (
    <HStack justify="space-between" fontSize="sm">
      <Text color="gray.500">{label}</Text>
      <Text fontWeight="medium" color={color}>
        {value}
      </Text>
    </HStack>
  );
}

function ItemCard({ item, isSelected, isEquipped, onClick }) {
  const border = RARITY_COLORS[item.rarity] ?? '#888';
  const snap = item.itemSnapshot ?? {};
  const stats = snap.stats ?? {};

  return (
    <Box
      border="2px solid"
      borderColor={isSelected ? 'yellow.400' : border}
      borderRadius="md"
      p={3}
      cursor={item.isUsed ? 'not-allowed' : 'pointer'}
      opacity={item.isUsed ? 0.5 : 1}
      bg={isSelected ? 'yellow.900' : 'gray.800'}
      _hover={!item.isUsed ? { borderColor: 'yellow.400', transform: 'translateY(-1px)' } : {}}
      transition="all 0.1s"
      onClick={() => !item.isUsed && onClick(item)}
      boxShadow={isSelected ? `0 0 10px ${RARITY_COLORS[item.rarity]}66` : 'none'}
    >
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="white">
          {item.name}
        </Text>
        <Badge colorScheme={RARITY_LABELS[item.rarity]} fontSize="xx-small">
          {item.rarity}
        </Badge>
      </HStack>

      <SimpleGrid columns={2} spacing={1} fontSize="xs" color="gray.400">
        {stats.attack > 0 && <Text>ATK +{stats.attack}</Text>}
        {stats.defense > 0 && <Text>DEF +{stats.defense}</Text>}
        {stats.speed > 0 && <Text>SPD +{stats.speed}</Text>}
        {stats.crit > 0 && <Text>CRT +{stats.crit}%</Text>}
        {stats.hp > 0 && <Text>HP +{stats.hp}</Text>}
      </SimpleGrid>

      {snap.special && (
        <Text fontSize="xx-small" color="purple.400" mt={1} noOfLines={1}>
          ✨ {snap.special.label}
        </Text>
      )}
      {snap.consumableEffect && (
        <Text fontSize="xx-small" color="blue.400" mt={1} noOfLines={1}>
          🧪 {snap.consumableEffect.description}
        </Text>
      )}

      {isEquipped && !isSelected && (
        <Badge colorScheme="purple" fontSize="xx-small" mt={1}>
          equipped
        </Badge>
      )}
    </Box>
  );
}

function ChampionStat({ loadout, items }) {
  const itemById = Object.fromEntries(items.map((i) => [i.itemId, i]));

  let atk = 0,
    def = 0,
    spd = 0,
    crit = 0,
    hp = 100;
  const specials = [];

  GEAR_SLOTS.forEach((slot) => {
    const id = loadout[slot];
    if (!id) return;
    const item = itemById[id];
    if (!item?.itemSnapshot?.stats) return;
    const s = item.itemSnapshot.stats;
    atk += s.attack ?? 0;
    def += s.defense ?? 0;
    spd += s.speed ?? 0;
    crit += s.crit ?? 0;
    hp += s.hp ?? 0;
    if (item.itemSnapshot.special) specials.push(item.itemSnapshot.special);
  });

  return (
    <Box bg="gray.800" borderRadius="md" p={4} border="1px solid" borderColor="gray.600">
      <Text fontWeight="semibold" fontSize="sm" mb={3} color="white">
        Champion Stats
      </Text>
      <VStack spacing={1} align="stretch">
        <StatRow label="Attack" value={atk} color="red.400" />
        <StatRow label="Defense" value={def} color="blue.400" />
        <StatRow label="Speed" value={spd} color="green.400" />
        <StatRow label="Crit" value={`${crit}%`} color="yellow.400" />
        <StatRow label="HP" value={hp} color="pink.400" />
      </VStack>
      {specials.length > 0 && (
        <Box mt={3}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            Specials
          </Text>
          {specials.map((sp) => (
            <HStack key={sp.id} spacing={2}>
              <Badge colorScheme="purple" fontSize="xx-small">
                ✨ {sp.label}
              </Badge>
              <Text fontSize="xx-small" color="gray.400">
                {sp.description}
              </Text>
            </HStack>
          ))}
        </Box>
      )}
    </Box>
  );
}

export function TeamOutfitter({ team, event, isAdmin }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const [draftLoadout, setDraftLoadout] = useState(team.officialLoadout ?? {});
  const [activeSlot, setActiveSlot] = useState('weapon');
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  const { data } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: team.teamId },
    fetchPolicy: 'cache-and-network',
  });

  const [saveLoadout, { loading: saving }] = useMutation(SAVE_OFFICIAL_LOADOUT);
  const [lockLoadout, { loading: locking }] = useMutation(LOCK_CLAN_WARS_LOADOUT);

  const items = data?.getClanWarsWarChest ?? [];
  const slotItems = items.filter((i) => i.slot === activeSlot);
  const consumableItems = items.filter((i) => i.slot === 'consumable');

  const isLocked = team.loadoutLocked;
  const officialLoadout = team.officialLoadout ?? {};

  const isCaptain =
    user?.discordUserId === team.captainDiscordId || (isAdmin && team.captainDiscordId == null);

  const equip = (slot, itemId) => {
    if (isLocked && !isAdmin) return;
    setDraftLoadout((prev) => ({ ...prev, [slot]: itemId }));
  };

  const equipConsumable = (itemId) => {
    if (isLocked && !isAdmin) return;
    setDraftLoadout((prev) => {
      const current = prev.consumables ?? [];
      if (current.includes(itemId)) {
        return { ...prev, consumables: current.filter((id) => id !== itemId) };
      }
      const max = event.eventConfig?.maxConsumableSlots ?? 4;
      if (current.length >= max) {
        showToast(`Max ${max} consumables`, 'warning');
        return prev;
      }
      return { ...prev, consumables: [...current, itemId] };
    });
  };

  const handleSave = async () => {
    try {
      await saveLoadout({ variables: { teamId: team.teamId, loadout: draftLoadout } });
      showToast('Official loadout saved!', 'success');
    } catch {
      showToast('Failed to save loadout', 'error');
    }
  };

  const handleLock = async () => {
    try {
      await lockLoadout({ variables: { teamId: team.teamId } });
      showToast('Loadout locked! Ready for battle.', 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to lock loadout', 'error');
    } finally {
      setLockConfirmOpen(false);
    }
  };

  const activeLabel =
    activeSlot === 'consumable'
      ? 'Consumables'
      : activeSlot.charAt(0).toUpperCase() + activeSlot.slice(1);

  return (
    <Box>
      {isLocked && (
        <Alert
          status="success"
          borderRadius="md"
          mb={4}
          fontSize="sm"
          bg="green.900"
          color="green.200"
        >
          <AlertIcon color="green.400" />
          Loadout locked! This team is ready for battle.
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {/* Column 1 — Paperdoll */}
        <VStack align="flex-start" spacing={3}>
          <Paperdoll
            draftLoadout={draftLoadout}
            items={items}
            activeSlot={activeSlot}
            onSlotClick={setActiveSlot}
          />
          <Button
            size="xs"
            color="white"
            _hover={{ bg: 'purple.600' }}
            colorScheme={
              activeSlot === 'consumable'
                ? 'purple'
                : draftLoadout.consumables?.length > 0
                ? 'green'
                : 'gray'
            }
            variant={activeSlot === 'consumable' ? 'solid' : 'outline'}
            onClick={() => setActiveSlot('consumable')}
          >
            🧪 consumables ({draftLoadout.consumables?.length ?? 0}/
            {event.eventConfig?.maxConsumableSlots ?? 4})
          </Button>
        </VStack>

        {/* Column 2 — Item grid for selected slot */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={3}>
            {SLOT_EMOJI[activeSlot] ?? '🧪'} {activeLabel}
          </Text>
          {activeSlot === 'consumable' ? (
            consumableItems.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                No consumables in war chest.
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                {consumableItems.map((item) => (
                  <ItemCard
                    key={item.itemId}
                    item={item}
                    isSelected={(draftLoadout.consumables ?? []).includes(item.itemId)}
                    isEquipped={(officialLoadout.consumables ?? []).includes(item.itemId)}
                    onClick={() => equipConsumable(item.itemId)}
                  />
                ))}
              </SimpleGrid>
            )
          ) : slotItems.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No {activeSlot} items in war chest.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
              {slotItems.map((item) => (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  isSelected={draftLoadout[activeSlot] === item.itemId}
                  isEquipped={officialLoadout[activeSlot] === item.itemId}
                  onClick={() => equip(activeSlot, item.itemId)}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Column 3 — Stats + draft summary + save/lock */}
        <VStack align="stretch" spacing={3}>
          <ChampionStat loadout={draftLoadout} items={items} />

          <Box bg="gray.800" borderRadius="md" p={3}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={2}>
              Current Draft
            </Text>
            {GEAR_SLOTS.map((slot) => {
              const itemId = draftLoadout[slot];
              const item = items.find((i) => i.itemId === itemId);
              return (
                <HStack key={slot} fontSize="xs" justify="space-between" py={0.5}>
                  <Text color="gray.500" textTransform="capitalize">
                    {slot}
                  </Text>
                  {item ? (
                    <Text
                      fontWeight="medium"
                      color={RARITY_COLORS[item.rarity]}
                      noOfLines={1}
                      maxW="120px"
                    >
                      {item.name}
                    </Text>
                  ) : (
                    <Text color="gray.600">—</Text>
                  )}
                </HStack>
              );
            })}
          </Box>

          {!isLocked && isCaptain && (
            <VStack spacing={2}>
              <Button colorScheme="blue" size="sm" w="full" isLoading={saving} onClick={handleSave}>
                Save as Official Loadout
              </Button>
              {isAdmin && (
                <Button
                  colorScheme="red"
                  size="sm"
                  variant="outline"
                  w="full"
                  isLoading={locking}
                  onClick={() => setLockConfirmOpen(true)}
                >
                  🔒 Lock Loadout
                </Button>
              )}
            </VStack>
          )}
        </VStack>
      </SimpleGrid>

      <ConfirmModal
        isOpen={lockConfirmOpen}
        onClose={() => setLockConfirmOpen(false)}
        onConfirm={handleLock}
        title="Lock Loadout?"
        body="This cannot be undone. The loadout will be fixed for battle."
        confirmLabel="Lock Loadout"
        colorScheme="red"
        isLoading={locking}
      />
    </Box>
  );
}

export default function OutfittingScreen({ event, isAdmin, refetch }) {
  const { showToast } = useToastContext();
  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });
  const [battleConfirmOpen, setBattleConfirmOpen] = useState(false);

  const teams = event.teams ?? [];
  const allLocked = teams.length > 0 && teams.every((t) => t.loadoutLocked);

  return (
    <VStack align="stretch" spacing={6}>
      <Box p={5} bg="blue.900" borderRadius="lg">
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="blue.200">
              🛡️ Outfitting Phase — {event.eventName}
            </Text>
            <Text fontSize="sm" color="blue.300">
              Captains kit out their champions from the war chest. Lock in before battle begins.
            </Text>
            {event.outfittingEnd && (
              <Text fontSize="xs" color="blue.400">
                Ends {new Date(event.outfittingEnd).toLocaleString()}
              </Text>
            )}
          </VStack>
          {isAdmin && allLocked && (
            <Button colorScheme="red" size="sm" onClick={() => setBattleConfirmOpen(true)}>
              ⚔️ Start Battle Phase
            </Button>
          )}
        </HStack>
      </Box>

      {teams.length === 0 ? (
        <Center h="200px">
          <Text color="gray.500">No teams found for this event.</Text>
        </Center>
      ) : (
        <Tabs colorScheme="purple" variant="line">
          <TabList overflowX="auto">
            {teams.map((team) => (
              <Tab
                key={team.teamId}
                fontSize="sm"
                color="gray.300"
                _selected={{ color: 'white', borderColor: 'purple.400' }}
              >
                {team.teamName}
                {team.loadoutLocked && ' 🔒'}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            {teams.map((team) => (
              <TabPanel key={team.teamId} px={0} pt={4}>
                <TeamOutfitter team={team} event={event} isAdmin={isAdmin} />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}

      <ConfirmModal
        isOpen={battleConfirmOpen}
        onClose={() => setBattleConfirmOpen(false)}
        onConfirm={() => {
          advancePhase({ variables: { eventId: event.eventId, status: 'BATTLE' } });
          setBattleConfirmOpen(false);
        }}
        title="Start Battle Phase?"
        body="All teams are locked in. This will end outfitting and begin the battle."
        confirmLabel="Start Battle"
        colorScheme="red"
      />
    </VStack>
  );
}
