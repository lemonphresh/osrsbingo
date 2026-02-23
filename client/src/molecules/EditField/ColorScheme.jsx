import React from 'react';
import theme from '../../theme';
import { Select, Text } from '@chakra-ui/react';

const ColorScheme = ({ board, canEdit, onChange }) =>
  canEdit && (
    <>
      <Text
        as="span"
        color={theme.colors.teal[300]}
        display="inline"
        fontWeight="semibold"
        marginY="8px"
        textAlign="center"
      >
        Color Scheme:
      </Text>
      <Select
        backgroundColor={theme.colors.gray[300]}
        color={theme.colors.gray[700]}
        margin="0 auto"
        maxWidth="196px"
        name="category"
        onChange={onChange}
        defaultValue={board.theme}
      >
        <option value="DEFAULT">Default</option>
        <option value="purple">Purple</option>
        <option value="blue">Blue</option>
        <option value="cyan">Cyan</option>
        <option value="green">Green</option>
        <option value="yellow">Yellow</option>
        <option value="orange">Orange</option>
        <option value="pink">Pink</option>
        <option value="red">Red</option>
        <option value="gray">Gray</option>
      </Select>
    </>
  );

export default ColorScheme;
