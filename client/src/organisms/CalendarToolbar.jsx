// CalendarToolbar.jsx
import { Portal, Box, Button, HStack, Text, useOutsideClick } from '@chakra-ui/react';
import { useRef } from 'react';

export default function Toolbar({
  x,
  y,
  onClose,
  onView,
  onEdit,
  onSaveForLater,
  onDelete,
  title,
}) {
  const ref = useRef(null);
  useOutsideClick({ ref, handler: onClose });

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
      >
        <Text fontWeight="semibold" mb={2} noOfLines={1} maxW="260px">
          {title}
        </Text>
        <HStack spacing={2}>
          <Button size="sm" onClick={onView}>
            View
          </Button>
          <Button size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={onSaveForLater}>
            Save for later
          </Button>
          <Button size="sm" colorScheme="red" variant="outline" onClick={onDelete}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </HStack>
      </Box>
    </Portal>
  );
}
