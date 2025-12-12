// File: src/organisms/TreasureHunt/VictoryOverlay.jsx
import React, { useEffect, useState } from 'react';
import { Box, VStack, HStack, Text, Button, Icon, useColorMode } from '@chakra-ui/react';
import { FaTrophy, FaCrown, FaCoins } from 'react-icons/fa';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';

// Animations
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const shine = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const slideUp = keyframes`
  0% { transform: translateY(100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const VictoryOverlay = ({
  isOpen,
  onClose,
  teamName,
  teamColor = '#FFD700',
  finalGP,
  nodesCompleted,
  totalNodes,
  rank = 1,
  isFirstToFinish = false,
  eventName,
}) => {
  const { colorMode } = useColorMode();
  const [showStats, setShowStats] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (isOpen) {
      // Delay showing stats for dramatic effect
      const statsTimer = setTimeout(() => setShowStats(true), 1000);

      // Auto-close countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(statsTimer);
        clearInterval(countdownInterval);
      };
    } else {
      setShowStats(false);
      setCountdown(15);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatGP = (gp) => {
    if (!gp) return '0';
    if (gp >= 1000000) return (gp / 1000000).toFixed(1) + 'M';
    if (gp >= 1000) return (gp / 1000).toFixed(0) + 'K';
    return gp.toString();
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  const getRankText = (rank) => {
    switch (rank) {
      case 1:
        return '1st Place!';
      case 2:
        return '2nd Place!';
      case 3:
        return '3rd Place!';
      default:
        return `${rank}th Place!`;
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={10000}
      bg="blackAlpha.900"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      {/* Animated background rays */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        width="200vmax"
        height="200vmax"
        background={`conic-gradient(from 0deg, transparent, ${teamColor}22, transparent, ${teamColor}22, transparent)`}
        animation={`spin 20s linear infinite`}
        sx={{
          '@keyframes spin': {
            '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
            '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
          },
        }}
      />

      {/* Main content */}
      <VStack
        spacing={6}
        p={8}
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        borderRadius="2xl"
        boxShadow="0 0 100px rgba(255, 215, 0, 0.5)"
        border="4px solid"
        borderColor={teamColor}
        maxW="500px"
        w="90%"
        position="relative"
        onClick={(e) => e.stopPropagation()}
        animation={`${slideUp} 0.5s ease-out`}
      >
        {/* Trophy Icon */}
        <Box animation={`${float} 2s ease-in-out infinite`} fontSize="80px">
          <Icon
            as={FaTrophy}
            color={rank === 1 ? 'yellow.400' : rank === 2 ? 'gray.400' : 'orange.400'}
            filter="drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))"
          />
        </Box>

        {/* Victory Text */}
        <VStack spacing={2}>
          <Text
            fontSize="4xl"
            fontWeight="black"
            bgGradient="linear(to-r, yellow.400, orange.400, yellow.400)"
            bgClip="text"
            bgSize="200% auto"
            animation={`${shine} 3s linear infinite`}
            textAlign="center"
          >
            {isFirstToFinish ? '🎉 VICTORY! 🎉' : '🏆 FINISHED! 🏆'}
          </Text>

          <HStack spacing={2}>
            <Box
              w="40px"
              h="40px"
              bg={teamColor}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FaCrown} color="white" />
            </Box>
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={colorMode === 'dark' ? 'white' : 'gray.800'}
            >
              {teamName}
            </Text>
          </HStack>

          <Text fontSize="xl" color="gray.500">
            {getRankEmoji(rank)} {getRankText(rank)}
          </Text>
        </VStack>

        {/* Stats */}
        {showStats && (
          <HStack
            spacing={8}
            p={4}
            bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100'}
            borderRadius="lg"
            animation={`${slideUp} 0.5s ease-out`}
          >
            <VStack spacing={1}>
              <Icon as={FaCoins} color="yellow.400" boxSize={6} />
              <Text fontSize="2xl" fontWeight="bold" color="green.400">
                {formatGP(finalGP)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                GP Earned
              </Text>
            </VStack>

            <Box h="60px" w="1px" bg="gray.500" />

            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color={colorMode === 'dark' ? 'white' : 'gray.800'}
              >
                {nodesCompleted}/{totalNodes}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Nodes
              </Text>
            </VStack>
          </HStack>
        )}

        {/* Event name */}
        <Text fontSize="sm" color="gray.500">
          {eventName}
        </Text>

        {/* Close button */}
        <Button
          colorScheme="yellow"
          size="lg"
          onClick={onClose}
          animation={`${pulse} 2s ease-in-out infinite`}
        >
          Yay! ({countdown}s)
        </Button>

        {isFirstToFinish && (
          <Text fontSize="xs" color="green.400" fontWeight="bold">
            🌟 First team to complete all nodes!
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default VictoryOverlay;
