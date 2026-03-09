import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, Text,
} from '@chakra-ui/react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  colorScheme = 'red',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.800" border="1px solid" borderColor="gray.600">
        <ModalHeader color="white" fontSize="md">{title}</ModalHeader>
        <ModalCloseButton color="gray.400" />
        {body && (
          <ModalBody>
            <Text fontSize="sm" color="gray.300">{body}</Text>
          </ModalBody>
        )}
        <ModalFooter gap={2}>
          <Button size="sm" variant="ghost" colorScheme="gray" onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" colorScheme={colorScheme} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
