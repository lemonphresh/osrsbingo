import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  SimpleGrid,
  VStack,
  Image,
  useColorMode,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import useBingoTileTheme from '../hooks/useBingoTileTheme';

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const RandomTilePickerModal = ({ isOpen, onClose, tiles, themeName, onSelectTile }) => {
  const { colorMode } = useColorMode();
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const timeoutRef = useRef(null);

  const { backgroundColor, completeBackgroundColor } = useBingoTileTheme(themeName);

  // flatten layout if it's a 2D array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const flatTiles = Array.isArray(tiles?.[0]) ? tiles.flat() : tiles || [];
  const incompleteTiles = flatTiles.filter((t) => !t.isComplete);

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const spin = useCallback(() => {
    if (isSpinning || incompleteTiles.length === 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setSelectedTile(null);

    const winnerTile = incompleteTiles[Math.floor(Math.random() * incompleteTiles.length)];
    const winnerIndex = flatTiles.findIndex((t) => t.id === winnerTile.id);

    const totalDuration = 3000;
    const startTime = Date.now();
    let lastIndex = -1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const easedProgress = easeOut(progress);
      const baseDelay = 50;
      const maxDelay = 400;
      const currentDelay = baseDelay + (maxDelay - baseDelay) * easedProgress;

      if (progress < 1) {
        // Pick a random incomplete tile different from the last one
        let randomTile;
        let randomIndex;
        do {
          randomTile = incompleteTiles[Math.floor(Math.random() * incompleteTiles.length)];
          // eslint-disable-next-line no-loop-func
          randomIndex = flatTiles.findIndex((t) => t.id === randomTile.id);
        } while (randomIndex === lastIndex && incompleteTiles.length > 1);

        lastIndex = randomIndex;
        setHighlightedIndex(randomIndex);
        timeoutRef.current = setTimeout(animate, currentDelay);
      } else {
        setHighlightedIndex(winnerIndex);
        setSelectedTile(winnerTile);
        setTimeout(() => {
          setShowResult(true);
          setIsSpinning(false);
          if (onSelectTile) onSelectTile(winnerTile);
        }, 500);
      }
    };

    animate();
  }, [isSpinning, incompleteTiles, flatTiles, onSelectTile]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(null);
      setSelectedTile(null);
      setShowResult(false);
      setIsSpinning(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  const isHighlighted = (index) => highlightedIndex === index;
  const isWinner = (tile) => selectedTile?.id === tile.id && showResult;

  const gridColumns = Math.ceil(Math.sqrt(flatTiles.length));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg={colorMode === 'dark' ? 'gray.800' : 'white'} mx={4}>
        <ModalHeader textAlign="center">
          <Text fontSize="2xl">What's my next tile?</Text>
          <Text fontSize="sm" fontWeight="normal" color="gray.500">
            {incompleteTiles.length} incomplete tiles remaining
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          {/* tile grid */}
          <SimpleGrid columns={gridColumns} spacing={2} mb={6}>
            {flatTiles.map((tile, index) => (
              <Box
                key={tile.id}
                aspectRatio="1"
                borderRadius="md"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p={2}
                position="relative"
                overflow="hidden"
                bg={
                  tile.isComplete
                    ? completeBackgroundColor
                    : isWinner(tile)
                    ? 'green.500'
                    : isHighlighted(index)
                    ? 'purple.500'
                    : backgroundColor
                }
                border={
                  isWinner(tile)
                    ? '3px solid'
                    : isHighlighted(index)
                    ? '3px solid'
                    : '2px solid transparent'
                }
                borderColor={
                  isWinner(tile) ? 'green.300' : isHighlighted(index) ? 'purple.300' : 'transparent'
                }
                boxShadow={
                  isWinner(tile)
                    ? '0 0 20px var(--chakra-colors-green-500)'
                    : isHighlighted(index)
                    ? '0 0 15px var(--chakra-colors-purple-500)'
                    : 'none'
                }
                transform={
                  isWinner(tile) ? 'scale(1.1)' : isHighlighted(index) ? 'scale(1.05)' : 'scale(1)'
                }
                opacity={tile.isComplete ? 0.6 : 1}
                transition="all 0.1s ease"
                zIndex={isWinner(tile) ? 10 : 1}
              >
                {tile.icon ? (
                  <Image
                    src={tile.icon}
                    maxH="24px"
                    maxW="24px"
                    filter={tile.isComplete ? 'grayscale(1)' : 'none'}
                  />
                ) : (
                  <Text color="black" fontSize="xl">
                    {tile.isComplete ? (
                      '✓'
                    ) : (
                      <Image
                        height="32px"
                        src="https://oldschool.runescape.wiki/images/thumb/Achievement_Diaries.png/1200px-Achievement_Diaries.png?f3803"
                        width="32px"
                      />
                    )}
                  </Text>
                )}
                <Text
                  color={tile.isComplete ? 'black' : 'white'}
                  fontSize="xs"
                  textAlign="center"
                  mt={1}
                  noOfLines={2}
                >
                  {tile.name}
                </Text>

                {/* Winner shimmer effect */}
                {isWinner(tile) && (
                  <Box
                    position="absolute"
                    inset={0}
                    bgGradient="linear(45deg, transparent 40%, whiteAlpha.300 50%, transparent 60%)"
                    animation={`${shimmer} 1.5s infinite`}
                  />
                )}
              </Box>
            ))}
          </SimpleGrid>

          {/* result */}
          {showResult && selectedTile && (
            <Box
              bg="green.300"
              borderRadius="lg"
              p={4}
              mb={4}
              textAlign="center"
              border="2px solid"
              borderColor="green.200"
              animation={`${fadeIn} 0.3s ease`}
            >
              <Text fontSize="sm" color="green.800" mb={1}>
                Get to grinding! You're working on this tile:
              </Text>
              <VStack spacing={2}>
                {selectedTile.icon && <Image src={selectedTile.icon} maxH="32px" maxW="32px" />}
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  {selectedTile.name}
                </Text>
              </VStack>
            </Box>
          )}

          <Button
            w="full"
            size="lg"
            colorScheme={isSpinning ? 'gray' : 'yellow'}
            onClick={spin}
            isDisabled={isSpinning || incompleteTiles.length === 0}
            _hover={{ transform: isSpinning ? 'none' : 'scale(1.02)' }}
          >
            {isSpinning ? 'Choosing...' : '🎲 Pick Random Tile!'}
          </Button>

          {incompleteTiles.length === 0 && (
            <Text textAlign="center" mt={4} color="green.400">
              🎉 Congratulations! All tiles complete!
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RandomTilePickerModal;
