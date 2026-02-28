import React from 'react';
import { Box, Button, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import StandingsCard from './StandingsCard';

const LeaderboardPanel = ({
  sortedTeams,
  event,
  currentColors,
  colorMode,
  isEventAdmin,
  onCreateTeamOpen,
  onTeamClick,
  onEditTeam,
  userDiscordId,
}) => (
  <Box
    flexShrink={0}
    flexGrow={0}
    h={['auto', 'auto', 'auto', '96%']}
    w={['100%', '100%', '100%', '340px']}
    minW={0}
    mb={[-2, -2, -2, 0]}
  >
    <HStack justify="space-between" mb={3}>
      <Heading size="sm" color={currentColors.white}>
        🏆 &nbsp;Leaderboard
      </Heading>
      {isEventAdmin && event.status === 'DRAFT' && (
        <Button
          size="xs"
          leftIcon={<AddIcon />}
          bg={currentColors.turquoise.base}
          color="white"
          _hover={{ opacity: 0.8 }}
          onClick={onCreateTeamOpen}
        >
          Add Team
        </Button>
      )}
    </HStack>

    {sortedTeams.length === 0 ? (
      <Box p={6} textAlign="center" bg={currentColors.cardBg} borderRadius="md">
        <Text color="gray.400" mb={3}>
          No teams yet.
        </Text>
        {isEventAdmin && event.status === 'DRAFT' && (
          <Button
            size="sm"
            leftIcon={<AddIcon />}
            bg={currentColors.turquoise.base}
            color="white"
            _hover={{ opacity: 0.8 }}
            onClick={onCreateTeamOpen}
          >
            Add the first team
          </Button>
        )}
      </Box>
    ) : (
      <VStack
        align="stretch"
        h="100%"
        maxH={['250px', '250px', '250px', '100%']}
        py={3}
        pl={3}
        mb="0"
        bg="whiteAlpha.100"
        borderTopLeftRadius="8px"
        borderTopRightRadius="8px"
        spacing={3}
        overflow="scroll"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#abb8ceff',
            borderRadius: '10px',
            '&:hover': {
              background: '#718096',
            },
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#abb8ceff transparent',
        }}
      >
        {sortedTeams.map((team, idx) => (
          <StandingsCard
            key={team.teamId}
            team={team}
            index={idx}
            event={event}
            currentColors={currentColors}
            colorMode={colorMode}
            onTeamClick={onTeamClick}
            onEditTeam={isEventAdmin ? onEditTeam : null}
            userDiscordId={userDiscordId}
          />
        ))}
      </VStack>
    )}
  </Box>
);

export default LeaderboardPanel;
