import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import ParticipantSetupModal from '../../molecules/TreasureHunt/ParticipantSetupModal';

const EVENT_ID = 'debug_event_001';

// Clear localStorage so the modal can reopen in debug
const clearSeen = () => localStorage.removeItem(`participantSetup_${EVENT_ID}_seen`);

function Scenario({ title, description, tags, user }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Button
        size="sm"
        colorScheme="yellow"
        onClick={() => {
          clearSeen();
          setIsOpen(true);
        }}
      >
        Open modal
      </Button>
      <ParticipantSetupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
        eventId={EVENT_ID}
      />
    </StoryLayout>
  );
}

export default function ParticipantSetupModalStories() {
  return (
    <StoryPage
      title="ParticipantSetupModal"
      description="One-time prompt shown on PUBLIC event pages for participants who haven't linked Discord yet."
    >
      <Scenario
        title="Not logged in"
        description="No user at all — both steps unchecked, Sign In CTA shown"
        tags={['empty state']}
        user={null}
      />

      <Scenario
        title="Logged in, no Discord"
        description="Has an account but hasn't linked Discord — step 1 checked, step 2 unchecked"
        tags={['happy path']}
        user={{ id: 'user_123', username: 'lemon', discordUserId: null }}
      />
    </StoryPage>
  );
}
