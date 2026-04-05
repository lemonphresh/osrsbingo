import { Button, Input, VStack, Text, useToast } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { LINK_DISCORD_ACCOUNT } from '../graphql/mutations';
import { useAuth } from '../providers/AuthProvider';
import { useState } from 'react';

export default function DiscordLinkSettings({ user }) {
  const { showToast } = useToast();
  const { setUser } = useAuth();
  const [discordId, setDiscordId] = useState(user.discordUserId || '');

  const [linkDiscord] = useMutation(LINK_DISCORD_ACCOUNT, {
    onCompleted: ({ linkDiscordAccount }) => {
      const { token, user: updatedUser } = linkDiscordAccount;
      if (token) {
        localStorage.setItem('authToken', token);
        setUser(updatedUser);
      }
      showToast('Discord account linked!', 'success');
    },
  });

  return (
    <VStack>
      <Text>Link your Discord account to interact via bot</Text>
      <Input
        placeholder="Discord User ID (like dis, 123456789012345678)"
        value={discordId}
        onChange={(e) => setDiscordId(e.target.value)}
      />
      <Button
        onClick={() =>
          linkDiscord({
            variables: { userId: user.id, discordUserId: discordId },
          })
        }
      >
        Link Discord Account
      </Button>
      {user.discordUserId && (
        <Text fontSize="sm" color="green.500">
          ✅ Linked: {user.discordUserId}
        </Text>
      )}
    </VStack>
  );
}
