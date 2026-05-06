// CalendarToolbar.jsx
import { Portal, Box, Button, Wrap, WrapItem, Text, useOutsideClick } from '@chakra-ui/react';
import { useRef, useLayoutEffect } from 'react';

export default function Toolbar({
  x,
  y,
  onClose,
  onView,
  onEdit,
  onSaveForLater,
  onDelete,
  onPromote,
  onDemote,
  title,
}) {
  const ref = useRef(null);
  useOutsideClick({ ref, handler: onClose });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    if (rect.right > window.innerWidth) {
      el.style.left = `${Math.max(pad, window.innerWidth - rect.width - pad)}px`;
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${Math.max(pad, window.innerHeight - rect.height - pad)}px`;
    }
  }, [x, y]);

  return (
    <Portal>
      <Box
        ref={ref}
        position="fixed"
        left={x}
        top={y}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderWidth="1px"
        borderRadius="md"
        shadow="lg"
        p={3}
        zIndex={2000}
        maxW="calc(100vw - 16px)"
      >
        <Text fontWeight="semibold" mb={2} noOfLines={1} maxW="260px">
          {title}
        </Text>
        <Wrap spacing={2}>
          <WrapItem><Button size="sm" onClick={onView}>View</Button></WrapItem>
          <WrapItem><Button size="sm" onClick={onEdit}>Edit</Button></WrapItem>
          <WrapItem><Button size="sm" variant="outline" onClick={onSaveForLater}>Save for later</Button></WrapItem>
          {onPromote && (
            <WrapItem>
              <Button size="sm" colorScheme="green" variant="outline" onClick={onPromote}>
                Promote to Official
              </Button>
            </WrapItem>
          )}
          {onDemote && (
            <WrapItem>
              <Button size="sm" colorScheme="orange" variant="outline" onClick={onDemote}>
                Demote to Draft
              </Button>
            </WrapItem>
          )}
          <WrapItem>
            <Button size="sm" colorScheme="red" variant="outline" onClick={onDelete}>Delete</Button>
          </WrapItem>
          <WrapItem>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </WrapItem>
        </Wrap>
      </Box>
    </Portal>
  );
}
