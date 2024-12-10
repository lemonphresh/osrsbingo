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
} from '@chakra-ui/react';
import theme from '../theme';
import EditField from '../molecules/EditField';
import { UPDATE_TILE } from '../graphql/mutations';
import IconSearch from './IconSearch';
import { useMutation } from '@apollo/client';
import moment from 'moment';

const formattedDate = (date) => {
  if (!date) return null;
  const dateObj = typeof date === 'number' ? moment(date) : moment(date);
  return dateObj.format('MMMM D, YYYY h:mm:ss A');
};

const BingoTileDetails = ({ isEditor, isOpen, onClose, tile }) => {
  const [fieldsEditing, setFieldsEditing] = useState({
    completedBy: false,
    icon: false,
    isComplete: false,
    name: false,
    value: false,
  });
  const [tileState, setTileState] = useState({
    ...tile,
    dateCompleted: tile.dateCompleted
      ? formattedDate(new Date(Number(tile.dateCompleted))) // convert timestamp to readable format
      : null,
  });
  const [updateTile] = useMutation(UPDATE_TILE);

  useEffect(() => {
    if (tile) {
      setTileState({
        ...tile,
        dateCompleted: tile.dateCompleted
          ? formattedDate(new Date(Number(tile.dateCompleted))) // normalize date
          : null,
      });
    }
  }, [tile]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent backgroundColor={theme.colors.gray[100]}>
        <ModalHeader textAlign="center">{isEditor ? 'Edit Tile' : 'Tile Details'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody flexDirection="column" paddingX={['16px', '32px', '56px']} width="100%">
          {tileState.icon ? (
            <Flex
              alignItems="center"
              backgroundColor={theme.colors.white}
              borderRadius="8px"
              boxShadow="md"
              justifyContent="center"
              margin="0 auto"
              padding="16px"
              width="fit-content"
            >
              <Image height="30px" src={tileState.icon} width="30px" />
            </Flex>
          ) : (
            <></>
          )}
          <Flex flexDirection="column" gridGap="4px" marginTop="20px" marginX="16px">
            {!fieldsEditing.name ? (
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.purple[600]}
                    display="inline"
                    fontWeight="bold"
                    marginRight="8px"
                  >
                    Name:
                  </Text>
                  {tileState.name}
                </Text>
                {isEditor && (
                  <Button
                    _hover={{ backgroundColor: theme.colors.purple[100] }}
                    color={theme.colors.purple[300]}
                    marginLeft="16px"
                    onClick={() =>
                      setFieldsEditing({
                        ...fieldsEditing,
                        name: true,
                      })
                    }
                    textDecoration="underline"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : (
              <EditField
                fieldName="name"
                MUTATION={UPDATE_TILE}
                onSave={(data, val) => {
                  setTileState({
                    ...tileState,
                    ...data.editBingoTile,
                    dateCompleted: tileState.dateCompleted,
                    name: val,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    name: false,
                  });
                }}
                entityId={tile.id}
                value={tileState.name}
              />
            )}

            {!fieldsEditing.value ? (
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.purple[600]}
                    display="inline"
                    fontWeight="bold"
                    marginRight="8px"
                  >
                    Value:
                  </Text>
                  {tileState.value}
                </Text>
                {isEditor && (
                  <Button
                    _hover={{ backgroundColor: theme.colors.purple[100] }}
                    color={theme.colors.purple[300]}
                    marginLeft="16px"
                    onClick={() =>
                      setFieldsEditing({
                        ...fieldsEditing,
                        value: true,
                      })
                    }
                    textDecoration="underline"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : (
              <EditField
                entityId={tile.id}
                fieldName="value"
                inputType="number"
                MUTATION={UPDATE_TILE}
                onSave={(data, val) => {
                  setTileState({
                    ...tileState,
                    ...data.editBingoTile,
                    dateCompleted: tileState.dateCompleted,
                    value: val,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    value: false,
                  });
                }}
                max={100}
                step={5}
                value={tileState.value}
              />
            )}
            <Flex flexDirection="column">
              <Text
                alignItems="center"
                display="flex"
                justifyContent={isEditor ? 'space-between' : 'flex-start'}
                width="100%"
              >
                <Text
                  as="span"
                  color={theme.colors.purple[600]}
                  display="inline"
                  fontWeight="bold"
                  marginRight="8px"
                >
                  Is Completed:
                </Text>
                {isEditor ? (
                  <Checkbox
                    colorScheme="purple"
                    borderColor={theme.colors.purple[300]}
                    defaultChecked={tileState.isComplete}
                    marginRight="16px"
                    onChange={async () => {
                      const currentDate = tileState.isComplete
                        ? null
                        : moment().utc().toISOString(); // unix timestamp in milliseconds

                      const { data } = await updateTile({
                        variables: {
                          id: tile.id,
                          input: {
                            isComplete: !tileState.isComplete,
                            dateCompleted: currentDate, // send as timestamp
                          },
                        },
                      });

                      setTileState({
                        ...tileState,
                        ...data.editBingoTile,
                        isComplete: !tileState.isComplete,
                        dateCompleted: currentDate
                          ? formattedDate(new Date(currentDate)) // format for display
                          : null,
                      });
                    }}
                    size="lg"
                  />
                ) : (
                  <Text>{tileState.isComplete ? 'Yes' : 'No'}</Text>
                )}
              </Text>
            </Flex>
            {tileState.isComplete && (
              <Text color={theme.colors.gray[500]} fontSize="14px">
                {tileState.dateCompleted}
              </Text>
            )}
            {!fieldsEditing.completedBy && tileState.isComplete ? (
              <Flex
                alignItems="center"
                flexDirection="space-between"
                paddingLeft="16px"
                width="100%"
              >
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.purple[600]}
                    display="inline"
                    fontWeight="bold"
                    marginRight="8px"
                  >
                    By:
                  </Text>
                  {tileState.completedBy}
                </Text>
                {isEditor && (
                  <Button
                    _hover={{ backgroundColor: theme.colors.purple[100] }}
                    color={theme.colors.purple[300]}
                    marginLeft="16px"
                    onClick={() =>
                      setFieldsEditing({
                        ...fieldsEditing,
                        completedBy: true,
                      })
                    }
                    textDecoration="underline"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : (
              tileState.isComplete && (
                <EditField
                  fieldName="completedBy"
                  MUTATION={UPDATE_TILE}
                  onSave={(data, val) => {
                    setTileState({
                      ...tileState,
                      ...data.editBingoTile,
                      dateCompleted: tileState.dateCompleted,
                      completedBy: val,
                    });
                    setFieldsEditing({
                      ...fieldsEditing,
                      completedBy: false,
                    });
                  }}
                  entityId={tile.id}
                  value={tileState.completedBy}
                />
              )
            )}
          </Flex>
          {isEditor && (
            <Flex flexDirection="column" marginTop="20px" marginX="16px">
              <Text
                as="span"
                color={theme.colors.purple[600]}
                display="inline"
                fontWeight="bold"
                marginRight="4px"
              >
                Update Icon:
              </Text>
              <IconSearch setTileState={setTileState} tile={tile} tileState={tileState} />
            </Flex>
          )}
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  );
};

export default BingoTileDetails;
