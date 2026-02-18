import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Divider,
  useColorMode,
  Tooltip,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

export function StoryLayout({ title, description, tags = [], children }) {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'dark' ? 'gray.750' : 'gray.50';
  const border = colorMode === 'dark' ? 'gray.600' : 'gray.200';

  return (
    <Box borderWidth={1} borderColor={border} borderRadius="lg" overflow="hidden" bg={bg}>
      <Box px={4} py={3} borderBottomWidth={1} borderColor={border}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0}>
            <Text
              fontWeight="bold"
              fontSize="sm"
              color={colorMode === 'dark' ? 'white' : 'gray.800'}
            >
              {title}
            </Text>
            {description && (
              <Text fontSize="xs" color="gray.500" mt={0.5}>
                {description}
              </Text>
            )}
          </VStack>
          {tags.length > 0 && (
            <HStack spacing={1} flexWrap="wrap" justify="end">
              {tags.map((tag) => (
                <Badge key={tag} fontSize="xs" colorScheme={tagColor(tag)}>
                  {tag}
                </Badge>
              ))}
            </HStack>
          )}
        </HStack>
      </Box>
      <Box p={4}>{children}</Box>
    </Box>
  );
}

function tagColor(tag) {
  const map = {
    'happy path': 'green',
    'error state': 'red',
    'empty state': 'gray',
    admin: 'purple',
    member: 'blue',
    'non-member': 'orange',
    new: 'teal',
    buff: 'yellow',
  };
  return map[tag.toLowerCase()] || 'gray';
}

export function StoryPage({ title, description, children }) {
  const { colorMode } = useColorMode();
  return (
    <Box>
      <VStack align="start" spacing={1} mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.900'}>
          {title}
        </Text>
        {description && (
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        )}
      </VStack>
      <VStack align="stretch" spacing={4}>
        {children}
      </VStack>
    </Box>
  );
}

export function DebugShell({ stories, activeId, onSelect, children }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const sidebarBg = colorMode === 'dark' ? 'gray.800' : 'white';
  const activeBg = colorMode === 'dark' ? 'whiteAlpha.200' : 'blue.50';
  const hoverBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100';
  const border = colorMode === 'dark' ? 'gray.700' : 'gray.200';

  const grouped = stories.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <HStack align="stretch" spacing={0} minH="100vh">
      {/* Sidebar */}
      <Box
        w="240px"
        flexShrink={0}
        bg={sidebarBg}
        borderRightWidth={1}
        borderColor={border}
        py={4}
        position="sticky"
        top={0}
        h="100vh"
        overflowY="auto"
      >
        <VStack align="stretch" spacing={0}>
          <HStack px={4} pb={3} justify="space-between">
            <VStack align="start" spacing={0}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={colorMode === 'dark' ? 'white' : 'gray.900'}
              >
                🧪 Debug
              </Text>
              <Text fontSize="xs" color="gray.500">
                Component Library
              </Text>
            </VStack>
            <Tooltip label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}>
              <Button size="xs" variant="ghost" onClick={toggleColorMode} px={1}>
                {colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
              </Button>
            </Tooltip>
          </HStack>

          <Divider />

          {Object.entries(grouped).map(([category, items]) => (
            <Box key={category} mt={3}>
              <Text
                px={4}
                pb={1}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="gray.500"
              >
                {category}
              </Text>
              {items.map((story) => (
                <Box
                  key={story.id}
                  px={4}
                  py={2}
                  cursor="pointer"
                  bg={activeId === story.id ? activeBg : 'transparent'}
                  borderLeftWidth={3}
                  borderLeftColor={activeId === story.id ? 'blue.400' : 'transparent'}
                  _hover={{ bg: activeId === story.id ? activeBg : hoverBg }}
                  onClick={() => onSelect(story.id)}
                  transition="all 0.1s"
                >
                  <Text
                    fontSize="sm"
                    fontWeight={activeId === story.id ? 'semibold' : 'normal'}
                    color={
                      activeId === story.id
                        ? colorMode === 'dark'
                          ? 'blue.200'
                          : 'blue.700'
                        : colorMode === 'dark'
                        ? 'gray.200'
                        : 'gray.700'
                    }
                  >
                    {story.label}
                  </Text>
                  {story.scenarioCount && (
                    <Text fontSize="xs" color="gray.500">
                      {story.scenarioCount} scenarios
                    </Text>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Main content — children rendered here, not a dead placeholder */}
      <Box flex={1} overflowY="auto" bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}>
        <HStack justify="end" px={8} pt={4}>
          <Badge colorScheme="yellow" fontSize="xs">
            {process.env.NODE_ENV}
          </Badge>
        </HStack>
        <Box px={8} pb={8}>
          {children}
        </Box>
      </Box>
    </HStack>
  );
}
