import React from 'react';
import { Box, VStack, HStack, Text, Badge, Card, CardBody } from '@chakra-ui/react';
import { CheckCircleIcon, LockIcon, QuestionIcon } from '@chakra-ui/icons';

// Component to render redacted/blocked text for locked content
const RedactedText = ({ length = 'medium', inline = false, colorMode = 'dark' }) => {
  const widths = {
    short: '60px',
    medium: '120px',
    long: '180px',
    full: '100%',
  };

  const redactedBg = colorMode === 'dark' ? '#1A202C' : '#E2E8F0';
  const shimmerColor = colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <Box
      as={inline ? 'span' : 'div'}
      display="inline-block"
      bg={redactedBg}
      borderRadius="2px"
      height={inline ? '1em' : '1.2em'}
      width={widths[length] || widths.medium}
      position="relative"
      overflow="hidden"
      _after={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        animation: 'shimmer 2s infinite',
      }}
      sx={{
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      }}
    />
  );
};

// Example of how to render a locked node card
const LockedNodeCard = ({ node, currentColors, colorMode, theme }) => {
  return (
    <Card
      bg={currentColors.cardBg}
      borderWidth={2}
      borderColor={currentColors.gray || '#4A5568'}
      cursor="not-allowed"
      opacity={0.7}
      transition="all 0.2s"
      position="relative"
    >
      <CardBody>
        <HStack justify="space-between" align="start">
          <HStack spacing={4} flex={1}>
            <LockIcon color="gray.400" boxSize={6} />

            <VStack align="start" spacing={2} flex={1}>
              <HStack>
                <RedactedText length="long" colorMode={colorMode} />
                <Badge bg="gray.500" color="white" px={2} borderRadius="md">
                  LOCKED
                </Badge>
              </HStack>

              <VStack align="start" spacing={1} w="full">
                <RedactedText length="full" colorMode={colorMode} />
                <RedactedText length="long" colorMode={colorMode} />
              </VStack>
            </VStack>
          </HStack>

          {/* Redacted rewards */}
          <VStack align="end" spacing={1}>
            <RedactedText length="short" colorMode={colorMode} />
            <HStack spacing={1}>
              <RedactedText length="short" colorMode={colorMode} />
            </HStack>
          </VStack>
        </HStack>

        {/* Blur overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={colorMode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}
          backdropFilter="blur(2px)"
          borderRadius="md"
          pointerEvents="none"
        />
      </CardBody>
    </Card>
  );
};

// Example of how to render an available/completed node card
const UnlockedNodeCard = ({
  node,
  status,
  currentColors,
  colorMode,
  theme,
  formatGP,
  getNodeBorderColor,
  handleNodeClick,
}) => {
  return (
    <Card
      bg={currentColors.cardBg}
      borderWidth={2}
      borderColor={getNodeBorderColor(status, node.nodeType)}
      cursor="pointer"
      onClick={() => handleNodeClick(node)}
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      <CardBody>
        <HStack justify="space-between" align="start">
          <HStack spacing={4} flex={1}>
            {status === 'completed' && (
              <CheckCircleIcon color={currentColors.green.base} boxSize={6} />
            )}
            {status === 'available' && (
              <QuestionIcon color={currentColors.turquoise.base} boxSize={6} />
            )}

            <VStack align="start" spacing={2} flex={1}>
              <HStack>
                <Text fontWeight="semibold" fontSize="lg" color={currentColors.textColor}>
                  {node.title}
                </Text>
                <Badge
                  bg={getNodeBorderColor(status, node.nodeType)}
                  color="white"
                  px={2}
                  borderRadius="md"
                >
                  {node.nodeType}
                </Badge>
              </HStack>

              <Text fontSize="sm" color={theme.colors.gray[600]}>
                {node.description}
              </Text>
            </VStack>
          </HStack>

          {node.rewards && (
            <VStack align="end" spacing={1}>
              <Text fontWeight="semibold" color={currentColors.green.base}>
                {formatGP(node.rewards.gp)}
              </Text>
              {node.rewards.keys && node.rewards.keys.length > 0 && (
                <HStack spacing={1}>
                  {node.rewards.keys.map((key, idx) => (
                    <Badge key={idx} colorScheme={key.color} size="sm">
                      {key.quantity} {key.color}
                    </Badge>
                  ))}
                </HStack>
              )}
            </VStack>
          )}
        </HStack>
      </CardBody>
    </Card>
  );
};

// Complete example showing how to use in the map function
const NodeCardList = ({
  nodes,
  team,
  currentColors,
  colorMode,
  theme,
  formatGP,
  getNodeStatus,
  getNodeBorderColor,
  handleNodeClick,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      {nodes.map((node) => {
        const status = getNodeStatus(node);
        const isLocked = status === 'locked';

        return isLocked ? (
          <LockedNodeCard
            key={node.nodeId}
            node={node}
            currentColors={currentColors}
            colorMode={colorMode}
            theme={theme}
          />
        ) : (
          <UnlockedNodeCard
            key={node.nodeId}
            node={node}
            status={status}
            currentColors={currentColors}
            colorMode={colorMode}
            theme={theme}
            formatGP={formatGP}
            getNodeBorderColor={getNodeBorderColor}
            handleNodeClick={handleNodeClick}
          />
        );
      })}
    </VStack>
  );
};

export { RedactedText, LockedNodeCard, UnlockedNodeCard, NodeCardList };
