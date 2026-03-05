import React from 'react';
import { Box } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import AdminQuickActionsPanel from '../../organisms/TreasureHunt/AdminQuickActions';

// ── Helpers ───────────────────────────────────────────────────────────────────

const noop = () => {};

const PUBLIC_EVENT = {
  eventId: 'evt_001',
  eventName: 'Gielinor Rush: Season 1',
  status: 'PUBLIC',
};

const makeMember = (id, discordUsername, username = null) => ({
  discordUserId: id,
  discordUsername,
  discordAvatar: null,
  username, // null = unverified (Discord only), string = verified (site account)
});

const makeTeam = (id, name, pot, completedNodes, members) => ({
  teamId: id,
  teamName: name,
  currentPot: String(pot),
  completedNodes,
  members,
});

const makeSub = (id, teamId, nodeId, status) => ({
  submissionId: id,
  teamId,
  nodeId,
  status,
});

// ── Scenario data ─────────────────────────────────────────────────────────────

const TEAMS_ALL_VERIFIED = [
  makeTeam('t1', 'Dragon Slayers', 42_000_000, ['node_001', 'node_003'], [
    makeMember('111111111111111111', 'zezima', 'zezima'),
    makeMember('222222222222222222', 'woox', 'woox'),
    makeMember('333333333333333333', 'lynx_titan', 'lynx_titan'),
  ]),
  makeTeam('t2', 'Iron Warriors', 28_500_000, ['node_easy_001'], [
    makeMember('444444444444444444', 'swampletics', 'swampletics'),
    makeMember('555555555555555555', 'b0aty', 'b0aty'),
  ]),
];

const TEAMS_MIXED_VERIFICATION = [
  makeTeam('t1', 'Dragon Slayers', 42_000_000, ['node_001', 'node_003'], [
    makeMember('111111111111111111', 'zezima', 'zezima'),         // verified
    makeMember('222222222222222222', 'woox', null),               // unverified
    makeMember('333333333333333333', 'lynx_titan', 'lynx_titan'), // verified
  ]),
  makeTeam('t2', 'Iron Warriors', 28_500_000, ['node_easy_001'], [
    makeMember('444444444444444444', 'swampletics', null),        // unverified
    makeMember('555555555555555555', 'b0aty', null),              // unverified
  ]),
  makeTeam('t3', 'Chaos Druids', 5_000_000, [], [
    makeMember('666666666666666666', 'grinderscape', 'grinderscape'), // verified
  ]),
];

const TEAMS_ALL_UNVERIFIED = [
  makeTeam('t1', 'Dragon Slayers', 15_000_000, ['node_001'], [
    makeMember('111111111111111111', 'zezima', null),
    makeMember('222222222222222222', 'woox', null),
  ]),
  makeTeam('t2', 'Iron Warriors', 8_000_000, [], [
    makeMember('444444444444444444', 'swampletics', null),
    makeMember('555555555555555555', 'b0aty', null),
    makeMember('666666666666666666', 'grinderscape', null),
  ]),
];

const TEAMS_WITH_URGENT = [
  makeTeam('t1', 'Dragon Slayers', 42_000_000, ['node_001'], [
    makeMember('111111111111111111', 'zezima', 'zezima'),
  ]),
  makeTeam('t2', 'Iron Warriors', 0, [], []), // no members → warning
  makeTeam('t3', 'Chaos Druids', 0, [], []),  // no members → warning
];

const SUBS_URGENT = [
  makeSub('s1', 't1', 'node_003', 'PENDING_REVIEW'),
  makeSub('s2', 't1', 'node_easy_001', 'PENDING_REVIEW'),
  makeSub('s3', 't1', 'node_001', 'APPROVED'),
  makeSub('s4', 't1', 'node_med_001', 'DENIED'),
];

const SUBS_QUIET = [
  makeSub('s1', 't1', 'node_001', 'APPROVED'),
  makeSub('s2', 't1', 'node_003', 'APPROVED'),
  makeSub('s3', 't2', 'node_easy_001', 'DENIED'),
];

// ── Wrapper ───────────────────────────────────────────────────────────────────
// `transform: scale(1)` creates a new stacking context so position:fixed inside
// is scoped to this container rather than the viewport.

function PanelFrame({ children }) {
  return (
    <Box position="relative" minH="280px" style={{ transform: 'scale(1)' }}>
      {children}
    </Box>
  );
}

function Scenario({ title, description, tags, teams, submissions = [], defaultExpanded = true }) {
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <PanelFrame>
        <AdminQuickActionsPanel
          event={PUBLIC_EVENT}
          teams={teams}
          submissions={submissions}
          isEventAdmin
          onNavigateToSubmissions={noop}
          onNavigateToTeams={noop}
          onOpenSettings={noop}
          onOpenDiscordSetup={noop}
          onOpenLaunchFAQ={noop}
        />
      </PanelFrame>
    </StoryLayout>
  );
}

// ── Stories ───────────────────────────────────────────────────────────────────

export default function AdminQuickActionsStories() {
  return (
    <StoryPage
      title="AdminQuickActionsPanel"
      description="Floating admin panel shown to event admins during PUBLIC events. Tracks submissions, team activity, and member verification."
    >
      <Scenario
        title="All verified — clean state"
        description="All members have site accounts; no pending submissions"
        tags={['happy path', 'admin']}
        teams={TEAMS_ALL_VERIFIED}
        submissions={SUBS_QUIET}
      />

      <Scenario
        title="Mixed verification"
        description="Some members verified (site account), some Discord-only — the typical real-world scenario"
        tags={['happy path', 'admin']}
        teams={TEAMS_MIXED_VERIFICATION}
        submissions={SUBS_QUIET}
      />

      <Scenario
        title="All unverified"
        description="No members have linked site accounts — 0 verified, all Discord-only"
        tags={['admin']}
        teams={TEAMS_ALL_UNVERIFIED}
        submissions={[]}
      />

      <Scenario
        title="Urgent — pending submissions + teams without members"
        description="Panel border turns orange; badge shows pending count; warnings for empty teams"
        tags={['admin', 'error state']}
        teams={TEAMS_WITH_URGENT}
        submissions={SUBS_URGENT}
      />

      <Scenario
        title="No teams yet"
        description="Event is PUBLIC but no teams have been created"
        tags={['empty state', 'admin']}
        teams={[]}
        submissions={[]}
      />
    </StoryPage>
  );
}
