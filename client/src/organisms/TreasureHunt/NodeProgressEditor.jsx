import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  Progress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
  useColorMode,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { UPDATE_NODE_PROGRESS } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';

const XP_STEP = 1000;

const NodeProgressEditor = ({
  eventId,
  teamId,
  nodeId,
  objectiveQuantity,
  objectiveType,
  currentProgress,
  isAdmin,
}) => {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const [value, setValue] = useState(currentProgress ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(currentProgress ?? 0);
  }, [currentProgress]);

  const [updateNodeProgress] = useMutation(UPDATE_NODE_PROGRESS);

  const step = objectiveType === 'xp_gain' ? XP_STEP : 1;
  const pct = objectiveQuantity > 0 ? Math.min(100, Math.round((value / objectiveQuantity) * 100)) : 0;
  const isDirty = value !== (currentProgress ?? 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNodeProgress({ variables: { eventId, teamId, nodeId, value } });
    } catch (err) {
      showToast(`Failed to update progress: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
  const mutedColor = colorMode === 'dark' ? 'gray.400' : 'gray.500';

  return (
    <Box
      p={3}
      bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50'}
      borderRadius="md"
      borderWidth={1}
      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="semibold" color={textColor}>
          📊 Progress
        </Text>
        <Text fontSize="xs" color={mutedColor}>
          {value.toLocaleString()} / {objectiveQuantity.toLocaleString()} ({pct}%)
        </Text>
      </HStack>

      <Progress
        value={pct}
        size="sm"
        colorScheme="green"
        borderRadius="full"
        mb={isAdmin ? 3 : 0}
        bg={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      />

      {isAdmin && (
        <VStack spacing={2} align="stretch">
          <Slider
            min={0}
            max={objectiveQuantity}
            step={step}
            value={value}
            onChange={(v) => setValue(v)}
            focusThumbOnChange={false}
          >
            <SliderTrack bg={colorMode === 'dark' ? 'gray.700' : 'gray.200'}>
              <SliderFilledTrack bg="green.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>

          <HStack>
            <NumberInput
              min={0}
              max={objectiveQuantity}
              value={value}
              onChange={(_, v) => {
                if (!isNaN(v)) setValue(Math.max(0, Math.min(v, objectiveQuantity)));
              }}
              size="sm"
              flex={1}
            >
              <NumberInputField
                bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                color={textColor}
                borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.300'}
              />
            </NumberInput>
            <Button
              size="sm"
              colorScheme="blue"
              isLoading={saving}
              isDisabled={!isDirty}
              onClick={handleSave}
            >
              Save
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default NodeProgressEditor;
