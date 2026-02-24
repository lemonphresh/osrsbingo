import React from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { MOCK_SUBMISSIONS } from '../mocks/submissions';
import { MOCK_NODES } from '../mocks/nodes';
import PlayerSubmissionsPanel from '../../organisms/TreasureHunt/PlayerSubmissionsPanel';

const TEAM_ID = 'team_001';
const NODES = Object.values(MOCK_NODES);

function Scenario({ title, description, tags, submissions, loading = false }) {
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <PlayerSubmissionsPanel
        submissions={submissions}
        nodes={NODES}
        teamId={TEAM_ID}
        loading={loading}
      />
    </StoryLayout>
  );
}

export default function PlayerSubmissionsPanelStories() {
  return (
    <StoryPage
      title="PlayerSubmissionsPanel"
      description="Collapsible panel showing a team's recent submission history. Highlights pending submissions and shows denial reasons."
    >
      <Scenario
        title="Loading state"
        description="Submissions are being fetched"
        tags={['loading']}
        submissions={[]}
        loading={true}
      />

      <Scenario
        title="Pending submissions only"
        description="Two submissions waiting for admin review — header turns yellow"
        tags={['pending']}
        submissions={MOCK_SUBMISSIONS.pending_only}
      />

      <Scenario
        title="Mixed statuses"
        description="Pending, approved, and denied submissions in the same list"
        tags={['happy path']}
        submissions={MOCK_SUBMISSIONS.mixed}
      />

      <Scenario
        title="All approved"
        description="Team's submissions have all been accepted"
        tags={['happy path']}
        submissions={MOCK_SUBMISSIONS.all_approved}
      />

      <Scenario
        title="Denied with reasons"
        description="Denied submissions expanded with specific denial reasons shown"
        tags={['error state']}
        submissions={MOCK_SUBMISSIONS.denied_with_reasons}
      />
    </StoryPage>
  );
}
