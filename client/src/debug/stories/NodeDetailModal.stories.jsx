import React from 'react';
import { Button } from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { MOCK_NODES } from '../mocks/nodes';
import { MOCK_TEAMS } from '../mocks/teams';
import { MOCK_USERS } from '../mocks/users';
import NodeDetailModal from '../../organisms/TreasureHunt/NodeDetailModal';

function NodeScenario({
  title,
  description,
  tags,
  node,
  team,
  user = MOCK_USERS.member,
  adminMode = false,
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Button size="sm" colorScheme="blue" onClick={onOpen}>
        Open Node Modal
      </Button>
      <NodeDetailModal
        isOpen={isOpen}
        onClose={onClose}
        node={node}
        team={team}
        eventId="event_001"
        teamId={team.teamId}
        currentUser={user}
        adminMode={adminMode}
        showTutorial={false}
        onAdminComplete={(id) => console.log('[debug] adminComplete', id)}
        onAdminUncomplete={(id) => console.log('[debug] adminUncomplete', id)}
        onApplyBuff={(buffId) => console.log('[debug] applyBuff', buffId)}
      />
    </StoryLayout>
  );
}

export default function NodeDetailModalStories() {
  return (
    <StoryPage
      title="NodeDetailModal"
      description="Node detail view for standard, inn, and start nodes across all statuses."
    >
      {/* ── Status variants ── */}
      <NodeScenario
        title="Available — easy node"
        description="Simple kill objective, easy difficulty, member viewing"
        tags={['happy path', 'member']}
        node={MOCK_NODES.standard_easy_available}
        team={MOCK_TEAMS.no_keys}
      />

      <NodeScenario
        title="Available — hard node"
        description="Hard difficulty kill objective with key rewards"
        tags={['happy path', 'member']}
        node={MOCK_NODES.standard_available}
        team={MOCK_TEAMS.with_keys}
      />

      <NodeScenario
        title="Available — XP objective"
        description="Medium difficulty XP gain objective"
        tags={['happy path', 'member']}
        node={MOCK_NODES.standard_medium_available}
        team={MOCK_TEAMS.no_keys}
      />

      <NodeScenario
        title="Completed node"
        description="Node already done — shows completed state, no submission prompt"
        tags={['member']}
        node={MOCK_NODES.standard_completed}
        team={MOCK_TEAMS.with_keys}
      />

      <NodeScenario
        title="Locked node — admin view"
        description="Locked nodes are only viewable in admin mode"
        tags={['admin']}
        node={MOCK_NODES.standard_locked}
        team={MOCK_TEAMS.no_keys}
        adminMode
      />

      {/* ── Buff variants ── */}
      <NodeScenario
        title="Available — team has applicable buffs"
        description="Team has a kill buff that applies to this node's objective — Apply Buff button should appear"
        tags={['member', 'buff']}
        node={MOCK_NODES.standard_available}
        team={MOCK_TEAMS.with_single_buff}
      />

      <NodeScenario
        title="Available — team has buffs but none apply"
        description="Team has XP buffs but node needs kills — Apply Buff button should NOT appear"
        tags={['member', 'buff']}
        node={MOCK_NODES.standard_available}
        team={MOCK_TEAMS.with_xp_buffs_only}
      />

      <NodeScenario
        title="Buff already applied to objective"
        description="Node has a buff applied — shows reduced quantity and saved amount"
        tags={['member', 'buff']}
        node={MOCK_NODES.standard_buff_applied}
        team={MOCK_TEAMS.no_keys}
      />

      <NodeScenario
        title="Node grants a buff reward"
        description="Completing this node rewards a buff — should be shown in rewards section"
        tags={['member', 'buff']}
        node={MOCK_NODES.standard_grants_buff}
        team={MOCK_TEAMS.no_keys}
      />

      {/* ── Admin mode ── */}
      <NodeScenario
        title="Admin — available node"
        description="Admin controls shown — can mark as completed"
        tags={['admin']}
        node={MOCK_NODES.standard_available}
        team={MOCK_TEAMS.no_keys}
        adminMode
      />

      <NodeScenario
        title="Admin — completed node"
        description="Admin controls shown — can un-complete"
        tags={['admin']}
        node={MOCK_NODES.standard_completed}
        team={MOCK_TEAMS.no_keys}
        adminMode
      />

      {/* ── Non-member ── */}
      <NodeScenario
        title="Non-member viewing available node"
        description="Discord linked but not on team — view only, no Submit or Apply Buff"
        tags={['non-member']}
        node={MOCK_NODES.standard_available}
        team={MOCK_TEAMS.with_keys}
        user={MOCK_USERS.non_member}
      />

      {/* ── Special node types ── */}
      <NodeScenario
        title="Start node"
        description="The START node — no objective, tutorial suppressed in debug"
        tags={['happy path', 'member']}
        node={MOCK_NODES.start}
        team={MOCK_TEAMS.empty}
      />
    </StoryPage>
  );
}
