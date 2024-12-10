import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import theme from '../theme';

const InternalLinkList = ({ list, type }) => {
  const formattedList = list.map((item, idx) => (
    <Link key={item.id} to={`/${type}/${item.id}`}>
      →
      <Text
        _hover={{
          textDecoration: 'underline',
        }}
        color={theme.colors.orange[100]}
        display="inline"
        marginLeft="16px"
      >
        {item.name}
      </Text>
    </Link>
  ));
  return (
    <Flex flexDirection="column" margin="0 auto">
      {formattedList}
    </Flex>
  );
};

export default InternalLinkList;
