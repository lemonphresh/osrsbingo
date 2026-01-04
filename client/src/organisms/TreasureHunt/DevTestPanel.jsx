import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  HStack,
  Box,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaTrophy, FaBug, FaCheck, FaTimes, FaGift } from 'react-icons/fa';
import VictoryOverlay from './VictoryOverlay';
import {
  triggerMiniConfetti,
  triggerEmojiBurst,
  triggerRewardFloat,
  playSuccessSound,
  playApprovalSound,
  playDenialSound,
  celebrateSubmissionApproved,
  celebrateNodeCompleted,
  celebrateSubmissionDenied,
} from '../../utils/celebrationUtils';

// Mock team data for testing
const MOCK_TEAMS = [
  { teamName: 'Dragon Slayers', teamColor: '#FF6B6B', finalGP: 2450000 },
  { teamName: 'Iron Warriors', teamColor: '#4ECDC4', finalGP: 1875000 },
  { teamName: 'Maxed Mains', teamColor: '#45B7D1', finalGP: 3200000 },
  { teamName: 'GE Flippers', teamColor: '#96CEB4', finalGP: 5500000 },
];

// ============================================
// VICTORY CONFETTI & SOUND (Mega version)
// ============================================

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

    const now = audioContext.currentTime;
    playTone(523.25, 0.3, now, 0.12);
    playTone(659.25, 0.3, now, 0.1);
    playTone(783.99, 0.3, now, 0.1);
    playTone(587.33, 0.3, now + 0.25, 0.12);
    playTone(739.99, 0.3, now + 0.25, 0.1);
    playTone(880.0, 0.3, now + 0.25, 0.1);
    playTone(783.99, 0.5, now + 0.5, 0.15);
    playTone(987.77, 0.5, now + 0.5, 0.12);
    playTone(1046.5, 0.6, now + 0.5, 0.15);
    playTone(1318.51, 0.4, now + 0.8, 0.1);
    playTone(1567.98, 0.6, now + 1.0, 0.12);
  } catch (error) {
    console.log('Could not play victory sound:', error);
  }
};

const triggerConfetti = () => {
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) rotateZ(0deg) scale(1); opacity: 1; }
        25% { transform: translateY(25vh) rotateZ(180deg) scale(1.2); }
        50% { transform: translateY(50vh) rotateZ(360deg) scale(0.8); }
        75% { transform: translateY(75vh) rotateZ(540deg) scale(1.1); }
        100% { transform: translateY(120vh) rotateZ(720deg) scale(0.5); opacity: 0; }
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

    if (shape === 'circle') shapeStyles = 'border-radius: 50%;';
    else if (shape === 'square') shapeStyles = 'border-radius: 2px;';
    else if (shape === 'triangle') {
      shapeStyles = `width: 0 !important; height: 0 !important;
        border-left: ${size / 2}px solid transparent;
        border-right: ${size / 2}px solid transparent;
        border-bottom: ${size}px solid ${color};
        background: transparent !important;`;
      glowStyle = `filter: drop-shadow(0 0 ${size / 3}px ${color});`;
    } else if (shape === 'star') {
      shapeStyles = `clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);`;
    }

    confetti.style.cssText = `
      position: fixed; width: ${size}px; height: ${size}px;
      background-color: ${color}; pointer-events: none; z-index: 9999;
      left: ${startX}px; top: -20px;
      animation: confettiFall ${duration}s ease-out ${delay}s forwards;
      ${glowStyle} ${shapeStyles}
    `;

    const wobbleAmount = 30 + Math.random() * 50;
    let wobblePos = 0;
    const wobbleInterval = setInterval(() => {
      wobblePos += 0.15;
      confetti.style.left = `${startX + Math.sin(wobblePos) * wobbleAmount}px`;
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
      emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const startX = Math.random() * window.innerWidth;
      const size = 20 + Math.random() * 30;
      const duration = 2 + Math.random() * 2;
      const delay = Math.random() * 0.3;

      emoji.style.cssText = `
        position: fixed; font-size: ${size}px; left: ${startX}px; top: -50px;
        pointer-events: none; z-index: 10001;
        animation: confettiFall ${duration}s ease-out ${delay}s forwards;
      `;
      document.body.appendChild(emoji);
      setTimeout(() => emoji.remove(), (duration + delay) * 1000 + 100);
    }
  };

  createEmojiExplosion();
  for (let i = 0; i < 150; i++) setTimeout(() => createConfettiPiece(), i * 20);
  setTimeout(() => {
    for (let i = 0; i < 75; i++) setTimeout(() => createConfettiPiece(), i * 25);
  }, 500);
  setTimeout(() => createEmojiExplosion(), 1000);
};

const triggerMegaConfetti = () => {
  triggerConfetti();
  setTimeout(() => triggerConfetti(), 300);
  setTimeout(() => triggerConfetti(), 600);

  const createFirework = (startX, startY) => {
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'];
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      const angle = (i / 30) * Math.PI * 2;
      const velocity = 100 + Math.random() * 150;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 4 + Math.random() * 8;

      particle.style.cssText = `
        position: fixed; width: ${size}px; height: ${size}px;
        background: ${color}; border-radius: 50%;
        left: ${startX}px; top: ${startY}px;
        pointer-events: none; z-index: 10000;
        box-shadow: 0 0 ${size}px ${color};
      `;
      document.body.appendChild(particle);

      let progress = 0;
      const animate = () => {
        progress += 0.02;
        particle.style.left = `${startX + Math.cos(angle) * velocity * progress}px`;
        particle.style.top = `${
          startY + Math.sin(angle) * velocity * progress + progress * progress * 200
        }px`;
        particle.style.opacity = 1 - progress;
        if (progress < 1) requestAnimationFrame(animate);
        else particle.remove();
      };
      requestAnimationFrame(animate);
    }
  };

  setTimeout(() => createFirework(100, window.innerHeight - 100), 200);
  setTimeout(() => createFirework(window.innerWidth - 100, window.innerHeight - 100), 400);
  setTimeout(() => createFirework(window.innerWidth / 2, window.innerHeight - 50), 600);
  setTimeout(() => createFirework(100, window.innerHeight - 100), 1000);
  setTimeout(() => createFirework(window.innerWidth - 100, window.innerHeight - 100), 1200);
};

// ============================================
// DEV TEST PANEL COMPONENT
// ============================================

const DevTestPanel = ({
  teams = MOCK_TEAMS,
  eventName = 'Summer Treasure Hunt 2025',
  totalNodes = 45,
  show = true,
}) => {
  const { colorMode } = useColorMode();
  const [victoryData, setVictoryData] = useState(null);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') return null;
  if (!show) return null;

  const triggerVictory = (team, rank = 1, isFirstToFinish = true) => {
    triggerMegaConfetti();
    playVictorySound();
    setVictoryData({
      teamName: team.teamName,
      teamColor: team.teamColor,
      finalGP: team.finalGP,
      nodesCompleted: Math.floor(totalNodes / 3),
      totalNodes,
      rank,
      isFirstToFinish,
      eventName,
    });
  };

  const triggerRandomVictory = () => {
    const randomTeam = teams[Math.floor(Math.random() * teams.length)];
    const randomRank = Math.floor(Math.random() * teams.length) + 1;
    triggerVictory(randomTeam, randomRank, randomRank === 1);
  };

  const menuItemHover = { bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100' };

  return (
    <>
      <Box color="gray.500" position="fixed" bottom="16px" right="16px" zIndex={9998}>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            leftIcon={<FaBug />}
            size="sm"
            colorScheme="purple"
            variant="solid"
            boxShadow="lg"
          >
            Dev Tools
          </MenuButton>
          <MenuList
            bg={colorMode === 'dark' ? '#2D3748' : 'white'}
            borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200'}
            maxH="400px"
            overflowY="auto"
          >
            {/* Victory Section */}
            <MenuGroup title="🏆 Victory" color="gray.500">
              <MenuItem
                icon={<FaTrophy color="#FFD700" />}
                onClick={triggerRandomVictory}
                _hover={menuItemHover}
              >
                Random Team Victory
              </MenuItem>
              {teams.map((team, idx) => (
                <MenuItem
                  key={team.teamName}
                  onClick={() => triggerVictory(team, idx + 1, idx === 0)}
                  _hover={menuItemHover}
                >
                  <HStack spacing={3}>
                    <Box w="10px" h="10px" bg={team.teamColor} borderRadius="full" />
                    <Text fontSize="sm">{team.teamName}</Text>
                    {idx === 0 && (
                      <Text fontSize="xs" color="yellow.500">
                        🥇
                      </Text>
                    )}
                  </HStack>
                </MenuItem>
              ))}
            </MenuGroup>

            <MenuDivider />

            {/* Celebrations Section */}
            <MenuGroup title="🎉 Celebrations" color="gray.500">
              <MenuItem
                icon={<FaCheck color="#48BB78" />}
                onClick={() => celebrateSubmissionApproved('Test Node', 500000)}
                _hover={menuItemHover}
              >
                Submission Approved
              </MenuItem>
              <MenuItem
                icon={<FaTimes color="#F56565" />}
                onClick={() => celebrateSubmissionDenied()}
                _hover={menuItemHover}
              >
                Submission Denied
              </MenuItem>
              <MenuItem
                icon={<FaGift color="#9F7AEA" />}
                onClick={() =>
                  celebrateNodeCompleted('Test Node', 1500000, [{ color: 'gold', quantity: 2 }])
                }
                _hover={menuItemHover}
              >
                Node Completed
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            {/* Individual Effects Section */}
            <MenuGroup title="✨ Effects" color="gray.500">
              <MenuItem onClick={() => triggerMiniConfetti()} _hover={menuItemHover}>
                🎊 Mini Confetti
              </MenuItem>
              <MenuItem onClick={() => triggerEmojiBurst('🎯', 8)} _hover={menuItemHover}>
                🎯 Emoji Burst
              </MenuItem>
              <MenuItem onClick={() => triggerRewardFloat('+1.5M GP')} _hover={menuItemHover}>
                💰 GP Float
              </MenuItem>
              <MenuItem onClick={() => playSuccessSound()} _hover={menuItemHover}>
                🔊 Success Sound
              </MenuItem>
              <MenuItem onClick={() => playApprovalSound()} _hover={menuItemHover}>
                🔊 Approval Sound
              </MenuItem>
              <MenuItem onClick={() => playDenialSound()} _hover={menuItemHover}>
                🔊 Denial Sound
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
      </Box>

      <VictoryOverlay
        isOpen={!!victoryData}
        onClose={() => setVictoryData(null)}
        {...victoryData}
      />
    </>
  );
};

export default DevTestPanel;
