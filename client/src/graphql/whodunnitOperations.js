import { gql } from '@apollo/client';

// ── Fragments ────────────────────────────────────────────────────────────

export const WHODUNNIT_MEMBER_FIELDS = gql`
  fragment WhodunnitMemberFields on WhodunnitTeamMember {
    id
    memberId
    userId
    isCreator
    joinedAt
    user {
      id
      username
      rsn
      displayName
    }
  }
`;

export const WHODUNNIT_PROGRESS_FIELDS = gql`
  fragment WhodunnitProgressFields on WhodunnitNodeProgress {
    id
    progressId
    nodeId
    startedAt
    endedAt
    durationSeconds
    hintUsedClueIds
    revealedHints {
      clueId
      hint
    }
  }
`;

export const WHODUNNIT_ANSWER_FIELDS = gql`
  fragment WhodunnitAnswerFields on WhodunnitClueAnswer {
    id
    answerId
    nodeId
    clueId
    answer
    correct
    submittedAt
    submittedBy {
      id
      username
      rsn
    }
  }
`;

export const WHODUNNIT_SUSPECT_FIELDS = gql`
  fragment WhodunnitSuspectFields on WhodunnitSuspectHistory {
    id
    entryId
    suspect
    updatedAt
    updatedBy {
      id
      username
      rsn
    }
  }
`;

export const WHODUNNIT_CAMPAIGN_FIELDS = gql`
  fragment WhodunnitCampaignFields on WhodunnitCampaign {
    id
    campaignId
    agencyName
    status
    currentNodeId
    choiceAPath
    choiceBPath
    primeSuspect
    createdAt
    updatedAt
    completedAt
    totalDurationSeconds
    createdBy {
      id
      username
      rsn
    }
    members {
      ...WhodunnitMemberFields
    }
    nodeProgress {
      ...WhodunnitProgressFields
    }
    answers {
      ...WhodunnitAnswerFields
    }
    suspectHistory {
      ...WhodunnitSuspectFields
    }
  }
  ${WHODUNNIT_MEMBER_FIELDS}
  ${WHODUNNIT_PROGRESS_FIELDS}
  ${WHODUNNIT_ANSWER_FIELDS}
  ${WHODUNNIT_SUSPECT_FIELDS}
`;

// ── Queries ──────────────────────────────────────────────────────────────

export const GET_MY_WHODUNNIT_CAMPAIGNS = gql`
  query MyWhodunnitCampaigns {
    myWhodunnitCampaigns {
      id
      campaignId
      agencyName
      status
      currentNodeId
      createdAt
      completedAt
      totalDurationSeconds
      members {
        id
        userId
        isCreator
        user {
          id
          rsn
          username
        }
      }
    }
  }
`;

export const GET_WHODUNNIT_CAMPAIGN = gql`
  query WhodunnitCampaign($campaignId: ID!) {
    whodunnitCampaign(campaignId: $campaignId) {
      ...WhodunnitCampaignFields
    }
  }
  ${WHODUNNIT_CAMPAIGN_FIELDS}
`;

export const GET_WHODUNNIT_STORY = gql`
  query WhodunnitStory {
    whodunnitStory {
      id
      title
      subtitle
      startNodeId
      nodes
    }
  }
`;

export const GET_ALL_WHODUNNIT_CAMPAIGNS = gql`
  query AllWhodunnitCampaigns {
    allWhodunnitCampaigns {
      id
      campaignId
      agencyName
      status
      currentNodeId
      createdAt
      completedAt
      totalDurationSeconds
      primeSuspect
      choiceAPath
      choiceBPath
      createdBy {
        id
        rsn
        username
      }
      members {
        id
        userId
        user {
          id
          rsn
          username
        }
      }
      nodeProgress {
        id
        nodeId
        startedAt
        endedAt
        durationSeconds
        hintUsedClueIds
      }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────

export const CREATE_WHODUNNIT_CAMPAIGN = gql`
  mutation CreateWhodunnitCampaign($agencyName: String, $teammateDiscordIds: [String!]) {
    createWhodunnitCampaign(agencyName: $agencyName, teammateDiscordIds: $teammateDiscordIds) {
      id
      campaignId
      agencyName
      status
      currentNodeId
    }
  }
`;

export const UPDATE_WHODUNNIT_AGENCY_NAME = gql`
  mutation UpdateWhodunnitAgencyName($campaignId: ID!, $agencyName: String!) {
    updateWhodunnitAgencyName(campaignId: $campaignId, agencyName: $agencyName) {
      id
      campaignId
      agencyName
    }
  }
`;

export const SUBMIT_WHODUNNIT_ANSWER = gql`
  mutation SubmitWhodunnitAnswer(
    $campaignId: ID!
    $nodeId: String!
    $clueId: String!
    $answer: String!
  ) {
    submitWhodunnitAnswer(
      campaignId: $campaignId
      nodeId: $nodeId
      clueId: $clueId
      answer: $answer
    ) {
      ...WhodunnitAnswerFields
    }
  }
  ${WHODUNNIT_ANSWER_FIELDS}
`;

export const ADVANCE_WHODUNNIT_NODE = gql`
  mutation AdvanceWhodunnitNode($campaignId: ID!, $nextNodeId: String!) {
    advanceWhodunnitNode(campaignId: $campaignId, nextNodeId: $nextNodeId) {
      id
      campaignId
      currentNodeId
      status
    }
  }
`;

export const COMPLETE_WHODUNNIT_CAMPAIGN = gql`
  mutation CompleteWhodunnitCampaign($campaignId: ID!) {
    completeWhodunnitCampaign(campaignId: $campaignId) {
      id
      campaignId
      status
      completedAt
      totalDurationSeconds
    }
  }
`;

export const USE_WHODUNNIT_HINT = gql`
  mutation UseWhodunnitHint($campaignId: ID!, $nodeId: String!, $clueId: String!) {
    useWhodunnitHint(campaignId: $campaignId, nodeId: $nodeId, clueId: $clueId) {
      id
      progressId
      nodeId
      hintUsedClueIds
      revealedHints {
        clueId
        hint
      }
    }
  }
`;

export const CHOOSE_WHODUNNIT_BRANCH = gql`
  mutation ChooseWhodunnitBranch($campaignId: ID!, $choiceKey: String!, $path: String!) {
    chooseWhodunnitBranch(campaignId: $campaignId, choiceKey: $choiceKey, path: $path) {
      id
      campaignId
      choiceAPath
      choiceBPath
    }
  }
`;

export const UPDATE_WHODUNNIT_PRIME_SUSPECT = gql`
  mutation UpdateWhodunnitPrimeSuspect($campaignId: ID!, $suspect: String!) {
    updateWhodunnitPrimeSuspect(campaignId: $campaignId, suspect: $suspect) {
      id
      campaignId
      primeSuspect
    }
  }
`;

// ── Subscriptions ────────────────────────────────────────────────────────

export const WHODUNNIT_CAMPAIGN_UPDATED = gql`
  subscription WhodunnitCampaignUpdated($campaignId: ID!) {
    whodunnitCampaignUpdated(campaignId: $campaignId) {
      ...WhodunnitCampaignFields
    }
  }
  ${WHODUNNIT_CAMPAIGN_FIELDS}
`;
