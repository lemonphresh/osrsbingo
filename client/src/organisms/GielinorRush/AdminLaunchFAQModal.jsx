import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';

const FAQ = [
  {
    q: 'How do participants get started?',
    a: 'Share your event page URL. From there they can see their team card in the leaderboard and click into their team page. The team page has a built-in tutorial that walks them through everything.',
  },
  {
    q: 'How do participants link their Discord account?',
    a: "They need to create a Bingo Hub account and link their Discord in their profile settings (top-right menu → Profile). Without a linked Discord they won't be recognized as a team member.",
  },
  {
    q: 'Where do participants enter the event password?',
    a: "The event password is shown in the tutorial on their team page. It should be presented as an overlay in their screenshot when they submit proof with the /submit bot command. This is how you can confirm they're actually playing and not just sharing screenshots from the internet.",
  },
  {
    q: 'How do teams submit proof of completing a task?',
    a: 'Teams use the /submit Discord bot command in your server. They attach a screenshot with the Event Password in a WOM plugin (or similar plugin) overlay, and it shows up in the Submissions tab on your event page for review.',
  },
  {
    q: "A team says they can't see any quests / their map is blank?",
    a: "Their Discord account may not be linked to their Bingo Hub account, or they're not listed as a team member. Check the team's member list in the Leaderboard panel. Each member needs a linked Discord that matches.",
  },
  {
    q: 'What are keys and how do teams use them?',
    a: "Keys are rewards earned from completing certain nodes. When an Inn node is unlocked on the team's map, they can visit it to trade their keys for GP and sometimes buffs.",
  },
  {
    q: 'What are buffs?',
    a: 'Buffs are special rewards earned from certain nodes. Once earned, a team can apply a buff to an available quest to reduce its requirement.',
  },
  {
    q: 'A submission was denied, what happens to the player?',
    a: 'They receive a Discord notification with your denial reason. They can re-read the objective and submit again. Make sure to always include a clear reason when denying so they know what went wrong.',
  },
  {
    q: "The Discord bot isn't working / not responding to /submit?",
    a: "Check Event Settings → Discord Integration to confirm the bot is properly configured for your server. Make sure the event ID is in the team channels' descriptions.",
  },
  {
    q: 'Can teams see locked quests?',
    a: 'No; locked nodes show as redacted (blurred) on the team page. Only available and completed quests show their full details. This is intentional to keep the game exciting.',
  },
];

const AdminLaunchFAQModal = ({ isOpen, onClose, currentColors, colorMode }) => (
  <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
    <ModalOverlay />
    <ModalContent bg={currentColors.cardBg} maxH="85vh">
      <ModalCloseButton />
      <ModalHeader>
        <VStack align="start" spacing={1}>
          <HStack>
            <Text fontSize="2xl">🚀</Text>
            <Heading size="md" color={currentColors.textColor}>
              Event Launched!
            </Heading>
          </HStack>
          <Text
            fontSize="sm"
            fontWeight="normal"
            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
          >
            Keep this handy, here are common questions participants will ask you
          </Text>
        </VStack>
      </ModalHeader>
      <ModalBody pb={4}>
        <Box
          mb={4}
          p={3}
          bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
          borderRadius="md"
          border="1px solid"
          borderColor={colorMode === 'dark' ? 'green.700' : 'green.200'}
        >
          <Text fontSize="sm" color={colorMode === 'dark' ? 'green.200' : 'green.800'}>
            ✅ Your event is now public. Teams can navigate to their team page and see available
            quests. Once the start time for the event is upon us, remember to check the{' '}
            <strong>Submissions</strong> tab regularly to approve submissions and complete nodes for
            teams.
          </Text>
        </Box>

        <Accordion allowMultiple defaultIndex={[]} mt={2}>
          {FAQ.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              border="none"
              mb={2}
              bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}
              borderRadius="md"
              overflow="hidden"
            >
              <AccordionButton
                py={3}
                px={4}
                _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.100' }}
              >
                <Box flex="1" textAlign="left">
                  <Text fontSize="sm" fontWeight="semibold" color={currentColors.textColor}>
                    {q}
                  </Text>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel px={4} pb={3}>
                <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                  {a}
                </Text>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        <Box
          mt={4}
          p={3}
          bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
          borderRadius="md"
        >
          <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
            💡 You can re-open this guide anytime from the{' '}
            <Badge fontSize="xs" colorScheme="purple">
              Admin Quick Actions
            </Badge>{' '}
            panel on the event page.
          </Text>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="green" onClick={onClose}>
          Got it, let's go!
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default AdminLaunchFAQModal;
