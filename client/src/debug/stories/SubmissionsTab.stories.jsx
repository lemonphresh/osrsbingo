import React from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import SubmissionsTab from '../../organisms/TreasureHunt/SubmissionsTab';

const noop = () => {};
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

// ── Mock data ─────────────────────────────────────────────────────────────────

const TEAM = {
  teamId: 'team_001',
  teamName: 'Dragon Slayers',
  completedNodes: ['node_001'],
  nodeProgress: {
    node_003: 35,       // 35/100 = 35%
    node_med_001: 750000, // 750k/1.1M xp
  },
  nodeBuffs: {},
};

const EVENT = {
  eventId: 'evt_debug',
  nodes: [
    {
      nodeId: 'node_003',
      nodeType: 'STANDARD',
      title: 'Lumbridge - Abyssal Demons',
      mapLocation: 'Lumbridge',
      objective: { type: 'boss_kc', target: 'Abyssal Demons', quantity: 100 },
      rewards: { gp: 3000000 },
    },
    {
      nodeId: 'node_easy_001',
      nodeType: 'STANDARD',
      title: 'Draynor Village - Goblins',
      mapLocation: 'Draynor Village',
      objective: { type: 'boss_kc', target: 'Goblins', quantity: 30 },
      rewards: { gp: 1000000 },
    },
    {
      nodeId: 'node_med_001',
      nodeType: 'STANDARD',
      title: 'Varrock - Slayer XP',
      mapLocation: 'Varrock',
      objective: { type: 'xp_gain', target: 'Slayer', quantity: 1100000 },
      rewards: { gp: 2000000 },
    },
    {
      nodeId: 'node_001',
      nodeType: 'STANDARD',
      title: 'Falador - Ice Warriors',
      mapLocation: 'Falador',
      objective: { type: 'boss_kc', target: 'Ice Warriors', quantity: 50 },
      rewards: { gp: 1500000 },
    },
  ],
  teams: [TEAM],
};

const makeSub = (id, nodeId, status, user = 'testplayer') => ({
  submissionId: id,
  teamId: TEAM.teamId,
  nodeId,
  status,
  submittedAt: hoursAgo(Math.random() * 4),
  submittedByUsername: user,
  proofUrl: 'https://i.imgur.com/example.png',
  denialReason: status === 'DENIED' ? 'Screenshot missing kill count overlay.' : null,
  team: { teamId: TEAM.teamId, teamName: TEAM.teamName },
});

const SUBS_WITH_PROGRESS = [
  makeSub('s1', 'node_003', 'PENDING_REVIEW'),
  makeSub('s2', 'node_003', 'APPROVED'),
  makeSub('s3', 'node_med_001', 'APPROVED', 'runescape_irl'),
  makeSub('s4', 'node_med_001', 'PENDING_REVIEW', 'gamer99'),
];

const SUBS_NO_PROGRESS = [
  makeSub('s1', 'node_easy_001', 'PENDING_REVIEW'),
  makeSub('s2', 'node_easy_001', 'APPROVED'),
];

const SUBS_COMPLETED_NODE = [
  makeSub('s1', 'node_001', 'APPROVED'),
];

// ── Wrapper ───────────────────────────────────────────────────────────────────

function TabWrapper({ allSubmissions, event = EVENT, isEventAdmin = false }) {
  const { colors: currentColors, colorMode } = useThemeColors();
  return (
    <SubmissionsTab
      allSubmissions={allSubmissions}
      event={event}
      currentColors={currentColors}
      colorMode={colorMode}
      isEventAdmin={isEventAdmin}
      teamId={TEAM.teamId}
      setSubmissionToDeny={noop}
      onDenialModalOpen={noop}
      setNodeToComplete={noop}
      onOpenCompleteDialog={noop}
      handleReviewSubmission={noop}
    />
  );
}

// ── Stories ───────────────────────────────────────────────────────────────────

export default function SubmissionsTabStories() {
  return (
    <StoryPage
      title="SubmissionsTab"
      description="Submission review accordion. Shows progress bars on accordion headers when nodeProgress > 0."
    >
      <StoryLayout
        title="With progress — member view"
        description="Two nodes with partial nodeProgress — progress bars show on the closed accordion header. node_003 is 35/100 kc, node_med_001 is 750k/1.1M XP."
        tags={['happy path', 'member']}
      >
        <TabWrapper allSubmissions={SUBS_WITH_PROGRESS} />
      </StoryLayout>

      <StoryLayout
        title="With progress — admin view"
        description="Same data but isEventAdmin=true — NodeProgressEditor slider + Save button visible inside each panel."
        tags={['admin']}
      >
        <TabWrapper allSubmissions={SUBS_WITH_PROGRESS} isEventAdmin />
      </StoryLayout>

      <StoryLayout
        title="No progress set"
        description="node_easy_001 has no nodeProgress entry — progress bar does not appear on accordion header."
        tags={['happy path', 'member']}
      >
        <TabWrapper allSubmissions={SUBS_NO_PROGRESS} />
      </StoryLayout>

      <StoryLayout
        title="Completed node"
        description="node_001 is in completedNodes — accordion item is faded, no progress bar, no Complete button."
        tags={['member']}
      >
        <TabWrapper allSubmissions={SUBS_COMPLETED_NODE} />
      </StoryLayout>

      <StoryLayout
        title="Empty — no submissions"
        description="No submissions to review — empty state message shown."
        tags={['empty state']}
      >
        <TabWrapper allSubmissions={[]} />
      </StoryLayout>
    </StoryPage>
  );
}
