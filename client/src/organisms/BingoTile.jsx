import React, { useEffect, useState } from 'react';
import theme from '../theme';
import { Flex, Image, Text, useDisclosure } from '@chakra-ui/react';
import { CheckCircleIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import BingoTileDetails from './BingoTileDetails';

const BingoTile = ({ colIndex, completedPatterns, isEditor, tile }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const size = ['56px', '64px', '96px', '120px'];
  const [isHovered, setIsHovered] = useState(false);
  const { icon, isComplete, name, value } = tile;
  const [updatedCompletedPatterns, setUpdatedCompletedPatterns] = useState(completedPatterns);
  const [isPartOfCompletedGroup, setIsPartOfCompletedGroup] = useState(
    completedPatterns.some((group) => group.tiles.includes(tile.id))
  );

  useEffect(() => {
    setUpdatedCompletedPatterns(completedPatterns);
  }, [completedPatterns, tile]);

  useEffect(() => {
    setIsPartOfCompletedGroup(
      updatedCompletedPatterns.some((group) => group.tiles.some((item) => item.id === tile.id))
    );
  }, [tile.id, updatedCompletedPatterns]);

  return (
    <>
      <Flex
        _hover={{
          backgroundColor: !isComplete ? theme.colors.blue[500] : theme.colors.green[300],
          cursor: 'pointer',
        }}
        alignItems="center"
        backgroundColor={!isComplete ? theme.colors.blue[600] : theme.colors.green[400]}
        borderRadius={['8px', '12px']}
        boxShadow={
          isPartOfCompletedGroup
            ? `0 0 4px rgba(255, 182, 193, 0.8), 
            0 0 8px rgba(255, 160, 170, 0.6), 
            0 0 12px rgba(255, 140, 160, 0.5), 
            0 0 16px rgba(255, 120, 140, 0.4)`
            : 'none'
        }
        color={!isComplete ? theme.colors.white : theme.colors.gray[800]}
        flexDirection="column"
        height={size}
        justifyContent="center"
        key={tile}
        margin={['2px', '2px', '4px']}
        onClick={onOpen}
        // zz make onEnter open thse too
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        padding="8px"
        transition="all ease 0.2s"
        width={size}
        tabIndex={0}
      >
        {!isHovered ? (
          <>
            {icon ? (
              <Image height="30px" src={icon} width="30px" />
            ) : isComplete ? (
              <CheckCircleIcon boxSize="30px" color={theme.colors.green[600]} />
            ) : (
              <Image
                height="32px"
                src="https://oldschool.runescape.wiki/images/thumb/Achievement_Diaries.png/1200px-Achievement_Diaries.png?f3803"
                width="32px"
              />
            )}
            <Text
              display={['none', 'none', '-webkit-box']}
              marginTop="8px"
              overflow="hidden"
              textOverflow="ellipsis"
              maxWidth="100%"
              textAlign="center"
              whiteSpace="normal"
              css={`
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
              `}
            >
              {name || 'N/A'}
            </Text>
            {value > 0 ? (
              <Text
                display={['none', 'none', '-webkit-box']}
                marginTop="8px"
                overflow="hidden"
                textOverflow="ellipsis"
                maxWidth="100%"
                textAlign="center"
                fontSize="12px"
                whiteSpace="normal"
                css={`
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: 2;
                `}
              >
                ({value} pts)
              </Text>
            ) : null}
          </>
        ) : isEditor ? (
          <EditIcon boxSize="32px" />
        ) : (
          <ViewIcon boxSize="32px" />
        )}
      </Flex>
      <BingoTileDetails isEditor={isEditor} isOpen={isOpen} onClose={onClose} tile={tile} />
    </>
  );
};

export default BingoTile;
