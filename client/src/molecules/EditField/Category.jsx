import { Button, Select, Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../../theme';
import { EditIcon } from '@chakra-ui/icons';

const Category = ({ board, canEdit, fieldActive, onChange, onClickEdit, user }) => (
  <>
    <Text
      as="span"
      color={theme.colors.teal[300]}
      display="inline"
      fontWeight="semibold"
      marginTop="8px"
      textAlign="center"
    >
      Category:
    </Text>
    {canEdit && fieldActive ? (
      <Select
        backgroundColor={theme.colors.gray[300]}
        color={theme.colors.gray[700]}
        margin="0 auto"
        marginTop="8px"
        maxWidth="196px"
        name="category"
        onChange={onChange}
        defaultValue={board.category}
      >
        {user?.admin && <option value="Featured">Featured</option>}
        <option value="PvM">PvM</option>
        <option value="PvP">PvP</option>
        <option value="Skilling">Skilling</option>
        <option value="Social">Social</option>
        <option value="Other">Other</option>
      </Select>
    ) : (
      <Text alignItems="center" display="flex" justifyContent="center" width="100%">
        <Text>{board.category}</Text>
        {canEdit && (
          <Button
            _hover={{ backgroundColor: theme.colors.teal[800] }}
            color={theme.colors.teal[300]}
            marginLeft="8px"
            onClick={onClickEdit}
            textDecoration="underline"
            variant="ghost"
            width="fit-content"
          >
            <EditIcon />
          </Button>
        )}
      </Text>
    )}
  </>
);

export default Category;
