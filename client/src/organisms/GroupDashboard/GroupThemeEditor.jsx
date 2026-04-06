import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Text,
  Image,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_GROUP_DASHBOARD } from '../../graphql/groupDashboardOperations';

function ThemePreview({ groupName, primaryColor, accentColor, bannerUrl, groupIconUrl }) {
  return (
    <Box
      bg="gray.850"
      border="1px solid"
      borderColor="gray.600"
      borderRadius="lg"
      overflow="hidden"
    >
      <Text
        fontSize="xs"
        color="gray.500"
        px={3}
        pt={2}
        pb={1}
        textTransform="uppercase"
        letterSpacing="wider"
        fontWeight="semibold"
      >
        Preview
      </Text>

      {/* Banner */}
      {bannerUrl && (
        <Box h="80px" overflow="hidden">
          <Image src={bannerUrl} alt="" w="full" h="full" objectFit="cover" />
        </Box>
      )}

      {/* Header */}
      <Box px={4} pt={3} pb={3} borderBottom="1px solid" borderColor="gray.700">
        <HStack spacing={3} align="center">
          {groupIconUrl && (
            <Box
              flexShrink={0}
              borderRadius="md"
              overflow="hidden"
              border="2px solid"
              borderColor={primaryColor}
              boxShadow={`0 0 10px ${primaryColor}55`}
            >
              <Image src={groupIconUrl} alt="" boxSize="40px" objectFit="cover" display="block" />
            </Box>
          )}
          <VStack align="flex-start" spacing={0.5}>
            <Text fontSize="lg" fontWeight="extrabold" color="white" lineHeight="1.1">
              {groupName || 'Your Group Name'}
            </Text>
            <HStack spacing={2}>
              <Box w="2px" h="12px" bg={primaryColor} borderRadius="full" />
              <Text fontSize="xs" color="gray.400">
                April Event
              </Text>
              <Box
                px={1.5}
                py={0.5}
                bg={`${accentColor}22`}
                border="1px solid"
                borderColor={`${accentColor}66`}
                borderRadius="sm"
              >
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  color={accentColor}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Active
                </Text>
              </Box>
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Sample goal card */}
      <Box px={4} py={3}>
        <Box
          bg="gray.800"
          border="2px solid"
          borderColor={accentColor}
          borderRadius="md"
          overflow="hidden"
        >
          <HStack px={4} pt={3} pb={2} justify="space-between">
            <HStack spacing={2}>
              <Text fontSize="lg" lineHeight="1">
                ⚔️
              </Text>
              <Text fontWeight="bold" color="white" fontSize="sm">
                5,000 Vardorvis KC
              </Text>
            </HStack>
            <Box
              px={2}
              py={0.5}
              bg="gray.700"
              border="1px solid"
              borderColor="gray.600"
              borderRadius="md"
            >
              <Text fontSize="xs" fontWeight="bold" color="gray.200">
                62%
              </Text>
            </Box>
          </HStack>
          <Box px={4} pb={3}>
            <Box
              bg="#111"
              borderRadius={4}
              h="10px"
              overflow="hidden"
              border="1px solid #333"
              mb={1.5}
            >
              <Box
                h="full"
                w="62%"
                bg={accentColor}
                borderRadius={4}
                boxShadow={`0 0 6px ${accentColor}88`}
              />
            </Box>
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.500">
                3,100 gained
              </Text>
              <Text fontSize="xs" color="gray.500">
                target: 5,000
              </Text>
            </HStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

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
      <ThemePreview
        groupName={dashboard?.groupName}
        primaryColor={primaryColor}
        accentColor={accentColor}
        bannerUrl={bannerUrl}
        groupIconUrl={groupIconUrl}
      />
      <HStack spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">
            Primary Color
          </FormLabel>
          <HStack>
            <Box position="relative" flexShrink={0}>
              <Box
                as="label"
                htmlFor="primary-color-picker"
                w="36px"
                h="36px"
                borderRadius="md"
                bg={primaryColor}
                border="1px solid"
                borderColor="gray.500"
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
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
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
          <Text fontSize="xs" color="gray.500" mt={1}>
            Used for the header color strip
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="gray.300">
            Accent Color
          </FormLabel>
          <HStack>
            <Box position="relative" flexShrink={0}>
              <Box
                as="label"
                htmlFor="accent-color-picker"
                w="36px"
                h="36px"
                borderRadius="md"
                bg={accentColor}
                border="1px solid"
                borderColor="gray.500"
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
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
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
          <Text fontSize="xs" color="gray.500" mt={1}>
            Used for progress bars
          </Text>
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">
          Group Icon URL
        </FormLabel>
        <Input
          value={groupIconUrl}
          onChange={(e) => setGroupIconUrl(e.target.value)}
          placeholder="https://..."
          bg="gray.800"
          borderColor="gray.600"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Shown in the dashboard header. Square image, recommended 128x128px or larger. Use a direct link from Imgur, Gyazo or Discord — some hosts block external embeds.
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" color="gray.300">
          Banner Image URL
        </FormLabel>
        <Input
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://..."
          bg="gray.800"
          borderColor="gray.600"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Optional banner at the top of the public page. Recommended 1200x300px or similar wide crop. Use a direct link from Imgur, Gyazo or Discord.
        </Text>
      </FormControl>

      <Button
        colorScheme="purple"
        size="sm"
        onClick={handleSave}
        isLoading={loading}
        alignSelf="flex-end"
      >
        Save Theme
      </Button>
    </VStack>
  );
}
