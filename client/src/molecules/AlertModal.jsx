import React, { useRef } from 'react';
import theme from '../theme';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from '@chakra-ui/react';

const AlertModal = ({
  actionButtonText,
  buttonText,
  colorScheme = 'red',
  dialogBody,
  dialogHeader,
  icon,
  onClickAction,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  return (
    <>
      <Button
        display="inline-flex"
        _hover={{
          border: `1px solid ${theme.colors[colorScheme][300]}`,
          padding: '4px',
        }}
        color={theme.colors[colorScheme][300]}
        leftIcon={icon}
        justifyContent="center"
        marginBottom="1px"
        onClick={onOpen}
        padding="6px"
        textAlign="center"
        variant="unstyled"
        width="fit-content"
      >
        {buttonText}
      </Button>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="semibold">
              {dialogHeader}
            </AlertDialogHeader>
            <AlertDialogBody>{dialogBody}</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme={colorScheme}
                onClick={() => {
                  onClickAction();
                  onClose();
                }}
                ml={3}
              >
                {actionButtonText}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default AlertModal;
