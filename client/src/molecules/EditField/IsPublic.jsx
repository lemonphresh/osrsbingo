import { Checkbox, Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../../theme';

const IsPublic = ({ board, canEdit, onChange }) => (
  <Text alignItems="center" display="flex" marginBottom="8px" justifyContent="center" width="100%">
    <Text
      as="span"
      color={theme.colors.teal[300]}
      display="inline"
      fontWeight="semibold"
      marginRight="8px"
      marginTop="16px"
    >
      Is Public:
    </Text>
    {canEdit ? (
      <Checkbox
        colorScheme="teal"
        borderColor={theme.colors.teal[300]}
        defaultChecked={board.isPublic}
        marginRight="16px"
        marginTop="16px"
        onChange={onChange}
        size="lg"
      />
    ) : (
      <Text marginTop="16px">{board.isPublic ? 'Yes' : 'No'}</Text>
    )}
  </Text>
);

export default IsPublic;
