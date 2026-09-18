import React from 'react';
import { Badge, Box, Text, Wrap, WrapItem } from '@chakra-ui/react';

export function BSAcceptedDrops({ validDrops = [], accentColor = '#4ade80' }) {
  const drops = Array.isArray(validDrops) ? validDrops.filter(Boolean) : [];
  if (drops.length === 0) return null;

  return (
    <Box
      bg="rgba(255,255,255,0.025)"
      border="1px solid"
      borderColor="#1a4028"
      borderRadius="md"
      px={3}
      py={2}
      mb={3}
    >
      <Text
        fontFamily="mono"
        fontSize="9px"
        color={accentColor}
        letterSpacing="widest"
        textTransform="uppercase"
        mb={1}
      >
        Accepted drops ({drops.length})
      </Text>
      <Text fontFamily="mono" fontSize="9px" color="#6b9e78" mb={2}>
        These are the items that count toward this task.
      </Text>
      <Box
        maxH="124px"
        overflowY="auto"
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#1a4028', borderRadius: '2px' },
          scrollbarWidth: 'thin',
          scrollbarColor: '#1a4028 transparent',
        }}
      >
        <Wrap spacing={1.5}>
          {drops.map((drop, index) => (
            <WrapItem key={`${drop}-${index}`}>
              <Badge
                bg="#102619"
                border="1px solid"
                borderColor="#285236"
                color="#b7dfc1"
                fontFamily="mono"
                fontSize="9px"
                fontWeight="normal"
                textTransform="none"
                whiteSpace="normal"
                px={2}
                py={1}
              >
                {drop}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    </Box>
  );
}
