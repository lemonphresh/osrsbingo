import React, { useState } from 'react';
import {
  Button,
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

const BingoTileDetails = ({ isEditor, isOpen, onClose, tile }) => {
  const [fieldsEditing, setFieldsEditing] = useState({
    completedBy: false,
    icon: false,
    name: false,
  });
  const [tileState, setTileState] = useState(tile);
  console.log(tileState);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent backgroundColor={theme.colors.gray[100]}>
        <ModalHeader textAlign="center">{isEditor ? 'Edit Tile' : 'Tile Details'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody flexDirection="column" paddingX="72px" width="100%">
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
          <Flex flexDirection="column" marginTop="20px">
            {!fieldsEditing.name ? (
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.purple[600]}
                    display="inline"
                    fontWeight="bold"
                    marginRight="4px"
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
                    ...data.editBingoTile,
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
            {!fieldsEditing.completedBy ? (
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.purple[600]}
                    display="inline"
                    fontWeight="bold"
                    marginRight="4px"
                  >
                    Completed By:
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
              <EditField
                fieldName="completedBy"
                MUTATION={UPDATE_TILE}
                onSave={(data, val) => {
                  setTileState({
                    ...data.editBingoTile,
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
            )}
          </Flex>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  );
};

export default BingoTileDetails;
