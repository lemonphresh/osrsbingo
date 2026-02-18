import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import TeamAccessOverlay from '../../organisms/TreasureHunt/TeamAccessOverlay';

function OverlayScenario({ title, description, tags, reason }) {
  const [show, setShow] = useState(false);
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Button size="sm" colorScheme="red" onClick={() => setShow(true)}>
        Show Overlay
      </Button>
      <TeamAccessOverlay
        show={show}
        reason={reason}
        eventId="event_001"
        teamName="Team Red"
        userDiscordId={reason === 'not_member' ? '999999999999999999' : undefined}
        onClose={() => setShow(false)}
      />
    </StoryLayout>
  );
}

export default function TeamAccessOverlayStories() {
  return (
    <StoryPage
      title="TeamAccessOverlay"
      description="Full-screen access gate shown when a user isn't authorised to view a team page."
    >
      <OverlayScenario
        title="No Discord linked"
        description="User has no discordUserId — prompts them to link their account"
        tags={['error state', 'non-member']}
        reason="no_discord"
      />

      <OverlayScenario
        title="Not a team member"
        description="User has Discord linked but isn't in this team's member list"
        tags={['error state', 'non-member']}
        reason="not_member"
      />
    </StoryPage>
  );
}
