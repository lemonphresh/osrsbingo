import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  Textarea,
  Tooltip,
  VStack,
  useColorMode,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { ADD_NODE_COMMENT, DELETE_NODE_COMMENT } from '../../graphql/mutations';
import { useToastContext } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';

const NodeNoteEditor = ({ eventId, teamId, nodeId, initialComments, isAdmin }) => {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [comments, setComments] = useState(Array.isArray(initialComments) ? initialComments : []);

  // Keep in sync if parent data changes (e.g. subscription update)
  useEffect(() => {
    if (Array.isArray(initialComments)) setComments(initialComments);
  }, [initialComments]);

  const [addNodeComment] = useMutation(ADD_NODE_COMMENT);
  const [deleteNodeComment] = useMutation(DELETE_NODE_COMMENT);

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      const result = await addNodeComment({
        variables: { eventId, teamId, nodeId, text: draft.trim() },
      });
      const updated = result.data?.addNodeComment?.nodeNotes?.[nodeId];
      if (Array.isArray(updated)) setComments(updated);
      setDraft('');
    } catch (err) {
      showToast(`Failed to add comment: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      const result = await deleteNodeComment({
        variables: { eventId, teamId, nodeId, commentId },
      });
      const updated = result.data?.deleteNodeComment?.nodeNotes?.[nodeId];
      if (Array.isArray(updated)) setComments(updated);
    } catch (err) {
      showToast(`Failed to delete comment: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const borderColor = colorMode === 'dark' ? 'gray.600' : 'gray.200';
  const mutedColor = colorMode === 'dark' ? 'gray.400' : 'gray.500';
  const textColor = colorMode === 'dark' ? 'white' : 'gray.800';

  return (
    <Box
      p={3}
      bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50'}
      borderRadius="md"
      borderWidth={1}
      borderColor={borderColor}
    >
      <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={2}>
        📝 Notes
      </Text>

      {comments.length > 0 && (
        <VStack align="stretch" spacing={2} mb={3}>
          {comments.map((c) => {
            const canDelete = isAdmin || c.authorId === user?.id;
            return (
              <Box
                key={c.id}
                p={2}
                bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                borderRadius="md"
                borderWidth={1}
                borderColor={borderColor}
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={0} flex={1}>
                    <HStack spacing={1}>
                      <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                        {c.authorName}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        · {new Date(c.timestamp).toLocaleString()}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap">
                      {c.text}
                    </Text>
                  </VStack>
                  {canDelete && (
                    <Tooltip label="Delete comment">
                      <IconButton
                        icon={<DeleteIcon />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        isLoading={deletingId === c.id}
                        onClick={() => handleDelete(c.id)}
                        aria-label="Delete comment"
                      />
                    </Tooltip>
                  )}
                </HStack>
              </Box>
            );
          })}
        </VStack>
      )}

      <Textarea
        size="sm"
        placeholder="Add a note for other refs, i.e. tracking current progress for task, team member issues, etc..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        color={textColor}
        borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.300'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd();
        }}
      />
      <HStack justify="flex-end" mt={2}>
        <Text fontSize="xs" color={mutedColor}>
          Ctrl+Enter to post
        </Text>
        <Button
          size="xs"
          colorScheme="blue"
          isLoading={submitting}
          isDisabled={!draft.trim()}
          onClick={handleAdd}
        >
          Add Note
        </Button>
      </HStack>
    </Box>
  );
};

export default NodeNoteEditor;
