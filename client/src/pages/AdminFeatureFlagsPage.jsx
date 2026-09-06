import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { QuestionOutlineIcon, RepeatIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import usePageTitle from '../hooks/usePageTitle';
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_OVERRIDE,
  clearFeatureFlagOverrides,
  getFeatureFlagOverride,
  isEnvironmentFeatureEnabled,
  isFeatureEnabled,
  setFeatureFlagOverride,
} from '../config/featureFlags';

const OPTIONS = [
  { value: FEATURE_FLAG_OVERRIDE.DEFAULT, label: 'Environment' },
  { value: FEATURE_FLAG_OVERRIDE.ENABLED, label: 'Force on' },
  { value: FEATURE_FLAG_OVERRIDE.DISABLED, label: 'Force off' },
];

const FlagHelpTooltip = ({ flag }) => (
  <Tooltip
    hasArrow
    placement="top"
    bg="gray.700"
    color="white"
    borderRadius="md"
    px={4}
    py={3}
    maxW="380px"
    label={
      <VStack align="stretch" spacing={2}>
        <Text fontWeight="bold">Where this flag takes effect</Text>
        {flag.effects.map((effect) => (
          <HStack key={effect} align="start" spacing={2}>
            <Text aria-hidden>•</Text>
            <Text fontSize="sm" lineHeight="1.45">
              {effect}
            </Text>
          </HStack>
        ))}
      </VStack>
    }
  >
    <IconButton
      aria-label={`Explain where the ${flag.label} flag takes effect`}
      icon={<QuestionOutlineIcon />}
      size="xs"
      variant="ghost"
      color="gray.400"
      _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
    />
  </Tooltip>
);

export default function AdminFeatureFlagsPage() {
  usePageTitle('Feature Flags (Admin)');
  const { user } = useAuth();
  const [, setRevision] = useState(0);

  const rows = FEATURE_FLAGS.map((flag) => ({
    ...flag,
    environmentEnabled: isEnvironmentFeatureEnabled(flag.key),
    override: getFeatureFlagOverride(flag.key, user),
    effectiveEnabled: isFeatureEnabled(flag.key, user),
  }));

  const setOverride = (flagKey, value) => {
    setFeatureFlagOverride(flagKey, value, user);
    setRevision((current) => current + 1);
  };

  const resetAll = () => {
    clearFeatureFlagOverrides(user);
    setRevision((current) => current + 1);
  };

  return (
    <Flex flex="1" direction="column" align="center" px={[4, 6, 10]} py={[10, 14]}>
      <VStack align="stretch" spacing={6} maxW="900px" w="100%">
        <Box>
          <Flex
            justify="space-between"
            align={{ base: 'stretch', md: 'start' }}
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <Box>
              <Heading size="lg">Feature flags</Heading>
              <Text color="gray.400" mt={2} maxW="680px">
                These overrides apply only to your admin account in this browser. Environment mode
                uses the value bundled into this deployment, which is what every non-admin sees.
              </Text>
            </Box>
            <Button
              leftIcon={<RepeatIcon />}
              variant="outline"
              size="sm"
              alignSelf={{ base: 'flex-start', md: 'auto' }}
              color="gray.100"
              borderColor="gray.400"
              bg="transparent"
              _hover={{ bg: 'whiteAlpha.200', borderColor: 'gray.200' }}
              _active={{ bg: 'whiteAlpha.300' }}
              onClick={resetAll}
            >
              Reset all
            </Button>
          </Flex>
        </Box>

        {rows.map((flag) => (
          <Box
            key={flag.key}
            bg="gray.800"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="lg"
            p={[4, 5]}
          >
            <Flex
              justify="space-between"
              align={{ base: 'stretch', md: 'center' }}
              gap={4}
              direction={{ base: 'column', md: 'row' }}
            >
              <Box minW={0}>
                <HStack spacing={2} flexWrap="wrap">
                  <Heading size="sm">{flag.label}</Heading>
                  <FlagHelpTooltip flag={flag} />
                  <Badge colorScheme={flag.environmentEnabled ? 'green' : 'gray'}>
                    Environment: {flag.environmentEnabled ? 'on' : 'off'}
                  </Badge>
                  <Badge colorScheme={flag.effectiveEnabled ? 'teal' : 'red'}>
                    You see: {flag.effectiveEnabled ? 'on' : 'off'}
                  </Badge>
                </HStack>
                <Text color="gray.500" fontSize="xs" mt={2} fontFamily="mono">
                  {flag.envName}
                </Text>
              </Box>

              <ButtonGroup
                size="sm"
                isAttached
                variant="outline"
                display="flex"
                w={{ base: '100%', md: 'auto' }}
                flexShrink={0}
              >
                {OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    flex={{ base: 1, md: 'initial' }}
                    minW={{ base: 0, md: '108px' }}
                    px={{ base: 2, sm: 4 }}
                    fontSize={{ base: 'xs', sm: 'sm' }}
                    color={flag.override === option.value ? 'white' : 'gray.200'}
                    bg={flag.override === option.value ? 'purple.500' : 'transparent'}
                    borderColor={flag.override === option.value ? 'purple.400' : 'gray.500'}
                    variant={flag.override === option.value ? 'solid' : 'outline'}
                    _hover={{
                      bg: flag.override === option.value ? 'purple.400' : 'whiteAlpha.200',
                      borderColor: flag.override === option.value ? 'purple.300' : 'gray.300',
                    }}
                    _active={{
                      bg: flag.override === option.value ? 'purple.600' : 'whiteAlpha.300',
                    }}
                    onClick={() => setOverride(flag.key, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Flex>
          </Box>
        ))}
      </VStack>
    </Flex>
  );
}
