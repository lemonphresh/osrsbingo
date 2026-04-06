import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Divider,
  Box,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import GroupGoalBuilder from './GroupGoalBuilder';

function makeBlankGoal() {
  return {
    goalId: uuidv4(),
    type: 'boss_kc',
    metric: 'vardorvis',
    target: 1000,
    displayName: '',
    emoji: '🎯',
    enabled: true,
    order: 0,
  };
}

function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function GroupGoalEventEditor({ initialValues, onSave, onCancel, loading }) {
  const [eventName, setEventName] = useState(initialValues?.eventName ?? '');
  const [startDate, setStartDate] = useState(toInputDate(initialValues?.startDate));
  const [endDate, setEndDate] = useState(toInputDate(initialValues?.endDate));
  const [goals, setGoals] = useState(
    initialValues?.goals?.length ? initialValues.goals : [makeBlankGoal()]
  );

  function updateGoal(idx, updated) {
    setGoals((prev) => prev.map((g, i) => (i === idx ? updated : g)));
  }

  function removeGoal(idx) {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  }

  function addGoal() {
    setGoals((prev) => [...prev, { ...makeBlankGoal(), order: prev.length }]);
  }

  function handleSave() {
    if (!eventName.trim() || !startDate || !endDate) return;
    onSave({
      eventName: eventName.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      goals: goals.map((g, i) => ({ ...g, order: i })),
    });
  }

  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel fontSize="sm" color="gray.300">
          Event Name
        </FormLabel>
        <Input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="i.e. April Grind"
          bg="gray.800"
          borderColor="gray.600"
        />
      </FormControl>

      <HStack spacing={3}>
        <FormControl isRequired>
          <FormLabel fontSize="sm" color="gray.300">
            Start Date
          </FormLabel>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            bg="gray.800"
            borderColor="gray.600"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm" color="gray.300">
            End Date
          </FormLabel>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            bg="gray.800"
            borderColor="gray.600"
          />
        </FormControl>
      </HStack>

      <Divider borderColor="gray.600" />

      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={3}>
          Goals
        </Text>
        <VStack spacing={3} align="stretch">
          {goals.map((goal, idx) => (
            <GroupGoalBuilder
              key={goal.goalId}
              goal={goal}
              onChange={(updated) => updateGoal(idx, updated)}
              onRemove={() => removeGoal(idx)}
            />
          ))}
        </VStack>
        <Button
          size="sm"
          leftIcon={<AddIcon />}
          variant="ghost"
          colorScheme="purple"
          mt={3}
          onClick={addGoal}
        >
          Add Goal
        </Button>
      </Box>

      <HStack justify="flex-end" spacing={3}>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel} isDisabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          colorScheme="purple"
          onClick={handleSave}
          isLoading={loading}
          isDisabled={!eventName.trim() || !startDate || !endDate}
        >
          Save Event
        </Button>
      </HStack>
    </VStack>
  );
}
