import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { CREATE_BS_EVENT } from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import usePageTitle from '../../hooks/usePageTitle';

// ── Styled label ──────────────────────────────────────────────────────────

function FieldLabel({ children, htmlFor }) {
  return (
    <FormLabel
      htmlFor={htmlFor}
      fontFamily="mono"
      fontSize="10px"
      fontWeight="bold"
      color="#94a3b8"
      letterSpacing="widest"
      textTransform="uppercase"
      mb={1}
    >
      {children}
    </FormLabel>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────

export default function BattleshipCreatePage() {
  usePageTitle('New Campaign — Battleship');

  const navigate = useNavigate();
  const { showToast } = useToastContext();

  const [eventName, setEventName] = useState('');
  const [eventPassword, setEventPassword] = useState('');
  const [placementPhaseHours, setPlacementPhaseHours] = useState(24);
  const [cooldownMinutes, setCooldownMinutes] = useState(10);
  const [initialSkipTokens, setInitialSkipTokens] = useState(2);
  const [nameError, setNameError] = useState('');

  const [createBSEvent, { loading }] = useMutation(CREATE_BS_EVENT, {
    onCompleted: (data) => {
      const newEventId = data?.createBSEvent?.eventId;
      showToast('Campaign created. Prepare your fleet.', 'success');
      navigate(`/battleship/${newEventId}`);
    },
    onError: (err) => {
      showToast(err.message ?? 'Failed to create campaign.', 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = eventName.trim();
    if (!trimmed) {
      setNameError('Campaign name is required.');
      return;
    }
    setNameError('');
    createBSEvent({
      variables: {
        input: {
          eventName: trimmed,
          placementPhaseHours: Number(placementPhaseHours),
          cooldownMinutes: Number(cooldownMinutes),
          initialSkipTokens: Number(initialSkipTokens),
          eventPassword: eventPassword.trim() || null,
        },
      },
    });
  };

  return (
    <Box flex="1" minH="100vh" bg="#071523">
      {/* Top bar */}
      <Box bg="#0d2137" borderBottom="1px solid" borderColor="#1e4976" px={[4, 6, 8]} py={3}>
        <HStack spacing={3} align="center" maxW="1200px" mx="auto">
          <RouterLink to="/battleship">
            <Button
              size="xs"
              variant="ghost"
              color="#94a3b8"
              leftIcon={<ArrowBackIcon />}
              fontFamily="mono"
              fontSize="xs"
              _hover={{ color: '#e2e8f0', bg: 'transparent' }}
            >
              Campaigns
            </Button>
          </RouterLink>
          <Box w="1px" h="16px" bg="#1e4976" />
          <Text
            fontFamily="mono"
            fontSize="sm"
            fontWeight="bold"
            color="#e2e8f0"
            letterSpacing="wide"
          >
            New Campaign
          </Text>
        </HStack>
      </Box>

      {/* Form card */}
      <Box maxW="520px" mx="auto" px={[4, 6]} py={[10, 14]}>
        <VStack align="stretch" spacing={8}>
          {/* Page heading */}
          <VStack align="flex-start" spacing={2}>
            <Text
              fontFamily="mono"
              fontSize={['xl', '2xl']}
              fontWeight="bold"
              color="#e2e8f0"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Launch Campaign
            </Text>
            <HStack spacing={2}>
              <Box w="24px" h="1px" bg="#0ea5e9" />
              <Box w="8px" h="1px" bg="#1e4976" />
            </HStack>
            <Text fontFamily="mono" fontSize="xs" color="#94a3b8" letterSpacing="wide">
              Configure event parameters before launch.
            </Text>
          </VStack>

          {/* Form */}
          <Box
            as="form"
            onSubmit={handleSubmit}
            bg="#0d2137"
            border="1px solid"
            borderColor="#1e4976"
            borderRadius="md"
            p={[5, 6]}
          >
            <VStack align="stretch" spacing={5}>
              {/* Event name */}
              <FormControl isInvalid={!!nameError} isRequired>
                <FieldLabel htmlFor="eventName">Campaign Name</FieldLabel>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="i.e. Operation Iron Tide"
                  bg="#071523"
                  border="1px solid"
                  borderColor="#1e4976"
                  color="#e2e8f0"
                  fontFamily="mono"
                  fontSize="sm"
                  _placeholder={{ color: '#475569' }}
                  _focus={{ borderColor: '#0ea5e9', boxShadow: 'none' }}
                  _hover={{ borderColor: '#2d5f9a' }}
                />
                <FormErrorMessage fontFamily="mono" fontSize="xs">
                  {nameError}
                </FormErrorMessage>
              </FormControl>

              {/* Event password (optional) */}
              <FormControl>
                <FieldLabel htmlFor="eventPassword">Event Password (optional)</FieldLabel>
                <Input
                  id="eventPassword"
                  value={eventPassword}
                  onChange={(e) => setEventPassword(e.target.value)}
                  placeholder="i.e. ironhide"
                  bg="#071523"
                  border="1px solid"
                  borderColor="#1e4976"
                  color="#e2e8f0"
                  fontFamily="mono"
                  fontSize="sm"
                  _placeholder={{ color: '#475569' }}
                  _focus={{ borderColor: '#0ea5e9', boxShadow: 'none' }}
                  _hover={{ borderColor: '#2d5f9a' }}
                />
                <Text fontFamily="mono" fontSize="10px" color="#475569" mt={1} letterSpacing="wide">
                  Shown to participants on the event page — used for screenshot verification.
                </Text>
              </FormControl>

              {/* Placement phase hours */}
              <FormControl>
                <FieldLabel htmlFor="placementPhaseHours">Placement Phase (hours)</FieldLabel>
                <NumberInput
                  id="placementPhaseHours"
                  value={placementPhaseHours}
                  onChange={(val) => setPlacementPhaseHours(val)}
                  min={1}
                  max={168}
                  clampValueOnBlur
                >
                  <NumberInputField
                    bg="#071523"
                    border="1px solid"
                    borderColor="#1e4976"
                    color="#e2e8f0"
                    fontFamily="mono"
                    fontSize="sm"
                    _focus={{ borderColor: '#0ea5e9', boxShadow: 'none' }}
                    _hover={{ borderColor: '#2d5f9a' }}
                  />
                  <NumberInputStepper borderColor="#1e4976">
                    <NumberIncrementStepper
                      borderColor="#1e4976"
                      color="#94a3b8"
                      _hover={{ bg: '#0d2137' }}
                    />
                    <NumberDecrementStepper
                      borderColor="#1e4976"
                      color="#94a3b8"
                      _hover={{ bg: '#0d2137' }}
                    />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontFamily="mono" fontSize="10px" color="#475569" mt={1} letterSpacing="wide">
                  Min 1 — Max 168 (one week)
                </Text>
              </FormControl>

              {/* Cooldown minutes */}
              <FormControl>
                <FieldLabel htmlFor="cooldownMinutes">Shot Cooldown (minutes)</FieldLabel>
                <NumberInput
                  id="cooldownMinutes"
                  value={cooldownMinutes}
                  onChange={(val) => setCooldownMinutes(val)}
                  min={1}
                  max={60}
                  clampValueOnBlur
                >
                  <NumberInputField
                    bg="#071523"
                    border="1px solid"
                    borderColor="#1e4976"
                    color="#e2e8f0"
                    fontFamily="mono"
                    fontSize="sm"
                    _focus={{ borderColor: '#0ea5e9', boxShadow: 'none' }}
                    _hover={{ borderColor: '#2d5f9a' }}
                  />
                  <NumberInputStepper borderColor="#1e4976">
                    <NumberIncrementStepper
                      borderColor="#1e4976"
                      color="#94a3b8"
                      _hover={{ bg: '#0d2137' }}
                    />
                    <NumberDecrementStepper
                      borderColor="#1e4976"
                      color="#94a3b8"
                      _hover={{ bg: '#0d2137' }}
                    />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontFamily="mono" fontSize="10px" color="#475569" mt={1} letterSpacing="wide">
                  Min 1 — Max 60
                </Text>
              </FormControl>

              {/* Skip tokens */}
              <FormControl>
                <FieldLabel htmlFor="initialSkipTokens">Skip Tokens per Team</FieldLabel>
                <NumberInput
                  id="initialSkipTokens"
                  value={initialSkipTokens}
                  onChange={(val) => setInitialSkipTokens(val)}
                  min={0}
                  max={10}
                  clampValueOnBlur
                >
                  <NumberInputField
                    bg="#071523"
                    border="1px solid"
                    borderColor="#1e4976"
                    color="#e2e8f0"
                    fontFamily="mono"
                    fontSize="sm"
                    _focus={{ borderColor: '#0ea5e9', boxShadow: 'none' }}
                    _hover={{ borderColor: '#2d5f9a' }}
                  />
                  <NumberInputStepper borderColor="#1e4976">
                    <NumberIncrementStepper
                      borderColor="#1e4976"
                      color="#94a3b8"
                      _hover={{ bg: '#0d2137' }}
                    />
                    <NumberDecrementStepper
                      borderColor="#1e4976"
                      color="#94a3b8"
                      _hover={{ bg: '#0d2137' }}
                    />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontFamily="mono" fontSize="10px" color="#475569" mt={1} letterSpacing="wide">
                  Each team starts with this many skip tokens. Default is 2.
                </Text>
              </FormControl>

              {/* Submit */}
              <Box pt={2}>
                <Button
                  type="submit"
                  isLoading={loading}
                  loadingText="Launching..."
                  colorScheme="cyan"
                  w="full"
                  fontFamily="mono"
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  bg="#0ea5e9"
                  color="#071523"
                  _hover={{ bg: '#38bdf8' }}
                  _active={{ bg: '#0284c7' }}
                >
                  Launch Campaign
                </Button>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
