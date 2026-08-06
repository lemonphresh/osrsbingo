import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, SimpleGrid, Text, VStack, HStack, Button, Center } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import BSGrid from './BSGrid';
import { coordLabel } from '../../utils/battleship/bsClientHelpers';

const G = '#4ade80';
const DIM = '#3d6b4a';
const CYAN = '#22d3ee';
const AMBER = '#f59e0b';
const RED = '#f87171';
const BG = '#060f0a';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString([], { month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${mon} ${time}`;
}

function fmtDate(iso) {
  if (!iso) return '?';
  return new Date(iso)
    .toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
}

function fmtDuration(ms) {
  if (!ms || ms <= 0) return '?';
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function pad(str, len) {
  return String(str ?? '').padEnd(len);
}

// ── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(lines, skip = false) {
  const linesRef = useRef(lines);
  const [lineIdx, setLineIdx] = useState(skip ? lines.length : 0);
  const [charIdx, setCharIdx] = useState(0);
  const [pausing, setPausing] = useState(false);

  useEffect(() => {
    if (skip) return;
    const all = linesRef.current;
    if (lineIdx >= all.length) return;
    const line = all[lineIdx];

    if (pausing) {
      const id = setTimeout(() => {
        setPausing(false);
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      }, line.pauseAfter ?? 300);
      return () => clearTimeout(id);
    }

    if (charIdx >= line.text.length) {
      if (line.pauseAfter != null) {
        setPausing(true);
      } else {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      }
      return;
    }

    if (line.instant) {
      setCharIdx(line.text.length);
      return;
    }

    const id = setTimeout(() => setCharIdx((c) => c + 1), line.charDelay ?? 22);
    return () => clearTimeout(id);
  }, [lineIdx, charIdx, pausing, skip]);

  const all = linesRef.current;
  const done = lineIdx >= all.length;

  const displayLines = all.slice(0, done ? all.length : lineIdx + 1).map((line, i) => {
    const isCurrent = !done && i === lineIdx;
    const displayText = isCurrent ? line.text.slice(0, charIdx) : line.text;
    const complete = !isCurrent || charIdx >= line.text.length;
    return { ...line, displayText, complete };
  });

  return { displayLines, done };
}

// ── Blinking cursor ──────────────────────────────────────────────────────────

function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);
  return <span style={{ color: G, opacity: on ? 1 : 0 }}>█</span>;
}

// ── Terminal line ────────────────────────────────────────────────────────────

function TermLine({ line }) {
  const textProps = {
    fontSize: 'xs',
    color: line.color ?? G,
    letterSpacing: 'wide',
    lineHeight: '1.85',
    whiteSpace: 'pre',
    display: 'block',
    sx: line.glow ? { textShadow: `0 0 8px ${line.color ?? G}` } : undefined,
  };
  const inner = (
    <>
      {line.displayText}
      {!line.complete && <Cursor />}
    </>
  );
  if (line.href && line.complete) {
    return (
      <Text
        {...textProps}
        as="a"
        href={line.href}
        target="_blank"
        rel="noopener noreferrer"
        _hover={{ textDecoration: 'underline' }}
        cursor="pointer"
      >
        {inner}
      </Text>
    );
  }
  return <Text {...textProps}>{inner}</Text>;
}

// ── Board section (shown after animation) ────────────────────────────────────

function FinalBoards({ winnerTeam, loserTeam, colorblindMode }) {
  const winColor = colorblindMode ? CYAN : G;
  const loseColor = colorblindMode ? AMBER : RED;

  return (
    <Box mt={8} mb={12}>
      <Text
        fontSize="10px"
        color={DIM}
        letterSpacing="widest"
        textTransform="uppercase"
        mb={6}
        fontFamily="mono"
      >
        ─── Final Grid Assessment ───────────────────────────────
      </Text>
      <SimpleGrid columns={[1, 1, 2]} spacing={8}>
        {[
          { team: winnerTeam, label: 'VICTOR', borderColor: winColor, dimColor: winColor },
          { team: loserTeam, label: 'DEFEATED', borderColor: loseColor, dimColor: loseColor },
        ].map(({ team, label, borderColor, dimColor }) => (
          <Box
            key={team?.teamId}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            p={4}
            bg="#060f0a"
          >
            <VStack align="flex-start" spacing={3}>
              <VStack align="flex-start" spacing={0}>
                <Text
                  fontSize="9px"
                  color={dimColor}
                  letterSpacing="widest"
                  textTransform="uppercase"
                  fontFamily="mono"
                >
                  {label}
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={borderColor}
                  fontFamily="mono"
                  letterSpacing="wide"
                >
                  {team?.teamName ?? '—'}
                </Text>
              </VStack>
              <BSGrid tiles={team?.board?.tiles ?? []} showShips colorblindMode={colorblindMode} />
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function BSGameOverScreen({ event, shotLog }) {
  const colorblindMode = localStorage.getItem('bsColorblindMode') === 'true';
  const sessionKey = `bs_gameover_typed_${event.eventId}`;
  const alreadySeen = Boolean(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)
  );

  const winnerTeam = event.teams.find((t) => t.teamId === event.winnerId);
  const loserTeam = event.teams.find((t) => t.teamId !== event.winnerId);

  const winColor = colorblindMode ? CYAN : G;
  const loseColor = colorblindMode ? AMBER : RED;

  // ── Lookup maps (computed once, game is over) ─────────────────────────────

  const tileMap = useMemo(() => {
    const m = {};
    for (const team of event.teams ?? []) {
      const boardId = team.board?.boardId;
      if (!boardId) continue;
      for (const tile of team.board.tiles ?? []) {
        m[`${boardId}:${tile.row},${tile.col}`] = tile;
      }
    }
    return m;
  }, [event.teams]);

  const teamNameMap = useMemo(() => {
    const m = {};
    for (const t of event.teams ?? []) m[t.teamId] = t.teamName;
    return m;
  }, [event.teams]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const battleStart = event.placementEndsAt ? new Date(event.placementEndsAt) : null;
  const battleEnd = event.completedAt ? new Date(event.completedAt) : new Date();
  const durationMs = battleStart ? battleEnd - battleStart : null;

  const teamShotCounts = useMemo(() => {
    const m = {};
    for (const t of event.teams ?? []) m[t.teamId] = { hits: 0, misses: 0 };
    for (const s of shotLog) {
      if (!m[s.firingTeamId]) m[s.firingTeamId] = { hits: 0, misses: 0 };
      if (s.result === 'HIT') m[s.firingTeamId].hits++;
      else m[s.firingTeamId].misses++;
    }
    return m;
  }, [shotLog, event.teams]);

  const shipsSunk = useMemo(() => {
    const loserTiles = loserTeam?.board?.tiles ?? [];
    const byShip = {};
    for (const t of loserTiles) {
      if (!t.shipType) continue;
      if (!byShip[t.shipType]) byShip[t.shipType] = { total: 0, done: 0 };
      byShip[t.shipType].total++;
      if (t.isShot && t.taskCompleted) byShip[t.shipType].done++;
    }
    return Object.values(byShip).filter((s) => s.done === s.total).length;
  }, [loserTeam]);

  // ── Build lines (frozen on first render) ──────────────────────────────────

  const lines = useMemo(() => {
    const I = (text, color = DIM, extra = {}) => ({ text, color, instant: true, ...extra });
    const C = (text, color = G, extra = {}) => ({ text, color, charDelay: 22, ...extra });
    const S = (text, color = G, extra = {}) => ({ text, color, charDelay: 38, ...extra });
    const BLANK = (pauseAfter) => I('', DIM, pauseAfter != null ? { pauseAfter } : {});
    const SEP_H = (p = 60) =>
      I('> ═══════════════════════════════════════════════', DIM, { pauseAfter: p });
    const SEP_L = (p = 40) =>
      I('> ───────────────────────────────────────────────', DIM, { pauseAfter: p });

    const winnerName = winnerTeam?.teamName ?? 'UNKNOWN';
    const loserName = loserTeam?.teamName ?? 'UNKNOWN';
    const wStats = teamShotCounts[winnerTeam?.teamId] ?? { hits: 0, misses: 0 };
    const lStats = teamShotCounts[loserTeam?.teamId] ?? { hits: 0, misses: 0 };
    const sortedLog = [...shotLog].sort((a, b) => new Date(a.shotAt) - new Date(b.shotAt));

    return [
      BLANK(),
      I('> OSRS BINGO HUB / BATTLESHIP COMMAND TERMINAL', DIM, { pauseAfter: 300 }),
      SEP_H(100),
      BLANK(100),
      C('> LOADING BATTLE ASSESSMENT REPORT...', DIM),
      BLANK(),
      C('> ACCESSING ENGAGEMENT RECORDS...', DIM, { pauseAfter: 700 }),

      SEP_H(),
      C(`> CAMPAIGN   :  ${event.eventName}`),
      C(`> COMMENCED  :  ${fmtDate(event.placementEndsAt)}`),
      C(`> CONCLUDED  :  ${fmtDate(event.completedAt)}`),
      C(`> DURATION   :  ${fmtDuration(durationMs)}`, CYAN),
      SEP_H(200),

      BLANK(),
      S('> ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', winColor, { glow: true }),
      BLANK(),
      { ...S(`>     MISSION ACCOMPLISHED`, winColor, { charDelay: 45, glow: true }) },
      BLANK(),
      C(`>     VICTOR   :  ${winnerName}`, winColor, { charDelay: 28 }),
      C(`>     DEFEATED :  ${loserName}`, loseColor, { charDelay: 28 }),
      BLANK(),
      S('> ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', winColor, { glow: true }),
      BLANK(700),

      SEP_L(),
      C('> ENGAGEMENT SUMMARY'),
      SEP_L(100),
      BLANK(),
      C(`> TOTAL SALVOS FIRED  :  ${shotLog.length}`),
      BLANK(),
      C(
        `> ${pad(winnerName, 14)}  ${wStats.hits + wStats.misses} shots  (${wStats.hits} HIT / ${
          wStats.misses
        } MISS)`,
        winColor
      ),
      C(
        `> ${pad(loserName, 14)}  ${lStats.hits + lStats.misses} shots  (${lStats.hits} HIT / ${
          lStats.misses
        } MISS)`,
        loseColor
      ),
      BLANK(),
      C(`> SHIPS SUNK          :  ${shipsSunk} / 5`),
      BLANK(500),

      SEP_H(),
      C('> ENGAGEMENT LOG'),
      SEP_H(200),
      BLANK(),

      ...sortedLog.map((shot) => {
        const teamName = teamNameMap[shot.firingTeamId] ?? shot.firingTeamId;
        const coord = coordLabel(shot.row, shot.col);
        const tile = tileMap[`${shot.targetBoardId}:${shot.row},${shot.col}`];
        const shipType = tile?.shipType ? `  ${tile.shipType}` : '';
        const isHit = shot.result === 'HIT';
        const hitColor = isHit ? (colorblindMode ? AMBER : RED) : DIM;
        const marker = isHit ? '●' : '○';
        const text = `> [${fmtDateTime(shot.shotAt)}]  ${pad(teamName, 14)} ▶  ${pad(
          coord,
          4
        )} ${marker} ${isHit ? 'HIT ' : 'MISS'}${shipType}`;
        return I(text, hitColor, { pauseAfter: isHit ? 60 : 25 });
      }),

      BLANK(700),
      SEP_H(),
      C('> FINAL GRID ASSESSMENT RENDERING...', DIM, { pauseAfter: 900 }),
      BLANK(),

      SEP_H(400),
      BLANK(),
      S('>  ♥  TRANSMISSION FROM THE DEVELOPER  ♥', AMBER, { glow: true, pauseAfter: 200 }),
      BLANK(),
      C('>  OSRS Bingo Hub is built and maintained by a solo dev.', AMBER, { charDelay: 18 }),
      C('>  If this event brought your team some fun, please consider', AMBER, { charDelay: 18 }),
      C('>  leaving a small tip :-) it helps keep the lights on.', AMBER, { charDelay: 18 }),
      BLANK(),
      C('>  ➜  osrsbingohub.com/support', CYAN, {
        charDelay: 28,
        glow: true,
        pauseAfter: 600,
        href: '/support',
      }),
      BLANK(),
      SEP_H(),
    ];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { displayLines, done } = useTypewriter(lines, alreadySeen);

  // Scroll to top on first load only
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mark seen in sessionStorage once animation finishes
  useEffect(() => {
    if (done && !alreadySeen) {
      try {
        sessionStorage.setItem(sessionKey, 'true');
      } catch (_) {}
    }
  }, [done, alreadySeen, sessionKey]);

  return (
    <Box minH="100vh" bg={BG} color={G} fontFamily="mono" position="relative">
      {/* CRT scanline overlay */}
      <Box
        position="fixed"
        inset={0}
        pointerEvents="none"
        zIndex={0}
        sx={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        }}
      />

      {/* Terminal text */}
      <Box px={[4, 8, 14]} pt={10} pb={4} position="relative" zIndex={1} maxW="900px" mx="auto">
        <VStack align="flex-start" spacing={0}>
          {displayLines.map((line, i) => (
            <TermLine key={i} line={line} />
          ))}
        </VStack>
      </Box>

      {/* Final boards — fade in after animation */}
      {done && (
        <Box px={[4, 8, 14]} pb={16} position="relative" zIndex={1} maxW="1100px" mx="auto">
          <FinalBoards
            winnerTeam={winnerTeam}
            loserTeam={loserTeam}
            colorblindMode={colorblindMode}
          />

          <Center mt={8}>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Button
                as={RouterLink}
                to="/battleship"
                size="sm"
                variant="outline"
                borderColor="#1a4028"
                color={DIM}
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="wider"
                _hover={{ borderColor: G, color: G }}
              >
                ← All Campaigns
              </Button>
              <Button
                as={RouterLink}
                to="/support"
                size="sm"
                variant="outline"
                borderColor={AMBER}
                color={AMBER}
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="wider"
                _hover={{ bg: AMBER, color: BG }}
              >
                ♥ Support the Dev
              </Button>
            </HStack>
          </Center>
        </Box>
      )}
    </Box>
  );
}
