import { Box, Text, HStack } from '@chakra-ui/react';

const RANK_COLORS = ['#f5c518', '#adb5bd', '#cd7f32'];

function formatValue(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export default function GroupGoalLeaderboard({ contributors = [] }) {
  if (!contributors.length) {
    return (
      <Text fontSize="sm" color="gray.600" textAlign="center" py={4}>
        No contributions yet
      </Text>
    );
  }

  return (
    <Box>
      {contributors.map((c, i) => {
        const isTop3 = i < 3;
        const nameColor = i === 0 ? 'yellow.300' : i === 1 ? 'gray.100' : 'gray.300';

        return (
          <HStack
            key={c.rsn}
            px={1}
            py={1.5}
            borderRadius="md"
            _hover={{ bg: 'whiteAlpha.50' }}
            transition="background 0.1s"
            spacing={2}
          >
            {/* Rank */}
            <Text
              w="18px"
              fontSize="11px"
              fontWeight="bold"
              color={isTop3 ? RANK_COLORS[i] : 'gray.600'}
              textAlign="center"
              flexShrink={0}
            >
              {i + 1}
            </Text>

            {/* Name */}
            <Text
              fontSize="sm"
              fontWeight={isTop3 ? 'semibold' : 'normal'}
              color={nameColor}
              flex="1"
              minW={0}
              noOfLines={1}
            >
              {c.rsn}
            </Text>

            {/* Value */}
            <Text
              fontSize="sm"
              color="gray.300"
              fontVariantNumeric="tabular-nums"
              w="58px"
              textAlign="right"
              flexShrink={0}
            >
              {formatValue(c.value)}
            </Text>

            {/* Percent */}
            <Text
              fontSize="11px"
              color="gray.600"
              fontVariantNumeric="tabular-nums"
              w="38px"
              textAlign="right"
              flexShrink={0}
              whiteSpace="nowrap"
            >
              {c.percent.toFixed(1)}%
            </Text>
          </HStack>
        );
      })}
    </Box>
  );
}
