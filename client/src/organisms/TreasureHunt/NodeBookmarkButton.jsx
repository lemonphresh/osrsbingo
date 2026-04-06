import React, { useState } from 'react';
import { Box, Tooltip } from '@chakra-ui/react';
import { FaBookmark } from 'react-icons/fa';
import { useMutation } from '@apollo/client';
import { TOGGLE_NODE_IN_PROGRESS } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';

/**
 * A bookmark ribbon pinned to the top-right corner of a node card.
 * Clicking it toggles the node's "in progress" status for the team.
 * Stops click propagation so it doesn't trigger the card's onClick.
 */
const NodeBookmarkButton = ({ eventId, teamId, nodeId, isBookmarked, onFirstHover }) => {
  const { showToast } = useToastContext();
  const [optimistic, setOptimistic] = useState(isBookmarked);
  const [toggling, setToggling] = useState(false);

  const [toggleNodeInProgress] = useMutation(TOGGLE_NODE_IN_PROGRESS);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    setOptimistic((v) => !v);
    try {
      await toggleNodeInProgress({ variables: { eventId, teamId, nodeId } });
    } catch (err) {
      setOptimistic((v) => !v); // revert
      showToast(`Failed to update bookmark: ${err.message}`, 'error');
    } finally {
      setToggling(false);
    }
  };

  // Sync if parent prop changes (i.e. subscription update)
  React.useEffect(() => {
    setOptimistic(isBookmarked);
  }, [isBookmarked]);

  return (
    <Tooltip label={optimistic ? 'Remove bookmark' : 'Mark as in progress'} placement="left">
      <Box
        position="absolute"
        top={0}
        right="10px"
        zIndex={2}
        onClick={handleClick}
        cursor={toggling ? 'wait' : 'pointer'}
        sx={{
          // Ribbon shape: narrow strip that tapers at the bottom
          width: '20px',
          height: '28px',
          background: optimistic ? '#F5C518' : 'rgba(160,160,160,0.55)',
          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '4px',
          transition: 'background 0.15s ease',
          _hover: {
            background: optimistic ? '#E0B015' : 'rgba(214,158,46,0.75)',
          },
        }}
        onMouseEnter={onFirstHover}
        aria-label={optimistic ? 'Remove bookmark' : 'Mark as in progress'}
        role="button"
      >
        <Box
          as={FaBookmark}
          boxSize="9px"
          color={optimistic ? 'white' : 'rgba(255,255,255,0.85)'}
        />
      </Box>
    </Tooltip>
  );
};

export default NodeBookmarkButton;
