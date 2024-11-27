import { useMutation } from '@apollo/client';
import { Button, Flex, Input, Textarea } from '@chakra-ui/react';
import React, { useState } from 'react';
import theme from '../theme';
import { useToastContext } from '../providers/ToastProvider';

const EditField = ({
  entityId,
  fieldName,
  flexDirection = 'row',
  inputType = 'text',
  MUTATION,
  onSave,
  value,
}) => {
  const [val, setVal] = useState(value);
  const [mutation, { loading }] = useMutation(MUTATION);
  const { showToast } = useToastContext();

  const handleSave = async () => {
    try {
      const { data } = await mutation({
        variables: {
          id: entityId,
          input: { [fieldName]: val },
        },
      });
      onSave(data, val);
      showToast('Update succeeded!', 'success');
    } catch (error) {
      showToast('Update failed.', 'error');
    }
  };

  return (
    <>
      <Flex flexDirection={flexDirection} width="100%">
        {inputType === 'text' && (
          <Input
            autocomplete="off"
            onChange={(e) => setVal(e.target.value)}
            placeholder={value}
            name={fieldName}
            type="text"
            value={val}
          />
        )}
        {inputType === 'textarea' && (
          <Textarea
            autocomplete="off"
            defaultValue={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={value}
            name={fieldName}
            minWidth={['100%', '350px', '500px', '650px']}
          />
        )}
        <Button
          _hover={{ backgroundColor: theme.colors.orange[800] }}
          color={theme.colors.orange[300]}
          isLoading={loading}
          margin={flexDirection !== 'column' ? 'auto' : '0 auto'}
          marginLeft={flexDirection !== 'column' ? '16px' : null}
          marginTop={flexDirection !== 'column' ? null : '16px'}
          onClick={handleSave}
          textDecoration="underline"
          variant="ghost"
          width={flexDirection !== 'column' ? 'auto' : 'fit-content'}
        >
          Save
        </Button>
      </Flex>
    </>
  );
};

export default EditField;
