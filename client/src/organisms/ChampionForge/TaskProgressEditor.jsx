import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react';
import { useToastContext } from '../../providers/ToastProvider';
import { SET_TASK_PROGRESS } from '../../graphql/clanWarsOperations';

// Admin-only slider/input to set numeric progress toward a task
export default function TaskProgressEditor({
  eventId,
  teamId,
  taskId,
  quantity,
  currentProgress,
  isAdmin,
  onSaved,
}) {
  const { showToast } = useToastContext();
  const [value, setValue] = useState(currentProgress ?? 0);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setValue(currentProgress ?? 0);
  }, [currentProgress]);

  const [setTaskProgressMutation] = useMutation(SET_TASK_PROGRESS, {
    onError: (err) => showToast(err.message, 'error'),
  });

  const isDirty = value !== (currentProgress ?? 0);
  const pct = quantity > 0 ? Math.min(100, Math.round((value / quantity) * 100)) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await setTaskProgressMutation({ variables: { eventId, teamId, taskId, value } });
      onSaved?.();
      showToast('Progress saved', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={3} bg="whiteAlpha.50" borderRadius="md" border="1px solid" borderColor="gray.600">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="semibold" color="white">
          📊 Progress
        </Text>
        <Text fontSize="xs" color="gray.400">
          {quantity > 0
            ? `${value.toLocaleString()} / ${quantity.toLocaleString()} (${pct}%)`
            : value.toLocaleString()}
        </Text>
      </HStack>

      {isAdmin && quantity > 0 && (
        <VStack spacing={2} align="stretch">
          <Slider
            min={0}
            max={quantity}
            step={1}
            value={value}
            onChange={(v) => setValue(v)}
            focusThumbOnChange={false}
          >
            <SliderTrack bg="gray.700">
              <SliderFilledTrack bg="green.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Button
            size="sm"
            colorScheme="blue"
            isLoading={saving}
            isDisabled={!isDirty}
            onClick={handleSave}
            alignSelf="flex-end"
          >
            Save
          </Button>
        </VStack>
      )}
    </Box>
  );
}
