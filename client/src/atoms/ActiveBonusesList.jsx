import { ListItem, Text, UnorderedList } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';

const removeTypename = (obj) => {
  const { __typename, ...rest } = obj;
  return rest;
};

const ActiveBonusesList = ({ board }) => {
  return (
    <Text
      alignItems="center"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      marginTop="16px"
      width="100%"
    >
      <Text
        as="span"
        color={theme.colors.teal[300]}
        display="inline"
        fontWeight="bold"
        marginBottom="4px"
      >
        Active bonuses:
      </Text>
      <UnorderedList marginBottom="8px">
        {Object.entries(removeTypename(board?.bonusSettings || {}))
          .filter(
            ([key, value]) =>
              value !== 0 &&
              value !== false &&
              value !== null &&
              value !== undefined &&
              !(board?.bonusSettings?.allowDiagonals === false && key === 'diagonalBonus')
          )
          .map(([key, value]) => (
            <ListItem key={key}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:{' '}
              {value.toString()}
              {key.toString().includes('black') ? ' pts' : 'x'}
            </ListItem>
          )).length > 0 ? (
          Object.entries(removeTypename(board?.bonusSettings || {}))
            .filter(
              ([key, value]) =>
                value !== 0 &&
                value !== false &&
                value !== true &&
                value !== null &&
                value !== undefined &&
                !(board?.bonusSettings?.allowDiagonals === false && key === 'diagonalBonus')
            )
            .map(([key, value]) => (
              <ListItem key={key}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:{' '}
                {value.toString()}
                {key.toString().includes('black') ? ' pts' : 'x'}
              </ListItem>
            ))
        ) : (
          <ListItem>None</ListItem>
        )}
      </UnorderedList>
    </Text>
  );
};

export default ActiveBonusesList;
