import React, { useState } from 'react';
import theme from '../theme';
import { Flex, Image, Text, useDisclosure } from '@chakra-ui/react';
import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import BingoTileDetails from './BingoTileDetails';

const BingoTile = ({ colIndex, isEditor, tile }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const size = ['56px', '64px', '96px', '120px'];
  const [isHovered, setIsHovered] = useState(false);
  const { icon, isComplete, name } = tile;

  return (
    <>
      <Flex
        _hover={{
          backgroundColor: !isComplete ? theme.colors.gray[500] : theme.colors.green[300],
          cursor: 'pointer',
        }}
        alignItems="center"
        backgroundColor={!isComplete ? theme.colors.gray[600] : theme.colors.green[400]}
        borderRadius={['8px', '12px']}
        color={!isComplete ? theme.colors.white : theme.colors.gray[800]}
        flexDirection="column"
        height={size}
        justifyContent="center"
        key={colIndex}
        margin={['2px', '2px', '4px']}
        onClick={onOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        padding="8px"
        width={size}
      >
        {!isHovered ? (
          <>
            {icon ? <Image height="30px" src={icon} width="30px" /> : <ViewIcon />}
            <Text display={['none', 'none', 'inline']} marginTop="8px">
              {name || 'N/A'}
            </Text>
          </>
        ) : isEditor ? (
          <EditIcon boxSize="32px" />
        ) : (
          <ViewIcon boxSize="32px" />
        )}
      </Flex>
      <BingoTileDetails isOpen={isOpen} onClose={onClose} tile={tile} />
    </>
  );
};

export default BingoTile;
