import React from 'react';
import {
  Box,
  Button,
  Collapse,
  Flex,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import GemTitle from '../../atoms/GemTitle';
import ExampleGR from '../../assets/exampleGR2.png';
import EventCreationGuide from './TreasureHuntEventCreationGuide';
import CreateEventModal from './CreateTreasureEventModal';
import AuthRequiredModal from '../../molecules/AuthRequiredModal';
import { isGielinorRushEnabled } from '../../config/featureFlags';

const HOW_IT_WORKS = [
  { label: 'Set Parameters', desc: 'Choose map size, difficulty, teams, content, and time frame.' },
  {
    label: 'Generate Map',
    desc: 'A unique map is created with objectives, buffs, and checkpoints.',
  },
  {
    label: 'Teams Compete',
    desc: 'Teams navigate the map, complete objectives, and race to the treasure.',
  },
];

const DashboardEmptyState = ({
  c,
  colorMode,
  user,
  navigate,
  guideOpen,
  onGuideToggle,
  onCreateEventClick,
  isOpen,
  onClose,
  onSuccess,
  isAuthModalOpen,
  onAuthModalClose,
}) => (
  <Flex
    flex="1"
    flexDirection="column"
    alignItems="center"
    px={['16px', '24px', '64px']}
    pt="64px"
    pb="48px"
  >
    <VStack spacing={6} maxW="640px" w="100%" textAlign="center">
      <GemTitle gemColor="purple">Gielinor Rush</GemTitle>
      <Text color="gray.300" fontSize="md">
        Create competitive clan events where teams race through OSRS challenges to claim the prize.
      </Text>

      {isGielinorRushEnabled(user) && (
        <Box
          as="button"
          onClick={() => navigate('/gielinor-rush/active')}
          px={4}
          py={2}
          borderRadius="md"
          borderWidth="1px"
          borderColor={c.green.base}
          color={c.green.base}
          fontSize="sm"
          fontWeight="semibold"
          _hover={{ bg: 'whiteAlpha.100' }}
          transition="all 0.2s"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Box
            w="7px"
            h="7px"
            borderRadius="full"
            bg={c.green.base}
            boxShadow={`0 0 6px ${c.green.base}`}
            flexShrink={0}
            sx={{
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }}
          />
          Spectate live events
        </Box>
      )}

      <Box
        w="100%"
        borderRadius="10px"
        overflow="hidden"
        boxShadow="0 20px 60px rgba(0,0,0,0.5)"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
      >
        {/* Browser chrome bar */}
        <HStack px={3} py={2} bg="gray.800" spacing={2} flexShrink={0}>
          <Box w="10px" h="10px" borderRadius="full" bg="red.400" />
          <Box w="10px" h="10px" borderRadius="full" bg="yellow.400" />
          <Box w="10px" h="10px" borderRadius="full" bg="green.400" />
          <Box flex={1} bg="gray.700" borderRadius="4px" h="18px" mx={2} />
        </HStack>
        {/* Screenshot */}
        <Box
          maxH="320px"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Image
            src={ExampleGR}
            alt="Example Gielinor Rush event page"
            w="100%"
            display="block"
            loading="lazy"
          />
        </Box>
      </Box>

      {/* How it works — compact steps inline */}
      <SimpleGrid columns={3} spacing={3} w="100%">
        {HOW_IT_WORKS.map(({ label, desc }, i) => (
          <Box key={label} bg={c.cardBg} borderRadius="8px" p={3} textAlign="center">
            <Box
              bg={c.purple.base}
              color="white"
              borderRadius="full"
              w="26px"
              h="26px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="semibold"
              mx="auto"
              mb={2}
            >
              {i + 1}
            </Box>
            <Text fontSize="xs" fontWeight="semibold" color={c.textColor} mb={1}>
              {label}
            </Text>
            <Text
              fontSize="xs"
              color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
              lineHeight="1.5"
            >
              {desc}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <Button
        size="lg"
        leftIcon={<AddIcon />}
        bg={c.purple.base}
        color="white"
        w="100%"
        _hover={{ bg: c.purple.light, transform: 'translateY(-2px)', shadow: 'lg' }}
        _active={{ bg: c.purple.dark }}
        onClick={onCreateEventClick}
        transition="all 0.2s"
      >
        Create Your First Event
      </Button>

      {/* Collapsible guide */}
      <Box
        w="100%"
        borderWidth="1px"
        borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
        borderRadius="8px"
        overflow="hidden"
      >
        <HStack
          px={4}
          py={3}
          cursor="pointer"
          justify="space-between"
          bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
          onClick={onGuideToggle}
          _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.100' }}
        >
          <Text fontSize="sm" fontWeight="semibold" color={c.textColor}>
            📋 Detailed Setup Guide
          </Text>
          {guideOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </HStack>
        <Collapse in={guideOpen} animateOpacity>
          <Box p={4}>
            <EventCreationGuide colorMode={colorMode} currentColors={c} />
          </Box>
        </Collapse>
      </Box>
    </VStack>

    <CreateEventModal isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />
    <AuthRequiredModal
      isOpen={isAuthModalOpen}
      onClose={onAuthModalClose}
      feature="create Gielinor Rush events"
    />
  </Flex>
);

export default DashboardEmptyState;
