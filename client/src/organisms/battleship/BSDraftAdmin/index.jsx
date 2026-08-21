import React from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { TeamsTab } from './TeamsTab';
import { TaskGridTab } from './TaskGridTab';
import { BSRefsTab } from './RefsTab';
import { LaunchTab } from './LaunchTab';

const DRAFT_TABS = ['Teams', 'Task Grid', 'Refs', 'Launch'];

export default function BSEventDraftAdmin({ event, refetch }) {
  return (
    <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md">
      <Tabs variant="unstyled" colorScheme="green">
        <TabList
          bg="#060f0a"
          borderBottom="1px solid"
          borderColor="#1a4028"
          px={4}
          pt={2}
          gap={1}
          borderTopRadius="md"
        >
          {DRAFT_TABS.map((label) => (
            <Tab
              key={label}
              fontFamily="mono"
              fontSize="xs"
              letterSpacing="wider"
              textTransform="uppercase"
              color="#6b9e78"
              pb={2}
              px={3}
              _selected={{
                color: '#4ade80',
                borderBottom: '2px solid',
                borderColor: '#22c55e',
              }}
              _hover={{ color: '#d4f0da' }}
            >
              {label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel p={5}>
            <TeamsTab event={event} refetch={refetch} />
          </TabPanel>
          <TabPanel p={5}>
            <TaskGridTab event={event} refetch={refetch} />
          </TabPanel>
          <TabPanel p={5}>
            <BSRefsTab event={event} refetch={refetch} />
          </TabPanel>
          <TabPanel p={5}>
            <LaunchTab event={event} refetch={refetch} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
