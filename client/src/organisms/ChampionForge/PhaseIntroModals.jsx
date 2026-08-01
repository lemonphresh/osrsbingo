import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Checkbox,
} from '@chakra-ui/react';

export const CF_GATHERING_SEEN_KEY = 'cf_gathering_intro_seen';
export const CF_OUTFITTING_SEEN_KEY = 'cf_outfitting_intro_seen';

function PhaseIntroModal({
  isOpen,
  storageKey,
  title,
  accentColor,
  children,
  confirmLabel,
  onConfirm,
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) setScrolledToBottom(true);
  };

  const handleConfirm = () => {
    localStorage.setItem(storageKey, 'true');
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      closeOnOverlayClick={false}
      isCentered
      size="lg"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="gray.800"
        border="1px solid"
        borderColor={`${accentColor}.700`}
        borderTopWidth="3px"
        borderTopColor={`${accentColor}.400`}
        maxH="85vh"
      >
        <ModalHeader color={`${accentColor}.200`} fontSize="lg" pb={2}>
          {title}
        </ModalHeader>
        <ModalBody
          overflowY="auto"
          onScroll={handleScroll}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#4a5568', borderRadius: '10px' },
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 transparent',
          }}
        >
          <VStack align="stretch" spacing={5} pb={4}>
            {children}
          </VStack>
        </ModalBody>
        <ModalFooter flexDir="column" gap={3} borderTop="1px solid" borderColor="gray.700">
          {!scrolledToBottom && (
            <Text fontSize="xs" color="gray.500" textAlign="center" w="full">
              Scroll through to continue
            </Text>
          )}
          <Checkbox
            isChecked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            isDisabled={!scrolledToBottom}
            colorScheme={accentColor}
            alignItems="flex-start"
            w="full"
          >
            <Text fontSize="sm" color="gray.200">
              {confirmLabel}
            </Text>
          </Checkbox>
          <Button
            colorScheme={accentColor}
            w="full"
            isDisabled={!scrolledToBottom || !checked}
            onClick={handleConfirm}
          >
            Let's go
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function GatheringPhaseIntroModal({ isOpen, onClose }) {
  return (
    <PhaseIntroModal
      isOpen={isOpen}
      storageKey={CF_GATHERING_SEEN_KEY}
      title="⚒️ Welcome to the Gathering Phase"
      accentColor="green"
      confirmLabel="I understand how the Gathering Phase works"
      onConfirm={onClose}
    >
      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          What is this phase?
        </Text>
        <Text fontSize="sm" color="gray.300">
          During Gathering, your team completes tasks to stock your war chest with gear. Every item
          your team earns becomes equipment your champion can use in the battle. The more you
          complete, the better your options in the Outfitting Phase.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={2}>
          Picking your role
        </Text>
        <VStack align="stretch" spacing={2}>
          <HStack align="flex-start" spacing={3}>
            <Badge colorScheme="orange" flexShrink={0} mt={0.5}>
              PvMer
            </Badge>
            <Text fontSize="sm" color="gray.300">
              Boss kills and combat drops. You'll earn gear slots: weapon, helm, chest, legs,
              gloves, boots, or trinket.
            </Text>
          </HStack>
          <HStack align="flex-start" spacing={3}>
            <Badge colorScheme="teal" flexShrink={0} mt={0.5}>
              Skiller
            </Badge>
            <Text fontSize="sm" color="gray.300">
              XP gains and minigame completions. You'll earn utility slots: consumables, rings,
              amulets, capes, or shields.
            </Text>
          </HStack>
          <HStack align="flex-start" spacing={3}>
            <Badge colorScheme="purple" flexShrink={0} mt={0.5}>
              Flex
            </Badge>
            <Text fontSize="sm" color="gray.300">
              Can join any task. Good if your team is short on one role or you want to fill gaps.
            </Text>
          </HStack>
        </VStack>
      </Box>

      <Box p={3} bg="yellow.900" borderRadius="md" border="1px solid" borderColor="yellow.700">
        <Text fontWeight="semibold" color="yellow.200" mb={1}>
          ⚠️ Coordinate before locking in
        </Text>
        <Text fontSize="sm" color="yellow.300">
          Your team needs a healthy mix of PvMers and Skillers to earn gear across all slots. Check
          the Team Roster to see what roles your teammates are leaning toward before you commit. Be
          strategic, you want all bases covered, not six PvMers and no one farming utilities.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          How role locking works
        </Text>
        <Text fontSize="sm" color="gray.300">
          Your role is{' '}
          <Text as="span" color="orange.300" fontWeight="semibold">
            not locked
          </Text>{' '}
          until you join your first task. Until then, you can change it freely. The moment you join
          a task, your role is locked for the rest of the event, but you can still move between
          tasks within your role at any time.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          Joining and leaving tasks
        </Text>
        <Text fontSize="sm" color="gray.300">
          Marking yourself on a task lets your teammates see who's working on what. It's not a hard
          commitment, so you can leave a task and join a different one whenever you like. Any
          progress you've contributed stays on the task even if you leave.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          Pre-screenshots
        </Text>
        <Text fontSize="sm" color="gray.300" mb={2}>
          For most tasks, you'll need a{' '}
          <Text as="span" color="white" fontWeight="semibold">
            before
          </Text>{' '}
          screenshot taken before you start grinding. This proves you weren't already partway
          through when the event began. Open the task detail and copy the{' '}
          <Text as="span" fontFamily="mono" color="purple.300" fontSize="xs">
            !cfpresubmit
          </Text>{' '}
          command, then post it in Discord with your screenshot attached. Do this before you start
          the task, not after.
        </Text>
        <Text fontSize="sm" color="gray.500">
          Some tasks don't require a pre-screenshot, check the task detail for instructions.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          Submitting evidence
        </Text>
        <Text fontSize="sm" color="gray.300">
          When you've completed a task, open the task detail and copy the{' '}
          <Text as="span" fontFamily="mono" color="green.300" fontSize="xs">
            !cfsubmit
          </Text>{' '}
          command. Run it in your team's Discord channel with a screenshot attached. A ref will
          review and approve your submission, which updates your team's progress and war chest.
        </Text>
      </Box>
    </PhaseIntroModal>
  );
}

export function OutfittingPhaseIntroModal({ isOpen, onClose }) {
  return (
    <PhaseIntroModal
      isOpen={isOpen}
      storageKey={CF_OUTFITTING_SEEN_KEY}
      title="🛡️ Welcome to the Outfitting Phase"
      accentColor="blue"
      confirmLabel="I understand my role in the Outfitting Phase"
      onConfirm={onClose}
    >
      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          What is this phase?
        </Text>
        <Text fontSize="sm" color="gray.300">
          Outfitting is where your team turns your war chest into a battle-ready loadout. Every item
          your team earned during Gathering is now available to slot onto your champion. You have a
          limited time window. Make it count.
        </Text>
      </Box>

      <Box p={3} bg="blue.900" borderRadius="md" border="1px solid" borderColor="blue.700">
        <Text fontWeight="semibold" color="blue.200" mb={1}>
          👑 Captain's job
        </Text>
        <Text fontSize="sm" color="blue.300">
          Only the captain can save and lock the final loadout. Once the captain locks it in, that's
          the setup your champion goes into battle with, and there are no changes after that.
          Captains: don't lock until your team has agreed on the build.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          What team members should do
        </Text>
        <Text fontSize="sm" color="gray.300">
          Everyone can and should explore the gear options and experiment with the training dummy to
          test DPS and defensive setups. Use the outfitter to try different combinations from your
          war chest. The dummy lets you see how builds actually perform before the captain commits.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          Compare loadouts with your team
        </Text>
        <Text fontSize="sm" color="gray.300">
          Found a build you think works? Share it in your team channel so everyone can compare. The
          captain should have a few options in front of them before locking anything in...
          Crowdsourced theory-crafting wins championships.
        </Text>
      </Box>

      <Box>
        <Text fontWeight="semibold" color="white" mb={1}>
          When does battle start?
        </Text>
        <Text fontSize="sm" color="gray.300">
          The battle phase is started manually by the event admin once all captains have locked
          their loadouts. Keep an eye on your team channel! The admin will announce when it's time.
        </Text>
      </Box>
    </PhaseIntroModal>
  );
}
