import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Progress,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { RepeatIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  GET_CLAN_WARS_BATTLE,
  GET_CLAN_WARS_WAR_CHEST,
} from '../../graphql/clanWarsOperations';
import ChampionSprite from './ChampionSprite';
import { BASE_SPRITES, getLayerSprite } from '../../assets/champion-forge/sprites/spriteRegistry';
import ActionEffect from './ActionEffect';
import { getActionEffects, resolveSide } from './battleAnimations';
import BattleVolumeSlider from './BattleVolumeSlider';
import { playBattleSound } from '../../utils/soundEngine';

// ---------------------------------------------------------------------------
// Helpers (mirrored from BattleScreen)
// ---------------------------------------------------------------------------
const LAYER_ORDER = ['boots', 'legs', 'chest', 'gloves', 'cape', 'shield', 'helm', 'weapon'];

function buildLayers(loadout, itemById) {
  if (!loadout) return [];
  return LAYER_ORDER.map((slot) => {
    const id = loadout[slot];
    if (!id) return null;
    const item = itemById[id];
    const key = item?.itemSnapshot?.spriteIcon ?? item?.itemSnapshot?.spriteKey;
    return key ? getLayerSprite(key) : null;
  }).filter(Boolean);
}

// ---- HP Bar ----
function HPBar({ current, max, color }) {
  const pct = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const barColor = pct > 0.5 ? color : pct > 0.25 ? '#e0a020' : '#e05050';
  return (
    <Box w="full" bg="#111" borderRadius={6} h="12px" overflow="hidden" border="1px solid #333">
      <Box
        w={`${pct * 100}%`}
        h="full"
        bg={barColor}
        borderRadius={6}
        transition="width 0.5s ease"
        boxShadow={`0 0 6px ${barColor}88`}
      />
    </Box>
  );
}


function getNarrativeColor(action) {
  if (action === 'SPECIAL') return '#ce93d8';
  if (action === 'USE_ITEM') return '#ffe082';
  if (action === 'BATTLE_START' || action === 'BATTLE_END') return '#666';
  return '#e0e0e0';
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function BattleReplayModal({ isOpen, onClose, battleId }) {
  const effectIdRef = useRef(0);

  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const [effects, setEffects] = useState([]);
  const [shaking, setShaking] = useState(null);
  const [flashing, setFlashing] = useState(null);

  const logRef = useRef(null);

  const { data: battleData, loading: battleLoading } = useQuery(GET_CLAN_WARS_BATTLE, {
    variables: { battleId },
    skip: !battleId || !isOpen,
    fetchPolicy: 'cache-first',
  });
  const battle = battleData?.getClanWarsBattle;
  const log = battle?.battleLog ?? [];
  const snap = battle?.championSnapshots ?? {};

  const { data: t1Data } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: battle?.team1Id },
    skip: !battle?.team1Id,
    fetchPolicy: 'cache-first',
  });
  const { data: t2Data } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: battle?.team2Id },
    skip: !battle?.team2Id,
    fetchPolicy: 'cache-first',
  });

  // Derived values
  const maxHp1 = snap.champion1?.stats?.maxHp ?? 100;
  const maxHp2 = snap.champion2?.stats?.maxHp ?? 100;
  const currentEntry = step > 0 ? log[step - 1] : null;
  const hp1 = currentEntry?.hpAfter?.team1Hp ?? maxHp1;
  const hp2 = currentEntry?.hpAfter?.team2Hp ?? maxHp2;
  const narrative = currentEntry?.narrative ?? 'Battle begins...';
  const isAtEnd = step >= log.length;

  const team1Name = snap.champion1?.teamName ?? 'Team 1';
  const team2Name = snap.champion2?.teamName ?? 'Team 2';
  const winnerName =
    battle?.winnerId === battle?.team1Id ? team1Name : team2Name;

  // Sprite layers
  const allItems = [
    ...(t1Data?.getClanWarsWarChest ?? []),
    ...(t2Data?.getClanWarsWarChest ?? []),
  ];
  const battleItemById = Object.fromEntries(allItems.map((i) => [i.itemId, i]));
  const champion1Layers = buildLayers(snap.champion1?.loadout, battleItemById);
  const champion2Layers = buildLayers(snap.champion2?.loadout, battleItemById);
  const champion1Src = BASE_SPRITES[snap.champion1?.loadout?.baseSprite ?? 'baseSprite1'] ?? undefined;
  const champion2Src = BASE_SPRITES[snap.champion2?.loadout?.baseSprite ?? 'baseSprite1'] ?? undefined;

  // Reset on open / battleId change
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsPlaying(false);
      setEffects([]);
    }
  }, [isOpen, battleId]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= log.length) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, log.length]);

  // Hit effects + CSS action effects on step advance
  useEffect(() => {
    if (!currentEntry) return;
    if (currentEntry.damageDealt > 0) {
      const hitSide = currentEntry.actorTeamId === battle?.team1Id ? 'right' : 'left';
      setShaking(hitSide);
      setTimeout(() => setShaking(null), 300);
      setFlashing(hitSide);
      setTimeout(() => setFlashing(null), 200);
    }
    const isActorOnLeft = currentEntry.actorTeamId === battle?.team1Id;
    getActionEffects(currentEntry).forEach(({ effectKey, side }) => {
      const id = effectIdRef.current++;
      setEffects((e) => [...e, { id, effectKey, targetSide: resolveSide(side, isActorOnLeft) }]);
      playBattleSound(effectKey);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Scroll log to bottom when step advances
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [step]);

  const handleRestart = () => {
    setStep(0);
    setIsPlaying(false);
    setEffects([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700" fontFamily="mono" mx={2} minH="720px" maxH="720px" overflow="hidden" display="flex" flexDirection="column">
        <ModalHeader pb={2} color="white" fontSize="md">
          <HStack spacing={2} justify="space-between">
            <HStack spacing={2} flexWrap="wrap">
              <Text>⏮</Text>
              <Text>{team1Name}</Text>
              <Text color="gray.500" fontSize="sm">vs</Text>
              <Text>{team2Name}</Text>
              {battle?.winnerId && (
                <Badge colorScheme="yellow" fontSize="xs">
                  🏆 {winnerName} won
                </Badge>
              )}
            </HStack>
            <BattleVolumeSlider />
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        <ModalBody pb={5} flex="1" overflowY="auto">
          {battleLoading && !battle ? (
            <Center h="300px">
              <Spinner color="purple.400" size="xl" />
            </Center>
          ) : !battle ? (
            <Center h="200px">
              <Text color="gray.500">Battle data not found.</Text>
            </Center>
          ) : (
            <VStack spacing={3} align="stretch">
              {/* Arena */}
              <Box
                bg="gray.800"
                border="1px solid"
                borderColor="gray.600"
                borderRadius="xl"
                p={4}
                position="relative"
                overflow="hidden"
              >
                {effects.map((e) => (
                  <ActionEffect
                    key={e.id}
                    effectKey={e.effectKey}
                    targetSide={e.targetSide}
                    onDone={() => setEffects((ef) => ef.filter((x) => x.id !== e.id))}
                  />
                ))}

                <SimpleGrid columns={3} alignItems="flex-end" gap={3}>
                  {/* Team 1 */}
                  <VStack spacing={2} align="flex-start">
                    <Text fontSize="10px" color="gray.400" textTransform="uppercase" letterSpacing={1}>
                      {team1Name}
                    </Text>
                    <HPBar current={hp1} max={maxHp1} color="#e05c5c" />
                    <Text fontSize="10px" color="#e05c5c">
                      {hp1} / {maxHp1} hp
                    </Text>
                    <Box pt={1}>
                      <ChampionSprite
                        facing="right"
                        name={team1Name}
                        color="#e05c5c"
                        hasBorder={false}
                        src={champion1Src}
                        layers={champion1Layers}
                        isShaking={shaking === 'left'}
                        isFlashing={flashing === 'left'}
                        isDead={hp1 <= 0}
                        size={72}
                      />
                    </Box>
                  </VStack>

                  {/* VS / progress */}
                  <VStack spacing={2} align="center" pb={2}>
                    <Text fontSize="10px" color="gray.600">vs</Text>
                    <Text fontSize="10px" color="gray.500">
                      Turn {step} / {log.length}
                    </Text>
                    <Progress
                      value={(step / Math.max(1, log.length)) * 100}
                      size="xs"
                      colorScheme="purple"
                      w="60px"
                      borderRadius="full"
                      bg="gray.700"
                    />
                  </VStack>

                  {/* Team 2 */}
                  <VStack spacing={2} align="flex-end">
                    <Text fontSize="10px" color="gray.400" textTransform="uppercase" letterSpacing={1}>
                      {team2Name}
                    </Text>
                    <HPBar current={hp2} max={maxHp2} color="#5c9ee0" />
                    <Text fontSize="10px" color="#5c9ee0" textAlign="right">
                      {hp2} / {maxHp2} hp
                    </Text>
                    <Box pt={1} alignSelf="flex-end">
                      <ChampionSprite
                        facing="left"
                        name={team2Name}
                        color="#5c9ee0"
                        hasBorder={false}
                        src={champion2Src}
                        layers={champion2Layers}
                        isShaking={shaking === 'right'}
                        isFlashing={flashing === 'right'}
                        isDead={hp2 <= 0}
                        size={72}
                      />
                    </Box>
                  </VStack>
                </SimpleGrid>
              </Box>

              {/* Narrative */}
              <Box
                bg="gray.800"
                border="1px solid"
                borderColor="gray.700"
                borderRadius="lg"
                p={3}
                h="64px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                <Text
                  fontSize="sm"
                  textAlign="center"
                  color={isAtEnd ? 'yellow.300' : getNarrativeColor(currentEntry?.action)}
                  fontWeight={isAtEnd ? 'bold' : 'normal'}
                >
                  {isAtEnd ? `🏆 ${winnerName} wins!` : narrative}
                </Text>
              </Box>

              {/* Controls */}
              <HStack justify="center" spacing={2} flexWrap="wrap">
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  leftIcon={<RepeatIcon />}
                  onClick={handleRestart}
                >
                  Restart
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="gray.600"
                  color="gray.300"
                  leftIcon={<ChevronLeftIcon />}
                  isDisabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  colorScheme="purple"
                  onClick={() => {
                    if (isAtEnd) {
                      handleRestart();
                      setTimeout(() => setIsPlaying(true), 50);
                    } else {
                      setIsPlaying((p) => !p);
                    }
                  }}
                >
                  {isAtEnd ? '🔄 Replay' : isPlaying ? '⏸ Pause' : '▶ Play'}
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="gray.600"
                  color="gray.300"
                  rightIcon={<ChevronRightIcon />}
                  isDisabled={isAtEnd}
                  onClick={() => setStep((s) => Math.min(log.length, s + 1))}
                >
                  Next
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  color={speed === 600 ? 'purple.300' : 'gray.500'}
                  onClick={() => setSpeed((s) => (s === 1200 ? 600 : 1200))}
                >
                  {speed === 1200 ? '1×' : '2×'}
                </Button>
              </HStack>

              {/* Battle log */}
              <Box
                ref={logRef}
                bg="gray.950"
                border="1px solid"
                borderColor="gray.700"
                borderRadius="lg"
                p={2}
                h="160px"
                overflowY="auto"
                fontSize="11px"
                sx={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '4px' },
                }}
              >
                {step === 0 && (
                  <Text color="gray.600">Press ▶ Play to start the replay...</Text>
                )}
                {log.slice(0, step).map((entry, i) => (
                  <Text
                    key={i}
                    mb={0.5}
                    color={getNarrativeColor(entry.action)}
                    opacity={i < step - 3 ? 0.5 : 1}
                    transition="opacity 0.3s"
                  >
                    <Text as="span" color="gray.600" mr={1}>
                      T{entry.turnNumber}
                    </Text>
                    {entry.narrative}
                    {entry.isCrit && (
                      <Text as="span" color="red.300" ml={1} fontSize="10px">
                        CRIT
                      </Text>
                    )}
                  </Text>
                ))}
              </Box>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
