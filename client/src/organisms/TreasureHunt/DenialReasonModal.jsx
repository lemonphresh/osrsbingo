import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  VStack,
  useColorMode,
} from '@chakra-ui/react';

/**
 * Modal for entering a denial reason when rejecting a submission
 */
const DenialReasonModal = ({ isOpen, onClose, onDeny, submissionId, submittedBy }) => {
  const { colorMode } = useColorMode();
  const [denialReason, setDenialReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = {
    dark: {
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  const handleDeny = async () => {
    setIsSubmitting(true);
    try {
      await onDeny(submissionId, denialReason);
      setDenialReason(''); // Reset for next time
      onClose();
    } catch (error) {
      console.error('Error denying submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDenialReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>Deny Submission</ModalHeader>
        <ModalCloseButton color={currentColors.textColor} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color={currentColors.textColor} fontSize="sm">
              You are about to deny the submission from <strong>{submittedBy}</strong>.
            </Text>

            <FormControl>
              <FormLabel color={currentColors.textColor}>
                Reason for Denial{' '}
                <Text as="span" fontSize="sm" color="gray.500">
                  (Optional)
                </Text>
              </FormLabel>
              <Textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="i.e., Kill count not visible in screenshot, Wrong boss, Image unclear, etc."
                rows={4}
                color={currentColors.textColor}
                borderColor={colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.300'}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.400',
                }}
                _focus={{
                  borderColor: 'red.500',
                  boxShadow: '0 0 0 1px red.500',
                }}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                This reason will be sent to the user via Discord notification.
              </Text>
            </FormControl>

            <Text fontSize="xs" color="orange.500">
              💡 Tip: Providing a reason helps users understand why their submission was denied and
              improves resubmissions.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDeny}
            isLoading={isSubmitting}
            loadingText="Denying..."
          >
            Deny Submission
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DenialReasonModal;
