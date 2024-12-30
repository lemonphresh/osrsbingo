import React, { useEffect, useState } from 'react';
import { Flex, Image, Text, useDisclosure } from '@chakra-ui/react';
import { CheckCircleIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import BingoTileDetails from './BingoTileDetails';
import useBingoTileTheme from '../hooks/useBingoTileTheme';

const BingoTile = ({ colIndex, completedPatterns, isEditor, tile, themeName }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const size = ['48px', '64px', '96px', '120px'];
  const [isHovered, setIsHovered] = useState(false);
  const { icon, isComplete, name, value } = tile;
  const [updatedCompletedPatterns, setUpdatedCompletedPatterns] = useState(completedPatterns);
  const [isPartOfCompletedGroup, setIsPartOfCompletedGroup] = useState(
    completedPatterns.some((group) => group.tiles.includes(tile.id))
  );

  const {
    hoverBackgroundColor,
    backgroundColor,
    completeBackgroundColor,
    completeHoverBackgroundColor,
    textColor,
    completeTextColor,
  } = useBingoTileTheme(themeName);

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
          backgroundColor: isComplete ? completeHoverBackgroundColor : hoverBackgroundColor,
          cursor: 'pointer',
        }}
        alignItems="center"
        backgroundColor={isComplete ? completeBackgroundColor : backgroundColor}
        borderRadius={['8px', '12px']}
        boxShadow={
          isPartOfCompletedGroup
            ? `0 0 4px rgba(255, 182, 193, 0.8), 
            0 0 8px rgba(255, 160, 170, 0.6), 
            0 0 12px rgba(255, 140, 160, 0.5), 
            0 0 16px rgba(255, 120, 140, 0.4)`
            : 'none'
        }
        color={isComplete ? completeTextColor : textColor}
        flexDirection="column"
        height={size}
        justifyContent="center"
        key={tile}
        margin={['2px', '2px', '4px']}
        onClick={onOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        padding={['4px', '8px']}
        transition="all ease 0.2s"
        width={size}
        tabIndex={0}
      >
        {!isHovered ? (
          <>
            {icon ? (
              <Image aria-hidden height="30px" src={icon} width="30px" loading="lazy" />
            ) : isComplete ? (
              <CheckCircleIcon boxSize="30px" color="rgba(0,0,0,0.3)" />
            ) : (
              <Image
                height="32px"
                src="https://oldschool.runescape.wiki/images/thumb/Achievement_Diaries.png/1200px-Achievement_Diaries.png?f3803"
                width="32px"
              />
            )}
            <Text
              display={['none', 'none', '-webkit-box']}
              fontSize={['14px', '14px', '14px', '16px']}
              marginTop={['2px', '2px', '2px', '4px']}
              overflow="hidden"
              textOverflow="ellipsis"
              maxWidth="100%"
              textAlign="center"
              whiteSpace="normal"
              sx={{
                '-webkit-box-orient': 'vertical',
                '-webkit-line-clamp': ['1', '1', '1', '2'],
              }}
            >
              {name || 'N/A'}
            </Text>
            {value > 0 ? (
              <Text
                display={['none', 'none', '-webkit-box']}
                marginTop={['0px', '0px', '0px', '8px']}
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
