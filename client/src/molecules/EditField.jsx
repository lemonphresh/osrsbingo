import { useMutation } from '@apollo/client';
import {
  Button,
  Flex,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Text,
} from '@chakra-ui/react';
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
  max,
  step,
  value,
}) => {
  const [val, setVal] = useState(value);
  const [mutation, { loading }] = useMutation(MUTATION);
  const { showToast } = useToastContext();
  const [characterCount, setCharacterCount] = useState(value?.length || 0);

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
      <Flex flexDirection={flexDirection} marginY="16px" width="100%">
        {inputType === 'text' && (
          <Input
            autoComplete="off"
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            onChange={(e) => setVal(e.target.value)}
            placeholder={value}
            name={fieldName}
            type="text"
            value={val}
          />
        )}
        {inputType === 'number' && (
          <NumberInput
            backgroundColor={theme.colors.gray[300]}
            color={theme.colors.gray[700]}
            max={max}
            min={0}
            onChange={(num) => setVal(parseInt(num))}
            step={step}
          >
            <NumberInputField autoComplete="off" name={fieldName} placeholder={value} value={val} />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        )}
        {inputType === 'textarea' && (
          <>
            <Textarea
              autoComplete="off"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              defaultValue={val}
              onChange={(e) => {
                setVal(e.target.value);
                setCharacterCount(e.target.value?.length || 0);
              }}
              placeholder={value}
              name={fieldName}
              minWidth={['100%', '350px', '500px', '650px']}
            />
            <Text fontSize="12px" textAlign="right">
              {characterCount} characters
            </Text>
          </>
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
