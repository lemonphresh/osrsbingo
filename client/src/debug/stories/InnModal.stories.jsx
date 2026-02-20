import React from 'react';
import { Button } from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { MOCK_NODES } from '../mocks/nodes';
import { MOCK_TEAMS } from '../mocks/teams';
import { MOCK_USERS } from '../mocks/users';
import InnModal from '../../organisms/TreasureHunt/TreasureInnModal';

function InnScenario({ title, description, tags, node, team, user }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Button size="sm" colorScheme="yellow" onClick={onOpen}>
        Open Inn Modal
      </Button>
      <InnModal
        isOpen={isOpen}
        onClose={onClose}
        node={node}
        team={team}
        eventId="event_001"
        currentUser={user}
        onPurchaseComplete={() => console.log('[debug] onPurchaseComplete called')}
      />
    </StoryLayout>
  );
}

export default function InnModalStories() {
  return (
    <StoryPage
      title="InnModal"
      description="Inn reward trading modal. Teams spend keys for GP and optional buffs."
    >
      <InnScenario
        title="Happy path — no buff"
        description="Member with enough keys, no buffs on any reward"
        tags={['happy path', 'member']}
        node={MOCK_NODES.inn_no_buff}
        team={MOCK_TEAMS.with_keys}
        user={MOCK_USERS.member}
      />

      <InnScenario
        title="Happy path — with buff on reward"
        description="One reward slot has a buff attached; should show purple border + buff detail"
        tags={['happy path', 'member', 'buff']}
        node={MOCK_NODES.inn_with_buff}
        team={MOCK_TEAMS.with_keys}
        user={MOCK_USERS.member}
      />

      <InnScenario
        title="Tier 3 inn — major buff available"
        description="Higher tier inn with a universal buff on one trade"
        tags={['happy path', 'member', 'buff']}
        node={MOCK_NODES.inn_tier3_with_buff}
        team={MOCK_TEAMS.rich}
        user={MOCK_USERS.member}
      />

      <InnScenario
        title="Can't afford any trade"
        description="Team has no keys — all options should be disabled"
        tags={['error state', 'member']}
        node={MOCK_NODES.inn_with_buff}
        team={MOCK_TEAMS.no_keys}
        user={MOCK_USERS.member}
      />

      <InnScenario
        title="Can afford some but not combo"
        description="Only 1 red key — small trade affordable, combo trade is not"
        tags={['member']}
        node={MOCK_NODES.inn_no_buff}
        team={MOCK_TEAMS.partial_keys}
        user={MOCK_USERS.member}
      />

      <InnScenario
        title="Already purchased"
        description="Team already traded at this inn — shows purchased banner, all buttons disabled"
        tags={['error state', 'member']}
        node={MOCK_NODES.inn_no_buff}
        team={MOCK_TEAMS.already_purchased}
        user={MOCK_USERS.member}
      />

      <InnScenario
        title="Non-member viewing"
        description="User is not on the team — view only, no purchase allowed"
        tags={['non-member']}
        node={MOCK_NODES.inn_with_buff}
        team={MOCK_TEAMS.with_keys}
        user={MOCK_USERS.non_member}
      />

      <InnScenario
        title="No Discord linked"
        description="User has no discordUserId — treated as non-member"
        tags={['non-member', 'error state']}
        node={MOCK_NODES.inn_with_buff}
        team={MOCK_TEAMS.with_keys}
        user={MOCK_USERS.no_discord}
      />
    </StoryPage>
  );
}
