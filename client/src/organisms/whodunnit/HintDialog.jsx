import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Box,
  Text,
} from '@chakra-ui/react';
import { WD_COLORS, WD_FONTS } from './whodunnitTheme';

// "Are you sure?" gate before revealing a hint. Uses of the hint are
// tracked on the campaign so the final Casebook Report can flag which
// clues were unstuck with help.
//
// Styled as a formal case-file note on the desk — paper background, ink
// typewriter body, brass label, wax-red confirm.
const HintDialog = ({ isOpen, onCancel, onConfirm }) => {
  const cancelRef = React.useRef();
  return (
    <AlertDialog isOpen={isOpen} onClose={onCancel} leastDestructiveRef={cancelRef}>
      <AlertDialogOverlay bg="rgba(20, 12, 4, 0.65)" backdropFilter="blur(4px)">
        <AlertDialogContent
          bg={WD_COLORS.paper}
          color={WD_COLORS.ink}
          border="1px solid"
          borderColor={WD_COLORS.paperShadow}
          borderRadius="3px"
          boxShadow="0 2px 0 rgba(0,0,0,0.15), 0 20px 40px rgba(0,0,0,0.55)"
          maxW="440px"
          overflow="hidden"
        >
          {/* Header strip — brass accent bar */}
          <Box
            bg={WD_COLORS.brass}
            color={WD_COLORS.paper}
            px={5}
            py={2}
          >
            <Text
              fontFamily={WD_FONTS.typewriter}
              fontSize="10px"
              letterSpacing="0.4em"
              textTransform="uppercase"
              fontWeight="bold"
            >
              Case File — Hint Request
            </Text>
          </Box>

          <AlertDialogHeader
            fontFamily={WD_FONTS.heading}
            fontStyle="italic"
            fontSize="2xl"
            color={WD_COLORS.ink}
            pt={5}
            pb={2}
          >
            Reveal the hint?
          </AlertDialogHeader>
          <AlertDialogBody
            fontFamily={WD_FONTS.typewriter}
            color={WD_COLORS.inkFaded}
            fontSize="sm"
            lineHeight="1.7"
            pb={4}
          >
            This clue will be flagged on your final Casebook Report. Watson will notice. Or he'll
            pretend to.
          </AlertDialogBody>
          <AlertDialogFooter
            bg="rgba(0,0,0,0.03)"
            borderTop="1px solid"
            borderTopColor={WD_COLORS.paperShadow}
            py={3}
          >
            <Button
              ref={cancelRef}
              onClick={onCancel}
              variant="outline"
              borderColor={WD_COLORS.paperShadow}
              color={WD_COLORS.inkFaded}
              bg="transparent"
              _hover={{ bg: 'rgba(0,0,0,0.06)', borderColor: WD_COLORS.inkFaded }}
              fontFamily={WD_FONTS.typewriter}
            >
              Never mind
            </Button>
            <Button
              onClick={onConfirm}
              ml={3}
              bg={WD_COLORS.wax}
              color={WD_COLORS.paper}
              _hover={{ bg: WD_COLORS.waxHighlight }}
              fontFamily={WD_FONTS.typewriter}
              letterSpacing="0.05em"
            >
              Reveal it
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default HintDialog;
