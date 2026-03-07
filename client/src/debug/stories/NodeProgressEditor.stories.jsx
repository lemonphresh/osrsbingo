import React, { useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import NodeProgressEditor from '../../organisms/TreasureHunt/NodeProgressEditor';

// NodeProgressEditor uses useMutation internally — save requires a backend.
// Read-only variants (isAdmin=false) are fully static.

const FAKE_IDS = { eventId: 'evt_debug', teamId: 'team_debug', nodeId: 'node_debug' };

function ProgressScenario({ title, description, tags, currentProgress, objectiveQuantity, objectiveType = 'boss_kc', isAdmin = false }) {
  const [progress, setProgress] = useState(currentProgress);
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Box maxW="480px">
        <NodeProgressEditor
          {...FAKE_IDS}
          objectiveQuantity={objectiveQuantity}
          objectiveType={objectiveType}
          currentProgress={progress}
          isAdmin={isAdmin}
        />
        {isAdmin && (
          <Text fontSize="xs" color="gray.500" mt={2}>
            Save requires a backend connection — mutation will fail in demo.
          </Text>
        )}
      </Box>
    </StoryLayout>
  );
}

export default function NodeProgressEditorStories() {
  return (
    <StoryPage
      title="NodeProgressEditor"
      description="Progress tracker for item_collection / xp_gain nodes. Shows a read-only bar for members and a slider+input+save for admins."
    >
      {/* ── Read-only (member view) ── */}
      <ProgressScenario
        title="No progress — read only"
        description="Member view, 0/100 kc — only the empty progress bar is shown"
        tags={['member', 'happy path']}
        currentProgress={0}
        objectiveQuantity={100}
      />

      <ProgressScenario
        title="Partial progress — read only"
        description="Member view, 35/100 kc (35%)"
        tags={['member', 'happy path']}
        currentProgress={35}
        objectiveQuantity={100}
      />

      <ProgressScenario
        title="Nearly complete — read only"
        description="Member view, 97/100 kc (97%)"
        tags={['member']}
        currentProgress={97}
        objectiveQuantity={100}
      />

      <ProgressScenario
        title="XP objective — read only"
        description="Member view, 750,000 / 1,100,000 XP"
        tags={['member']}
        currentProgress={750000}
        objectiveQuantity={1100000}
        objectiveType="xp_gain"
      />

      {/* ── Admin view ── */}
      <ProgressScenario
        title="Admin — no progress"
        description="Admin view with slider + number input. Save button disabled until value changes."
        tags={['admin']}
        currentProgress={0}
        objectiveQuantity={100}
        isAdmin
      />

      <ProgressScenario
        title="Admin — partial progress, XP"
        description="Admin view for an XP objective (step=1000). Slider moves in 1k increments."
        tags={['admin']}
        currentProgress={500000}
        objectiveQuantity={1100000}
        objectiveType="xp_gain"
        isAdmin
      />
    </StoryPage>
  );
}
