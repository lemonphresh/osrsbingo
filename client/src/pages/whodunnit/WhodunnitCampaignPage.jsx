import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box,
  Grid,
  GridItem,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  GET_WHODUNNIT_CAMPAIGN,
  SUBMIT_WHODUNNIT_ANSWER,
  ADVANCE_WHODUNNIT_NODE,
  COMPLETE_WHODUNNIT_CAMPAIGN,
  USE_WHODUNNIT_HINT,
  CHOOSE_WHODUNNIT_BRANCH,
  UPDATE_WHODUNNIT_AGENCY_NAME,
  UPDATE_WHODUNNIT_PRIME_SUSPECT,
  WHODUNNIT_CAMPAIGN_UPDATED,
} from '../../graphql/whodunnitOperations';
import NodeView from '../../organisms/whodunnit/NodeView';
import DetectiveNotebook from '../../organisms/whodunnit/DetectiveNotebook';
import WhodunnitDesk from '../../organisms/whodunnit/WhodunnitDesk';
import CampaignHeader from '../../organisms/whodunnit/CampaignHeader';
import EnvelopeReveal from '../../organisms/whodunnit/EnvelopeReveal';
import { FaSnowflake } from 'react-icons/fa';
import {
  getNode,
  computeNextNodeId,
  isTerminalNode,
} from '../../utils/whodunnit/storyEngine';
import { useAuth } from '../../providers/AuthProvider';
import { isWhodunnitEnabled } from '../../config/featureFlags';
import usePageTitle from '../../hooks/usePageTitle';

const WhodunnitCampaignPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle('Investigating • A Gielinor Whodunnit');

  const { data, loading, error, refetch } = useQuery(GET_WHODUNNIT_CAMPAIGN, {
    variables: { campaignId },
    skip: !user,
  });

  // Live updates to any team member
  useSubscription(WHODUNNIT_CAMPAIGN_UPDATED, {
    variables: { campaignId },
    skip: !user,
  });

  const [submitAnswerMutation] = useMutation(SUBMIT_WHODUNNIT_ANSWER);
  const [advanceNodeMutation] = useMutation(ADVANCE_WHODUNNIT_NODE);
  const [completeCampaignMutation] = useMutation(COMPLETE_WHODUNNIT_CAMPAIGN);
  const [hintMutation] = useMutation(USE_WHODUNNIT_HINT);
  const [chooseBranchMutation] = useMutation(CHOOSE_WHODUNNIT_BRANCH);
  const [updateAgencyNameMutation] = useMutation(UPDATE_WHODUNNIT_AGENCY_NAME);
  const [updateSuspectMutation] = useMutation(UPDATE_WHODUNNIT_PRIME_SUSPECT);

  const campaign = data?.whodunnitCampaign;

  // If campaign becomes COMPLETE, route to the summary page.
  useEffect(() => {
    if (campaign?.status === 'COMPLETE') {
      navigate(`/whodunnit/campaign/${campaignId}/complete`, { replace: true });
    }
  }, [campaign?.status, campaignId, navigate]);

  // Whenever the current node changes, scroll back to the top so the team
  // starts reading the new node from the beginning rather than mid-page
  // (the last node may have been long and left them scrolled down).
  useEffect(() => {
    if (!campaign?.currentNodeId) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [campaign?.currentNodeId]);

  const currentNode = useMemo(() => (campaign ? getNode(campaign.currentNodeId) : null), [campaign]);

  if (!user) return <Navigate to="/login" />;
  if (!isWhodunnitEnabled(user)) return <Navigate to="/" />;

  if (loading) {
    return (
      <Center py={20}>
        <Spinner color="purple.300" size="xl" />
      </Center>
    );
  }
  if (error) {
    return (
      <Box maxW="600px" mx="auto" px={5} py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error.message}
        </Alert>
      </Box>
    );
  }
  if (!campaign) {
    return (
      <Box maxW="600px" mx="auto" px={5} py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Campaign not found.
        </Alert>
      </Box>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────

  const onSubmitAnswer = async (nodeId, clueId, answer) => {
    await submitAnswerMutation({
      variables: { campaignId, nodeId, clueId, answer },
    });
    await refetch();
  };

  const onUseHint = async (nodeId, clueId) => {
    await hintMutation({ variables: { campaignId, nodeId, clueId } });
    await refetch();
  };

  const onAdvance = async () => {
    if (isTerminalNode(campaign.currentNodeId)) {
      await completeCampaignMutation({ variables: { campaignId } });
      await refetch();
      return;
    }
    const next = computeNextNodeId(campaign.currentNodeId, {
      choiceAPath: campaign.choiceAPath,
      choiceBPath: campaign.choiceBPath,
    });
    if (!next) return;
    await advanceNodeMutation({ variables: { campaignId, nextNodeId: next } });
    await refetch();
  };

  const onChoose = async (choiceKey, path) => {
    await chooseBranchMutation({ variables: { campaignId, choiceKey, path } });
    // Then advance to the first node in the picked path
    const nextAfterChoice = computeNextNodeId(campaign.currentNodeId, {
      choiceAPath: choiceKey === 'A' ? path : campaign.choiceAPath,
      choiceBPath: choiceKey === 'B' ? path : campaign.choiceBPath,
    });
    if (nextAfterChoice) {
      await advanceNodeMutation({ variables: { campaignId, nextNodeId: nextAfterChoice } });
    }
    await refetch();
  };

  const onSetAgencyName = async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    if (trimmed === campaign.agencyName) return;
    await updateAgencyNameMutation({ variables: { campaignId, agencyName: trimmed } });
    await refetch();
  };

  const onUpdatePrimeSuspect = async (suspect) => {
    await updateSuspectMutation({ variables: { campaignId, suspect } });
    await refetch();
  };

  const subtitle = currentNode
    ? `Currently working: ${currentNode.title}`
    : 'Case in progress';

  return (
    <WhodunnitDesk>
      <EnvelopeReveal
        // Re-key on the current node so advancing to a new node remounts
        // the component and pops a fresh envelope (once per node per
        // session — refreshing the same node won't re-fire).
        key={campaign.currentNodeId}
        icon={FaSnowflake}
        sealLabel="OPEN"
        storageKey={`campaign-${campaignId}-${campaign.currentNodeId}`}
      />
      <CampaignHeader campaign={campaign} subtitle={subtitle} />
      <Box maxW="1200px" mx="auto" px={5} py={6}>
        <Grid templateColumns={{ base: '1fr', lg: '1fr 320px' }} gap={6}>
          <GridItem>
            {currentNode ? (
              <NodeView
                campaign={campaign}
                nodeId={campaign.currentNodeId}
                onSubmitAnswer={onSubmitAnswer}
                onUseHint={onUseHint}
                onAdvance={onAdvance}
                onChoose={onChoose}
                onSetAgencyName={onSetAgencyName}
              />
            ) : (
              <Text color="red.300">Unknown node: {campaign.currentNodeId}</Text>
            )}
          </GridItem>

          <GridItem>
            <DetectiveNotebook campaign={campaign} onUpdatePrimeSuspect={onUpdatePrimeSuspect} />
          </GridItem>
        </Grid>
      </Box>
    </WhodunnitDesk>
  );
};

export default WhodunnitCampaignPage;
