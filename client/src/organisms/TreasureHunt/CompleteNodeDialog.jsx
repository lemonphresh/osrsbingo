import React, { useState, useCallback, memo } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  useColorMode,
} from '@chakra-ui/react';

const CompleteNodeDialog = memo(
  ({ isOpen, nodeToComplete, onClose, onComplete, isLoading = false }) => {
    const { colorMode } = useColorMode();
    const [congratsMessage, setCongratsMessage] = useState('');
    const cancelRef = React.useRef();

    const colors = {
      dark: {
        green: { base: '#43AA8B' },
      },
      light: {
        green: { base: '#43AA8B' },
      },
    };

    const currentColors = colors[colorMode];

    const handleCongratsMessageChange = useCallback((e) => {
      setCongratsMessage(e.target.value);
    }, []);

    const handleClose = useCallback(() => {
      setCongratsMessage('');
      onClose();
    }, [onClose]);

    const handleComplete = useCallback(() => {
      onComplete(congratsMessage.trim() || null);
      setCongratsMessage('');
    }, [congratsMessage, onComplete]);

    if (!nodeToComplete) return null;

    return (
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={handleClose}>
        <AlertDialogOverlay>
          <AlertDialogContent bg={colorMode === 'dark' ? '#2D3748' : 'white'}>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="semibold"
              color={colorMode === 'dark' ? '#F7FAFC' : '#171923'}
            >
              Complete Node
            </AlertDialogHeader>

            <AlertDialogBody color={colorMode === 'dark' ? '#F7FAFC' : '#171923'}>
              <VStack align="stretch" spacing={3}>
                <Text>
                  Are you sure you want to complete{' '}
                  <Text as="span" fontWeight="semibold">
                    "{nodeToComplete.nodeTitle}"
                  </Text>{' '}
                  for{' '}
                  <Text as="span" fontWeight="semibold">
                    {nodeToComplete.teamName}
                  </Text>
                  ?
                </Text>

                <Box
                  p={3}
                  bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={currentColors.green.base}
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    This will:
                  </Text>
                  <VStack align="start" spacing={1} fontSize="sm">
                    <HStack>
                      <Text>✅</Text>
                      <Text>Mark the node as completed</Text>
                    </HStack>
                    <HStack>
                      <Text>💰</Text>
                      <Text>Grant GP rewards to team pot</Text>
                    </HStack>
                    <HStack>
                      <Text>🔑</Text>
                      <Text>Add any key rewards to inventory</Text>
                    </HStack>
                    <HStack>
                      <Text>✨</Text>
                      <Text>Grant any buff rewards</Text>
                    </HStack>
                    <HStack>
                      <Text>🔓</Text>
                      <Text>Unlock connected nodes</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Congratulatory Message Input */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    🎉 Congratulatory Message (Optional)
                  </FormLabel>
                  <Textarea
                    placeholder="Great work team! Keep up the excellent progress..."
                    value={congratsMessage}
                    onChange={handleCongratsMessageChange}
                    size="sm"
                    resize="vertical"
                    rows={3}
                    maxLength={256}
                    bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'white'}
                  />
                  <HStack justify="space-between" mt={1}>
                    <FormHelperText fontSize="xs" mt={0}>
                      Add a custom message to celebrate the team's achievement.
                    </FormHelperText>
                    <Text
                      fontSize="xs"
                      color={
                        congratsMessage.length >= 240
                          ? 'orange.400'
                          : colorMode === 'dark'
                          ? 'gray.500'
                          : 'gray.400'
                      }
                    >
                      {congratsMessage.length}/256
                    </Text>
                  </HStack>
                </FormControl>

                <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                  You can undo this later using Admin Mode if needed.
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleComplete} ml={3} isLoading={isLoading}>
                Complete Node
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    );
  }
);

export default CompleteNodeDialog;
