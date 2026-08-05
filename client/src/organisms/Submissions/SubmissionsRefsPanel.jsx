import { useState } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Icon,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useSubmissions } from '../../providers/SubmissionsProvider';
import { useToastContext } from '../../providers/ToastProvider';
import { warmUpAudio } from '../../utils/soundEngine';
import SubmissionCard from './SubmissionCard';

// ── Helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ children, count }) {
  return (
    <HStack mb={2} spacing={2}>
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        {children}
      </Text>
      {count > 0 && (
        <Badge colorScheme="gray" fontSize="10px">{count}</Badge>
      )}
    </HStack>
  );
}

function SubmissionSection({ label, submissions }) {
  if (submissions.length === 0) return null;
  return (
    <Box>
      <SectionLabel count={submissions.length}>{label}</SectionLabel>
      <VStack align="stretch" spacing={2}>
        {submissions.map((sub) => (
          <SubmissionCard key={sub.id} submission={sub} />
        ))}
      </VStack>
    </Box>
  );
}

// ── Tile group (accordion item) ────────────────────────────────────────────

function TileGroup({ tileId, tileLabel, submissions, showTileComplete }) {
  const { completeTile, undoTileComplete, colorScheme } = useSubmissions();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);

  const pending  = submissions.filter((s) => s.status === 'PENDING');
  const approved = submissions.filter((s) => s.status === 'APPROVED');
  const denied   = submissions.filter((s) => s.status === 'DENIED');

  // A tile is considered "complete" when there are no more pending subs and at least one approved
  // Callers can override this logic via their own completeTile mutation response
  const isComplete = pending.length === 0 && approved.length > 0;

  const handleComplete = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await completeTile(tileId);
      showToast(`"${tileLabel}" marked complete`, 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to complete tile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (e) => {
    e.stopPropagation();
    if (!undoTileComplete) return;
    setLoading(true);
    try {
      await undoTileComplete(tileId);
      showToast('Tile completion undone', 'info');
    } catch (err) {
      showToast(err.message ?? 'Failed to undo', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccordionItem border="1px solid" borderColor="gray.700" borderRadius="lg" mb={2} overflow="hidden">
      <AccordionButton
        px={4}
        py={3}
        bg="gray.800"
        _hover={{ bg: 'gray.750' }}
        _expanded={{ bg: 'gray.800' }}
      >
        <HStack flex={1} justify="space-between" align="center" mr={2}>
          <HStack spacing={2}>
            <Text fontWeight="semibold" fontSize="sm" color="white">
              {tileLabel ?? tileId}
            </Text>
            {pending.length > 0 && (
              <Badge colorScheme="yellow" fontSize="xs">{pending.length} pending</Badge>
            )}
            {isComplete && (
              <Badge colorScheme="green" fontSize="xs">complete</Badge>
            )}
          </HStack>

          {showTileComplete && (
            <HStack spacing={2} onClick={(e) => e.stopPropagation()}>
              {isComplete && undoTileComplete && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={handleUndo}
                  isLoading={loading}
                >
                  Undo
                </Button>
              )}
              {!isComplete && (
                <Button
                  size="xs"
                  colorScheme={colorScheme}
                  variant="outline"
                  onClick={handleComplete}
                  isLoading={loading}
                  isDisabled={pending.length > 0}
                >
                  Mark Complete
                </Button>
              )}
            </HStack>
          )}
        </HStack>
        <AccordionIcon color="gray.400" />
      </AccordionButton>

      <AccordionPanel px={4} py={4} bg="gray.900">
        <VStack align="stretch" spacing={4}>
          <SubmissionSection label="Pending" submissions={pending} />
          <SubmissionSection label="Approved" submissions={approved} />
          <SubmissionSection label="Denied" submissions={denied} />
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
}

// ── Pre-screenshot section ─────────────────────────────────────────────────

function PreScreenshotSection() {
  const { preScreenshots, acceptPreScreenshot, denyPreScreenshot } = useSubmissions();
  if (preScreenshots.length === 0) return null;

  return (
    <Box>
      <Divider mb={4} borderColor="gray.700" />
      <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={3}>
        Pre-screenshots ({preScreenshots.length})
      </Text>
      <VStack align="stretch" spacing={2}>
        {preScreenshots.map((ps) => (
          <HStack
            key={ps.id}
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="lg"
            px={4}
            py={3}
            justify="space-between"
          >
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="sm" fontWeight="semibold" color="white">
                {ps.tileLabel ?? ps.tileId}
              </Text>
              <Text fontSize="xs" color="gray.400">{ps.submittedBy}</Text>
            </VStack>
            <HStack spacing={2}>
              {ps.screenshot && (
                <Button
                  as="a"
                  href={ps.screenshot}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant="outline"
                  colorScheme="gray"
                >
                  View
                </Button>
              )}
              <Button size="xs" variant="ghost" colorScheme="green" onClick={() => acceptPreScreenshot(ps)}>
                ✓
              </Button>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => denyPreScreenshot(ps)}>
                ✗
              </Button>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

export default function SubmissionsRefsPanel({ groupBy = 'tile', showTileComplete = false }) {
  const {
    allSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    deniedSubmissions,
    newPendingCount,
    clearNewPendingCount,
    showPreScreenshots,
    soundEnabled,
    setSoundEnabled,
    loading,
  } = useSubmissions();

  const handleSoundToggle = () => {
    if (!soundEnabled) warmUpAudio();
    setSoundEnabled((v) => !v);
  };

  // Group by tileId for accordion view
  const tileGroups = (() => {
    if (groupBy !== 'tile') return [];
    const map = new Map();
    for (const sub of allSubmissions) {
      const key = sub.tileId;
      if (!map.has(key)) map.set(key, { tileId: key, tileLabel: sub.tileLabel, submissions: [] });
      map.get(key).submissions.push(sub);
    }
    return [...map.values()];
  })();

  return (
    <VStack align="stretch" spacing={4}>
      {/* Sound toggle */}
      <HStack justify="flex-end" spacing={3}>
        <Icon as={BellIcon} color={soundEnabled ? 'white' : 'gray.600'} boxSize={4} />
        <Switch
          isChecked={soundEnabled}
          onChange={handleSoundToggle}
          size="sm"
          colorScheme="gray"
        />
      </HStack>

      {/* New submissions banner */}
      {newPendingCount > 0 && (
        <Button
          size="sm"
          colorScheme="yellow"
          variant="solid"
          onClick={clearNewPendingCount}
          leftIcon={<BellIcon />}
        >
          {newPendingCount} new submission{newPendingCount !== 1 ? 's' : ''} — click to load
        </Button>
      )}

      {loading && allSubmissions.length === 0 && (
        <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
          Loading submissions...
        </Text>
      )}

      {!loading && allSubmissions.length === 0 && (
        <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
          No submissions yet.
        </Text>
      )}

      {/* Grouped by tile */}
      {groupBy === 'tile' && tileGroups.length > 0 && (
        <Accordion allowMultiple>
          {tileGroups.map((group) => (
            <TileGroup
              key={group.tileId}
              {...group}
              showTileComplete={showTileComplete}
            />
          ))}
        </Accordion>
      )}

      {/* Flat list */}
      {groupBy === 'none' && allSubmissions.length > 0 && (
        <VStack align="stretch" spacing={4}>
          <SubmissionSection label="Pending"  submissions={pendingSubmissions} />
          <SubmissionSection label="Approved" submissions={approvedSubmissions} />
          <SubmissionSection label="Denied"   submissions={deniedSubmissions} />
        </VStack>
      )}

      {/* Pre-screenshots */}
      {showPreScreenshots && <PreScreenshotSection />}
    </VStack>
  );
}
