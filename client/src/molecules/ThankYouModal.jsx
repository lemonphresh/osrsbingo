import React, { useEffect, useState } from 'react';
import {
  Button,
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
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../providers/AuthProvider';

// Bump this version string to re-show the modal to everyone with fresh copy.
const STORAGE_KEY_PREFIX = 'thankYouModal_v1_dismissed_';

const ThankYouModal = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY_PREFIX}${user.id}`;
    if (!localStorage.getItem(key)) {
      // Small delay so it doesn't slam the user the instant a page loads.
      const t = setTimeout(() => setIsOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [user]);

  const dismiss = () => {
    setIsOpen(false);
    if (user) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, Date.now().toString());
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={dismiss} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent
        bg="linear-gradient(145deg, #1b1533 0%, #2a1a4a 45%, #1f2a4c 100%)"
        border="1px solid"
        borderColor="rgba(244, 211, 94, 0.35)"
        color="white"
        boxShadow="0 12px 40px rgba(224, 122, 95, 0.25)"
      >
        <ModalHeader fontSize="xl" color="#f4d35e">
          Thank you!!! 💛
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" />
        <ModalBody>
          <VStack align="stretch" spacing={4} fontSize="sm" lineHeight="1.7">
            <Text>
              Hey, quick pop-in from Lemon, the stinky dev behind the site, to say thank you from
              the bottom of their little heart. The site has grown a lot this year, and none of that
              happens without folks like you actually using and sharing it. (125,000 visitors and
              4,500 boards since January is kind of bananas, you guys. Sheesh.)
            </Text>
            <Text>
              Wild to think this started as a bingo builder for my clan and has grown into Gielinor
              Rush, Battleship, Group Dashboard (WOM group goals and monthly bounties), Team
              Balancer, Blind Draft, and more. All ad-free, no investors, no yuckiness. Just lil ol'
              me, shipping features and your beautiful clans and friends running events on top of
              them.
            </Text>
            <Text>
              Coming up in the next few months: BATTLESHIP RELEASE! And a site-wide holiday event
              that anyone can jump into, plus a steady drumbeat of new event types and polish across
              everything already here. My whole thing is making OSRS events more fun and more
              accessible for every kind of group. Clans, friend chats, ironmen, casuals, all of it.
            </Text>
            <Text>
              If the site has been useful to you, giving it a share or supporting it a bit goes a
              long way toward keeping the lights on.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" color="whiteAlpha.700" onClick={dismiss}>
            Party on
          </Button>
          <Link to="/support" onClick={dismiss}>
            <HStack
              as="span"
              spacing={2}
              bg="#f4d35e"
              color="gray.900"
              px={5}
              py={2}
              borderRadius="md"
              fontWeight="semibold"
              fontSize="sm"
              _hover={{ bg: '#f6d574' }}
            >
              <FaHeart color="#c53030" /> Support the Site
            </HStack>
          </Link>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ThankYouModal;
