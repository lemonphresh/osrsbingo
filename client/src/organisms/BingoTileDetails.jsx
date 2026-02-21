import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import theme from '../theme';
import IconSearch from './IconSearch';
import { UPDATE_TILE } from '../graphql/mutations';
import { useMutation } from '@apollo/client';

const formatDate = (date) => {
  if (!date) return null;
  return format(
    typeof date === 'number' ? new Date(date) : new Date(date),
    'MMMM d, yyyy h:mm:ss a'
  );
};

// Simple inline text editor — no mutation, just calls onChange
const InlineEditField = ({ label, value, onChange, inputType = 'text', isEditor }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  // Keep local in sync if parent resets (e.g. modal reopens)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const commit = () => {
    onChange(local);
    setEditing(false);
  };

  return (
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      {editing ? (
        <Flex gap={2} flex={1}>
          <input
            autoFocus
            type={inputType}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #718096',
              borderRadius: 4,
              padding: '2px 8px',
              color: 'white',
            }}
          />
          <Button size="xs" colorScheme="purple" onClick={commit}>
            Save
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setLocal(value);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </Flex>
      ) : (
        <Text width="100%" color="gray.100">
          <Text as="span" color={theme.colors.purple[300]} fontWeight="bold" marginRight="8px">
            {label}:
          </Text>
          {value}
        </Text>
      )}
      {isEditor && !editing && (
        <Button
          _hover={{ backgroundColor: 'whiteAlpha.100' }}
          color={theme.colors.purple[300]}
          marginLeft="16px"
          onClick={() => setEditing(true)}
          textDecoration="underline"
          variant="ghost"
        >
          Edit
        </Button>
      )}
    </Flex>
  );
};

const BingoTileDetails = ({ isEditor, isOpen, onClose, tile }) => {
  const [tileState, setTileState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updateTile] = useMutation(UPDATE_TILE);

  // Reset state whenever the modal opens with a new tile
  useEffect(() => {
    if (tile) {
      setTileState({
        ...tile,
        dateCompleted: tile.dateCompleted ? formatDate(new Date(Number(tile.dateCompleted))) : null,
      });
    }
  }, [tile]);

  const handleClose = async () => {
    if (!isEditor || !tileState) {
      onClose();
      return;
    }

    // Build diff — only send fields that changed
    const input = {};
    if (tileState.name !== tile.name) input.name = tileState.name;
    if (tileState.value !== tile.value) input.value = tileState.value;
    if (tileState.completedBy !== tile.completedBy) input.completedBy = tileState.completedBy;
    if (tileState.isComplete !== tile.isComplete) {
      input.isComplete = tileState.isComplete;
      input.dateCompleted = tileState.isComplete ? new Date().toISOString() : null;
    }

    if (Object.keys(input).length > 0) {
      setSaving(true);
      try {
        await updateTile({ variables: { id: tile.id, input } });
      } catch (e) {
        console.error('Failed to save tile:', e);
      } finally {
        setSaving(false);
      }
    }

    onClose();
  };

  if (!tileState) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent backgroundColor="gray.800" color="white">
        <ModalHeader textAlign="center" color="white">
          {isEditor ? 'Edit Tile' : 'Tile Details'}
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody flexDirection="column" paddingX={['16px', '32px', '56px']} width="100%">
          {tileState.icon && (
            <Flex
              alignItems="center"
              backgroundColor="gray.700"
              borderRadius="8px"
              boxShadow="md"
              justifyContent="center"
              height="60px"
              margin="0 auto"
              padding="16px"
              width="60px"
            >
              <Image
                aria-hidden
                maxHeight="30px"
                maxWidth="30px"
                src={tileState.icon}
                loading="lazy"
              />
            </Flex>
          )}

          <Flex flexDirection="column" gridGap="4px" marginTop="20px" marginX="16px">
            <InlineEditField
              label="Name"
              value={tileState.name}
              isEditor={isEditor}
              onChange={(val) => setTileState((s) => ({ ...s, name: val }))}
            />
            <InlineEditField
              label="Value"
              value={tileState.value}
              inputType="number"
              isEditor={isEditor}
              onChange={(val) => setTileState((s) => ({ ...s, value: val }))}
            />

            <Flex flexDirection="column">
              <Text
                alignItems="center"
                color="gray.100"
                display="flex"
                justifyContent={isEditor ? 'space-between' : 'flex-start'}
                width="100%"
              >
                <Text
                  as="span"
                  color={theme.colors.purple[300]}
                  fontWeight="bold"
                  marginRight="8px"
                >
                  Is Completed:
                </Text>
                {isEditor ? (
                  <Checkbox
                    colorScheme="purple"
                    borderColor="gray.500"
                    isChecked={tileState.isComplete}
                    marginRight="16px"
                    onChange={() =>
                      setTileState((s) => ({
                        ...s,
                        isComplete: !s.isComplete,
                        dateCompleted: !s.isComplete ? formatDate(new Date()) : null,
                      }))
                    }
                    size="lg"
                  />
                ) : (
                  <Text color="gray.100">{tileState.isComplete ? 'Yes' : 'No'}</Text>
                )}
              </Text>
            </Flex>

            {tileState.isComplete && (
              <Text color="gray.400" fontSize="14px">
                {tileState.dateCompleted}
              </Text>
            )}

            {tileState.isComplete && (
              <InlineEditField
                label="By"
                value={tileState.completedBy}
                isEditor={isEditor}
                onChange={(val) => setTileState((s) => ({ ...s, completedBy: val }))}
              />
            )}
          </Flex>

          {isEditor && (
            <Flex flexDirection="column" marginTop="20px" marginX="16px">
              <Text as="span" color={theme.colors.purple[300]} fontWeight="bold" marginRight="4px">
                Update Icon:
              </Text>
              <IconSearch setTileState={setTileState} tile={tile} tileState={tileState} />
            </Flex>
          )}
        </ModalBody>

        <ModalFooter>
          {isEditor && (
            <Button
              colorScheme="purple"
              onClick={handleClose}
              isLoading={saving}
              spinner={<Spinner size="sm" />}
              w="full"
            >
              Save & Close
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BingoTileDetails;
