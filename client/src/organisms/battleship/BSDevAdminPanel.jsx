import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Box, VStack, HStack, Text, Button, Divider, Input, Select } from '@chakra-ui/react';
import { CREATE_BS_SUBMISSION } from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import { coordLabel, COL_LABELS } from '../../utils/battleship/bsClientHelpers';

export function DevAdminPanel({
  pendingTask,
  eventId,
  proposeShot,
  proposing,
  teams = [],
  cooldownMs = 0,
}) {
  const { showToast } = useToastContext();
  const [open, setOpen] = useState(false);
  const [fakeUsername, setFakeUsername] = useState('TestUser#1234');
  const [fakeScreenshot, setFakeScreenshot] = useState('https://i.imgur.com/fake.png');
  const [propRow, setPropRow] = useState(0);
  const [propCol, setPropCol] = useState(0);
  const [propTeamId, setPropTeamId] = useState('');

  const [createSubmission, { loading: submitting }] = useMutation(CREATE_BS_SUBMISSION, {
    onCompleted: () => showToast('Fake submission created!', 'success'),
    onError: (e) => showToast(e.message ?? 'Submission failed', 'error'),
  });

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      zIndex={9999}
      bg="#060f0a"
      border="1px solid"
      borderColor="#facc15"
      borderRadius="md"
      overflow="hidden"
      maxW="320px"
      w="320px"
      boxShadow="0 0 12px rgba(250,204,21,0.2)"
    >
      <HStack
        px={3}
        py={2}
        cursor="pointer"
        justify="space-between"
        onClick={() => setOpen((o) => !o)}
        _hover={{ bg: '#0a1f0a' }}
      >
        <Text
          fontFamily="mono"
          fontSize="11px"
          color="#facc15"
          letterSpacing="widest"
          textTransform="uppercase"
        >
          ⚡ Dev Panel
        </Text>
        <Text fontFamily="mono" fontSize="11px" color="#facc15">
          {open ? '▲' : '▼'}
        </Text>
      </HStack>

      {open && (
        <Box px={3} pb={3}>
          <VStack align="stretch" spacing={3}>
            {/* ── Fake submission for active task ── */}
            <Box>
              <Text
                fontFamily="mono"
                fontSize="9px"
                color="#6b9e78"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Submit for active task
              </Text>
              {!pendingTask ? (
                <Text fontFamily="mono" fontSize="10px" color="#3d6b4a">
                  No active task right now
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  <Box
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    borderRadius="sm"
                    px={2}
                    py={1}
                  >
                    <Text fontFamily="mono" fontSize="10px" color="#d4f0da">
                      {coordLabel(pendingTask.row, pendingTask.col)} —{' '}
                      {pendingTask.task?.label ?? pendingTask.tileId}
                    </Text>
                  </Box>

                  <Input
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={fakeUsername}
                    onChange={(e) => setFakeUsername(e.target.value)}
                    placeholder="Discord username"
                  />

                  <Input
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={fakeScreenshot}
                    onChange={(e) => setFakeScreenshot(e.target.value)}
                    placeholder="Screenshot URL"
                  />

                  <Button
                    size="xs"
                    colorScheme="yellow"
                    variant="outline"
                    fontFamily="mono"
                    isLoading={submitting}
                    onClick={() =>
                      createSubmission({
                        variables: {
                          input: {
                            tileId: pendingTask.tileId,
                            discordUserId: `dev-${Date.now()}`,
                            discordUsername: fakeUsername,
                            screenshotUrl: fakeScreenshot,
                          },
                        },
                      })
                    }
                  >
                    Submit
                  </Button>
                </VStack>
              )}
            </Box>

            <Divider borderColor="#1a4028" />

            {/* ── Fake proposal ── */}
            <Box>
              <Text
                fontFamily="mono"
                fontSize="9px"
                color="#6b9e78"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Propose shot (as current user)
              </Text>
              <VStack align="stretch" spacing={2}>
                {teams.length > 0 && (
                  <Select
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={propTeamId}
                    onChange={(e) => setPropTeamId(e.target.value)}
                    placeholder="Fire as team…"
                  >
                    {teams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        {t.teamName}
                      </option>
                    ))}
                  </Select>
                )}
                <HStack spacing={2}>
                  <Select
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={propCol}
                    onChange={(e) => setPropCol(Number(e.target.value))}
                  >
                    {COL_LABELS.map((lbl, i) => (
                      <option key={lbl} value={i}>
                        {lbl}
                      </option>
                    ))}
                  </Select>
                  <Select
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={propRow}
                    onChange={(e) => setPropRow(Number(e.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={i}>
                        {i + 1}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="xs"
                    colorScheme="yellow"
                    variant="outline"
                    fontFamily="mono"
                    isLoading={proposing}
                    isDisabled={cooldownMs > 0}
                    title={
                      cooldownMs > 0
                        ? `Cooldown: ${Math.ceil(cooldownMs / 1000 / 60)}m remaining`
                        : undefined
                    }
                    onClick={() =>
                      proposeShot({
                        variables: {
                          eventId,
                          row: propRow,
                          col: propCol,
                          ...(propTeamId ? { firingTeamId: propTeamId } : {}),
                        },
                      })
                    }
                  >
                    Propose
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
