import React, { useRef, useState } from 'react';
import { useParams, Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import html2canvas from 'html2canvas';
import { GET_WHODUNNIT_CAMPAIGN, GET_WHODUNNIT_STORY } from '../../graphql/whodunnitOperations';
import CasebookReport from '../../organisms/whodunnit/CasebookReport';
import WhodunnitDesk from '../../organisms/whodunnit/WhodunnitDesk';
import CampaignHeader from '../../organisms/whodunnit/CampaignHeader';
import EnvelopeReveal from '../../organisms/whodunnit/EnvelopeReveal';
import { FaStar } from 'react-icons/fa';
import { WD_COLORS, WD_FONTS } from '../../organisms/whodunnit/whodunnitTheme';
import { useAuth } from '../../providers/AuthProvider';
import { isWhodunnitEnabled } from '../../config/featureFlags';
import usePageTitle from '../../hooks/usePageTitle';

const WhodunnitSummaryPage = () => {
  const { campaignId } = useParams();
  const { user } = useAuth();
  usePageTitle('Casebook Report • A Gielinor Whodunnit');
  const toast = useToast();
  const reportRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const { data, loading } = useQuery(GET_WHODUNNIT_CAMPAIGN, {
    variables: { campaignId },
    skip: !user,
  });
  const { data: storyData, loading: storyLoading } = useQuery(GET_WHODUNNIT_STORY, {
    skip: !user,
  });

  if (!user) return <Navigate to="/login" />;
  if (!isWhodunnitEnabled(user)) return <Navigate to="/" />;

  if (loading || storyLoading) {
    return (
      <Center py={20}>
        <Spinner color="purple.300" size="xl" />
      </Center>
    );
  }
  const campaign = data?.whodunnitCampaign;
  const story = storyData?.whodunnitStory;
  if (!campaign) return <Text color="red.300">Campaign not found.</Text>;

  const downloadImage = async () => {
    if (!reportRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `whodunnit-${campaign.agencyName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      toast({
        title: 'Could not save image',
        description: err.message,
        status: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const copyImage = async () => {
    if (!reportRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Empty capture');
        try {
          await navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': blob }),
          ]);
          toast({ title: 'Copied to clipboard', status: 'success' });
        } catch (e) {
          toast({
            title: 'Clipboard write failed',
            description: 'Try downloading the image instead.',
            status: 'warning',
          });
        }
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <WhodunnitDesk>
      <EnvelopeReveal
        icon={FaStar}
        sealLabel="SOLVED"
        storageKey={`summary-${campaignId}`}
      />
      <CampaignHeader campaign={campaign} subtitle="Case closed" />
      <Box maxW="760px" mx="auto" px={5} py={8}>
        <VStack spacing={5} align="stretch">
          <HStack justify="space-between">
            <Text
              fontFamily={WD_FONTS.typewriter}
              fontSize="xs"
              letterSpacing="0.15em"
              color={WD_COLORS.brassLight}
              textTransform="uppercase"
            >
              Share your Casebook Report
            </Text>
            <HStack>
              <Button
                size="sm"
                onClick={copyImage}
                isLoading={busy}
                variant="outline"
                borderColor={WD_COLORS.paperShadow}
                color={WD_COLORS.paper}
                fontFamily={WD_FONTS.typewriter}
              >
                Copy image
              </Button>
              <Button
                size="sm"
                onClick={downloadImage}
                isLoading={busy}
                bg={WD_COLORS.wax}
                color={WD_COLORS.paper}
                _hover={{ bg: WD_COLORS.waxHighlight }}
                fontFamily={WD_FONTS.typewriter}
              >
                Download image
              </Button>
            </HStack>
          </HStack>

          <CasebookReport ref={reportRef} story={story} campaign={campaign} />

          <HStack justify="center" pt={4}>
            <RouterLink to="/whodunnit">
              <Button variant="ghost" color={WD_COLORS.paperShadow} fontFamily={WD_FONTS.typewriter}>
                Back to cases
              </Button>
            </RouterLink>
          </HStack>
        </VStack>
      </Box>
    </WhodunnitDesk>
  );
};

export default WhodunnitSummaryPage;
