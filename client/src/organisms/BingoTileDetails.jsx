import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
  Wrap,
  WrapItem,
  Tooltip,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import theme from '../theme';
import IconSearch from './IconSearch';
import { UPDATE_TILE } from '../graphql/mutations';

const GET_POPULAR_TILES = gql`
  query GetPopularTiles {
    getPopularTiles {
      name
      icon
      usageCount
    }
  }
`;

const formatDate = (date) => {
  if (!date) return null;
  return format(
    typeof date === 'number' ? new Date(date) : new Date(date),
    'MMMM d, yyyy h:mm:ss a'
  );
};

const InlineEditField = ({ label, value, onChange, inputType = 'text', isEditor }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

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

const PopularTiles = ({ onSelect }) => {
  const { data, loading } = useQuery(GET_POPULAR_TILES);

  if (loading)
    return (
      <Flex justify="center" py={3}>
        <Spinner size="sm" color="purple.300" />
      </Flex>
    );

  const tiles = data?.getPopularTiles || [];

  return (
    <Wrap spacing="4px" maxHeight="180px" overflowY="auto" paddingY="8px">
      {tiles.map((t) => (
        <WrapItem key={t.name}>
          <Tooltip label={t.name} placement="top" hasArrow openDelay={300}>
            <Flex
              alignItems="center"
              justifyContent="center"
              backgroundColor="gray.700"
              borderRadius="6px"
              cursor="pointer"
              height="36px"
              width="36px"
              onClick={() => onSelect(t)}
              _hover={{
                backgroundColor: 'purple.700',
                outline: '2px solid',
                outlineColor: 'purple.400',
              }}
              transition="all 0.1s"
            >
              {t.icon ? (
                <Image src={t.icon} maxH="24px" maxW="24px" loading="lazy" />
              ) : (
                <Text fontSize="10px" color="gray.400" textAlign="center" px="2px" noOfLines={2}>
                  {t.name}
                </Text>
              )}
            </Flex>
          </Tooltip>
        </WrapItem>
      ))}
    </Wrap>
  );
};

const BingoTileDetails = ({ isEditor, isOpen, onClose, tile }) => {
  const [tileState, setTileState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updateTile] = useMutation(UPDATE_TILE);

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

  const handlePopularTileSelect = async (popularTile) => {
    await updateTile({
      variables: {
        id: tile.id,
        input: {
          name: popularTile.name,
          icon: popularTile.icon,
        },
      },
    });
    setTileState((s) => ({ ...s, name: popularTile.name, icon: popularTile.icon }));
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
            <Flex flexDirection="column" marginTop="20px" marginX="16px" gap="12px">
              <Flex flexDirection="column">
                <Text
                  as="span"
                  color={theme.colors.purple[300]}
                  fontWeight="bold"
                  marginBottom="4px"
                >
                  Update Icon:
                </Text>
                <IconSearch setTileState={setTileState} tile={tile} tileState={tileState} />
              </Flex>

              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton
                    px={0}
                    _hover={{ backgroundColor: 'transparent' }}
                    color={theme.colors.purple[300]}
                  >
                    <Text fontWeight="bold" flex={1} textAlign="left" fontSize="sm">
                      Need suggestions?
                    </Text>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel px={0} pb={2}>
                    <Text fontSize="xs" color="gray.400" mb={2}>
                      Click any tile to apply its name and icon.
                    </Text>
                    <PopularTiles onSelect={handlePopularTileSelect} />
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
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
