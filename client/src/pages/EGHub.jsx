import { useEffect, useState } from 'react';
import {
  Flex,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from '@chakra-ui/react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_CALENDAR_EVENTS } from '../graphql/queries';
import { AUTHENTICATE_CALENDAR } from '../graphql/mutations';
import PasswordGate from '../organisms/PasswordGate';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';
import EGCalendar from './EGCalendar';
import SurveyViewer from '../organisms/SurveyViewer';
import ClanStats from '../organisms/ClanStats';

export default function EGHub() {
  const toast = useToast();
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // --- AUTH CHECK ---
  const [checkAuth, { loading: authLoading }] = useLazyQuery(GET_CALENDAR_EVENTS, {
    variables: { limit: 1, offset: 0 },
    fetchPolicy: 'network-only',
    onCompleted: () => {
      setAuthed(true);
      setAuthChecked(true);
    },
    onError: (e) => {
      const isUnauthed = e?.graphQLErrors?.some(
        (err) => err?.extensions?.code === 'UNAUTHENTICATED'
      );
      setAuthed(!isUnauthed);
      setAuthChecked(true);
    },
  });

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [doAuth] = useMutation(AUTHENTICATE_CALENDAR);

  const submitPassword = async (pwd) => {
    try {
      const res = await doAuth({ variables: { password: pwd } });
      if (res?.data?.authenticateCalendar?.ok) {
        setAuthed(true);
      } else {
        toast({ status: 'error', title: 'Incorrect password' });
      }
    } catch (e) {
      toast({ status: 'error', title: e?.message || 'Request failed' });
    }
  };

  usePageTitle('EG Hub');

  if (!authChecked || authLoading) {
    return (
      <Flex align="center" justify="center" minHeight="60vh">
        <Spinner />
      </Flex>
    );
  }

  if (!authed) {
    return (
      <Flex align="center" justify="center" minHeight="60vh">
        <div style={{ width: 420 }}>
          <GemTitle gemColor="purple" size="md" style={{ marginBottom: 16 }}>
            Eternal Gems Hub
          </GemTitle>
          <PasswordGate onAuthed={() => {}} submitOverride={submitPassword} />
        </div>
      </Flex>
    );
  }

  return (
    <Flex direction="column" width="100%" minHeight="100vh">
      <Flex
        paddingX={['16px', '24px', '64px']}
        paddingTop={['48px', '72px']}
        direction="column"
        align="center"
        width="100%"
      >
        <GemTitle gemColor="purple" maxW="1200px" width="100%" paddingBottom="24px">
          Eternal Gems Hub
        </GemTitle>

        <Tabs
          variant="line"
          colorScheme="purple"
          width="100%"
          maxW="1200px"
        >
          <TabList borderBottomColor="whiteAlpha.200" mb={0}>
            <Tab
              _selected={{ color: 'dark.purple.light', borderColor: 'dark.purple.light' }}
              fontWeight="semibold"
            >
              Events Calendar
            </Tab>
            <Tab
              _selected={{ color: 'dark.purple.light', borderColor: 'dark.purple.light' }}
              fontWeight="semibold"
            >
              EG Survey Results
            </Tab>
            <Tab
              _selected={{ color: 'dark.purple.light', borderColor: 'dark.purple.light' }}
              fontWeight="semibold"
            >
              Clan Stats
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <EGCalendar authed={authed} setAuthed={setAuthed} />
            </TabPanel>
            <TabPanel p={0}>
              <SurveyViewer />
            </TabPanel>
            <TabPanel p={0}>
              <ClanStats />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Flex>
  );
}
