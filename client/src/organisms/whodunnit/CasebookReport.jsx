import React, { forwardRef } from 'react';
import { Box, Text, VStack, HStack, Heading, Badge, Divider } from '@chakra-ui/react';
import { getNode } from '../../utils/whodunnit/storyEngine';

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// The final Casebook Report — designed to be captured as an image and
// shared. Uses a parchment-y palette.
const CasebookReport = forwardRef(({ campaign }, ref) => {
  const members = campaign.members || [];
  const nodeProgress = (campaign.nodeProgress || []).filter(
    (p) => p.nodeId !== 'intro' && !p.nodeId.startsWith('choice-'),
  );
  const totalHints = nodeProgress.reduce((sum, p) => sum + (p.hintUsedClueIds?.length || 0), 0);
  const suspects = (campaign.suspectHistory || []).map((s) => s.suspect);
  const uniqueSuspects = [...new Set(suspects)];

  return (
    <Box
      ref={ref}
      bg="#fbf3d9"
      color="#3d2f1f"
      p={8}
      borderRadius="md"
      boxShadow="0 10px 40px rgba(0,0,0,0.5)"
      fontFamily="Georgia, serif"
      border="2px solid #a58a5c"
    >
      <VStack align="stretch" spacing={4}>
        <Box textAlign="center" pb={3} borderBottom="2px solid #a58a5c">
          <Text fontSize="xs" letterSpacing="0.3em" textTransform="uppercase" color="#8a6e3f">
            From the Casebook of Watson
          </Text>
          <Heading size="lg" mt={2} color="#3d2f1f" fontFamily="Georgia, serif">
            {campaign.agencyName}
          </Heading>
          <Text fontSize="sm" color="#6a5232" mt={1}>
            A Gielinor Whodunnit — case closed
          </Text>
        </Box>

        <HStack justify="space-between" fontSize="sm">
          <Box>
            <Text color="#8a6e3f" textTransform="uppercase" fontSize="xs" letterSpacing="0.1em">
              Detectives
            </Text>
            <Text>{members.map((m) => m.user?.rsn || m.user?.username || '?').join(', ')}</Text>
          </Box>
          <Box textAlign="right">
            <Text color="#8a6e3f" textTransform="uppercase" fontSize="xs" letterSpacing="0.1em">
              Total case duration
            </Text>
            <Text fontWeight="bold">{formatDuration(campaign.totalDurationSeconds)}</Text>
          </Box>
        </HStack>

        <HStack justify="space-between" fontSize="sm">
          <Box>
            <Text color="#8a6e3f" textTransform="uppercase" fontSize="xs" letterSpacing="0.1em">
              Hints revealed
            </Text>
            <Text>{totalHints}</Text>
          </Box>
          <Box textAlign="right">
            <Text color="#8a6e3f" textTransform="uppercase" fontSize="xs" letterSpacing="0.1em">
              Prime suspects considered
            </Text>
            <Text>{uniqueSuspects.length}</Text>
          </Box>
        </HStack>

        {uniqueSuspects.length > 1 && (
          <Box fontSize="sm" pt={2}>
            <Text color="#8a6e3f" textTransform="uppercase" fontSize="xs" letterSpacing="0.1em" mb={1}>
              Suspect trail
            </Text>
            <Text fontStyle="italic">{uniqueSuspects.join(' → ')}</Text>
          </Box>
        )}

        <Divider borderColor="#a58a5c" />

        <Box>
          <Text color="#8a6e3f" textTransform="uppercase" fontSize="xs" letterSpacing="0.1em" mb={2}>
            Path taken
          </Text>
          <VStack align="stretch" spacing={1}>
            {nodeProgress.map((p) => {
              const node = getNode(p.nodeId);
              const hintCount = p.hintUsedClueIds?.length || 0;
              return (
                <HStack key={p.id} fontSize="sm" justify="space-between">
                  <HStack spacing={2} minW="0" flex="1">
                    <Text color="#8a6e3f" flexShrink={0}>
                      #{node?.index ?? '—'}
                    </Text>
                    <Text isTruncated>{node?.title || p.nodeId}</Text>
                    {hintCount > 0 && (
                      <Badge bg="#e6c976" color="#3d2f1f" fontSize="xs">
                        🔍 {hintCount}
                      </Badge>
                    )}
                  </HStack>
                  <Text color="#6a5232" flexShrink={0}>
                    {formatDuration(p.durationSeconds)}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </Box>

        <Divider borderColor="#a58a5c" />

        <Box textAlign="center" pt={2}>
          <Text fontStyle="italic" color="#6a5232" fontSize="sm">
            "Case declared solved by defendant. Investigators exonerated. Damages waived."
          </Text>
          <Text fontSize="xs" color="#8a6e3f" mt={2}>
            — Watson, Master Investigator
          </Text>
        </Box>
      </VStack>
    </Box>
  );
});

CasebookReport.displayName = 'CasebookReport';

export default CasebookReport;
