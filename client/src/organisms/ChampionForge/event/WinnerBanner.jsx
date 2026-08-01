import { Box, HStack, VStack, Text, Avatar, AvatarGroup, Tooltip } from '@chakra-ui/react';

export default function WinnerBanner({ event }) {
  const winnerId =
    event.bracket?.grandFinal?.winnerId ??
    event.bracket?.rounds?.slice(-1)[0]?.matches?.[0]?.winnerId;
  const winnerTeam = winnerId ? (event.teams ?? []).find((t) => t.teamId === winnerId) : null;

  return (
    <Box
      bgGradient="linear(to-r, yellow.900, purple.900)"
      border="2px solid"
      borderColor="yellow.600"
      borderRadius="xl"
      p={6}
      textAlign="center"
      boxShadow="0 0 30px rgba(214,158,46,0.25)"
    >
      <Text fontSize="4xl" mb={2}>
        🏆
      </Text>
      {winnerTeam ? (
        <>
          <Text fontSize="2xl" fontWeight="bold" color="yellow.300" mb={1}>
            {winnerTeam.teamName}
          </Text>
          <Text fontSize="sm" color="yellow.600" mb={3}>
            Champion of {event.eventName}
          </Text>
          {winnerTeam.members?.length > 0 && (
            <HStack justify="center" spacing={2}>
              <AvatarGroup size="sm" max={6}>
                {winnerTeam.members.map((m, i) => (
                  <Tooltip
                    key={m.discordId ?? i}
                    label={`${m.username ?? m.discordId}${
                      m.discordId === winnerTeam.captainDiscordId ? ' 👑' : ''
                    }`}
                    hasArrow
                  >
                    <Avatar
                      name={m.username ?? m.discordId}
                      src={
                        m.avatar
                          ? `https://cdn.discordapp.com/avatars/${m.discordId}/${m.avatar}.png`
                          : undefined
                      }
                      bg="yellow.700"
                    />
                  </Tooltip>
                ))}
              </AvatarGroup>
            </HStack>
          )}
        </>
      ) : (
        <Text fontSize="xl" color="yellow.400">
          Event Complete
        </Text>
      )}
    </Box>
  );
}
