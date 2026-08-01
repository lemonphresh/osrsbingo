import { HStack, Text, Code, IconButton, useClipboard } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

export default function EventPasswordBadge({ password }) {
  const { onCopy, hasCopied } = useClipboard(password);
  return (
    <HStack spacing={1} align="center">
      <Text fontSize="xs" color="gray.400" fontWeight="semibold">
        Password:
      </Text>
      <Code
        fontSize="xs"
        bg="gray.700"
        color="yellow.200"
        px={2}
        py={0.5}
        borderRadius="sm"
        letterSpacing="wider"
      >
        {password}
      </Code>
      <IconButton
        size="xs"
        variant="ghost"
        colorScheme="yellow"
        icon={<CopyIcon />}
        aria-label="Copy password"
        onClick={onCopy}
        title={hasCopied ? 'Copied!' : 'Copy'}
      />
    </HStack>
  );
}
