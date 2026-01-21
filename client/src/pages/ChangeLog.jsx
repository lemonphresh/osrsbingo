import React from 'react';
import { Link as ChakraLink, Image, Text, Box, Badge, VStack, HStack } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GnomeChild from '../assets/gnomechild-small.webp';
import {
  FaRocket,
  FaBug,
  FaStar,
  FaGamepad,
  FaPalette,
  FaShieldAlt,
  FaSearch,
  FaGripHorizontal,
  FaUserFriends,
  FaFlag,
} from 'react-icons/fa';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';

// Changelog data - newest first, parsed from git history
const CHANGELOG_ENTRIES = [
  {
    version: '2.1.0',
    date: 'January 2026',
    title: 'Polish & Performance',
    type: 'improvement',
    icon: FaRocket,
    highlights: [
      'Added Support page',
      'Major performance improvements to queries and mutations',
      'Added comprehensive test coverage',
      'PWA support...add the site to your home screen!',
      'Revamped landing page design',
      'Added Privacy Policy, Terms of Service, and About pages',
      'Event password to help with screenshot verification on Gielinor Rush competitions',
      'Discord user verification with Discord IDs',
      'Backend icon caching and memory optimizations',
      'Improved map node generation logic',
    ],
  },
  {
    version: '2.0.0',
    date: 'October - December 2025',
    title: 'Gielinor Rush 🎉',
    type: 'major',
    icon: FaGamepad,
    details:
      "A big one! Months of work building an entirely new competitive game mode. Generate unique maps, form teams, and race your clanmates through OSRS objectives. This was a massive undertaking and I'm so hyped it's finally here.",
    highlights: [
      'Brand new Treasure Hunt / Gielinor Rush game mode',
      'Procedurally generated maps with branching paths',
      'Team-based competitions with real-time progress tracking',
      'Buff system with strategic power-ups',
      'Inn nodes for rest and resource management',
      'Victory celebrations with confetti 🎊',
      'Admin walkthrough panels for event management',
      'Live activity feed with WebSocket updates',
      'Discord bot integration for team coordination',
      'Submission review system with approve/deny workflow',
      'Content selection! Customize which bosses, skills, etc. appear',
      'Interactive tutorial for new players',
    ],
  },
  {
    version: '1.5.0',
    date: 'July 2025',
    title: 'Wiki Integration Update',
    type: 'improvement',
    icon: FaSearch,
    highlights: [
      'Updated item endpoint to use OSRS Wiki API',
      'More reliable item icons (though not always perfect inventory sprites now)',
      'Pinned Node.js version for stability',
    ],
  },
  {
    version: '1.4.0',
    date: 'February 2025',
    title: 'Scoring Fixes',
    type: 'fix',
    icon: FaBug,
    highlights: [
      'Fixed scoring calculations for bingo boards',
      'Corrected verbiage throughout the app',
    ],
  },
  {
    version: '1.3.0',
    date: 'January 2025',
    title: 'Privacy & Access Controls',
    type: 'feature',
    icon: FaShieldAlt,
    highlights: [
      'Users can now view their own private boards (oops, that was a bug)',
      'Fixed navigation for non-editors on private boards',
      'Admin-only public boards list',
      'Better redirect handling for unauthorized access',
    ],
  },
  {
    version: '1.2.0',
    date: 'January 2025',
    title: 'Drag & Drop + UX Polish',
    type: 'feature',
    icon: FaGripHorizontal,
    highlights: [
      'Drag and drop tile reordering!',
      'Login prompt when trying to duplicate while unauthenticated',
      'Fixed button colors on alert modals',
    ],
  },
  {
    version: '1.1.0',
    date: 'December 2024',
    title: 'Themes & Customization',
    type: 'feature',
    icon: FaPalette,
    highlights: [
      'Color schemes/themes for bingo boards',
      'Extended auth token from 1 day to 7 days (less re-logging!)',
      'Fixed All Boards view when no boards exist',
      'Shuffle button now only available in edit mode',
    ],
  },
  {
    version: '1.0.5',
    date: 'December 2024',
    title: 'Admin Powers & Board Sizes',
    type: 'feature',
    icon: FaShieldAlt,
    highlights: [
      'Swap between 5x5 and 7x7 board sizes',
      'Admins can now edit any board',
      'Admin power to delete users (for moderation)',
      'Mobile layout fixes',
    ],
  },
  {
    version: '1.0.0',
    date: 'December 2024',
    title: 'Featured Boards & Discovery',
    type: 'feature',
    icon: FaStar,
    highlights: [
      'Featured boards list on homepage',
      'Display names for users',
      'Filters and search on All Boards page',
      'Admin toggle for board visibility',
      'SEO improvements with proper metadata',
    ],
  },
  {
    version: '0.9.0',
    date: 'December 2024',
    title: 'Editor Invitations',
    type: 'feature',
    icon: FaUserFriends,
    highlights: [
      'Invite others to edit your boards',
      'Remove individual editors from list',
      'Updated FAQ with new features',
    ],
  },
  {
    version: '0.8.0',
    date: 'December 2024',
    title: 'Points & Bonuses System',
    type: 'feature',
    icon: FaStar,
    highlights: [
      'Complete point system for competitive scoring',
      'Bonus system with clearer explanations',
      'Base tile value input when creating boards',
    ],
  },
  {
    version: '0.5.0',
    date: 'November - December 2024',
    title: 'Core Bingo Features',
    type: 'feature',
    icon: FaFlag,
    highlights: [
      'Duplicate bingo boards',
      'Edit mode for board details',
      'Public/private board toggle',
      'Timestamps for tile completions',
      'Delete boards',
      'Add and remove editors',
    ],
  },
  {
    version: '0.1.0',
    date: 'November 2024',
    title: 'Initial Launch 🚀',
    type: 'major',
    icon: FaRocket,
    details:
      'Where it all began! Basic bingo board functionality, user authentication, and a dream. Built this for my clan and figured others might want it too.',
    highlights: [
      'User authentication (login/signup)',
      'Create bingo boards (5x5 and 7x7)',
      '25/49 tiles auto-created per board',
      'Public user profiles',
      'FAQ page',
      'Basic landing page',
    ],
  },
];

const getTypeColor = (type) => {
  switch (type) {
    case 'major':
      return 'purple';
    case 'feature':
      return 'green';
    case 'fix':
      return 'orange';
    case 'improvement':
      return 'blue';
    default:
      return 'gray';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'major':
      return 'Major Release';
    case 'feature':
      return 'New Feature';
    case 'fix':
      return 'Bug Fix';
    case 'improvement':
      return 'Improvement';
    default:
      return 'Update';
  }
};

const ChangelogEntry = ({ entry, isLatest }) => {
  const IconComponent = entry.icon || FaBug;

  return (
    <Box
      position="relative"
      pl={8}
      pb={8}
      borderLeft="2px solid"
      borderColor={isLatest ? '#F4D35E' : 'rgba(255,255,255,0.1)'}
      _last={{ borderColor: 'transparent', pb: 0 }}
    >
      {/* Timeline dot */}
      <Box
        position="absolute"
        left="-11px"
        top="0"
        w="20px"
        h="20px"
        borderRadius="full"
        bg={isLatest ? '#F4D35E' : 'rgba(255,255,255,0.15)'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="2px solid"
        borderColor={isLatest ? '#F4D35E' : 'rgba(255,255,255,0.1)'}
      >
        <IconComponent size={10} color={isLatest ? '#1a1a2e' : '#a0aec0'} />
      </Box>

      {/* Content */}
      <VStack align="start" spacing={3}>
        <HStack spacing={3} flexWrap="wrap">
          <Badge
            bg={`${getTypeColor(entry.type)}.500`}
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
          >
            {getTypeLabel(entry.type)}
          </Badge>
          <Text fontSize="sm" color="rgba(255,255,255,0.5)">
            v{entry.version} • {entry.date}
          </Text>
        </HStack>

        <Text fontSize="xl" fontWeight="bold" color="white">
          {entry.title}
        </Text>

        {entry.details && (
          <Text fontSize="sm" color="rgba(255,255,255,0.7)" lineHeight="1.7">
            {entry.details}
          </Text>
        )}

        <VStack align="start" spacing={2} pl={4} w="100%">
          {entry.highlights.map((highlight, idx) => (
            <HStack key={idx} align="start" spacing={2}>
              <Text color="#F4D35E" fontSize="sm">
                •
              </Text>
              <Text fontSize="sm" color="rgba(255,255,255,0.8)">
                {highlight}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};

export default function ChangelogPage() {
  usePageTitle('Changelog');

  return (
    <Box
      fontFamily="system-ui, sans-serif"
      bg="linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)"
      minH="100vh"
      py={16}
      px={[4, 9]}
      color="#e2e8f0"
    >
      <Section flexDirection="column" style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <VStack spacing={4} mb={10} align="start">
          <HStack alignItems="center" spacing={3} w="100%" justifyContent="center">
            <GemTitle>Changelog</GemTitle>
          </HStack>
          <Text color="rgba(255,255,255,0.6)" fontSize="sm" lineHeight="1.6">
            The complete history of OSRS Bingo Hub, from the first commit to today. (This is for the
            curious souls who want to see how the project has evolved over time.)
          </Text>
        </VStack>

        {/* Latest release callout */}
        <Box
          bg="rgba(244, 211, 94, 0.1)"
          border="1px solid rgba(244, 211, 94, 0.3)"
          borderRadius="lg"
          p={5}
          mb={10}
        >
          <HStack spacing={2} mb={2}>
            <FaRocket color="#F4D35E" />
            <Text fontWeight="bold" color="#F4D35E" fontSize="sm">
              LATEST MAJOR RELEASE
            </Text>
          </HStack>
          <Text color="white" fontWeight="bold" fontSize="lg">
            Gielinor Rush is here!
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontSize="sm" mt={2} lineHeight="1.6">
            The new competitive game mode is finally live. Create maps, form teams, and race your
            clanmates through OSRS challenges. Months of work went into this one.
          </Text>
          <ChakraLink
            href="/treasure-hunt"
            display="inline-flex"
            alignItems="center"
            gap={2}
            bg="#F4D35E"
            color="#1a1a1a"
            px={4}
            py={2}
            borderRadius="md"
            fontWeight={600}
            fontSize="sm"
            mt={4}
            _hover={{ bg: '#e5c654', textDecoration: 'none' }}
          >
            <FaGamepad /> Try Gielinor Rush
          </ChakraLink>
        </Box>

        {/* Stats */}
        <HStack
          spacing={[4, 8]}
          mb={10}
          p={4}
          bg="rgba(255,255,255,0.05)"
          borderRadius="lg"
          justify="center"
          flexWrap="wrap"
        >
          <VStack spacing={0}>
            <Text fontSize={['xl', '2xl']} fontWeight="bold" color="#F4D35E">
              14+
            </Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.5)">
              months
            </Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontSize={['xl', '2xl']} fontWeight="bold" color="#F4D35E">
              200+
            </Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.5)">
              commits
            </Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontSize={['xl', '2xl']} fontWeight="bold" color="#F4D35E">
              1
            </Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.5)">
              goblin dev
            </Text>
          </VStack>
        </HStack>

        {/* Timeline */}
        <VStack align="stretch" spacing={0}>
          {CHANGELOG_ENTRIES.map((entry, idx) => (
            <ChangelogEntry key={entry.version} entry={entry} isLatest={idx === 0} />
          ))}
        </VStack>

        {/* Footer */}
        <VStack spacing={4} mt={12} align="start">
          <Box
            p={4}
            bg="rgba(255,255,255,0.05)"
            borderRadius="lg"
            borderLeft="3px solid"
            borderColor="rgba(255,255,255,0.2)"
          >
            <Text fontSize="sm" color="rgba(255,255,255,0.6)" lineHeight="1.6">
              Want to request a feature or report a bug? Hit me up on Discord.
            </Text>
          </Box>
          <HStack spacing={2} pt={4}>
            <Image aria-hidden height="32px" src={GnomeChild} width="32px" />
            <Text fontSize="xs" color="rgba(255,255,255,0.35)">
              — Lemon (RSN: butt looker)
            </Text>
          </HStack>
        </VStack>
      </Section>
    </Box>
  );
}
