import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Divider,
} from '@chakra-ui/react';
import theme from '../theme';
import { DeleteIcon } from '@chakra-ui/icons';

const TYPE_LABEL = {
  PVM: 'PvM',
  MASS: 'Mass',
  SKILLING: 'Skilling',
  MISC: 'Misc',
  MIXED_CONTENT: 'Mixed Content',
};

const TYPE_COLOR = {
  PVM: theme.colors.dark.red.base,
  MASS: theme.colors.dark.green.base,
  SKILLING: theme.colors.dark.sapphire.base,
  MISC: theme.colors.dark.purple.light,
  MIXED_CONTENT: theme.colors.dark.pink.dark,
};

export default function SavedEventsPanel({ items, onRestore, onView, onDelete }) {
  return (
    <Box minWidth="600px" maxW="800px" mt={16} mx="auto">
      <Heading size="md" mb={3}>
        Saved for later
      </Heading>

      <VStack
        backgroundColor={theme.colors.dark.turquoise.dark}
        padding="12px"
        borderRadius="6px"
        align="stretch"
        spacing={3}
      >
        {items.length === 0 && <Text color="gray.400">No saved events.</Text>}

        {items.map((e) => (
          <Box
            backgroundColor={theme.colors.dark.turquoise.base}
            key={e.id || e._tempId}
            p={3}
            borderRadius="md"
          >
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">{e.title}</Text>
                {e.eventType && (
                  <Badge backgroundColor={TYPE_COLOR[e.eventType] || undefined} color="white">
                    {TYPE_LABEL[e.eventType] || e.eventType}
                  </Badge>
                )}
              </VStack>

              <ButtonGroup size="sm" spacing={2}>
                <Button
                  backgroundColor={theme.colors.dark.turquoise.light}
                  onClick={() => onView && onView(e)}
                >
                  View details
                </Button>
                <Button backgroundColor={theme.colors.white} onClick={() => onRestore(e)}>
                  Add back
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    if (window.confirm('Delete this saved event? This cannot be undone.')) {
                      onDelete?.(e);
                    }
                  }}
                >
                  <DeleteIcon />
                </Button>
              </ButtonGroup>
            </HStack>
          </Box>
        ))}
      </VStack>

      <Divider mt={4} />
    </Box>
  );
}
