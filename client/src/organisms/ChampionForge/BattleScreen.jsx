import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
  useColorMode,
} from '@chakra-ui/react';
import {
  GET_CLAN_WARS_BATTLE,
  SUBMIT_BATTLE_ACTION,
  CLAN_WARS_BATTLE_UPDATED,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';

const RARITY_COLORS = { common: '#888', uncommon: '#2ecc71', rare: '#3498db', epic: '#9b59b6' };
const EMOTE_OPTIONS = ['🔥', '💀', '😱', '👏', '🗡️', '🛡️', '💥', '😤', '🤩', '👀'];

// ---- HP Bar ----
function HPBar({ current, max, color }) {
  const pct = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const barColor = pct > 0.5 ? color : pct > 0.25 ? '#e0a020' : '#e05050';
  return (
    <Box w="full" bg="#222" borderRadius={6} h="14px" overflow="hidden" border="1px solid #333">
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

// ---- Champion Sprite (placeholder — swap for Aseprite sprites) ----
function ChampionSprite({ side, name, color, isShaking, isFlashing, isDead }) {
  return (
    <VStack spacing={1} align="center">
      <Box
        w="96px"
        h="96px"
        borderRadius="lg"
        bg={`${color}22`}
        border={`2px solid ${color}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="48px"
        boxShadow={`0 0 20px ${color}44`}
        transform={isShaking ? `translateX(${side === 'left' ? -8 : 8}px)` : 'none'}
        filter={isFlashing ? 'brightness(3)' : isDead ? 'grayscale(1) opacity(0.4)' : 'none'}
        transition="transform 0.1s, filter 0.1s"
      >
        {isDead ? '💀' : '🧙'}
      </Box>
      <Text fontSize="13px" fontWeight="bold" color={color} fontFamily="mono">
        {name}
      </Text>
    </VStack>
  );
}

// ---- Floating Emote ----
function FloatingEmote({ emote, x, y, onDone }) {
  const [visible, setVisible] = useState(true);
  const [top, setTop] = useState(y);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setVisible(false);
      setTop(y - 60);
    }, 50);
    const t2 = setTimeout(onDone, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <Box
      position="absolute"
      left={`${x}px`}
      top={`${top}px`}
      fontSize="28px"
      opacity={visible ? 1 : 0}
      transition="top 1.1s ease-out, opacity 1.1s ease-out"
      pointerEvents="none"
      userSelect="none"
      zIndex={10}
    >
      {emote}
    </Box>
  );
}

// ---- Status Badges ----
function StatusBadges({ effects, defendActive }) {
  return (
    <HStack flexWrap="wrap" spacing={1}>
      {(effects ?? []).map((e, i) => (
        <Badge key={i} colorScheme="red" fontSize="10px" variant="subtle">
          {e.type === 'bleed'
            ? `🩸 bleed ${e.turns}t`
            : e.type === 'blind'
            ? '👁 blind'
            : e.type === 'fortress'
            ? `🏰 fortress ${e.turns}t`
            : e.type}
        </Badge>
      ))}
      {defendActive && (
        <Badge colorScheme="blue" fontSize="10px">
          🛡️ defending
        </Badge>
      )}
    </HStack>
  );
}

// ---- Consumable List ----
function ConsumableList({ consumableIds, items, onUse, disabled }) {
  return (
    <VStack align="stretch" spacing={1}>
      {consumableIds.map((id) => {
        const item = items.find((i) => i.itemId === id);
        if (!item) return null;
        return (
          <Button
            key={id}
            size="xs"
            colorScheme="blue"
            variant="outline"
            isDisabled={disabled}
            onClick={() => onUse(id)}
            justifyContent="flex-start"
          >
            🧪 {item.name}
          </Button>
        );
      })}
      {consumableIds.length === 0 && (
        <Text fontSize="xs" color="gray.500">
          No consumables remaining.
        </Text>
      )}
    </VStack>
  );
}

export default function BattleScreen({
  battle: initialBattle,
  myTeamId,
  allItems,
  turnTimerSeconds = 60,
}) {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const logRef = useRef(null);
  const emoteIdRef = useRef(0);

  const [battle, setBattle] = useState(initialBattle);
  const [emotes, setEmotes] = useState([]);
  const [shaking, setShaking] = useState(null);
  const [flashing, setFlashing] = useState(null);
  const [log, setLog] = useState([]);
  const [timer, setTimer] = useState(turnTimerSeconds);
  const [activeTab, setActiveTab] = useState('attack');
  const timerRef = useRef(null);

  const state = battle?.battleState ?? {};
  const snap = battle?.championSnapshots ?? {};
  const isMyTurn = state.currentTurn === (myTeamId === battle?.team1Id ? 'team1' : 'team2');
  const isBattleOver = battle?.status === 'COMPLETED';

  // Extract team side for convenience
  const mySide = myTeamId === battle?.team1Id ? 'team1' : 'team2';
  const oppSide = mySide === 'team1' ? 'team2' : 'team1';
  const mySnap = snap[mySide === 'team1' ? 'champion1' : 'champion2'];
  const oppSnap = snap[mySide === 'team1' ? 'champion2' : 'champion1'];

  const [submitAction, { loading: acting }] = useMutation(SUBMIT_BATTLE_ACTION);

  // Subscribe to live battle updates
  useSubscription(CLAN_WARS_BATTLE_UPDATED, {
    variables: { battleId: battle?.battleId },
    skip: !battle?.battleId || isBattleOver,
    onData: ({ data }) => {
      const update = data.data?.clanWarsBattleUpdated;
      if (!update) return;
      setBattle(update.battle);
      if (update.latestEvent?.narrative) {
        setLog((l) => [...l, update.latestEvent]);
      }
      // Trigger hit animations
      if (update.latestEvent?.damageDealt > 0) {
        const hitSide = update.latestEvent.actorTeamId === battle.team1Id ? 'right' : 'left';
        triggerShake(hitSide);
        triggerFlash(hitSide);
      }
    },
  });

  // Turn timer
  useEffect(() => {
    if (isBattleOver || !isMyTurn) return;
    setTimer(turnTimerSeconds);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAction('ATTACK'); // auto-attack on timeout
          return turnTimerSeconds;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state.currentTurn, isBattleOver]);

  // Scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const triggerShake = (side) => {
    setShaking(side);
    setTimeout(() => setShaking(null), 300);
  };
  const triggerFlash = (side) => {
    setFlashing(side);
    setTimeout(() => setFlashing(null), 200);
  };

  const spawnEmote = (emote) => {
    const id = emoteIdRef.current++;
    const x = 60 + Math.random() * 300;
    const y = 40 + Math.random() * 80;
    setEmotes((e) => [...e, { id, emote, x, y }]);
  };

  const handleAction = async (action, itemId) => {
    if (!isMyTurn || acting || isBattleOver) return;
    clearInterval(timerRef.current);
    try {
      await submitAction({
        variables: { battleId: battle.battleId, teamId: myTeamId, action, itemId: itemId ?? null },
      });
    } catch (err) {
      showToast(err.message ?? 'Action failed', 'error');
    }
  };

  const timerColor = timer > 20 ? '#4caf50' : timer > 10 ? '#e0a020' : '#e05050';
  const myConsumableIds = state.consumablesRemaining?.[mySide] ?? [];
  const specialUsed = state.specialUsed?.[mySide] ?? false;
  const mySpecials = mySnap?.stats?.specials ?? [];

  const winnerSnap = battle?.winnerId === battle?.team1Id ? snap.champion1 : snap.champion2;

  return (
    <Box bg={'#f0f0f0'} borderRadius="xl" p={4} fontFamily="mono">
      {/* Header */}
      <Text
        textAlign="center"
        fontSize="11px"
        color="gray.500"
        letterSpacing={2}
        textTransform="uppercase"
        mb={3}
      >
        Champion Forge · Battle · Turn {state.turnNumber ?? 1}
      </Text>

      {/* Arena */}
      <Box
        bg={'white'}
        border="1px solid"
        borderColor={'#ddd'}
        borderRadius="xl"
        p={5}
        position="relative"
        overflow="hidden"
        mb={4}
      >
        {/* Floating emotes */}
        {emotes.map((e) => (
          <FloatingEmote
            key={e.id}
            emote={e.emote}
            x={e.x}
            y={e.y}
            onDone={() => setEmotes((em) => em.filter((x) => x.id !== e.id))}
          />
        ))}

        {/* Turn banner */}
        {!isBattleOver && (
          <Text textAlign="center" mb={3} fontSize="12px" color={isMyTurn ? '#4caf50' : '#888'}>
            {isMyTurn
              ? '🟢 your turn — pick an action'
              : `⏳ waiting for ${
                  state.currentTurn === 'team1'
                    ? snap.champion1?.teamName
                    : snap.champion2?.teamName
                }...`}
          </Text>
        )}

        {isBattleOver && winnerSnap && (
          <Text
            textAlign="center"
            mb={3}
            fontSize="18px"
            fontWeight="bold"
            color="#c9a84c"
            textShadow="0 0 20px #c9a84c88"
          >
            🏆 {winnerSnap.teamName} wins!
          </Text>
        )}

        {/* Champions */}
        <SimpleGrid columns={3} alignItems="flex-end" gap={3} mb={4}>
          {/* Left (team1) */}
          <VStack spacing={2} align="flex-start">
            <Text fontSize="11px" color="gray.500" textTransform="uppercase" letterSpacing={1}>
              {snap.champion1?.teamName}
            </Text>
            <HPBar
              current={state.hp?.team1 ?? 0}
              max={snap.champion1?.stats?.maxHp ?? 100}
              color="#e05c5c"
            />
            <Text fontSize="11px" color="#e05c5c">
              {state.hp?.team1 ?? 0} / {snap.champion1?.stats?.maxHp ?? 100} hp
            </Text>
            <StatusBadges
              effects={state.activeEffects?.team1}
              defendActive={state.defendActive?.team1}
            />
            <Box pt={2}>
              <ChampionSprite
                side="left"
                name={snap.champion1?.teamName ?? 'Team 1'}
                color="#e05c5c"
                isShaking={shaking === 'left'}
                isFlashing={flashing === 'left'}
                isDead={(state.hp?.team1 ?? 1) <= 0}
              />
            </Box>
          </VStack>

          {/* VS / timer */}
          <VStack spacing={2} align="center" pb={4}>
            <Text fontSize="11px" color="#555">
              vs
            </Text>
            {!isBattleOver && (
              <Box
                w="44px"
                h="44px"
                borderRadius="full"
                bg={`${timerColor}22`}
                border={`2px solid ${timerColor}`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="14px"
                fontWeight="bold"
                color={timerColor}
                transition="all 0.5s"
              >
                {timer}
              </Box>
            )}
          </VStack>

          {/* Right (team2) */}
          <VStack spacing={2} align="flex-end">
            <Text fontSize="11px" color="gray.500" textTransform="uppercase" letterSpacing={1}>
              {snap.champion2?.teamName}
            </Text>
            <HPBar
              current={state.hp?.team2 ?? 0}
              max={snap.champion2?.stats?.maxHp ?? 100}
              color="#5c9ee0"
            />
            <Text fontSize="11px" color="#5c9ee0" textAlign="right">
              {state.hp?.team2 ?? 0} / {snap.champion2?.stats?.maxHp ?? 100} hp
            </Text>
            <HStack justify="flex-end" flexWrap="wrap">
              <StatusBadges
                effects={state.activeEffects?.team2}
                defendActive={state.defendActive?.team2}
              />
            </HStack>
            <Box pt={2} alignSelf="flex-end">
              <ChampionSprite
                side="right"
                name={snap.champion2?.teamName ?? 'Team 2'}
                color="#5c9ee0"
                isShaking={shaking === 'right'}
                isFlashing={flashing === 'right'}
                isDead={(state.hp?.team2 ?? 1) <= 0}
              />
            </Box>
          </VStack>
        </SimpleGrid>

        {/* Emote bar */}
        <HStack justify="center" flexWrap="wrap" spacing={1} mb={2}>
          {EMOTE_OPTIONS.map((e) => (
            <Button
              key={e}
              size="xs"
              variant="ghost"
              fontSize="16px"
              onClick={() => spawnEmote(e)}
              p={1}
            >
              {e}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Action panel */}
      {isMyTurn && !isBattleOver && (
        <Box bg={'white'} border="1px solid" borderColor={'#ddd'} borderRadius="lg" p={4} mb={4}>
          <HStack mb={3} spacing={2}>
            {['attack', 'defend', 'special', 'item'].map((t) => (
              <Button
                key={t}
                size="xs"
                variant={activeTab === t ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => setActiveTab(t)}
              >
                {t === 'attack' ? '⚔️' : t === 'defend' ? '🛡️' : t === 'special' ? '✨' : '🧪'} {t}
              </Button>
            ))}
          </HStack>

          {activeTab === 'attack' && (
            <VStack align="stretch">
              <Text fontSize="xs" color="gray.500" mb={1}>
                Deal damage to the enemy champion.
              </Text>
              <Button colorScheme="red" onClick={() => handleAction('ATTACK')} isLoading={acting}>
                ⚔️ Attack
              </Button>
            </VStack>
          )}

          {activeTab === 'defend' && (
            <VStack align="stretch">
              <Text fontSize="xs" color="gray.500" mb={1}>
                Reduce incoming damage by 60% until the next hit lands.
              </Text>
              <Button colorScheme="blue" onClick={() => handleAction('DEFEND')} isLoading={acting}>
                🛡️ Defend
              </Button>
            </VStack>
          )}

          {activeTab === 'special' && (
            <VStack align="stretch">
              {specialUsed ? (
                <Text fontSize="sm" color="gray.500">
                  Special ability already used this battle.
                </Text>
              ) : mySpecials.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No special abilities equipped.
                </Text>
              ) : (
                <>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    One-time use — cannot be undone.
                  </Text>
                  <Button
                    colorScheme="purple"
                    onClick={() => handleAction('SPECIAL')}
                    isLoading={acting}
                  >
                    ✨ {mySpecials[0]}
                  </Button>
                </>
              )}
            </VStack>
          )}

          {activeTab === 'item' && (
            <ConsumableList
              consumableIds={myConsumableIds}
              items={allItems ?? []}
              onUse={(itemId) => handleAction('USE_ITEM', itemId)}
              disabled={acting}
            />
          )}
        </Box>
      )}

      {/* Battle log */}
      <Box
        ref={logRef}
        bg={'#f8f8f8'}
        border="1px solid"
        borderColor={'#ddd'}
        borderRadius="lg"
        p={3}
        h="180px"
        overflowY="auto"
        fontFamily="mono"
        fontSize="12px"
      >
        {log.length === 0 && <Text color="gray.600">⚔️ Battle beginning...</Text>}
        {log.map((entry, i) => (
          <Text
            key={i}
            color={
              entry.action === 'SPECIAL'
                ? '#ce93d8'
                : entry.action === 'USE_ITEM'
                ? '#ffe082'
                : entry.action === 'BATTLE_START' || entry.action === 'BATTLE_END'
                ? '#888'
                : '#333'
            }
            mb={0.5}
          >
            {entry.narrative}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
