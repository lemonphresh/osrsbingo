import React from 'react';
import { Box, Flex, Heading, Icon, Text, VStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { MdOutlineArrowBack } from 'react-icons/md';
import EventStatusBanner from './EventStatusBanner';
import Section from '../../atoms/Section';

const DraftGateView = ({ event, isAdmin, currentColors }) => (
  <Flex
    alignItems="center"
    flex="1"
    flexDirection="column"
    height="100%"
    paddingY={['40px', '56px']}
    marginX={['12px', '36px']}
  >
    <EventStatusBanner event={event} isAdmin={isAdmin} />

    <Flex
      alignItems="center"
      flexDirection={['column', 'row']}
      justifyContent="space-between"
      marginBottom="16px"
      maxWidth="1200px"
      width="100%"
    >
      <Text
        alignItems="center"
        display="inline-flex"
        _hover={{ borderBottom: '1px solid white', marginBottom: '0px' }}
        fontWeight="semibold"
        justifyContent="center"
        marginBottom="1px"
      >
        <Icon as={MdOutlineArrowBack} marginRight="8px" />
        <Link to="/gielinor-rush"> Back to Events</Link>
      </Text>
    </Flex>
    <Section maxWidth="600px" width="100%" py={8}>
      <VStack spacing={6} align="center" textAlign="center">
        <Box fontSize="6xl">🔒</Box>
        <VStack spacing={2}>
          <Heading size="lg" color={currentColors.white}>
            Event Not Available...Yet!
          </Heading>
          <Text color={currentColors.white} fontSize="lg">
            This event is currently in draft mode
          </Text>
        </VStack>
        <Box p={4} bg="whiteAlpha.400" borderRadius="md" width="100%">
          <Text fontSize="sm" color={currentColors.white}>
            This Gielinor Rush event is still being set up by the event organizers. It will become
            visible once the admins publish it.
          </Text>
        </Box>
      </VStack>
    </Section>
  </Flex>
);

export default DraftGateView;
