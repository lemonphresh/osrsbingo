import React from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { MOCK_BUFF_HISTORY } from '../mocks/teams';
import { MOCK_NODES } from '../mocks/nodes';
import BuffHistoryPanel from '../../organisms/TreasureHunt/BuffHistoryPanel';

const NODES = Object.values(MOCK_NODES);

function Scenario({ title, description, tags, buffHistory }) {
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <BuffHistoryPanel buffHistory={buffHistory} nodes={NODES} />
    </StoryLayout>
  );
}

export default function BuffHistoryPanelStories() {
  return (
    <StoryPage
      title="BuffHistoryPanel"
      description="Collapsible panel showing a team's buff usage history — which buff was used, which node it was applied to, and how much requirement was saved."
    >
      <Scenario
        title="Empty history"
        description="Team has never used a buff — panel renders nothing"
        tags={['empty state']}
        buffHistory={MOCK_BUFF_HISTORY.empty}
      />

      <Scenario
        title="Single buff used"
        description="One kill reduction buff applied to a node"
        tags={['buff']}
        buffHistory={MOCK_BUFF_HISTORY.single}
      />

      <Scenario
        title="Multiple buffs used"
        description="Four buffs of different types used across different nodes"
        tags={['buff', 'happy path']}
        buffHistory={MOCK_BUFF_HISTORY.multiple}
      />
    </StoryPage>
  );
}
