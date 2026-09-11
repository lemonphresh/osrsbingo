import { Box, HStack, Text, useClipboard } from '@chakra-ui/react';
import { SPOOPY_COLORS } from './spoopyTheme';

// One-shot click-to-copy pill for a Discord command shown in a spoopy modal.
// Click anywhere on the pill copies the command; the label swaps to
// "copied!" briefly and the border flashes green. Same interaction as
// battleship / rainbow's click-to-copy, so muscle memory carries over.
//
// Props:
//   command   the exact string to copy (i.e. "!spoopysubmit t-r19-c8")
//   size      "sm" | "md" — controls font size and padding (default "md")
export default function SpoopyCommandCopy({ command, size = 'md' }) {
  const { onCopy, hasCopied } = useClipboard(command ?? '');
  const isSm = size === 'sm';

  return (
    <Box
      as="button"
      type="button"
      onClick={onCopy}
      width="100%"
      textAlign="left"
      bg={SPOOPY_COLORS.nightMist}
      border="1px solid"
      borderColor={hasCopied ? SPOOPY_COLORS.green : SPOOPY_COLORS.night}
      borderRadius="md"
      px={isSm ? 2 : 3}
      py={isSm ? 1 : 2}
      cursor="pointer"
      transition="border-color 120ms ease-out, background-color 120ms ease-out"
      _hover={{
        bg: SPOOPY_COLORS.night,
        borderColor: SPOOPY_COLORS.pumpkin,
      }}
      _active={{ transform: 'translateY(1px)' }}
      aria-label={hasCopied ? 'copied' : `copy ${command}`}
    >
      <HStack justify="space-between" spacing={2}>
        <Text
          fontFamily="mono"
          color={SPOOPY_COLORS.pumpkinLight}
          fontSize={isSm ? 'xs' : 'sm'}
          isTruncated
        >
          {command}
        </Text>
        <Text
          fontSize="10px"
          fontWeight="bold"
          color={hasCopied ? SPOOPY_COLORS.green : SPOOPY_COLORS.paper}
          opacity={hasCopied ? 1 : 0.55}
          letterSpacing="wider"
          textTransform="uppercase"
          flexShrink={0}
        >
          {hasCopied ? '✓ copied' : 'click to copy'}
        </Text>
      </HStack>
    </Box>
  );
}
