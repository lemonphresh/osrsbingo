import React, { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { DebugShell } from './StoryLayout';

import InnModalStories from './stories/InnModal.stories';
import NodeDetailModalStories from './stories/NodeDetailModal.stories';
import BuffInventoryStories from './stories/BuffInventory.stories';
import TeamAccessOverlayStories from './stories/TeamAccessOverlay.stories';
import BuffApplicationModalStories from './stories/BuffApplicationModal.stories';
import LaunchModalStories from './stories/LaunchModal.stories';
import BuffHistoryPanelStories from './stories/BuffHistoryPanel.stories';
import PlayerSubmissionsPanelStories from './stories/PlayerSubmissionsPanel.stories';
import AvailableTasksStripStories from './stories/AvailableTasksStrip.stories';
import EventSummaryPanelStories from './stories/EventSummaryPanel.stories';
import ParticipantSetupModalStories from './stories/ParticipantSetupModal.stories';
import EventPasswordReminderStories from './stories/EventPasswordReminder.stories';
import AdminQuickActionsStories from './stories/AdminQuickActions.stories';
import NodeProgressEditorStories from './stories/NodeProgressEditor.stories';
import SubmissionsTabStories from './stories/SubmissionsTab.stories';
import DropsFeedStories from './stories/DropsFeed.stories';

// ============================================================
// STORY REGISTRY
// Add new stories here — that's the only file you need to touch
// when adding a component.
// ============================================================
const STORIES = [
  {
    id: 'inn-modal',
    label: 'InnModal',
    category: 'Gielinor Rush',
    scenarioCount: 8,
    component: InnModalStories,
  },
  {
    id: 'node-detail-modal',
    label: 'NodeDetailModal',
    category: 'Gielinor Rush',
    scenarioCount: 13,
    component: NodeDetailModalStories,
  },
  {
    id: 'buff-inventory',
    label: 'BuffInventory',
    category: 'Gielinor Rush',
    scenarioCount: 6,
    component: BuffInventoryStories,
  },
  {
    id: 'buff-history-panel',
    label: 'BuffHistoryPanel',
    category: 'Gielinor Rush',
    scenarioCount: 3,
    component: BuffHistoryPanelStories,
  },
  {
    id: 'player-submissions-panel',
    label: 'PlayerSubmissionsPanel',
    category: 'Gielinor Rush',
    scenarioCount: 5,
    component: PlayerSubmissionsPanelStories,
  },
  {
    id: 'team-access-overlay',
    label: 'TeamAccessOverlay',
    category: 'Gielinor Rush',
    scenarioCount: 2,
    component: TeamAccessOverlayStories,
  },
  {
    id: 'buff-application-modal',
    label: 'BuffApplicationModal',
    category: 'Gielinor Rush',
    scenarioCount: 5,
    component: BuffApplicationModalStories,
  },
  {
    id: 'launch-modal',
    label: 'Launch Modal',
    category: 'Gielinor Rush',
    scenarioCount: 5,
    component: LaunchModalStories,
  },
  {
    id: 'available-tasks-strip',
    label: 'AvailableTasksStrip',
    category: 'Gielinor Rush',
    scenarioCount: 11,
    component: AvailableTasksStripStories,
  },
  {
    id: 'event-summary-panel',
    label: 'EventSummaryPanel',
    category: 'Gielinor Rush',
    scenarioCount: 5,
    component: EventSummaryPanelStories,
  },
  {
    id: 'participant-setup-modal',
    label: 'ParticipantSetupModal',
    category: 'Gielinor Rush',
    scenarioCount: 2,
    component: ParticipantSetupModalStories,
  },
  {
    id: 'event-password-reminder',
    label: 'EventPasswordReminder',
    category: 'Gielinor Rush',
    scenarioCount: 2,
    component: EventPasswordReminderStories,
  },
  {
    id: 'admin-quick-actions',
    label: 'AdminQuickActionsPanel',
    category: 'Gielinor Rush',
    scenarioCount: 5,
    component: AdminQuickActionsStories,
  },
  {
    id: 'node-progress-editor',
    label: 'NodeProgressEditor',
    category: 'Gielinor Rush',
    scenarioCount: 6,
    component: NodeProgressEditorStories,
  },
  {
    id: 'submissions-tab',
    label: 'SubmissionsTab',
    category: 'Gielinor Rush',
    scenarioCount: 5,
    component: SubmissionsTabStories,
  },
  {
    id: 'drops-feed',
    label: 'DropsFeed',
    category: 'Clan Stats',
    scenarioCount: 4,
    component: DropsFeedStories,
  },
];

// ============================================================
// PRODUCTION GUARD
// ============================================================
if (process.env.REACT_APP_ENV === 'production') {
  STORIES.length = 0;
}

export default function DebugIndex() {
  const [activeId, setActiveId] = useState(STORIES[0]?.id ?? null);

  if (process.env.REACT_APP_ENV === 'production') {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.400" fontWeight="semibold">
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
