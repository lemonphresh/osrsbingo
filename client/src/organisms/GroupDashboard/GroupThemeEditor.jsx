import {
  VStack, HStack, FormControl, FormLabel, Input, Button, Box, Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_GROUP_DASHBOARD } from '../../graphql/groupDashboardOperations';

export default function GroupThemeEditor({ dashboard }) {
  const theme = dashboard?.theme ?? {};
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor ?? '#7D5FFF');
  const [accentColor, setAccentColor] = useState(theme.accentColor ?? '#43AA8B');
  const [bannerUrl, setBannerUrl] = useState(theme.bannerUrl ?? '');
  const [groupIconUrl, setGroupIconUrl] = useState(theme.groupIconUrl ?? '');

  const [updateDashboard, { loading }] = useMutation(UPDATE_GROUP_DASHBOARD);

  async function handleSave() {
    await updateDashboard({
      variables: {
        id: dashboard.id,
        input: { theme: { primaryColor, accentColor, bannerUrl, groupIconUrl } },
      },
    });
  }

  return (
    <VStack spacing={5} align="stretch">
      <HStack spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">Primary Color</FormLabel>
          <HStack>
            <Box position="relative" flexShrink={0}>
              <Box
                as="label"
                htmlFor="primary-color-picker"
                w="36px" h="36px" borderRadius="md" bg={primaryColor}
                border="1px solid" borderColor="gray.500"
                cursor="pointer"
                display="block"
                _hover={{ borderColor: 'gray.300' }}
                transition="border-color 0.15s"
              />
              <input
                id="primary-color-picker"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              />
            </Box>
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#7D5FFF"
              bg="gray.800"
              borderColor="gray.600"
              fontFamily="mono"
              maxLength={7}
            />
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={1}>Used for the header color strip</Text>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">Accent Color</FormLabel>
          <HStack>
            <Box position="relative" flexShrink={0}>
              <Box
                as="label"
                htmlFor="accent-color-picker"
                w="36px" h="36px" borderRadius="md" bg={accentColor}
                border="1px solid" borderColor="gray.500"
                cursor="pointer"
                display="block"
                _hover={{ borderColor: 'gray.300' }}
                transition="border-color 0.15s"
              />
              <input
                id="accent-color-picker"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              />
            </Box>
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#43AA8B"
              bg="gray.800"
              borderColor="gray.600"
              fontFamily="mono"
              maxLength={7}
            />
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={1}>Used for progress bars</Text>
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">Group Icon URL</FormLabel>
        <Input
          value={groupIconUrl}
          onChange={(e) => setGroupIconUrl(e.target.value)}
          placeholder="https://..."
          bg="gray.800"
          borderColor="gray.600"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>Shown in the dashboard header</Text>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">Banner Image URL</FormLabel>
        <Input
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://..."
          bg="gray.800"
          borderColor="gray.600"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>Optional banner shown at the top of the public page</Text>
      </FormControl>

      <Button colorScheme="purple" size="sm" onClick={handleSave} isLoading={loading} alignSelf="flex-end">
        Save Theme
      </Button>
    </VStack>
  );
}
