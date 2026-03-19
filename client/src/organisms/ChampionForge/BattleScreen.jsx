import { useState, useEffect, useRef } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import { Box, VStack, HStack, Text, Button, Badge, SimpleGrid } from '@chakra-ui/react';
import {
  SUBMIT_BATTLE_ACTION,
  CLAN_WARS_BATTLE_UPDATED,
  SEND_BATTLE_EMOTE,
  BATTLE_EMOTE_RECEIVED,
} from '../../graphql/clanWarsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import ChampionSprite from './ChampionSprite';
import { BASE_SPRITES, getLayerSprite } from '../../assets/champion-forge/sprites/spriteRegistry';
import ActionEffect from './ActionEffect';
import { getActionEffects, resolveSide } from './battleAnimations';
import BattleVolumeSlider from './BattleVolumeSlider';
import { playBattleSound } from '../../utils/soundEngine';

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

const EMOTE_OPTIONS = ['🔥', '💀', '😱', '👏', '🗡️', '🛡️', '💥', '😤', '🤩', '👀'];

// ---- HP Bar ----
function HPBar({ current, max, color }) {
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


// ---- Floating Emote (user-sent emoji bar only) ----
function FloatingEmote({ emote, x, y, onDone }) {
  const [visible, setVisible] = useState(true);
  const [top, setTop] = useState(y);

  useEffect(() => {
    const t1 = setTimeout(() => { setVisible(false); setTop(y - 120); }, 50);
    const t2 = setTimeout(onDone, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone, y]);

  return (
    <Box
      position="absolute" left={`${x}%`} top={`${top}px`}
      fontSize="28px" opacity={visible ? 1 : 0}
      transition="top 1.1s ease-out, opacity 1.1s ease-out"
      pointerEvents="none" userSelect="none" zIndex={10}
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
  allBattleItems = [],
  turnTimerSeconds = 60,
  isAdmin = false,
  onBattleEnd = null,
}) {
  const { showToast } = useToastContext();
  const logRef = useRef(null);
  const emoteIdRef = useRef(0);
  const effectIdRef = useRef(0);

  const [battle, setBattle] = useState(initialBattle);
  const [emotes, setEmotes] = useState([]);
  const [effects, setEffects] = useState([]);
  const [shaking, setShaking] = useState(null);
  const [flashing, setFlashing] = useState(null);
  const [log, setLog] = useState([]);
  const [timer, setTimer] = useState(turnTimerSeconds);
  const [activeTab, setActiveTab] = useState('attack');
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [lobbyCountdown, setLobbyCountdown] = useState(null);
  const timerRef = useRef(null);
  const lobbyTimerRef = useRef(null);
  const autoRef = useRef(null);
  const battleRef = useRef(battle);

  battleRef.current = battle;

  const state = battle?.battleState ?? {};
  const snap = battle?.championSnapshots ?? {};
  const isBattleOver = battle?.status === 'COMPLETED';

  // Determine if this user is an active captain for one of the battle's teams
  const isSpectator = !myTeamId || (myTeamId !== battle?.team1Id && myTeamId !== battle?.team2Id);

  const mySide = myTeamId === battle?.team1Id ? 'team1' : 'team2';
  const isMyTurn = !isSpectator && state.currentTurn === mySide;
  const mySnap = snap[mySide === 'team1' ? 'champion1' : 'champion2'];

  const [submitAction, { loading: acting }] = useMutation(SUBMIT_BATTLE_ACTION);
  const [sendEmote] = useMutation(SEND_BATTLE_EMOTE);

  useSubscription(BATTLE_EMOTE_RECEIVED, {
    variables: { battleId: battle?.battleId },
    skip: !battle?.battleId,
    onData: ({ data }) => {
      const emote = data.data?.battleEmoteReceived?.emote;
      if (emote) spawnEmote(emote);
    },
  });

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
      const evt = update.latestEvent;
      if (evt?.damageDealt > 0) {
        const hitSide = evt.actorTeamId === battle.team1Id ? 'right' : 'left';
        triggerShake(hitSide);
        triggerFlash(hitSide);
      }
      if (evt) {
        const isActorOnLeft = evt.actorTeamId === battle.team1Id;
        getActionEffects(evt).forEach(({ effectKey, side }) => {
          const id = effectIdRef.current++;
          setEffects((e) => [...e, { id, effectKey, targetSide: resolveSide(side, isActorOnLeft) }]);
          playBattleSound(effectKey);
        });
      }
    },
  });

  useEffect(() => {
    if (isBattleOver || !isMyTurn) return;
    setTimer(turnTimerSeconds);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAction('ATTACK');
          return turnTimerSeconds;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTurn, isBattleOver]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Dev auto-play: submit one ATTACK per second on behalf of whoever's turn it is
  useEffect(() => {
    if (!autoPlaying || !isAdmin || isBattleOver) {
      clearInterval(autoRef.current);
      if (isBattleOver) setAutoPlaying(false);
      return;
    }
    autoRef.current = setInterval(() => {
      const currentBattle = battleRef.current;
      if (!currentBattle || currentBattle.status === 'COMPLETED') {
        clearInterval(autoRef.current);
        setAutoPlaying(false);
        return;
      }
      const actorSide = currentBattle.battleState?.currentTurn;
      const actorTeamId = actorSide === 'team1' ? currentBattle.team1Id : currentBattle.team2Id;
      submitAction({
        variables: {
          battleId: currentBattle.battleId,
          teamId: actorTeamId,
          action: 'ATTACK',
          itemId: null,
        },
      }).catch(() => {});
    }, 2000);
    return () => clearInterval(autoRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlaying, isAdmin, isBattleOver, battle?.battleId]);

  // Lobby countdown: when battle ends, tick down 15s then call onBattleEnd
  useEffect(() => {
    if (!isBattleOver || !onBattleEnd) return;
    setLobbyCountdown(15);
    lobbyTimerRef.current = setInterval(() => {
      setLobbyCountdown((c) => {
        if (c <= 1) {
          clearInterval(lobbyTimerRef.current);
          onBattleEnd();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(lobbyTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBattleOver]);

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
    const x = 10 + Math.random() * 75; // percentage across arena width
    const y = 160 + Math.random() * 60;
    setEmotes((e) => [...e, { id, emote, x, y }]);
  };

  const handleEmoteClick = (emote) => {
    if (battle?.battleId) {
      sendEmote({ variables: { battleId: battle.battleId, emote } });
    } else {
      spawnEmote(emote);
    }
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

  const battleItemById = Object.fromEntries(allBattleItems.map((i) => [i.itemId, i]));
  const champion1Layers = buildLayers(snap.champion1?.loadout, battleItemById);
  const champion2Layers = buildLayers(snap.champion2?.loadout, battleItemById);
  const champion1Src = BASE_SPRITES[snap.champion1?.loadout?.baseSprite ?? 'baseSprite1'] ?? undefined;
  const champion2Src = BASE_SPRITES[snap.champion2?.loadout?.baseSprite ?? 'baseSprite1'] ?? undefined;
  const specialUsed = state.specialUsed?.[mySide] ?? false;
  const mySpecials = mySnap?.stats?.specials ?? [];
  const winnerSnap = battle?.winnerId === battle?.team1Id ? snap.champion1 : snap.champion2;

  return (
    <Box bg="gray.900" borderRadius="xl" p={4} w="100%" fontFamily="mono">
      <HStack justify="space-between" mb={3} spacing={3}>
        <HStack spacing={3}>
          <Text fontSize="11px" color="gray.500" letterSpacing={2} textTransform="uppercase">
            Champion Forge · Battle · Turn {state.turnNumber ?? 1}
          </Text>
          {isSpectator && (
            <Badge colorScheme="gray" fontSize="10px" variant="subtle">
              👁 Spectating
            </Badge>
          )}
          {isAdmin && !isBattleOver && (
            <Button
              size="xs"
              colorScheme={autoPlaying ? 'red' : 'orange'}
              variant="outline"
              onClick={() => setAutoPlaying((p) => !p)}
            >
              {autoPlaying ? '⏹ Stop' : '⚡ Auto-Play'}
            </Button>
          )}
        </HStack>
        <BattleVolumeSlider />
      </HStack>

      {/* Arena */}
      <Box
        bg="gray.800"
        border="1px solid"
        borderColor="gray.600"
        borderRadius="xl"
        p={5}
        position="relative"
        overflow="hidden"
        mb={4}
      >
        {effects.map((e) => (
          <ActionEffect
            key={e.id}
            effectKey={e.effectKey}
            targetSide={e.targetSide}
            onDone={() => setEffects((ef) => ef.filter((x) => x.id !== e.id))}
          />
        ))}
        {emotes.map((e) => (
          <FloatingEmote
            key={e.id}
            emote={e.emote}
            x={e.x}
            y={e.y}
            onDone={() => setEmotes((em) => em.filter((x) => x.id !== e.id))}
          />
        ))}

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
          <>
            <Text
              textAlign="center"
              fontSize="18px"
              fontWeight="bold"
              color="#c9a84c"
              textShadow="0 0 20px #c9a84c88"
            >
              🏆 {winnerSnap.teamName} wins!
            </Text>
            {lobbyCountdown !== null && (
              <Text textAlign="center" mb={3} fontSize="12px" color="gray.500">
                Returning to lobby in {lobbyCountdown}…
              </Text>
            )}
          </>
        )}

        <SimpleGrid columns={3} alignItems="flex-end" gap={3} mb={4}>
          {/* Left (team1) */}
          <VStack spacing={2} align="flex-start">
            <Text fontSize="11px" color="gray.400" textTransform="uppercase" letterSpacing={1}>
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
                facing="right"
                name={snap.champion1?.teamName ?? 'Team 1'}
                color="#e05c5c"
                hasBorder={false}
                src={champion1Src}
                layers={champion1Layers}
                isShaking={shaking === 'left'}
                isFlashing={flashing === 'left'}
                isDead={(state.hp?.team1 ?? 1) <= 0}
              />
            </Box>
          </VStack>

          {/* VS / timer */}
          <VStack spacing={2} align="center" pb={4}>
            <Text fontSize="11px" color="gray.600">
              vs
            </Text>
            {!isBattleOver && !isSpectator && (
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
            {!isBattleOver && isSpectator && (
              <Box
                w="44px"
                h="44px"
                borderRadius="full"
                bg="gray.700"
                border="2px solid"
                borderColor="gray.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="18px"
              >
                ⏳
              </Box>
            )}
          </VStack>

          {/* Right (team2) */}
          <VStack spacing={2} align="flex-end">
            <Text fontSize="11px" color="gray.400" textTransform="uppercase" letterSpacing={1}>
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
                facing="left"
                hasBorder={false}
                name={snap.champion2?.teamName ?? 'Team 2'}
                color="#5c9ee0"
                src={champion2Src}
                layers={champion2Layers}
                isShaking={shaking === 'right'}
                isFlashing={flashing === 'right'}
                isDead={(state.hp?.team2 ?? 1) <= 0}
              />
            </Box>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Emote bar */}
      <Box
        bg="gray.800"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="lg"
        px={3}
        py={2}
        mb={4}
      >
        <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={1}>
          React live — click to send an emote
        </Text>
        <HStack flexWrap="wrap" alignItems="center" justifyContent="center" spacing={0.5}>
          {EMOTE_OPTIONS.map((e) => (
            <Button
              key={e}
              size="md"
              variant="ghost"
              fontSize="20px"
              onClick={() => handleEmoteClick(e)}
              p={1}
            >
              {e}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Action panel */}
      {isMyTurn && !isBattleOver && (
        <Box bg="gray.800" border="1px solid" borderColor="gray.600" borderRadius="lg" p={4} mb={4}>
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
              <Text fontSize="xs" color="gray.400" mb={1}>
                Deal damage to the enemy champion.
              </Text>
              <Button colorScheme="red" onClick={() => handleAction('ATTACK')} isLoading={acting}>
                ⚔️ Attack
              </Button>
            </VStack>
          )}
          {activeTab === 'defend' && (
            <VStack align="stretch">
              <Text fontSize="xs" color="gray.400" mb={1}>
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
                  <Text fontSize="xs" color="gray.400" mb={1}>
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
        bg="gray.900"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="lg"
        p={3}
        h="180px"
        overflowY="auto"
        fontFamily="mono"
        fontSize="12px"
        sx={{
          '&::-webkit-scrollbar': {
            height: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.4)',
          },
        }}
      >
        {log.length === 0 && <Text color="gray.600">⚔️ Battle beginning...</Text>}
        {log.map((entry, i) => (
          <Text
            key={i}
            mb={0.5}
            color={
              entry.action === 'SPECIAL'
                ? '#ce93d8'
                : entry.action === 'USE_ITEM'
                ? '#ffe082'
                : entry.action === 'BATTLE_START' || entry.action === 'BATTLE_END'
                ? '#666'
                : '#ccc'
            }
          >
            {entry.narrative}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
