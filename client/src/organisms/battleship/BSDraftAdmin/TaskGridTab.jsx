import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { SET_BS_SHIP_TEMPLATE, UPDATE_BS_TASK } from '../../../graphql/bsOperations';
import { useToastContext } from '../../../providers/ToastProvider';
import {
  COL_LABELS,
  SHIP_CONFIGS,
  SHIP_COLORS,
  DRAFT_OCEAN_CELLS,
  formatMetricLabel,
  metricUnitFor,
  getContentCategory,
  groupedBossSkillOptions,
  metricOptionsForCategory,
} from '../../../utils/battleship/bsClientHelpers';

export function TaskGridTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const tasks = event.tasks ?? [];
  const shipTemplates = event.shipTemplates ?? [];

  const [sel, setSel] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editBossOrSkill, setEditBossOrSkill] = useState('');
  const [editMetricType, setEditMetricType] = useState('kc');
  const [editMetricTarget, setEditMetricTarget] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  const templateMap = useMemo(() => {
    const m = {};
    for (const t of shipTemplates) m[`${t.shipType}:${t.cellIndex}`] = t;
    return m;
  }, [shipTemplates]);

  const templateTaskIds = useMemo(
    () => new Set(shipTemplates.map((t) => t.taskId)),
    [shipTemplates]
  );
  const oceanTasks = useMemo(
    () => tasks.filter((t) => !templateTaskIds.has(t.taskId)),
    [tasks, templateTaskIds]
  );

  // Shuffled display order — randomised on load and on demand
  const [displayOceanTasks, setDisplayOceanTasks] = useState([]);
  useEffect(() => {
    setDisplayOceanTasks([...oceanTasks].sort(() => Math.random() - 0.5));
  }, [oceanTasks]);

  const handleRandomize = () => {
    setDisplayOceanTasks((prev) => [...prev].sort(() => Math.random() - 0.5));
    setSel(null);
  };

  const oceanCellTaskMap = useMemo(() => {
    const m = {};
    DRAFT_OCEAN_CELLS.forEach((cell, i) => {
      if (displayOceanTasks[i]) m[`${cell.row}-${cell.col}`] = displayOceanTasks[i];
    });
    return m;
  }, [displayOceanTasks]);

  const contentLookup = useMemo(() => {
    const m = new Map();
    for (const t of tasks) {
      const name = t.bossOrSkill ?? t.label;
      if (!m.has(name)) m.set(name, t);
    }
    return m;
  }, [tasks]);

  const groupedOptions = useMemo(() => groupedBossSkillOptions(tasks), [tasks]);

  const [setBSShipTemplate, { loading: settingTemplate }] = useMutation(SET_BS_SHIP_TEMPLATE, {
    onCompleted: () => {
      showToast('Ship cell updated.', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to assign.', 'error'),
  });

  const [updateBSTask, { loading: updatingTask }] = useMutation(UPDATE_BS_TASK, {
    onCompleted: () => {
      showToast('Task updated.', 'success');
      setSel(null);
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update task.', 'error'),
  });

  const fillFormFromTask = (task) => {
    setEditBossOrSkill(task?.bossOrSkill ?? task?.label ?? '');
    const cat = getContentCategory(task);
    const opts = metricOptionsForCategory(cat);
    const currentType = task?.metricType ?? 'kc';
    const validType = opts.some((o) => o.value === currentType) ? currentType : opts[0]?.value ?? 'kc';
    setEditMetricType(validType);
    setEditMetricTarget(String(task?.metricTarget ?? ''));
  };

  const handleOceanClick = (row, col) => {
    if (sel?.type === 'ocean' && sel.row === row && sel.col === col) { setSel(null); return; }
    const task = oceanCellTaskMap[`${row}-${col}`];
    setSel({ type: 'ocean', row, col, task });
    setEditTaskId(task?.taskId ?? null);
    setTaskSearch('');
    fillFormFromTask(task);
  };

  const handleShipClick = (shipType, cellIndex) => {
    if (sel?.type === 'ship' && sel.shipType === shipType && sel.cellIndex === cellIndex) { setSel(null); return; }
    const task = templateMap[`${shipType}:${cellIndex}`]?.task ?? null;
    setSel({ type: 'ship', shipType, cellIndex });
    setEditTaskId(task?.taskId ?? null);
    setTaskSearch('');
    fillFormFromTask(task);
  };

  const handlePickTask = (task) => {
    fillFormFromTask(task);
    if (sel?.type === 'ship') {
      setEditTaskId(task.taskId);
      setBSShipTemplate({
        variables: { eventId: event.eventId, shipType: sel.shipType, cellIndex: sel.cellIndex, taskId: task.taskId },
      });
    }
    // ocean: keep editTaskId as the ocean tile's own task — we're just pre-filling the form
  };

  const handleSave = () => {
    if (!editTaskId) return;
    const target = Number(editMetricTarget);
    const ref = contentLookup.get(editBossOrSkill);
    updateBSTask({
      variables: {
        taskId: editTaskId,
        input: {
          label: editBossOrSkill,
          bossOrSkill: editBossOrSkill,
          metricType: editMetricType,
          metricTarget: target,
          metricUnit: metricUnitFor(editMetricType),
          metricLabel: formatMetricLabel(editMetricType, target),
          validDrops: editMetricType === 'unique' ? (ref?.validDrops ?? []) : [],
          womMetric: ref?.womMetric ?? null,
        },
      },
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (!taskSearch.trim()) return true;
    const q = taskSearch.trim().toLowerCase();
    return (
      (t.bossOrSkill ?? t.label).toLowerCase().includes(q) ||
      (t.metricLabel ?? '').toLowerCase().includes(q)
    );
  });

  const assignedCount = Object.keys(templateMap).length;
  const isShipSel = sel?.type === 'ship';
  const isOceanSel = sel?.type === 'ocean';
  const currentCategory = useMemo(
    () => getContentCategory({ bossOrSkill: editBossOrSkill, metricType: editMetricType }),
    [editBossOrSkill, editMetricType]
  );
  const currentMetricOptions = useMemo(() => metricOptionsForCategory(currentCategory), [currentCategory]);

  return (
    <VStack align="stretch" spacing={5}>
      {/* Explainer */}
      <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
        <VStack align="stretch" spacing={2}>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" letterSpacing="wide">
            The grid is split into two zones:{' '}
            <Text as="span" color="#4ade80" fontWeight="bold">
              ship cells
            </Text>{' '}
            and{' '}
            <Text as="span" color="#4ade80" fontWeight="bold">
              ocean cells
            </Text>
            . Ship cells are tied to a specific ship, and tasks assigned there will appear on that
            ship when teams place it. Ocean cells fill the rest of the board with a random selection
            from the task pool each game.
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" letterSpacing="wide">
            Click any cell to select it, then choose a task from the list on the right to assign it.
            Click{' '}
            <Text as="span" color="#4ade80" fontWeight="bold">
              Randomize Ocean
            </Text>{' '}
            to reshuffle which tasks fill the ocean cells; this doesn't affect ship assignments.
          </Text>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wide">
            You need all 17 ship template slots filled and at least 100 ocean tasks before you can
            start the placement phase.
          </Text>
        </VStack>
      </Box>

      {/* Stats + randomize */}
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <HStack spacing={5}>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78">
            Ship templates:{' '}
            <Text
              as="span"
              color={assignedCount >= 17 ? 'green.400' : 'yellow.400'}
              fontWeight="bold"
            >
              {assignedCount}/17
            </Text>
          </Text>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78">
            Ocean tasks:{' '}
            <Text
              as="span"
              color={oceanTasks.length >= 100 ? 'green.400' : 'yellow.400'}
              fontWeight="bold"
            >
              {oceanTasks.length}/100
            </Text>
          </Text>
        </HStack>
        <Button
          size="xs"
          variant="outline"
          colorScheme="green"
          borderColor="#1a4028"
          color="#4ade80"
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          textTransform="uppercase"
          _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
          onClick={handleRandomize}
        >
          Randomize Ocean
        </Button>
      </HStack>

      {/* Grid + edit panel side by side */}
      <Box display="flex" gap={6} alignItems="flex-start">
        {/* LEFT: Ocean grid */}
        <Box overflowX="auto" flexShrink={0}>
          <VStack spacing={0} align="flex-start">
            <HStack spacing={0} pl="22px">
              {COL_LABELS.map((lbl) => (
                <Box
                  key={lbl}
                  w="52px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                    {lbl}
                  </Text>
                </Box>
              ))}
            </HStack>
            {Array.from({ length: 10 }, (_, row) => (
              <HStack key={row} spacing={0}>
                <Box w="22px" h="52px" display="flex" alignItems="center" justifyContent="center">
                  <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                    {row + 1}
                  </Text>
                </Box>
                {Array.from({ length: 10 }, (_, col) => {
                  const key = `${row}-${col}`;
                  const task = oceanCellTaskMap[key];
                  const isSelected = isOceanSel && sel.row === row && sel.col === col;
                  return (
                    <Box
                      key={col}
                      w="52px"
                      h="52px"
                      border="1px solid"
                      borderColor={isSelected ? '#22c55e' : '#1a4028'}
                      bg="#060f0a"
                      cursor="pointer"
                      onClick={() => handleOceanClick(row, col)}
                      p="3px"
                      overflow="hidden"
                      boxShadow={isSelected ? '0 0 0 1px #22c55e inset' : 'none'}
                      _hover={{ borderColor: '#4ade80' }}
                      title={`${COL_LABELS[col]}${row + 1}: ${
                        task ? (task.bossOrSkill ?? task.label) + ' — ' + task.metricLabel : 'empty'
                      }`}
                    >
                      {task ? (
                        <VStack spacing={0} align="stretch" h="full" justify="center">
                          <Text
                            fontFamily="mono"
                            fontSize="7px"
                            color="#b8d4c0"
                            noOfLines={2}
                            lineHeight="1.3"
                          >
                            {task.bossOrSkill ?? task.label}
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="6px"
                            color="#2a6040"
                            noOfLines={1}
                            lineHeight="1.3"
                            mt="1px"
                          >
                            {task.metricLabel}
                          </Text>
                        </VStack>
                      ) : (
                        <Box
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box w="3px" h="3px" bg="#1e3050" borderRadius="full" />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* RIGHT: Unified edit panel */}
        {sel && (
          <Box flex="1" minW="280px" maxW="400px">
            <Box bg="#060f0a" border="1px solid" borderColor="#22c55e" borderRadius="md" p={4}>
              <VStack align="stretch" spacing={3}>

                {/* Header */}
                <HStack justify="space-between" align="center">
                  <Text fontFamily="mono" fontSize="10px" color="#4ade80" letterSpacing="widest" textTransform="uppercase">
                    {isShipSel
                      ? `${sel.shipType} · Cell ${sel.cellIndex}`
                      : `Ocean · ${COL_LABELS[sel.col]}${sel.row + 1}`}
                  </Text>
                  <Button size="xs" variant="ghost" color="#3d6b4a" fontFamily="mono" fontSize="10px" px={1} minW="auto" _hover={{ color: '#d4f0da', bg: 'transparent' }} onClick={() => setSel(null)}>
                    ✕
                  </Button>
                </HStack>

                {/* Premade task search */}
                <Box>
                  <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
                    {isShipSel ? 'ASSIGN FROM POOL' : 'PICK TO PRE-FILL'}
                  </Text>
                  <Input
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks..."
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="xs"
                    size="sm"
                    _placeholder={{ color: '#3d6b4a' }}
                    _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                    _hover={{ borderColor: '#1a5c2e' }}
                  />
                  <VStack align="stretch" spacing={0} maxH="160px" overflowY="auto" mt={1}>
                    {filteredTasks.length === 0 && (
                      <Text fontFamily="mono" fontSize="xs" color="#3d6b4a" px={2} py={1}>No tasks match.</Text>
                    )}
                    {filteredTasks.map((task) => {
                      const isActive = task.taskId === editTaskId;
                      return (
                        <Box
                          key={task.taskId}
                          py={2}
                          px={2}
                          cursor="pointer"
                          borderRadius="sm"
                          bg={isActive ? '#1a3a5c' : 'transparent'}
                          _hover={{ bg: '#091a10' }}
                          onClick={() => handlePickTask(task)}
                        >
                          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" noOfLines={1}>
                            {task.bossOrSkill ?? task.label}
                          </Text>
                          {task.metricLabel && (
                            <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" noOfLines={1}>
                              {task.metricLabel}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Divider */}
                <Box h="1px" bg="#1a4028" />

                {/* Custom editor */}
                {(isShipSel || sel.task) ? (
                  <>
                    <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider">CUSTOM EDIT</Text>

                    {/* Boss / Skill grouped dropdown */}
                    <Box>
                      <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
                        BOSS / SKILL / MINIGAME
                      </Text>
                      <Select
                        value={editBossOrSkill}
                        onChange={(e) => {
                          const name = e.target.value;
                          setEditBossOrSkill(name);
                          const ref = contentLookup.get(name);
                          const cat = getContentCategory(ref ?? { bossOrSkill: name, metricType: undefined });
                          const opts = metricOptionsForCategory(cat);
                          const currentValid = opts.some((o) => o.value === editMetricType);
                          if (!currentValid) setEditMetricType(opts[0]?.value ?? 'kc');
                          if (ref) setEditMetricTarget(String(ref.metricTarget ?? editMetricTarget));
                        }}
                        bg="#091a10"
                        border="1px solid"
                        borderColor="#1a4028"
                        color="#d4f0da"
                        fontFamily="mono"
                        fontSize="xs"
                        size="sm"
                        _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                        _hover={{ borderColor: '#1a5c2e' }}
                      >
                        {groupedOptions.boss.length > 0 && (
                          <optgroup label="── Bosses ──" style={{ background: '#091a10', color: '#6b9e78' }}>
                            {groupedOptions.boss.map((n) => (
                              <option key={n} value={n} style={{ background: '#091a10', color: '#d4f0da' }}>{n}</option>
                            ))}
                          </optgroup>
                        )}
                        {groupedOptions.raid.length > 0 && (
                          <optgroup label="── Raids ──" style={{ background: '#091a10', color: '#6b9e78' }}>
                            {groupedOptions.raid.map((n) => (
                              <option key={n} value={n} style={{ background: '#091a10', color: '#d4f0da' }}>{n}</option>
                            ))}
                          </optgroup>
                        )}
                        {groupedOptions.minigame.length > 0 && (
                          <optgroup label="── Minigames ──" style={{ background: '#091a10', color: '#6b9e78' }}>
                            {groupedOptions.minigame.map((n) => (
                              <option key={n} value={n} style={{ background: '#091a10', color: '#d4f0da' }}>{n}</option>
                            ))}
                          </optgroup>
                        )}
                        {groupedOptions.skill.length > 0 && (
                          <optgroup label="── Skills ──" style={{ background: '#091a10', color: '#6b9e78' }}>
                            {groupedOptions.skill.map((n) => (
                              <option key={n} value={n} style={{ background: '#091a10', color: '#d4f0da' }}>{n}</option>
                            ))}
                          </optgroup>
                        )}
                        {groupedOptions.clue.length > 0 && (
                          <optgroup label="── Clues ──" style={{ background: '#091a10', color: '#6b9e78' }}>
                            {groupedOptions.clue.map((n) => (
                              <option key={n} value={n} style={{ background: '#091a10', color: '#d4f0da' }}>{n}</option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                    </Box>

                    {/* Metric type + target */}
                    <HStack spacing={3} align="flex-end">
                      <Box flex={1}>
                        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
                          METRIC TYPE
                        </Text>
                        <Select
                          value={editMetricType}
                          onChange={(e) => setEditMetricType(e.target.value)}
                          bg="#091a10"
                          border="1px solid"
                          borderColor="#1a4028"
                          color="#d4f0da"
                          fontFamily="mono"
                          fontSize="xs"
                          size="sm"
                          _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                          _hover={{ borderColor: '#1a5c2e' }}
                        >
                          {currentMetricOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} style={{ background: '#091a10' }}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </Box>
                      <Box flex={1}>
                        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
                          TARGET
                        </Text>
                        <NumberInput value={editMetricTarget} onChange={(val) => setEditMetricTarget(val)} min={1} clampValueOnBlur>
                          <NumberInputField bg="#091a10" border="1px solid" borderColor="#1a4028" color="#d4f0da" fontFamily="mono" fontSize="xs" h="32px" px={3} _focus={{ borderColor: '#22c55e', boxShadow: 'none' }} _hover={{ borderColor: '#1a5c2e' }} />
                          <NumberInputStepper borderColor="#1a4028">
                            <NumberIncrementStepper borderColor="#1a4028" color="#6b9e78" _hover={{ bg: '#091a10' }} />
                            <NumberDecrementStepper borderColor="#1a4028" color="#6b9e78" _hover={{ bg: '#091a10' }} />
                          </NumberInputStepper>
                        </NumberInput>
                      </Box>
                    </HStack>

                    {/* Valid drops */}
                    {editMetricType === 'unique' && editBossOrSkill && contentLookup.get(editBossOrSkill)?.validDrops?.length > 0 && (
                      <Box>
                        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>VALID DROPS</Text>
                        <VStack align="stretch" spacing={0} maxH="72px" overflowY="auto" bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="sm" px={2} py={1}>
                          {contentLookup.get(editBossOrSkill).validDrops.map((drop) => (
                            <Text key={drop} fontFamily="mono" fontSize="10px" color="#6b9e78" noOfLines={1}>{drop}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Save */}
                    <HStack justify="flex-end" spacing={2}>
                      <Button size="xs" variant="ghost" color="#3d6b4a" fontFamily="mono" fontSize="10px" _hover={{ color: '#d4f0da', bg: 'transparent' }} onClick={() => setSel(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="green"
                        variant="outline"
                        borderColor="#1a4028"
                        color="#4ade80"
                        fontFamily="mono"
                        fontSize="10px"
                        letterSpacing="wider"
                        textTransform="uppercase"
                        isLoading={updatingTask}
                        isDisabled={!editBossOrSkill || !Number(editMetricTarget) || !editTaskId}
                        onClick={handleSave}
                        _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
                      >
                        Save
                      </Button>
                    </HStack>
                  </>
                ) : (
                  <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">No task at this position.</Text>
                )}
              </VStack>
            </Box>
          </Box>
        )}
      </Box>

      {/* Ship templates — below the grid */}
      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#6b9e78"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={3}
        >
          Ship Templates
        </Text>
        <VStack align="stretch" spacing={4}>
          {SHIP_CONFIGS.map(({ shipType, label, cells }) => (
            <Box key={shipType}>
              <Text
                fontFamily="mono"
                fontSize="9px"
                color="#3d6b4a"
                letterSpacing="widest"
                textTransform="uppercase"
                mb={1}
              >
                {label} · {cells} cells
              </Text>
              <HStack spacing={0}>
                {Array.from({ length: cells }, (_, i) => {
                  const tmpl = templateMap[`${shipType}:${i}`];
                  const isSel = isShipSel && sel.shipType === shipType && sel.cellIndex === i;
                  return (
                    <Box
                      key={i}
                      w="72px"
                      h="56px"
                      bg="#0e1f30"
                      border="1px solid"
                      borderColor={isSel ? '#22c55e' : '#1a5c2e'}
                      borderRight={i < cells - 1 ? 'none' : undefined}
                      cursor="pointer"
                      onClick={() => handleShipClick(shipType, i)}
                      p="4px"
                      overflow="hidden"
                      transition="all 0.1s"
                      boxShadow={isSel ? '0 0 0 1px #22c55e inset' : 'none'}
                      _hover={{ borderColor: '#4ade80' }}
                      title={
                        tmpl?.task
                          ? (tmpl.task.bossOrSkill ?? tmpl.task.label) +
                            ' — ' +
                            tmpl.task.metricLabel
                          : 'unassigned'
                      }
                    >
                      {tmpl?.task ? (
                        <VStack spacing={0} align="stretch">
                          <Text
                            fontFamily="mono"
                            fontSize="7px"
                            color="#b8d4c0"
                            noOfLines={2}
                            lineHeight="1.3"
                          >
                            {tmpl.task.bossOrSkill ?? tmpl.task.label}
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="6px"
                            color="#2a6040"
                            noOfLines={1}
                            lineHeight="1.3"
                            mt="1px"
                          >
                            {tmpl.task.metricLabel}
                          </Text>
                        </VStack>
                      ) : (
                        <Text fontFamily="mono" fontSize="9px" color="#1a5c2e">
                          —
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}
