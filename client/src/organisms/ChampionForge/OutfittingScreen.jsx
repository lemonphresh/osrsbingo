import React, { useState, useEffect, useMemo } from 'react';
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
  Collapse,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Progress,
} from '@chakra-ui/react';
import {
  GET_CLAN_WARS_WAR_CHEST,
  SAVE_OFFICIAL_LOADOUT,
  UPDATE_CLAN_WARS_EVENT_STATUS,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import ChampionSprite from './ChampionSprite';
import {
  BASE_SPRITES,
  LAYER_SPRITES,
  getLayerSprite,
  getIconSprite,
} from '../../assets/champion-forge/sprites/spriteRegistry';
import ActionEffect from './ActionEffect';
import { getSpecialEffects, getConsumableEffects, resolveSide } from './battleAnimations';

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
  'trinket',
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
  trinket: '🔮',
};

// ---------------------------------------------------------------------------
// Paperdoll layout
// ---------------------------------------------------------------------------

const PAPERDOLL_POSITIONS = [
  { slot: 'helm',    row: 1, col: 2 },
  { slot: 'cape',    row: 2, col: 1 },
  { slot: 'amulet',  row: 2, col: 2 },
  { slot: 'trinket', row: 2, col: 3 },
  { slot: 'weapon',  row: 3, col: 1 },
  { slot: 'chest',   row: 3, col: 2 },
  { slot: 'shield',  row: 3, col: 3 },
  { slot: 'legs',    row: 4, col: 2 },
  { slot: 'gloves',  row: 5, col: 1 },
  { slot: 'boots',   row: 5, col: 2 },
  { slot: 'ring',    row: 5, col: 3 },
];

const SLOT_W = 64;
const SLOT_GAP = 4;
const GRID_W = 3 * SLOT_W + 2 * SLOT_GAP;
const GRID_H = 5 * SLOT_W + 4 * SLOT_GAP;

function PaperdollSlot({ slot, equippedItem, isActive, onClick }) {
  const border = equippedItem ? RARITY_COLORS[equippedItem.rarity] ?? '#888' : undefined;
  return (
    <Tooltip label={equippedItem ? `${slot}: ${equippedItem.name}` : slot} placement="top" hasArrow>
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
          isActive ? '0 0 8px rgba(236,201,75,0.4)' : equippedItem ? `0 0 5px ${border}44` : 'none'
        }
        transition="all 0.1s"
        _hover={{ borderColor: 'yellow.300' }}
        position="relative"
      >
        {equippedItem ? (
          <Box
            as="img"
            src={getIconSprite(equippedItem.itemSnapshot?.inventoryIcon ?? equippedItem.itemSnapshot?.spriteKey)}
            w={`${SLOT_W - 8}px`}
            h={`${SLOT_W - 8}px`}
            style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
          />
        ) : (
          <Text fontSize="xl" lineHeight={1}>
            {SLOT_EMOJI[slot]}
          </Text>
        )}
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
      {/* Gear slots */}
      <Box
        position="absolute"
        top={0}
        left={0}
        display="grid"
        gridTemplateColumns={`repeat(3, ${SLOT_W}px)`}
        gridTemplateRows={`repeat(5, ${SLOT_W}px)`}
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

const STAT_KEYS = [
  { key: 'attack', label: 'ATK', suffix: '' },
  { key: 'defense', label: 'DEF', suffix: '' },
  { key: 'speed', label: 'SPD', suffix: '' },
  { key: 'crit', label: 'CRT', suffix: '%' },
  { key: 'hp', label: 'HP', suffix: '' },
];

function StatDiff({ diff, suffix }) {
  if (!diff) return null;
  return (
    <Text as="span" color={diff > 0 ? 'green.300' : 'red.300'} ml={1}>
      ({diff > 0 ? '+' : ''}{diff}{suffix})
    </Text>
  );
}

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

function ItemCard({ item, isSelected, isEquipped, onClick, compareItem }) {
  const border = RARITY_COLORS[item.rarity] ?? '#888';
  const snap = item.itemSnapshot ?? {};
  const stats = snap.stats ?? {};
  const cStats = compareItem?.itemSnapshot?.stats;

  // Rows to show: any stat this item has, plus any the equipped item has (so losses are visible)
  const statRows = STAT_KEYS.filter(({ key }) => (stats[key] ?? 0) > 0 || (cStats && (cStats[key] ?? 0) > 0));

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
      <HStack justify="space-between" mb={1} align="flex-start">
        {(snap.inventoryIcon ?? snap.spriteKey) && (
          <Box
            as="img"
            src={getIconSprite(snap.inventoryIcon ?? snap.spriteKey)}
            w="28px"
            h="28px"
            style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
            flexShrink={0}
          />
        )}
        <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="white" flex={1}>
          {item.name}
        </Text>
        <VStack spacing={1} align="flex-end" flexShrink={0}>
          <Badge colorScheme={RARITY_LABELS[item.rarity]} fontSize="xx-small">
            {item.rarity}
          </Badge>
          {isSelected && (
            <Badge colorScheme="purple" fontSize="xx-small">
              equipped
            </Badge>
          )}
        </VStack>
      </HStack>

      <SimpleGrid columns={2} spacing={1} fontSize="xs" color="gray.400">
        {statRows.map(({ key, label, suffix }) => {
          const val = stats[key] ?? 0;
          const diff = cStats ? val - (cStats[key] ?? 0) : 0;
          return (
            <Text key={key}>
              {label} +{val}{suffix}
              {!isSelected && cStats && <StatDiff diff={diff} suffix={suffix} />}
            </Text>
          );
        })}
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

    </Box>
  );
}

function computeAvailableSpecials(loadout, items) {
  const itemById = Object.fromEntries(items.map((i) => [i.itemId, i]));
  const result = [];
  GEAR_SLOTS.forEach((slot) => {
    const id = loadout[slot];
    if (!id) return;
    const item = itemById[id];
    if (!item?.itemSnapshot?.special) return;
    result.push({ slot, ...item.itemSnapshot.special });
  });
  return result;
}

function computeChampionStats(loadout, items) {
  const itemById = Object.fromEntries(items.map((i) => [i.itemId, i]));
  let atk = 8, def = 0, spd = 0, crit = 0, hp = 150;
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
  // Sort so the chosen special fires first
  const chosen = loadout.chosenSpecial;
  if (chosen) {
    const idx = specials.findIndex((sp) => sp.id === chosen);
    if (idx > 0) specials.unshift(...specials.splice(idx, 1));
  }
  return { attack: atk, defense: def, speed: spd, crit, maxHp: hp, specials };
}

function ChampionStat({ loadout, items }) {
  const { attack: atk, defense: def, speed: spd, crit, maxHp: hp, specials } = computeChampionStats(loadout, items);

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
            <HStack key={sp.id} spacing={2} mb={1}>
              <Badge colorScheme="purple" fontSize="xx-small">
                {sp.label}
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

function ConsumablePins({ loadout, items, maxSlots, onRemove, onSlotClick, activeSlot, isLocked }) {
  const itemById = Object.fromEntries(items.map((i) => [i.itemId, i]));
  const equipped = (loadout.consumables ?? []).slice(0, maxSlots);
  const slots = Array.from({ length: maxSlots }, (_, i) => equipped[i] ?? null);
  const isActive = activeSlot === 'consumable';

  return (
    <Box
      bg="gray.800" borderRadius="md" p={3} border="1px solid" mt={2}
      borderColor={isActive ? 'purple.500' : 'gray.600'}
      boxShadow={isActive ? '0 0 0 1px var(--chakra-colors-purple-500)' : 'none'}
      transition="border-color 0.15s, box-shadow 0.15s"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color={isActive ? 'purple.300' : 'gray.400'} fontWeight="semibold">
          Battle Pack
        </Text>
        <Text fontSize="xx-small" color={equipped.length === maxSlots ? 'green.400' : 'gray.600'}>
          {equipped.length}/{maxSlots}
        </Text>
      </HStack>
      <VStack spacing={1} align="stretch">
        {slots.map((itemId, i) => {
          const item = itemId ? itemById[itemId] : null;
          const snap = item?.itemSnapshot ?? {};
          const rColor = item ? RARITY_COLORS[item.rarity] : undefined;
          return (
            <HStack
              key={i}
              spacing={2}
              px={2}
              py={1}
              borderRadius="sm"
              bg={item ? 'gray.900' : 'gray.850'}
              border="1px solid"
              borderColor={item ? (rColor + '66') : 'gray.700'}
              minH="28px"
              cursor={!isLocked ? 'pointer' : 'default'}
              _hover={!isLocked ? { borderColor: 'purple.500', bg: item ? 'gray.900' : 'gray.800' } : {}}
              onClick={() => !isLocked && onSlotClick('consumable')}
            >
              <Text fontSize="xx-small" color="gray.600" w="12px" flexShrink={0}>
                {i + 1}.
              </Text>
              {item ? (
                <>
                  {(snap.inventoryIcon ?? snap.spriteKey) && (
                    <Box
                      as="img"
                      src={getIconSprite(snap.inventoryIcon ?? snap.spriteKey)}
                      w="16px"
                      h="16px"
                      style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                      flexShrink={0}
                    />
                  )}
                  <VStack spacing={0} align="flex-start" flex={1} overflow="hidden">
                    <Text fontSize="xx-small" color="white" noOfLines={1}>{item.name}</Text>
                    {snap.consumableEffect?.description && (
                      <Text fontSize="xx-small" color="gray.500" noOfLines={1}>
                        {snap.consumableEffect.description}
                      </Text>
                    )}
                  </VStack>
                  {!isLocked && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color="gray.600"
                      _hover={{ color: 'red.400' }}
                      minW={0}
                      h="auto"
                      p={0}
                      onClick={(e) => { e.stopPropagation(); onRemove(itemId); }}
                    >
                      ×
                    </Button>
                  )}
                </>
              ) : (
                <Text fontSize="xx-small" color="gray.700" fontStyle="italic">+ add consumable</Text>
              )}
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}

function SpecialPicker({ loadout, items, chosenSpecial, onPick, isLocked }) {
  const available = computeAvailableSpecials(loadout, items);
  if (available.length === 0) return null;
  return (
    <Box bg="gray.800" borderRadius="md" p={3} border="1px solid" borderColor="gray.600" mt={2}>
      <Text fontSize="xs" color="gray.400" mb={2} fontWeight="semibold">
        Active Special — pick which fires in battle
      </Text>
      <VStack spacing={1} align="stretch">
        {available.map((sp) => {
          const isActive = chosenSpecial === sp.id || (!chosenSpecial && sp === available[0]);
          return (
            <Box
              key={sp.slot + sp.id}
              onClick={() => !isLocked && onPick(sp.id)}
              cursor={isLocked ? 'default' : 'pointer'}
              borderRadius="sm"
              px={2}
              py={1.5}
              bg={isActive ? 'purple.900' : 'gray.900'}
              border="1px solid"
              borderColor={isActive ? 'purple.500' : 'gray.700'}
              _hover={!isLocked ? { borderColor: 'purple.400' } : {}}
              transition="all 0.1s"
            >
              <HStack spacing={2} align="flex-start">
                <Badge
                  colorScheme={isActive ? 'purple' : 'gray'}
                  fontSize="xx-small"
                  flexShrink={0}
                  mt="1px"
                >
                  {sp.label}
                </Badge>
                <Text fontSize="xx-small" color={isActive ? 'gray.200' : 'gray.500'} lineHeight="short">
                  {sp.description}
                </Text>
              </HStack>
              <Text fontSize="xx-small" color="gray.600" mt={0.5}>
                from {sp.slot}
              </Text>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

const STAT_GUIDE = [
  { label: 'ATK', color: 'red.300', desc: 'Raw damage output. Each point adds to your base hit.' },
  { label: 'DEF', color: 'blue.300', desc: 'Reduces incoming hits. Each point cancels 0.3 ATK from the enemy roll (e.g. 100 DEF negates 30 ATK).' },
  { label: 'SPD', color: 'green.300', desc: 'Whoever has more speed goes first. No effect after that.' },
  { label: 'CRIT', color: 'yellow.300', desc: '% chance each hit deals 1.5x damage.' },
  { label: 'HP', color: 'pink.300', desc: 'Total health pool. You start at 150 + gear bonuses.' },
];

// ---------------------------------------------------------------------------
// Battle preview demo
// ---------------------------------------------------------------------------

function clientRollDamage({ attackStat, defenseStat, critChance, isDefending = false }) {
  const base = Math.max(1, attackStat - defenseStat * 0.3);
  const variance = 0.85 + Math.random() * 0.3;
  const defMult = isDefending ? 0.4 : 1;
  const isCrit = Math.random() * 100 < Math.min(critChance, 75);
  const damage = Math.round(base * variance * defMult * (isCrit ? 1.5 : 1));
  return { damage: Math.max(1, damage), isCrit };
}

const DEMO_DUMMY = { name: 'Training Dummy', attack: 18, defense: 8, crit: 8, maxHp: 200 };

function previewGetEffectiveStats(baseStats, effects) {
  const s = { ...baseStats };
  for (const e of effects ?? []) {
    if (e.type === 'buff') {
      if (e.stat === 'all') { s.attack = (s.attack ?? 0) + e.value; s.defense = (s.defense ?? 0) + e.value; s.crit = (s.crit ?? 0) + e.value; }
      else if (e.stat in s) s[e.stat] = (s[e.stat] ?? 0) + e.value;
    } else if (e.type === 'debuff' && e.debuffType === 'weaken') {
      s.attack = Math.max(0, (s.attack ?? 0) - e.value);
    }
  }
  return s;
}

function previewHasFortress(effects) {
  return (effects ?? []).some((e) => e.type === 'fortress');
}

function previewTickEffects(effects) {
  let bleed = 0;
  const remaining = [];
  for (const e of effects ?? []) {
    if (e.type === 'bleed') { bleed += e.value; if (e.turns > 1) remaining.push({ ...e, turns: e.turns - 1 }); }
    else if (e.type === 'fortress') remaining.push(e); // decays separately
    else if (e.turns > 1) remaining.push({ ...e, turns: e.turns - 1 });
  }
  return { remaining, bleed };
}

function DemoHPBar({ current, max, color }) {
  const pct = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const barColor = pct > 0.5 ? color : pct > 0.25 ? '#e0a020' : '#e05050';
  return (
    <Box w="full" bg="#111" borderRadius={6} h="14px" overflow="hidden" border="1px solid #333">
      <Box
        w={`${pct * 100}%`}
        h="full"
        bg={barColor}
        borderRadius={6}
        transition="width 0.4s ease"
        boxShadow={`0 0 8px ${barColor}88`}
      />
    </Box>
  );
}

function BattlePreviewModal({ isOpen, onClose, myStats, myName, displayLoadout, items }) {
  const maxHp = myStats?.maxHp ?? 150;
  const [myHp, setMyHp] = useState(maxHp);
  const [dummyHp, setDummyHp] = useState(DEMO_DUMMY.maxHp);
  const [log, setLog] = useState([]);
  const [meDefending, setMeDefending] = useState(false);
  const [specialUsed, setSpecialUsed] = useState(false);
  const [consumablesRemaining, setConsumablesRemaining] = useState([]);
  const [battleOver, setBattleOver] = useState(null);
  const [activeTab, setActiveTab] = useState('attack');
  const [turnNumber, setTurnNumber] = useState(1);
  const [waiting, setWaiting] = useState(false);
  const [myShaking, setMyShaking] = useState(false);
  const [myFlashing, setMyFlashing] = useState(false);
  const [dummyShaking, setDummyShaking] = useState(false);
  const [dummyFlashing, setDummyFlashing] = useState(false);
  const [myActiveEffects, setMyActiveEffects] = useState([]);
  const [dummyActiveEffects, setDummyActiveEffects] = useState([]);
  const [effects, setEffects] = useState([]);
  const effectIdRef = React.useRef(0);
  const logRef = React.useRef(null);

  const equippedConsumableIds = displayLoadout?.consumables ?? [];
  const consumableItems = (items ?? []).filter((i) => equippedConsumableIds.includes(i.itemId));

  const triggerHit = (side) => {
    if (side === 'me') {
      setMyShaking(true); setMyFlashing(true);
      setTimeout(() => setMyShaking(false), 300);
      setTimeout(() => setMyFlashing(false), 200);
    } else {
      setDummyShaking(true); setDummyFlashing(true);
      setTimeout(() => setDummyShaking(false), 300);
      setTimeout(() => setDummyFlashing(false), 200);
    }
  };

  // actorSide: 'me' | 'dummy'  — me is always on the left in the layout
  const spawnEffects = (defs, actorSide) => {
    defs.forEach(({ effectKey, side }) => {
      const id = effectIdRef.current++;
      const isActorOnLeft = actorSide === 'me';
      setEffects((e) => [...e, { id, effectKey, targetSide: resolveSide(side, isActorOnLeft) }]);
    });
  };

  const reset = React.useCallback(() => {
    setMyHp(myStats?.maxHp ?? 150);
    setDummyHp(DEMO_DUMMY.maxHp);
    setLog([{ text: '⚔️ Battle beginning — choose your action!', type: 'system' }]);
    setMeDefending(false);
    setSpecialUsed(false);
    setConsumablesRemaining([...(displayLoadout?.consumables ?? [])]);
    setBattleOver(null);
    setActiveTab('attack');
    setTurnNumber(1);
    setWaiting(false);
    setMyShaking(false); setMyFlashing(false);
    setDummyShaking(false); setDummyFlashing(false);
    setMyActiveEffects([]);
    setDummyActiveEffects([]);
    setEffects([]);
  }, [myStats?.maxHp]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { if (isOpen) reset(); }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const doAction = (action, itemId) => {
    if (battleOver || waiting || !myStats) return;

    // --- Phase 1: my action (immediate) ---
    const myEntries = [];
    let curMyHp = myHp;
    let newDummyHp = dummyHp;
    let newMeDefending = false;
    let newSpecialUsed = specialUsed;
    let newConsumables = [...consumablesRemaining];
    let iHitDummy = false;

    // Decay fortress on my effects at start of my turn (mirrors server logic)
    let newMyEffects = myActiveEffects
      .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
      .filter((e) => e.turns > 0);
    let newDummyEffects = [...dummyActiveEffects];

    const myEffStats    = previewGetEffectiveStats(myStats, newMyEffects);
    const dummyEffStats = previewGetEffectiveStats(DEMO_DUMMY, newDummyEffects);

    if (action === 'ATTACK') {
      const roll = clientRollDamage({ attackStat: myEffStats.attack, defenseStat: dummyEffStats.defense, critChance: myEffStats.crit });
      newDummyHp = Math.max(0, dummyHp - roll.damage);
      iHitDummy = true;
      spawnEffects([{ effectKey: roll.isCrit ? 'critSlash' : 'slash', side: 'defender' }], 'me');
      myEntries.push({ text: `${roll.isCrit ? '💥 CRIT! ' : ''}${myName} attacks for ${roll.damage} damage!`, type: 'attack' });

    } else if (action === 'DEFEND') {
      newMeDefending = true;
      spawnEffects([{ effectKey: 'shield', side: 'actor' }], 'me');
      myEntries.push({ text: `🛡️ ${myName} takes a defensive stance. Incoming damage −60%.`, type: 'defend' });

    } else if (action === 'SPECIAL') {
      newSpecialUsed = true;
      const sp = myStats.specials[0];
      const spId = sp?.id;

      if (spId === 'cleave') {
        const roll = clientRollDamage({ attackStat: myEffStats.attack * 0.8, defenseStat: dummyEffStats.defense, critChance: myEffStats.crit });
        newDummyHp = Math.max(0, dummyHp - roll.damage);
        newDummyEffects.push({ type: 'bleed', value: 5, turns: 3 });
        iHitDummy = true;
        spawnEffects(getSpecialEffects('cleave', roll.isCrit), 'me');
        myEntries.push({ text: `⚡ ${myName} uses CLEAVE! ${roll.damage} damage + bleed (5/turn, 3 turns)!`, type: 'special' });
      } else if (spId === 'ambush') {
        const base = Math.max(1, myEffStats.attack);
        const variance = 0.85 + Math.random() * 0.3;
        const damage = Math.max(1, Math.round(base * variance * 1.5));
        newDummyHp = Math.max(0, dummyHp - damage);
        iHitDummy = true;
        spawnEffects(getSpecialEffects('ambush', true), 'me');
        myEntries.push({ text: `💥 ${myName} uses AMBUSH! ${damage} guaranteed crit (defense ignored)!`, type: 'special' });
      } else if (spId === 'barrage') {
        const r1 = clientRollDamage({ attackStat: myEffStats.attack * 0.65, defenseStat: dummyEffStats.defense, critChance: myEffStats.crit });
        const r2 = clientRollDamage({ attackStat: myEffStats.attack * 0.65, defenseStat: dummyEffStats.defense, critChance: myEffStats.crit });
        const total = r1.damage + r2.damage;
        newDummyHp = Math.max(0, dummyHp - total);
        iHitDummy = true;
        spawnEffects(getSpecialEffects('barrage'), 'me');
        myEntries.push({ text: `⚡ ${myName} uses BARRAGE! ${r1.damage} + ${r2.damage} = ${total} total!`, type: 'special' });
      } else if (spId === 'chain_lightning') {
        const base = myEffStats.attack * 1.2;
        const variance = 0.85 + Math.random() * 0.3;
        const damage = Math.max(1, Math.round(base * variance));
        newDummyHp = Math.max(0, dummyHp - damage);
        iHitDummy = true;
        spawnEffects(getSpecialEffects('chain_lightning'), 'me');
        myEntries.push({ text: `⚡ ${myName} unleashes CHAIN LIGHTNING! ${damage} unblockable magic damage!`, type: 'special' });
      } else if (spId === 'lifesteal') {
        const roll = clientRollDamage({ attackStat: myEffStats.attack, defenseStat: dummyEffStats.defense, critChance: myEffStats.crit });
        const heal = Math.round(roll.damage * 0.3);
        newDummyHp = Math.max(0, dummyHp - roll.damage);
        curMyHp = Math.min(maxHp, curMyHp + heal);
        iHitDummy = true;
        spawnEffects(getSpecialEffects('lifesteal', roll.isCrit), 'me');
        myEntries.push({ text: `🩸 ${myName} uses LIFESTEAL! ${roll.damage} damage, healed ${heal} HP!`, type: 'special' });
      } else if (spId === 'fortress') {
        newMyEffects.push({ type: 'fortress', turns: 2 });
        spawnEffects(getSpecialEffects('fortress'), 'me');
        myEntries.push({ text: `🛡️ ${myName} activates FORTRESS! Incoming damage −60% for 2 turns.`, type: 'special' });
      } else {
        const roll = clientRollDamage({ attackStat: myEffStats.attack * 1.2, defenseStat: 0, critChance: myEffStats.crit });
        newDummyHp = Math.max(0, dummyHp - roll.damage);
        iHitDummy = true;
        spawnEffects([{ effectKey: roll.isCrit ? 'critSlash' : 'slash', side: 'defender' }], 'me');
        myEntries.push({ text: `✨ ${myName} uses ${sp?.label ?? 'Special'}! ${roll.damage} damage!`, type: 'special' });
      }

    } else if (action === 'USE_ITEM' && itemId) {
      newConsumables = consumablesRemaining.filter((id) => id !== itemId);
      const item = consumableItems.find((i) => i.itemId === itemId);
      const effect = item?.itemSnapshot?.consumableEffect;
      const effectType = effect?.type ?? 'heal';
      spawnEffects(getConsumableEffects(effectType), 'me');
      if (effectType === 'heal') {
        curMyHp = Math.min(maxHp, curMyHp + effect.value);
        myEntries.push({ text: `🍖 ${myName} uses ${item?.name}! Restored ${effect.value} HP.`, type: 'item' });
      } else if (effectType === 'damage') {
        newDummyHp = Math.max(0, dummyHp - effect.value);
        iHitDummy = true;
        myEntries.push({ text: `💣 ${myName} hurls ${item?.name}! ${effect.value} magic damage (bypasses defense)!`, type: 'item' });
      } else if (effectType === 'debuff') {
        newDummyEffects.push({ type: 'debuff', debuffType: effect.debuffType ?? 'blind', value: effect.value ?? 0, turns: effect.duration || 1 });
        myEntries.push({ text: `✨ ${myName} uses ${item?.name}! ${effect.description}`, type: 'item' });
      } else if (effectType.startsWith('buff_')) {
        const stat = effectType.replace('buff_', '');
        newMyEffects.push({ type: 'buff', stat, value: effect.value, turns: effect.duration || 2 });
        myEntries.push({ text: `⚗️ ${myName} uses ${item?.name}! ${effect.description}`, type: 'item' });
      }
    }

    // Tick dummy's bleed after my action
    const { remaining: tickedDummyEffects, bleed: dummyBleed } = previewTickEffects(newDummyEffects);
    if (dummyBleed > 0) {
      newDummyHp = Math.max(0, newDummyHp - dummyBleed);
      spawnEffects([{ effectKey: 'bleed', side: 'defender' }], 'me');
      myEntries.push({ text: `🩸 Training Dummy bleeds for ${dummyBleed} damage!`, type: 'attack' });
    }

    // Tick my buffs (not fortress — that decays at top of my next turn)
    const tickedMyEffects = newMyEffects.map((e) => {
      if (e.type === 'fortress') return e;
      return e.turns > 1 ? { ...e, turns: e.turns - 1 } : null;
    }).filter(Boolean);

    setLog((prev) => [...prev, ...myEntries]);
    setDummyHp(newDummyHp);
    setMyHp(curMyHp);
    setMeDefending(newMeDefending);
    setSpecialUsed(newSpecialUsed);
    setConsumablesRemaining(newConsumables);
    setMyActiveEffects(tickedMyEffects);
    setDummyActiveEffects(tickedDummyEffects);
    setTurnNumber((t) => t + 1);
    if (iHitDummy) triggerHit('dummy');

    if (newDummyHp <= 0) {
      setLog((prev) => [...prev, { text: `🏆 ${myName} wins! Training Dummy defeated!`, type: 'result' }]);
      setBattleOver('win');
      return;
    }

    // --- Phase 2: dummy counterattacks (delayed) ---
    // Pre-compute now so closure doesn't rely on stale state
    const dummyIsBlind = tickedDummyEffects.some((e) => e.type === 'debuff' && e.debuffType === 'blind');
    const dummyEffStatsP2 = previewGetEffectiveStats(DEMO_DUMMY, tickedDummyEffects);
    const myFortressActive = previewHasFortress(tickedMyEffects);

    // Decay fortress on dummy's turn (on me)
    const myEffectsAfterDummyTurn = tickedMyEffects
      .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
      .filter((e) => e.turns > 0);
    // Decay dummy's timed debuffs on dummy's turn
    const dummyEffectsAfterDummyTurn = tickedDummyEffects.map((e) => {
      if (e.type === 'fortress' || e.type === 'bleed') return e;
      return e.turns > 1 ? { ...e, turns: e.turns - 1 } : null;
    }).filter(Boolean);

    let dummyDamage = 0;
    let dummyEntry;
    if (dummyIsBlind) {
      dummyEntry = { text: `😵 Training Dummy is blinded and misses!`, type: 'defend' };
    } else {
      const dummyRoll = clientRollDamage({
        attackStat: dummyEffStatsP2.attack,
        defenseStat: myEffStats.defense,
        critChance: DEMO_DUMMY.crit,
        isDefending: newMeDefending,
      });
      const fortressMult = myFortressActive ? 0.4 : 1;
      dummyDamage = fortressMult < 1 ? Math.max(1, Math.round(dummyRoll.damage * fortressMult)) : dummyRoll.damage;
      const fortressNote = fortressMult < 1 ? ' (fortress absorbed 60%!)' : '';
      const defendNote = newMeDefending ? ' (reduced by defend!)' : '';
      dummyEntry = {
        text: `${dummyRoll.isCrit ? '💥 CRIT! ' : ''}Training Dummy attacks for ${dummyDamage} damage!${defendNote}${fortressNote}`,
        type: 'attack',
      };
    }

    const finalMyHp = Math.max(0, curMyHp - dummyDamage);
    const died = finalMyHp <= 0;

    setWaiting(true);

    setTimeout(() => {
      if (!dummyIsBlind) {
        triggerHit('me');
        spawnEffects([{ effectKey: dummyEntry.text.includes('CRIT') ? 'critSlash' : 'slash', side: 'defender' }], 'dummy');
      }
      setLog((prev) => [
        ...prev,
        dummyEntry,
        ...(died ? [{ text: `💀 Training Dummy wins! Equip more gear to survive.`, type: 'result' }] : []),
      ]);
      setMyHp(finalMyHp);
      setMyActiveEffects(myEffectsAfterDummyTurn);
      setDummyActiveEffects(dummyEffectsAfterDummyTurn);
      if (died) {
        setBattleOver('lose');
        setWaiting(false);
      } else {
        setTimeout(() => setWaiting(false), 400);
      }
    }, 900);
  };

  const hasSpecial = (myStats?.specials?.length ?? 0) > 0;
  const mySpriteSrc = BASE_SPRITES[displayLoadout?.baseSprite ?? 'baseSprite1'];
  const myLayers = GEAR_SLOTS.map((slot) => {
    const id = displayLoadout?.[slot]; if (!id) return null;
    const item = (items ?? []).find((i) => i.itemId === id);
    const key = item?.itemSnapshot?.spriteIcon ?? item?.itemSnapshot?.spriteKey;
    return key ? getLayerSprite(key) : null;
  }).filter(Boolean);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700" fontFamily="mono">
        <ModalCloseButton color="gray.400" />
        <ModalBody p={4}>
          <VStack spacing={3} align="stretch">
            {/* Header */}
            <Text fontSize="11px" color="gray.500" letterSpacing={2} textTransform="uppercase" textAlign="center">
              Champion Forge · Battle Preview · Turn {turnNumber}
            </Text>

            {/* Arena */}
            <Box bg="gray.800" border="1px solid" borderColor="gray.600" borderRadius="xl" p={5} position="relative" overflow="hidden">
              {effects.map((e) => (
                <ActionEffect
                  key={e.id}
                  effectKey={e.effectKey}
                  targetSide={e.targetSide}
                  onDone={() => setEffects((ef) => ef.filter((x) => x.id !== e.id))}
                />
              ))}
              <Text textAlign="center" mb={3} fontSize="12px"
                color={battleOver ? '#c9a84c' : waiting ? '#888' : '#4caf50'}>
                {battleOver === 'win' ? `🏆 ${myName} wins!`
                  : battleOver === 'lose' ? `💀 Training Dummy wins!`
                  : waiting ? `⏳ Training Dummy is responding...`
                  : '🟢 your turn — pick an action'}
              </Text>

              <SimpleGrid columns={3} alignItems="flex-end" gap={3} mb={4}>
                {/* Left — player */}
                <VStack spacing={2} align="flex-start">
                  <Text fontSize="11px" color="gray.400" textTransform="uppercase" letterSpacing={1}>
                    {myName}
                  </Text>
                  <DemoHPBar current={myHp} max={maxHp} color="#e05c5c" />
                  <Text fontSize="11px" color="#e05c5c">{myHp} / {maxHp} hp</Text>
                  {meDefending && <Badge colorScheme="blue" fontSize="10px">🛡️ defending</Badge>}
                  <Box pt={2}>
                    <ChampionSprite facing="right" hasBorder={false} color="#e05c5c"
                      src={mySpriteSrc} layers={myLayers} isDead={myHp <= 0}
                      isShaking={myShaking} isFlashing={myFlashing} />
                  </Box>
                </VStack>

                {/* Center */}
                <VStack align="center" pb={4}>
                  <Text fontSize="11px" color="gray.600">vs</Text>
                </VStack>

                {/* Right — dummy */}
                <VStack spacing={2} align="flex-end">
                  <Text fontSize="11px" color="gray.400" textTransform="uppercase" letterSpacing={1}>
                    Training Dummy
                  </Text>
                  <DemoHPBar current={dummyHp} max={DEMO_DUMMY.maxHp} color="#5c9ee0" />
                  <Text fontSize="11px" color="#5c9ee0" textAlign="right">
                    {dummyHp} / {DEMO_DUMMY.maxHp} hp
                  </Text>
                  <Box pt={2} alignSelf="flex-end">
                    <ChampionSprite facing="left" hasBorder={false} color="#5c9ee0"
                      src={BASE_SPRITES['baseSprite1']} isDead={dummyHp <= 0}
                      isShaking={dummyShaking} isFlashing={dummyFlashing} />
                  </Box>
                </VStack>
              </SimpleGrid>
            </Box>

            {/* Action panel */}
            {!battleOver ? (
              <Box bg="gray.800" border="1px solid"
                borderColor={waiting ? 'gray.700' : 'gray.600'}
                borderRadius="lg" p={4}
                opacity={waiting ? 0.5 : 1}
                transition="opacity 0.3s, border-color 0.3s">
                <HStack mb={3} spacing={2}>
                  {['attack', 'defend', 'special', 'item'].map((t) => (
                    <Button key={t} size="xs"
                      variant={activeTab === t ? 'solid' : 'outline'}
                      colorScheme="purple"
                      isDisabled={waiting}
                      onClick={() => setActiveTab(t)}>
                      {t === 'attack' ? '⚔️' : t === 'defend' ? '🛡️' : t === 'special' ? '✨' : '🧪'} {t}
                    </Button>
                  ))}
                </HStack>

                {activeTab === 'attack' && (
                  <VStack align="stretch">
                    <Text fontSize="xs" color="gray.400" mb={1}>Deal damage to the enemy champion.</Text>
                    <Button colorScheme="red" isDisabled={waiting} onClick={() => doAction('ATTACK')}>⚔️ Attack</Button>
                  </VStack>
                )}
                {activeTab === 'defend' && (
                  <VStack align="stretch">
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      Reduce incoming damage by 60% until the next hit lands.
                    </Text>
                    <Button colorScheme="blue" isDisabled={waiting} onClick={() => doAction('DEFEND')}>🛡️ Defend</Button>
                  </VStack>
                )}
                {activeTab === 'special' && (
                  <VStack align="stretch">
                    {specialUsed ? (
                      <Text fontSize="sm" color="gray.500">Special ability already used this battle.</Text>
                    ) : !hasSpecial ? (
                      <Text fontSize="sm" color="gray.500">No special abilities equipped.</Text>
                    ) : (
                      <>
                        <Text fontSize="xs" color="gray.400" mb={1}>One-time use — cannot be undone.</Text>
                        <Button colorScheme="purple" isDisabled={waiting} onClick={() => doAction('SPECIAL')}>
                          ✨ {myStats.specials[0]?.label ?? 'Special'}
                        </Button>
                      </>
                    )}
                  </VStack>
                )}
                {activeTab === 'item' && (
                  <VStack align="stretch" spacing={1}>
                    {consumablesRemaining.length === 0 ? (
                      <Text fontSize="xs" color="gray.500">No consumables remaining.</Text>
                    ) : (
                      consumablesRemaining.map((id) => {
                        const item = consumableItems.find((i) => i.itemId === id);
                        if (!item) return null;
                        return (
                          <Button key={id} size="xs" colorScheme="blue" variant="outline"
                            justifyContent="flex-start" isDisabled={waiting}
                            onClick={() => doAction('USE_ITEM', id)}>
                            🧪 {item.name}
                          </Button>
                        );
                      })
                    )}
                  </VStack>
                )}
              </Box>
            ) : (
              <Box textAlign="center">
                <Button size="sm" variant="outline"
                  colorScheme={battleOver === 'win' ? 'yellow' : 'gray'}
                  onClick={reset}>
                  ↺ play again
                </Button>
              </Box>
            )}

            {/* Battle log */}
            <Box ref={logRef} bg="gray.900" border="1px solid" borderColor="gray.700"
              borderRadius="lg" p={3} h="160px" overflowY="auto" fontFamily="mono" fontSize="12px">
              {log.map((entry, i) => (
                <Text key={i} mb={0.5} color={
                  entry.type === 'special' ? '#ce93d8'
                  : entry.type === 'item' ? '#ffe082'
                  : entry.type === 'result' ? '#c9a84c'
                  : entry.type === 'system' ? '#666'
                  : '#ccc'
                }>
                  {entry.text}
                </Text>
              ))}
            </Box>

            <Text fontSize="xx-small" color="gray.700" textAlign="center">
              dummy: {DEMO_DUMMY.attack} atk / {DEMO_DUMMY.defense} def / {DEMO_DUMMY.crit}% crit / {DEMO_DUMMY.maxHp} hp
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function lsKey(teamId, userId) {
  return `cf_draft_${teamId}_${userId ?? 'anon'}`;
}

export function TeamOutfitter({ team, event, isAdmin }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const storageKey = lsKey(team.teamId, user?.discordUserId ?? user?.id);

  const [draftLoadout, setDraftLoadout] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return team.officialLoadout ?? {};
  });
  const [viewingOfficial, setViewingOfficial] = useState(false);
  const [activeSlot, setActiveSlot] = useState('weapon');
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statGuideOpen, setStatGuideOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saveWarnings, setSaveWarnings] = useState([]);

  const { data } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: team.teamId },
    fetchPolicy: 'cache-and-network',
  });

  const [saveLoadout, { loading: saving }] = useMutation(SAVE_OFFICIAL_LOADOUT);

  const items = data?.getClanWarsWarChest ?? [];
  const slotItems = items.filter((i) => i.slot === activeSlot);
  const consumableItems = items.filter((i) => i.slot === 'consumable');
  const activeItems = activeSlot === 'consumable' ? consumableItems : slotItems;
  const activeLabel =
    activeSlot === 'consumable'
      ? 'Consumables'
      : activeSlot.charAt(0).toUpperCase() + activeSlot.slice(1);

  const isLocked = team.loadoutLocked;
  const officialLoadout = useMemo(() => team.officialLoadout ?? {}, [team.officialLoadout]);
  const displayLoadout = viewingOfficial ? officialLoadout : draftLoadout;
  const baseSprite = displayLoadout.baseSprite ?? 'baseSprite1';

  // Persist draft to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draftLoadout));
    } catch {}
  }, [draftLoadout, storageKey]);

  // Is the current draft different from the official saved loadout?
  const differsFromOfficial = useMemo(
    () => JSON.stringify(draftLoadout) !== JSON.stringify(officialLoadout),
    [draftLoadout, officialLoadout]
  );

  const isCaptain = user?.discordUserId === team.captainDiscordId || isAdmin;

  const equip = (slot, itemId) => {
    if (viewingOfficial || (isLocked && !isAdmin)) return;
    setDraftLoadout((prev) => ({ ...prev, [slot]: itemId }));
  };

  const unequip = (slot) => {
    if (viewingOfficial || (isLocked && !isAdmin)) return;
    setDraftLoadout((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const equipConsumable = (itemId) => {
    if (viewingOfficial || (isLocked && !isAdmin)) return;
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

  const doSave = async () => {
    setSaveConfirmOpen(false);
    try {
      await saveLoadout({ variables: { teamId: team.teamId, loadout: draftLoadout } });
      showToast('Official loadout saved!', 'success');
    } catch {
      showToast('Failed to save loadout', 'error');
    }
  };

  const handleSave = () => {
    const warnings = [];
    const emptySlots = GEAR_SLOTS.filter((slot) => !draftLoadout[slot]);
    if (emptySlots.length > 0) {
      warnings.push(`${emptySlots.length} gear slot${emptySlots.length !== 1 ? 's' : ''} empty: ${emptySlots.join(', ')}`);
    }
    const availableSpecials = computeAvailableSpecials(draftLoadout, items);
    if (availableSpecials.length === 0) {
      warnings.push('no special ability equipped — your champion will have no special');
    }
    if (warnings.length > 0) {
      setSaveWarnings(warnings);
      setSaveConfirmOpen(true);
    } else {
      doSave();
    }
  };

  const handleExport = () => {
    const code = btoa(JSON.stringify(draftLoadout));
    navigator.clipboard
      .writeText(code)
      .then(() => showToast('Loadout code copied to clipboard!', 'success'))
      .catch(() => showToast('Copy failed — try selecting and copying manually', 'error'));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(atob(importCode.trim()));
      const knownIds = new Set(items.map((i) => i.itemId));
      // Strip out any item IDs that aren't in this team's war chest
      const sanitized = {};
      for (const [slot, val] of Object.entries(parsed)) {
        if (slot === 'consumables') {
          sanitized.consumables = Array.isArray(val) ? val.filter((id) => knownIds.has(id)) : [];
        } else if (typeof val === 'string' && knownIds.has(val)) {
          sanitized[slot] = val;
        }
      }
      setDraftLoadout(sanitized);
      setImportCode('');
      setImportOpen(false);
      showToast('Loadout imported!', 'success');
    } catch {
      showToast('Invalid loadout code', 'error');
    }
  };

  return (
    <Box overflowX="hidden">
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

      {/* Top row: gear slots | character sprite | stats */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={10} alignItems="flex-start" w="full">
        {/* Column 1 — Gear slots (paperdoll slot grid) */}
        <Box display="flex" alignItems="flex-start" justifyContent="center">
          <Paperdoll
            draftLoadout={displayLoadout}
            items={items}
            activeSlot={activeSlot}
            onSlotClick={setActiveSlot}
          />
        </Box>

        {/* Column 2 — Character sprite */}
        <VStack spacing={2} align="center">
          <Center
            w={`${GRID_W}px`}
            h={`${GRID_H}px`}
            bg="gray.900"
            border="1px dashed"
            borderColor="gray.700"
            borderRadius="lg"
          >
            <ChampionSprite
              hasBorder={false}
              size={180}
              color="#888"
              src={BASE_SPRITES[baseSprite]}
              layers={GEAR_SLOTS.map((slot) => {
                const id = displayLoadout[slot];
                if (!id) return null;
                const item = items.find((i) => i.itemId === id);
                const key = item?.itemSnapshot?.spriteIcon ?? item?.itemSnapshot?.spriteKey;
                return key ? LAYER_SPRITES[key] : null;
              }).filter(Boolean)}
            />
          </Center>
          {/* Base sprite picker */}
          <Box display="grid" gridTemplateColumns="repeat(5, 28px)" gap={1}>
            {Object.entries(BASE_SPRITES).map(([key, src]) => (
              <Box
                key={key}
                as="img"
                src={src}
                w="28px"
                h="56px"
                style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                border="2px solid"
                borderColor={baseSprite === key ? 'yellow.400' : 'gray.600'}
                borderRadius="sm"
                cursor="pointer"
                onClick={() => !viewingOfficial && setDraftLoadout((prev) => ({ ...prev, baseSprite: key }))}
              />
            ))}
          </Box>
        </VStack>

        {/* Column 3 — Stats + actions */}
        <VStack align="stretch" spacing={0} w="full" px={4}>
          <ChampionStat loadout={displayLoadout} items={items} />

          {isCaptain && !viewingOfficial && (
            <>
              <ConsumablePins
                loadout={draftLoadout}
                items={items}
                maxSlots={event.eventConfig?.maxConsumableSlots ?? 4}
                onRemove={(itemId) => setDraftLoadout((prev) => ({
                  ...prev,
                  consumables: (prev.consumables ?? []).filter((id) => id !== itemId),
                }))}
                onSlotClick={setActiveSlot}
                activeSlot={activeSlot}
                isLocked={isLocked && !isAdmin}
              />
              <SpecialPicker
                loadout={draftLoadout}
                items={items}
                chosenSpecial={draftLoadout.chosenSpecial}
                onPick={(id) => setDraftLoadout((prev) => ({ ...prev, chosenSpecial: id }))}
                isLocked={isLocked && !isAdmin}
              />
            </>
          )}

          {/* Utility link row */}
          <HStack
            mt={2}
            spacing={0}
            borderTop="1px solid"
            borderColor="gray.700"
            pt={2}
          >
            <Button
              size="xs"
              variant="ghost"
              color="gray.600"
              flex={1}
              fontSize="11px"
              _hover={{ color: 'gray.300' }}
              onClick={() => setStatGuideOpen((o) => !o)}
            >
              {statGuideOpen ? '▲ stat guide' : '▾ stat guide'}
            </Button>
            <Box w="1px" h="12px" bg="gray.700" flexShrink={0} />
            <Button
              size="xs"
              variant="ghost"
              color="gray.600"
              flex={1}
              fontSize="11px"
              _hover={{ color: 'purple.300' }}
              onClick={() => setPreviewOpen(true)}
            >
              ⚔️ preview
            </Button>
          </HStack>

          {/* Stat guide collapse */}
          <Collapse in={statGuideOpen} animateOpacity>
            <Box
              mt={2}
              mb={1}
              p={3}
              bg="gray.900"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.700"
              fontSize="xs"
            >
              <VStack spacing={2} align="stretch">
                {STAT_GUIDE.map(({ label, color, desc }) => (
                  <HStack key={label} spacing={2} align="flex-start">
                    <Text color={color} fontWeight="bold" minW="32px">{label}</Text>
                    <Text color="gray.400">{desc}</Text>
                  </HStack>
                ))}
                <Box pt={1} borderTop="1px solid" borderColor="gray.700">
                  <Text color="gray.500" fontStyle="italic">
                    defend: −60% next hit. specials: one use per battle.
                  </Text>
                </Box>
              </VStack>
            </Box>
          </Collapse>

          {/* Draft status — compact single row */}
          <HStack
            justify="space-between"
            fontSize="xs"
            py={2}
            mt={1}
            borderTop="1px solid"
            borderColor="gray.700"
          >
            <HStack spacing={1.5}>
              <Box
                w="6px"
                h="6px"
                borderRadius="full"
                flexShrink={0}
                bg={viewingOfficial ? 'blue.400' : differsFromOfficial ? 'yellow.400' : 'green.400'}
              />
              <Text color="gray.500">
                {viewingOfficial
                  ? 'viewing saved'
                  : differsFromOfficial
                  ? 'unsaved draft'
                  : 'up to date'}
              </Text>
            </HStack>
            {viewingOfficial ? (
              <Button size="xs" variant="ghost" color="gray.500" h="auto" py={0} minW={0}
                onClick={() => setViewingOfficial(false)}>
                ← my draft
              </Button>
            ) : differsFromOfficial ? (
              <Button size="xs" variant="ghost" color="gray.500" h="auto" py={0} minW={0}
                onClick={() => setViewingOfficial(true)}>
                view team loadout
              </Button>
            ) : null}
          </HStack>

          {/* Captain actions */}
          {isCaptain && !viewingOfficial && (
            <VStack spacing={2} align="stretch" pt={1}>
              <HStack spacing={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  flex={1}
                  fontSize="11px"
                  _hover={{ color: 'teal.300' }}
                  onClick={handleExport}
                >
                  📤 export
                </Button>
                <Box w="1px" h="12px" bg="gray.700" flexShrink={0} />
                <Button
                  size="xs"
                  variant="ghost"
                  color={importOpen ? 'teal.300' : 'gray.500'}
                  flex={1}
                  fontSize="11px"
                  _hover={{ color: 'teal.300' }}
                  onClick={() => { setImportOpen((o) => !o); setImportCode(''); }}
                >
                  📥 import
                </Button>
              </HStack>
              <Collapse in={importOpen} animateOpacity style={{ width: '100%' }}>
                <VStack spacing={2} align="stretch" mb={1}>
                  <Textarea
                    size="xs"
                    placeholder="Paste loadout code here…"
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    rows={3}
                    fontFamily="mono"
                    fontSize="11px"
                    bg="gray.900"
                    borderColor="gray.600"
                  />
                  <Button size="xs" colorScheme="teal" isDisabled={!importCode.trim()} onClick={handleImport}>
                    Apply
                  </Button>
                </VStack>
              </Collapse>
              {!isLocked && (
                <Button colorScheme="blue" size="sm" w="full" isLoading={saving} onClick={handleSave}>
                  Save Loadout
                </Button>
              )}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Inventory — fixed height, always-visible scrollbar to prevent layout shift */}
      <Box mt={5} h="320px" overflowY="scroll" style={{ scrollbarGutter: 'stable' }}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={3}>
          {SLOT_EMOJI[activeSlot] ?? '🧪'} {activeLabel}
          {activeItems.length > 0 && (
            <Text as="span" fontSize="xs" color="gray.500" ml={2}>
              {activeItems.length} item{activeItems.length !== 1 ? 's' : ''}
            </Text>
          )}
        </Text>
        {activeItems.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            No {activeLabel.toLowerCase()} in war chest.
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={2}>
            {activeItems.map((item) =>
              activeSlot === 'consumable' ? (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  isSelected={(displayLoadout.consumables ?? []).includes(item.itemId)}
                  isEquipped={(officialLoadout.consumables ?? []).includes(item.itemId)}
                  onClick={() => equipConsumable(item.itemId)}
                />
              ) : (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  isSelected={displayLoadout[activeSlot] === item.itemId}
                  isEquipped={officialLoadout[activeSlot] === item.itemId}
                  compareItem={
                    displayLoadout[activeSlot] && displayLoadout[activeSlot] !== item.itemId
                      ? items.find((i) => i.itemId === displayLoadout[activeSlot])
                      : null
                  }
                  onClick={() =>
                    displayLoadout[activeSlot] === item.itemId
                      ? unequip(activeSlot)
                      : equip(activeSlot, item.itemId)
                  }
                />
              )
            )}
          </SimpleGrid>
        )}
      </Box>

      <BattlePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        myStats={computeChampionStats(displayLoadout, items)}
        myName={team.teamName}
        displayLoadout={displayLoadout}
        items={items}
      />

      <ConfirmModal
        isOpen={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={doSave}
        title="Save loadout anyway?"
        body={`Heads up:\n${saveWarnings.map((w) => `• ${w}`).join('\n')}\n\nYou can still save — just double-checking.`}
        confirmLabel="Save anyway"
        colorScheme="blue"
        isLoading={saving}
      />
    </Box>
  );
}

export default function OutfittingScreen({ event, isAdmin, refetch }) {
  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });
  const [battleConfirmOpen, setBattleConfirmOpen] = useState(false);

  const teams = event.teams ?? [];

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
          {isAdmin && (
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
        body="This will end outfitting and begin the battle. Any unsaved loadouts will be locked in as-is."
        confirmLabel="Start Battle"
        colorScheme="red"
      />
    </VStack>
  );
}
