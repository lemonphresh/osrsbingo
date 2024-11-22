import { useMutation } from '@apollo/client';
import { Alert, Button, Flex, Input, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import theme from '../theme';
import { WarningIcon } from '@chakra-ui/icons';

const EditField = ({ entityId, fieldName, MUTATION, onSave, value }) => {
  const [val, setVal] = useState(value);
  const [mutation, { loading, error }] = useMutation(MUTATION);

  const handleSave = async () => {
    const { data } = await mutation({
      variables: {
        id: entityId,
        input: { [fieldName]: val },
      },
    });
    onSave(data, val);
  };

  return (
    <>
      <Flex>
        <Input
          onChange={(e) => setVal(e.target.value)}
          placeholder={value}
          name={fieldName}
          type="text"
          value={val}
        />{' '}
        <Button
          _hover={{ backgroundColor: theme.colors.orange[800] }}
          color={theme.colors.orange[300]}
          isLoading={loading}
          marginLeft="16px"
          onClick={handleSave}
          textDecoration="underline"
          variant="ghost"
        >
          Save
        </Button>
      </Flex>
      {error && (
        <Alert
          backgroundColor={theme.colors.pink[100]}
          borderRadius="8px"
          key={error.message + 'a'}
          marginY="16px"
          textAlign="center"
        >
          <Text color={theme.colors.pink[500]}>
            <WarningIcon
              alignSelf={['flex-start', undefined]}
              color={theme.colors.pink[500]}
              marginRight="8px"
              marginBottom="4px"
              height="14px"
              width="14px"
            />
            Failed to save changes.
          </Text>
        </Alert>
      )}
    </>
  );
};

export default EditField;
