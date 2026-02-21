import React, { createContext, useContext } from 'react';
import { useToast, Flex, Text, IconButton } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon, CloseIcon } from '@chakra-ui/icons';
import { MdError } from 'react-icons/md';

const ToastContext = createContext();

const TOAST_STYLES = {
  success: {
    icon: CheckCircleIcon,
    accent: '#43AA8B',
    bg: '#1a2e28',
  },
  error: {
    icon: MdError,
    accent: '#FF4B5C',
    bg: '#2e1a1a',
  },
  warning: {
    icon: WarningIcon,
    accent: '#F6AD55',
    bg: '#2e251a',
  },
  info: {
    icon: InfoIcon,
    accent: '#7D5FFF',
    bg: '#1e1a2e',
  },
};

const CustomToast = ({ message, status, onClose }) => {
  const style = TOAST_STYLES[status] ?? TOAST_STYLES.info;
  const Icon = style.icon;

  return (
    <Flex
      align="center"
      gap={3}
      bg={style.bg}
      borderLeft="4px solid"
      borderColor={style.accent}
      borderRadius="8px"
      boxShadow="0 4px 20px rgba(0,0,0,0.4)"
      px={4}
      py={3}
      minW="280px"
      maxW="400px"
      position="relative"
    >
      <Icon color={style.accent} boxSize={5} flexShrink={0} />
      <Text fontSize="sm" color="white" flex={1} fontWeight="medium">
        {message}
      </Text>
      <IconButton
        icon={<CloseIcon boxSize={2.5} />}
        size="xs"
        variant="ghost"
        color="whiteAlpha.600"
        aria-label="Close"
        onClick={onClose}
        _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
        flexShrink={0}
      />
    </Flex>
  );
};

export const ToastProvider = ({ children }) => {
  const toast = useToast();

  const showToast = (message, status = 'success') => {
    toast({
      duration: 4000,
      isClosable: true,
      position: 'bottom-right',
      render: ({ onClose }) => <CustomToast message={message} status={status} onClose={onClose} />,
    });
  };

  return <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>;
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToastContext must be used within a ToastProvider');
  return context;
};
