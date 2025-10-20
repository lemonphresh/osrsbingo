import React, { useState } from 'react';
import {
  Flex,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Badge,
  SimpleGrid,
  useDisclosure,
  useColorMode,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import CreateEventModal from '../organisms/CreateTreasureEventModal';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';

const TreasureHuntDashboard = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, refetch } = useQuery(GET_ALL_TREASURE_EVENTS, {
    variables: { userId: user?.id },
    skip: !user,
  });

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  const events = data?.getAllTreasureEvents || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return currentColors.green.base;
      case 'DRAFT':
        return currentColors.sapphire.base;
      case 'COMPLETED':
        return currentColors.turquoise.base;
      case 'ARCHIVED':
        return currentColors.purple.base;
      default:
        return currentColors.sapphire.base;
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/treasure-hunt/${eventId}`);
  };

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
      width="100%"
    >
      <Flex flexDirection="column" maxWidth="1200px" width="100%">
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" flexWrap="wrap">
            <Heading size="xl" color={currentColors.textColor}>
              Treasure Hunt Events
            </Heading>
            <Button
              leftIcon={<AddIcon />}
              bg={currentColors.purple.base}
              color="white"
              _hover={{ bg: currentColors.purple.light }}
              onClick={onOpen}
            >
              Create New Event
            </Button>
          </HStack>

          {loading ? (
            <Text color={currentColors.textColor}>Loading events...</Text>
          ) : events.length === 0 ? (
            <Text color={currentColors.textColor}>
              No events yet. Create your first treasure hunt!
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {events.map((event) => (
                <Card
                  key={event.eventId}
                  cursor="pointer"
                  bg={currentColors.cardBg}
                  _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                  transition="all 0.2s"
                  onClick={() => handleEventClick(event.eventId)}
                >
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md" color={currentColors.textColor}>
                        {event.eventName}
                      </Heading>
                      <Badge
                        bg={getStatusColor(event.status)}
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {event.status}
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Start:
                        </Text>
                        <Text fontSize="sm" color={currentColors.textColor}>
                          {new Date(event.startDate).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          End:
                        </Text>
                        <Text fontSize="sm" color={currentColors.textColor}>
                          {new Date(event.endDate).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Teams:
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                          {event.teams.length}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Flex>

      <CreateEventModal isOpen={isOpen} onClose={onClose} onSuccess={refetch} />
    </Flex>
  );
};

export default TreasureHuntDashboard;
