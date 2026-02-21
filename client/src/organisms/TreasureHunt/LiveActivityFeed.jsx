import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  useColorMode,
  Icon,
  Flex,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon, StarIcon } from '@chakra-ui/icons';
import { FaCrown, FaFire, FaTrophy, FaCoins } from 'react-icons/fa';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import VictoryOverlay from './VictoryOverlay';
import DevTestPanel from './DevTestPanel';

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (frequency, duration, startTime) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Celebratory sound sequence
    const now = audioContext.currentTime;
    playTone(800, 0.15, now);
    playTone(1000, 0.15, now + 0.1);
    playTone(1200, 0.2, now + 0.2);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

const playVictorySound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (frequency, duration, startTime, gain = 0.15) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Triumphant fanfare melody
    const now = audioContext.currentTime;
    // First chord (C major)
    playTone(523.25, 0.3, now, 0.12); // C5
    playTone(659.25, 0.3, now, 0.1); // E5
    playTone(783.99, 0.3, now, 0.1); // G5

    // Second chord (G major)
    playTone(587.33, 0.3, now + 0.25, 0.12); // D5
    playTone(739.99, 0.3, now + 0.25, 0.1); // F#5
    playTone(880.0, 0.3, now + 0.25, 0.1); // A5

    // Final chord (C major high)
    playTone(783.99, 0.5, now + 0.5, 0.15); // G5
    playTone(987.77, 0.5, now + 0.5, 0.12); // B5
    playTone(1046.5, 0.6, now + 0.5, 0.15); // C6

    // Flourish
    playTone(1318.51, 0.4, now + 0.8, 0.1); // E6
    playTone(1567.98, 0.6, now + 1.0, 0.12); // G6
  } catch (error) {
    console.log('Could not play victory sound:', error);
  }
};

const LiveActivityFeed = ({
  teams = [],
  event,
  onTeamActivity,
  className = '',
  maxActivities = 10,
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [victoryData, setVictoryData] = useState(null);

  // Use WebSocket subscription instead of local state monitoring
  const { activities, loading, error } = useActivityFeed(event?.eventId, teams);

  const colors = {
    dark: {
      purple: { base: '#7D5FFF' },
      turquoise: { base: '#28AFB0' },
      orange: { base: '#FF914D' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      green: { base: '#68D391' },
      yellow: { base: '#F6E05E' },
    },
    light: {
      purple: { base: '#7D5FFF' },
      turquoise: { base: '#28AFB0' },
      orange: { base: '#FF914D' },
      textColor: '#171923',
      cardBg: 'white',
      green: { base: '#48BB78' },
      yellow: { base: '#D69E2E' },
    },
  };

  const currentColors = colors[colorMode];

  // Team colors for consistency
  const PRESET_COLORS = useMemo(
    () => [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
    ],
    []
  );

  const getTeamColor = useCallback(
    (teamIndex) => {
      return PRESET_COLORS[teamIndex % PRESET_COLORS.length];
    },
    [PRESET_COLORS]
  );

  const getTeamInitials = (teamName) => {
    const words = teamName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return teamName.substring(0, 2).toUpperCase();
  };

  const formatGP = (gp) => {
    if (!gp) return '0';
    if (gp >= 1000000) return (gp / 1000000).toFixed(1) + 'M';
    if (gp >= 1000) return (gp / 1000).toFixed(0) + 'K';
    return gp.toString();
  };

  const triggerConfetti = useCallback(() => {
    // Add keyframes if not exists
    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
      @keyframes confettiFall {
        0% {
          transform: translateY(0) rotateZ(0deg) scale(1);
          opacity: 1;
        }
        25% {
          transform: translateY(25vh) rotateZ(180deg) scale(1.2);
        }
        50% {
          transform: translateY(50vh) rotateZ(360deg) scale(0.8);
        }
        75% {
          transform: translateY(75vh) rotateZ(540deg) scale(1.1);
        }
        100% {
          transform: translateY(120vh) rotateZ(720deg) scale(0.5);
          opacity: 0;
        }
      }
      @keyframes confettiSideways {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(30px); }
        75% { transform: translateX(-30px); }
      }
    `;
      document.head.appendChild(style);
    }

    const shapes = ['circle', 'square', 'triangle', 'star'];
    const confettiColors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#FF69B4',
      '#00FF00',
      '#FFD700',
      '#FF4500',
      '#9400D3',
      '#00FFFF',
      '#FF1493',
      '#7FFF00',
      '#DC143C',
      '#00CED1',
    ];

    const createConfettiPiece = () => {
      const confetti = document.createElement('div');
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const size = 8 + Math.random() * 16;
      const startX = Math.random() * window.innerWidth;
      const duration = 2 + Math.random() * 3;
      const delay = Math.random() * 0.5;

      let shapeStyles = '';
      let glowStyle = `box-shadow: 0 0 ${size / 2}px ${color};`;

      if (shape === 'circle') {
        shapeStyles = 'border-radius: 50%;';
      } else if (shape === 'square') {
        shapeStyles = 'border-radius: 2px;';
      } else if (shape === 'triangle') {
        shapeStyles = `
      width: 0 !important;
      height: 0 !important;
      border-left: ${size / 2}px solid transparent;
      border-right: ${size / 2}px solid transparent;
      border-bottom: ${size}px solid ${color};
      background: transparent !important;
    `;
        glowStyle = `filter: drop-shadow(0 0 ${size / 3}px ${color});`;
      } else if (shape === 'star') {
        shapeStyles = `
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    `;
      }

      confetti.style.cssText = `
    position: fixed;
    width: ${size}px;
    height: ${size}px;
    background-color: ${color};
    pointer-events: none;
    z-index: 9999;
    left: ${startX}px;
    top: -20px;
    animation: confettiFall ${duration}s ease-out ${delay}s forwards;
    ${glowStyle}
    ${shapeStyles}
  `;

      // Add wobble with JS animation for better effect
      const wobbleAmount = 30 + Math.random() * 50;
      let wobblePos = 0;
      const wobbleInterval = setInterval(() => {
        wobblePos += 0.15;
        const xOffset = Math.sin(wobblePos) * wobbleAmount;
        confetti.style.left = `${startX + xOffset}px`;
      }, 16);

      document.body.appendChild(confetti);

      setTimeout(() => {
        clearInterval(wobbleInterval);
        confetti.remove();
      }, (duration + delay) * 1000 + 100);
    };

    const createEmojiExplosion = () => {
      const emojis = ['🎉', '🎊', '🏆', '💰', '⭐', '🔥', '💎', '👑', '🚀', '✨'];

      for (let i = 0; i < 20; i++) {
        const emoji = document.createElement('div');
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const startX = Math.random() * window.innerWidth;
        const size = 20 + Math.random() * 30;
        const duration = 2 + Math.random() * 2;
        const delay = Math.random() * 0.3;

        emoji.textContent = randomEmoji;
        emoji.style.cssText = `
        position: fixed;
        font-size: ${size}px;
        left: ${startX}px;
        top: -50px;
        pointer-events: none;
        z-index: 10001;
        animation: confettiFall ${duration}s ease-out ${delay}s forwards;
      `;

        document.body.appendChild(emoji);
        setTimeout(() => emoji.remove(), (duration + delay) * 1000 + 100);
      }
    };

    // UNLEASH THE CHAOS
    createEmojiExplosion();

    // Main confetti storm - 150 pieces
    for (let i = 0; i < 150; i++) {
      setTimeout(() => createConfettiPiece(), i * 20);
    }

    // Second wave after 500ms
    setTimeout(() => {
      for (let i = 0; i < 75; i++) {
        setTimeout(() => createConfettiPiece(), i * 25);
      }
    }, 500);

    // Third wave
    setTimeout(() => {
      createEmojiExplosion();
    }, 1000);
  }, []);

  const triggerMegaConfetti = useCallback(() => {
    // First, trigger the normal confetti 3 times
    triggerConfetti();
    setTimeout(() => triggerConfetti(), 300);
    setTimeout(() => triggerConfetti(), 600);

    // Add firework bursts from corners
    const createFirework = (startX, startY) => {
      const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFD700', '#FFFFFF'];

      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        const angle = (i / 30) * Math.PI * 2;
        const velocity = 100 + Math.random() * 150;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 4 + Math.random() * 8;

        particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${startX}px;
        top: ${startY}px;
        pointer-events: none;
        z-index: 10000;
        box-shadow: 0 0 ${size}px ${color};
      `;

        document.body.appendChild(particle);

        // Animate outward
        let progress = 0;
        const animate = () => {
          progress += 0.02;
          const x = startX + Math.cos(angle) * velocity * progress;
          const y = startY + Math.sin(angle) * velocity * progress + progress * progress * 200; // gravity
          const opacity = 1 - progress;

          particle.style.left = `${x}px`;
          particle.style.top = `${y}px`;
          particle.style.opacity = opacity;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            particle.remove();
          }
        };

        requestAnimationFrame(animate);
      }
    };

    // Launch fireworks from corners
    setTimeout(() => createFirework(100, window.innerHeight - 100), 200);
    setTimeout(() => createFirework(window.innerWidth - 100, window.innerHeight - 100), 400);
    setTimeout(() => createFirework(window.innerWidth / 2, window.innerHeight - 50), 600);
    setTimeout(() => createFirework(100, window.innerHeight - 100), 1000);
    setTimeout(() => createFirework(window.innerWidth - 100, window.innerHeight - 100), 1200);
  }, [triggerConfetti]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'team_victory':
        return FaTrophy;
      case 'node_completed':
        return CheckCircleIcon;
      case 'inn_visited':
        return FaCoins;
      case 'gp_gained':
        return FaTrophy;
      case 'submission_approved':
        return CheckCircleIcon;
      case 'submission_denied':
        return TimeIcon;
      case 'team_created':
        return FaCrown;
      case 'buff_applied':
        return StarIcon;
      case 'leaderboard_change':
        return FaCrown;
      default:
        return TimeIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'team_victory':
        return '#FFD700';
      case 'node_completed':
        return currentColors.green.base;
      case 'inn_visited':
        return currentColors.yellow.base;
      case 'gp_gained':
        return currentColors.orange;
      case 'submission_approved':
        return currentColors.green.base;
      case 'submission_denied':
        return '#FF6B6B';
      case 'team_created':
        return currentColors.purple.base;
      case 'buff_applied':
        return currentColors.purple.base;
      case 'leaderboard_change':
        return '#FFD700';
      default:
        return currentColors.turquoise.base;
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'team_victory':
        return `🏆 ${activity.team.teamName} HAS FINISHED!`;
      case 'node_completed':
        return `🎯 ${activity.team.teamName} completed a node!`;
      case 'inn_visited':
        return `🏪 ${activity.team.teamName} visited an Inn!`;
      case 'gp_gained':
        return `💰 ${activity.team.teamName} earned GP!`;
      case 'submission_approved':
        return `✅ ${activity.team.teamName} submission approved!`;
      case 'submission_denied':
        return `❌ ${activity.team.teamName} submission denied`;
      case 'team_created':
        return `👥 ${activity.team.teamName} joined!`;
      default:
        return `⚡ ${activity.team.teamName} activity`;
    }
  };

  const getActivityDescription = useCallback((activity) => {
    switch (activity.type) {
      case 'node_completed':
        const diffText =
          activity.difficulty === 1
            ? 'Easy'
            : activity.difficulty === 3
            ? 'Medium'
            : activity.difficulty === 5
            ? 'Hard'
            : '';
        return `${diffText} ${activity.nodeTitle} (+${formatGP(activity.reward)} GP)`;
      case 'inn_visited':
        const keysText = Array.isArray(activity.keysSpent)
          ? `${activity.keysSpent.reduce((sum, k) => sum + k.quantity, 0)} keys`
          : '';
        return `Spent ${keysText} for ${formatGP(activity.gpEarned)} GP`;
      case 'submission_approved':
        return `${activity.nodeTitle} submission approved by ${activity.reviewedBy}`;
      case 'submission_denied':
        return `${activity.nodeTitle} - ${activity.denialReason || 'No reason provided'}`;
      case 'team_created':
        return `Joined the competition with ${activity.memberCount} members`;
      case 'buff_applied':
        return `Applied ${activity.buffName} to ${activity.nodeName}`;
      case 'gp_gained':
        return `+${formatGP(activity.amount)} GP (Total: ${formatGP(activity.newTotal)})`;
      case 'team_victory':
        return `Completed all nodes with ${formatGP(activity.finalGP)} GP! ${
          activity.isFirstToFinish ? '🥇 First to finish!' : ''
        }`;
      default:
        return '';
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  // Trigger effects when new activities come in
  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = activities[0];
      const isRecent = new Date() - latestActivity.timestamp < 5000;

      // Handle team victory
      if (isRecent && latestActivity.type === 'team_victory') {
        // MEGA celebration!
        triggerMegaConfetti();
        playVictorySound();

        // Show victory overlay
        setVictoryData({
          teamName: latestActivity.team.teamName,
          teamColor: latestActivity.teamColor || '#FFD700',
          finalGP: latestActivity.finalGP,
          nodesCompleted: latestActivity.nodesCompleted,
          totalNodes: latestActivity.totalNodes,
          rank: latestActivity.rank || 1,
          isFirstToFinish: latestActivity.isFirstToFinish,
          eventName: event?.eventName,
        });

        return; // Don't show regular toast for victory
      }

      // Regular activity handling (existing code)
      if (isRecent && ['node_completed', 'inn_visited'].includes(latestActivity.type)) {
        triggerConfetti();
        playNotificationSound();

        toast({
          title: getActivityTitle(latestActivity),
          description: getActivityDescription(latestActivity),
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      }

      if (onTeamActivity && isRecent) {
        onTeamActivity(latestActivity);
      }
    }
  }, [
    activities,
    toast,
    triggerConfetti,
    triggerMegaConfetti,
    onTeamActivity,
    getActivityDescription,
    event?.eventName,
  ]);

  // Log connection errors
  if (error) {
    console.error('Activity feed WebSocket error:', error);
  }

  if (!teams?.length) {
    return (
      <Card bg={currentColors.cardBg} className={className}>
        <CardBody>
          <Text color={currentColors.textColor} textAlign="center" py={4}>
            No teams yet
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card bg={currentColors.cardBg} className={className}>
        <DevTestPanel />
        <CardBody>
          <VStack align="stretch" h="100%" spacing={4}>
            {/* Header */}
            <HStack justify="space-between">
              <HStack>
                <Icon as={FaFire} color={currentColors.orange} boxSize={5} />
                <Text fontWeight="bold" color={currentColors.textColor} fontSize="lg">
                  Live Activity
                </Text>
                {activities.length > 0 && (
                  <Badge colorScheme="green" variant="subtle" fontSize="xs">
                    {activities.length} recent
                  </Badge>
                )}
                {loading && (
                  <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                    Connecting...
                  </Badge>
                )}
              </HStack>
              <HStack spacing={2}>
                {teams.slice(0, 5).map((team, idx) => (
                  <Tooltip key={team.teamId} label={team.teamName}>
                    <Box
                      w="24px"
                      h="24px"
                      bg={getTeamColor(idx)}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xs"
                      color="white"
                      fontWeight="bold"
                    >
                      {getTeamInitials(team.teamName)}
                    </Box>
                  </Tooltip>
                ))}
              </HStack>
            </HStack>

            {/* Loading State */}
            {loading && (
              <Text color="gray.500" fontSize="sm" textAlign="center">
                Connecting to live feed...
              </Text>
            )}

            {/* Error State */}
            {error && (
              <Text color="red.400" fontSize="sm" textAlign="center">
                Connection error - activities may be delayed
              </Text>
            )}

            {/* Activity List */}
            {activities.length === 0 && !loading ? (
              <VStack align="center" justify="center" h="100%" py={8} spacing={2}>
                <Icon as={TimeIcon} boxSize={8} color="gray.400" />
                <Text color="gray.500" fontSize="sm">
                  No recent activity
                </Text>
                <Text color="gray.400" fontSize="xs" textAlign="center">
                  Node completions and major events will appear here
                </Text>
              </VStack>
            ) : (
              <VStack
                align="stretch"
                spacing={2}
                maxH="300px"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#abb8ceff',
                    borderRadius: '10px',
                    '&:hover': {
                      background: '#718096',
                    },
                  },
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#abb8ceff transparent',
                }}
              >
                {activities.slice(0, maxActivities).map((activity) => {
                  // Find team index for color consistency
                  const teamIndex = teams.findIndex((t) => t.teamId === activity.teamId);

                  return (
                    <HStack
                      key={activity.id}
                      p={3}
                      bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50'}
                      borderRadius="md"
                      borderLeft="3px solid"
                      borderLeftColor={getActivityColor(activity.type)}
                      spacing={3}
                      transition="all 0.2s"
                      _hover={{
                        bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.100',
                      }}
                    >
                      {/* Team Avatar */}
                      <Box
                        w="32px"
                        h="32px"
                        bg={getTeamColor(teamIndex)}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="xs"
                        color="white"
                        fontWeight="bold"
                        flexShrink={0}
                      >
                        {getTeamInitials(activity.team.teamName)}
                      </Box>

                      {/* Activity Content */}
                      <Flex direction="column" flex={1} minW={0}>
                        <HStack spacing={2} align="center">
                          <Icon
                            as={getActivityIcon(activity.type)}
                            color={getActivityColor(activity.type)}
                            boxSize={4}
                            flexShrink={0}
                          />
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color={currentColors.textColor}
                            noOfLines={1}
                          >
                            {getActivityTitle(activity).replace(`${activity.team.teamName} `, '')}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" ml={2} color="gray.500" noOfLines={1}>
                          {getActivityDescription(activity)}
                        </Text>
                      </Flex>

                      {/* Timestamp */}
                      <Text
                        fontSize="xs"
                        color="gray.400"
                        flexShrink={0}
                        textAlign="right"
                        minW="60px"
                      >
                        {formatTimeAgo(activity.timestamp)}
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>
      <VictoryOverlay
        isOpen={!!victoryData}
        onClose={() => setVictoryData(null)}
        {...victoryData}
      />
    </>
  );
};

export default LiveActivityFeed;
