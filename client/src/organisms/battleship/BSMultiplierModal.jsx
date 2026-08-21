import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Box, VStack, HStack, Text, Button,
} from '@chakra-ui/react';

const MULTIPLIERS = [
  { value: 0.5,  label: '0.5×', hint: '~1 week' },
  { value: 0.75, label: '0.75×', hint: '~10 days' },
  { value: 1.0,  label: '1×',   hint: '~2 weeks' },
  { value: 1.25, label: '1.25×', hint: '~3 weeks' },
];

// Ranges are [min, max] from registry.quantities.medium.
// Easy boss (Giant Mole): {175,200}, medium (Zulrah): {80,160}, hard (Cerberus): {75,100},
// raid (CoX): {10,20}, skill (Fishing): {500k,1m}, clue (Hard): {7,12}
const EXAMPLES = [
  { label: 'Boss KC',      unit: 'kc', range: [80, 160]         },
  { label: 'Raid KC',      unit: 'kc', range: [10, 20]          },
  { label: 'Skill XP',     unit: 'xp', range: [500000, 1000000] },
  { label: 'Clue Scrolls', unit: 'kc', range: [7, 12]           },
];

function scaleOne(val, unit, mult) {
  if (unit === 'xp') return Math.ceil((val * mult) / 10000) * 10000;
  return Math.ceil((val * mult) / 10) * 10;
}

function fmtXp(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}m XP`;
  return `${Math.round(val / 1000)}k XP`;
}

function scaleRange([min, max], unit, mult) {
  const lo = scaleOne(min, unit, mult);
  const hi = scaleOne(max, unit, mult);
  if (unit === 'xp') return `${fmtXp(lo)} – ${fmtXp(hi)}`;
  return `${lo} – ${hi} kc`;
}

export default function BSMultiplierModal({ isOpen, onClose, currentMultiplier, onSave, isLoading }) {
  const [selected, setSelected] = useState(currentMultiplier ?? 1.0);

  const changed = selected !== currentMultiplier;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#0d2137" border="1px solid" borderColor="#1e4976" color="#e2e8f0" maxH="90vh">
        <ModalHeader fontFamily="mono" fontSize="sm" letterSpacing="widest" textTransform="uppercase">
          Task Difficulty / Event Length
        </ModalHeader>
        <ModalCloseButton color="#64748b" _hover={{ color: '#e2e8f0' }} />
        <ModalBody>
          <VStack align="stretch" spacing={5}>
            {/* Multiplier picker */}
            <HStack flexWrap="wrap" spacing={2}>
              {MULTIPLIERS.map(({ value, label, hint }) => {
                const active = selected === value;
                return (
                  <Button
                    key={value}
                    onClick={() => setSelected(value)}
                    size="sm"
                    fontFamily="mono"
                    fontSize="xs"
                    fontWeight="bold"
                    letterSpacing="wide"
                    bg={active ? '#0ea5e9' : '#071523'}
                    color={active ? '#071523' : '#94a3b8'}
                    border="1px solid"
                    borderColor={active ? '#0ea5e9' : '#1e4976'}
                    _hover={{ borderColor: '#0ea5e9', color: active ? '#071523' : '#e2e8f0' }}
                  >
                    {label}{' '}
                    <Box as="span" fontWeight="normal" ml={1} opacity={0.7}>{hint}</Box>
                  </Button>
                );
              })}
            </HStack>

            {/* Examples table */}
            <Box bg="#071523" border="1px solid" borderColor="#1e4976" borderRadius="md" p={4}>
              <Text fontFamily="mono" fontSize="10px" color="#64748b" letterSpacing="widest" textTransform="uppercase" mb={3}>
                Example target ranges at {selected}×
              </Text>
              <VStack align="stretch" spacing={1}>
                {EXAMPLES.map(({ label, unit, range }) => (
                  <HStack key={label} justify="space-between">
                    <Text fontFamily="mono" fontSize="xs" color="#94a3b8">{label}</Text>
                    <Text fontFamily="mono" fontSize="xs" color="#0ea5e9" fontWeight="bold">
                      {scaleRange(range, unit, selected)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Baseline note */}
            <Box bg="#071523" border="1px solid" borderColor="#1e4976" borderRadius="md" px={3} py={2}>
              <Text fontFamily="mono" fontSize="10px" color="#64748b" letterSpacing="wide">
                Baseline (1×) is estimated for two teams of 10–12 players averaging 10 hours per
                person. Adjust up or down based on your group size and commitment level.
              </Text>
            </Box>

            {/* Warning */}
            <Box bg="#0a1929" border="1px solid" borderColor="#1e3a5f" borderRadius="md" px={3} py={2}>
              <Text fontFamily="mono" fontSize="xs" color="#64748b" letterSpacing="wide">
                This rescales all task KC and XP targets. Tile positions are not changed.
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button
            size="xs" variant="ghost" color="#64748b" fontFamily="mono" fontSize="10px"
            _hover={{ color: '#e2e8f0', bg: 'transparent' }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            bg="#0ea5e9"
            color="#071523"
            fontFamily="mono"
            fontSize="10px"
            fontWeight="bold"
            letterSpacing="wider"
            textTransform="uppercase"
            isLoading={isLoading}
            isDisabled={!changed}
            onClick={() => onSave(selected)}
            _hover={{ bg: '#38bdf8' }}
            _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
          >
            Regenerate Tasks
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
