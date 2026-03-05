import React from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { MOCK_NODES } from '../mocks/nodes';
import EventSummaryPanel from '../../organisms/TreasureHunt/EventSummaryPanel';

const ALL_NODES = Object.values(MOCK_NODES);

// ── Shared event skeletons ────────────────────────────────────────────────────

const COMPLETED_EVENT = {
  eventId: 'evt_001',
  eventName: 'Gielinor Rush: Season 1',
  endDate: '2025-06-01T20:00:00.000Z',
  status: 'COMPLETED',
};

const ARCHIVED_EVENT = {
  ...COMPLETED_EVENT,
  eventName: 'Gielinor Rush: Beta',
  status: 'ARCHIVED',
};

// ── Team factories ────────────────────────────────────────────────────────────

const makeTeam = (id, name, pot, completedNodes = []) => ({
  teamId: id,
  teamName: name,
  currentPot: String(pot),
  completedNodes,
});

// Scenario data ────────────────────────────────────────────────────────────────

const THREE_TEAMS = [
  makeTeam('t1', 'Dragon Slayers', 42_000_000, [
    'node_001',        // hard (tier 5)
    'node_003',        // hard (tier 5)
    'node_easy_001',   // easy (tier 1)
  ]),
  makeTeam('t2', 'Iron Warriors', 28_500_000, [
    'node_med_001',    // medium (tier 3)
    'node_easy_001',   // easy (tier 1)
  ]),
  makeTeam('t3', 'Chaos Druids', 15_000_000, [
    'node_easy_001',   // easy (tier 1)
  ]),
];

const SIX_TEAMS = [
  makeTeam('t1', 'Dragon Slayers',  55_000_000, ['node_001', 'node_003']),
  makeTeam('t2', 'Iron Warriors',   48_000_000, ['node_001']),
  makeTeam('t3', 'Chaos Druids',    31_000_000, ['node_med_001']),
  makeTeam('t4', 'Goblin Gang',     22_000_000, ['node_easy_001']),
  makeTeam('t5', 'Barrow Boys',     14_000_000, []),
  makeTeam('t6', 'Noobs United',     2_000_000, []),
];

const DOMINANT_WINNER = [
  makeTeam('t1', 'Dragon Slayers', 80_000_000, [
    'node_001', 'node_003', 'node_buff_reward',   // 3× hard
  ]),
  makeTeam('t2', 'Iron Warriors',  1_000_000, []),
];

// ── Story wrapper ─────────────────────────────────────────────────────────────

function Scenario({ title, description, tags, event, teams, nodes = ALL_NODES }) {
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <EventSummaryPanel event={event} teams={teams} nodes={nodes} />
    </StoryLayout>
  );
}

// ── Stories ───────────────────────────────────────────────────────────────────

export default function EventSummaryPanelStories() {
  return (
    <StoryPage
      title="EventSummaryPanel"
      description="Post-event summary: event header, GP/node totals, final standings leaderboard with difficulty breakdowns."
    >
      <Scenario
        title="Happy path — 3 teams, COMPLETED"
        description="Standard completed event with medals, GP totals, and difficulty badges"
        tags={['happy path']}
        event={COMPLETED_EVENT}
        teams={THREE_TEAMS}
      />

      <Scenario
        title="ARCHIVED event — no success image"
        description="status=ARCHIVED hides the success.webp banner"
        tags={['happy path']}
        event={ARCHIVED_EVENT}
        teams={THREE_TEAMS}
      />

      <Scenario
        title="Large field — 6 teams"
        description="Teams 4-6 show rank numbers instead of medal emojis"
        tags={['happy path']}
        event={COMPLETED_EVENT}
        teams={SIX_TEAMS}
      />

      <Scenario
        title="Dominant winner"
        description="One team with a huge pot lead; second team with 0 completed nodes"
        tags={['happy path']}
        event={COMPLETED_EVENT}
        teams={DOMINANT_WINNER}
      />

      <Scenario
        title="Empty — no teams"
        description="Event ended with no teams registered"
        tags={['empty state']}
        event={COMPLETED_EVENT}
        teams={[]}
        nodes={[]}
      />
    </StoryPage>
  );
}
