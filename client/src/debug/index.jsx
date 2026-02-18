import React, { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { DebugShell } from './StoryLayout';

import InnModalStories from './stories/InnModal.stories';
import NodeDetailModalStories from './stories/NodeDetailModal.stories';
import BuffInventoryStories from './stories/BuffInventory.stories';
import TeamAccessOverlayStories from './stories/TeamAccessOverlay.stories';
import BuffApplicationModalStories from './stories/BuffApplicationModal.stories';

// ============================================================
// STORY REGISTRY
// Add new stories here — that's the only file you need to touch
// when adding a component.
// ============================================================
const STORIES = [
  {
    id: 'inn-modal',
    label: 'InnModal',
    category: 'Treasure Hunt',
    scenarioCount: 8,
    component: InnModalStories,
  },
  {
    id: 'node-detail-modal',
    label: 'NodeDetailModal',
    category: 'Treasure Hunt',
    scenarioCount: 13,
    component: NodeDetailModalStories,
  },
  {
    id: 'buff-inventory',
    label: 'BuffInventory',
    category: 'Treasure Hunt',
    scenarioCount: 6,
    component: BuffInventoryStories,
  },
  {
    id: 'team-access-overlay',
    label: 'TeamAccessOverlay',
    category: 'Treasure Hunt',
    scenarioCount: 2,
    component: TeamAccessOverlayStories,
  },
  {
    id: 'buff-application-modal',
    label: 'BuffApplicationModal',
    category: 'Treasure Hunt',
    scenarioCount: 5,
    component: BuffApplicationModalStories,
  },
];

// ============================================================
// PRODUCTION GUARD
// ============================================================
if (process.env.NODE_ENV === 'production') {
  STORIES.length = 0;
}

export default function DebugIndex() {
  const [activeId, setActiveId] = useState(STORIES[0]?.id ?? null);

  if (process.env.NODE_ENV === 'production') {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.400" fontWeight="bold">
          🚫 Not available in production.
        </Text>
      </Box>
    );
  }

  const ActiveComponent = STORIES.find((s) => s.id === activeId)?.component;

  return (
    <DebugShell stories={STORIES} activeId={activeId} onSelect={setActiveId}>
      <Box flex={1} overflowY="auto">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <Text color="gray.500">Select a component from the sidebar.</Text>
        )}
      </Box>
    </DebugShell>
  );
}
