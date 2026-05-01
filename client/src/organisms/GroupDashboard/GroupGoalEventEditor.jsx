import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Text,
  Divider,
  Box,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import GroupGoalBuilder from './GroupGoalBuilder';
import TimezoneToggle from '../../atoms/TimezoneToggle';

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

// Convert a stored UTC ISO string → local datetime-local input value (YYYY-MM-DDTHH:MM)
function toInputDatetime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Get local UTC offset label e.g. "UTC-7" or "UTC+5:30"
function localUtcLabel() {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m ? `UTC${sign}${h}:${String(m).padStart(2, '0')}` : `UTC${sign}${h}`;
}

export default function GroupGoalEventEditor({ initialValues, onSave, onCancel, loading, templates = [] }) {
  const [eventName, setEventName] = useState(initialValues?.eventName ?? '');
  const [startDate, setStartDate] = useState(toInputDatetime(initialValues?.startDate));
  const [endDate, setEndDate] = useState(toInputDatetime(initialValues?.endDate));
  const [goals, setGoals] = useState(
    initialValues?.goals?.length ? initialValues.goals : [makeBlankGoal()]
  );
  const [selectedTemplate, setSelectedTemplate] = useState('');

  function updateGoal(idx, updated) {
    setGoals((prev) => prev.map((g, i) => (i === idx ? updated : g)));
  }

  function removeGoal(idx) {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  }

  function addGoal() {
    setGoals((prev) => [...prev, { ...makeBlankGoal(), order: prev.length }]);
  }

  // datetime-local strings are parsed as local time (no Z), so .toISOString() gives correct UTC
  const dateRangeInvalid = startDate && endDate && new Date(endDate) <= new Date(startDate);

  function handleSave() {
    if (!eventName.trim() || !startDate || !endDate || dateRangeInvalid) return;
    onSave({
      eventName: eventName.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      goals: goals.map((g, i) => ({ ...g, order: i })),
    });
  }

  return (
    <VStack spacing={4} align="stretch">
      {templates.length > 0 && (
        <HStack spacing={2} pb={1}>
          <Text fontSize="xs" color="gray.500" flexShrink={0}>
            Load template:
          </Text>
          <Select
            size="sm"
            flex={1}
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              if (e.target.value) {
                const tpl = templates.find((t) => t.name === e.target.value);
                if (tpl) setGoals(tpl.goals.map((g, i) => ({ ...g, order: i })));
              }
            }}
            bg="gray.800"
            color="gray.100"
            borderColor="gray.600"
          >
            <option value="" style={{ background: '#1A202C', color: '#E2E8F0' }}>— select —</option>
            {templates.map((t) => (
              <option key={t.name} value={t.name} style={{ background: '#1A202C', color: '#E2E8F0' }}>
                {t.name}
              </option>
            ))}
          </Select>
        </HStack>
      )}
      <FormControl isRequired>
        <FormLabel fontSize="sm" color="gray.300">
          Event Name
        </FormLabel>
        <Input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="i.e. Springtime Skilling Showdown"
          bg="gray.800"
          borderColor="gray.600"
        />
      </FormControl>

      <Box>
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" color="gray.300" fontWeight="medium">
            Event Dates
          </Text>
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.500">{localUtcLabel()}</Text>
            <TimezoneToggle />
          </HStack>
        </HStack>
        <Text fontSize="xs" color="gray.500" mb={3}>
          Times are in your local timezone. Use the toggle above to display dates in UTC.
        </Text>
        <HStack spacing={3}>
          <FormControl isRequired>
            <FormLabel fontSize="xs" color="gray.400">
              Start
            </FormLabel>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              bg="gray.800"
              borderColor="gray.600"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel fontSize="xs" color="gray.400">
              End
            </FormLabel>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              bg="gray.800"
              borderColor="gray.600"
            />
          </FormControl>
        </HStack>
      </Box>

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
          Add Another Goal
        </Button>
      </Box>

      <HStack justify="flex-end" spacing={3}>
        {onCancel && (
          <Button size="sm" variant="ghost" colorScheme="gray" color="gray.300" onClick={onCancel} isDisabled={loading}>
            Cancel
          </Button>
        )}
        {dateRangeInvalid && (
          <Text fontSize="xs" color="red.400">End date must be after start date.</Text>
        )}
        <Button
          size="sm"
          colorScheme="purple"
          onClick={handleSave}
          isLoading={loading}
          isDisabled={!eventName.trim() || !startDate || !endDate || dateRangeInvalid}
        >
          Save Event
        </Button>
      </HStack>
    </VStack>
  );
}
