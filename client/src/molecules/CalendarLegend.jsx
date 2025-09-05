import { HStack, Box, Text, Wrap, WrapItem } from '@chakra-ui/react';
import theme from '../theme';

const TYPE_COLOR = {
  PVM: theme.colors.dark.red.base,
  MASS: theme.colors.dark.green.base,
  SKILLING: theme.colors.dark.sapphire.base,
  MISC: theme.colors.dark.purple.light,
  MIXED_CONTENT: theme.colors.dark.pink.dark,
};

const LABEL = {
  PVM: 'PvM',
  MASS: 'Mass',
  SKILLING: 'Skilling',
  MISC: 'Misc',
  MIXED_CONTENT: 'Mixed Content',
};

export default function CalendarLegend() {
  const entries = Object.entries(TYPE_COLOR);
  return (
    <Wrap spacing={4}>
      {entries.map(([key, color]) => (
        <WrapItem key={key}>
          <HStack>
            <Box w="12px" h="12px" borderRadius="full" bg={color} />
            <Text fontSize="sm">{LABEL[key]}</Text>
          </HStack>
        </WrapItem>
      ))}
    </Wrap>
  );
}
