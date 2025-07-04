import React, { useEffect, useState } from 'react';
import { Box, Flex, Image, Text, useDisclosure } from '@chakra-ui/react';
import { CheckCircleIcon, EditIcon } from '@chakra-ui/icons';
import BingoTileDetails from './BingoTileDetails';
import useBingoTileTheme from '../hooks/useBingoTileTheme';
import { MdLaunch } from 'react-icons/md';

const BingoTile = ({ completedPatterns, cursor, isEditor, tile, themeName }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const size = ['48px', '64px', '96px', '120px'];
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
          '#icon': {
            opacity: 1,
          },
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
        cursor={cursor}
        flexDirection="column"
        height={size}
        justifyContent="center"
        key={tile}
        margin={['2px', '2px', '4px']}
        onClick={onOpen}
        padding={['4px', '8px']}
        position="relative"
        transition="all ease 0.2s"
        width={size}
        tabIndex={0}
      >
        <>
          {icon ? (
            <Image aria-hidden maxHeight="30px" maxWidth="30px" src={icon} loading="lazy" />
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
        <Box position="absolute" right={isEditor ? '4px' : '6px'} top={isEditor ? '0px' : '6px'}>
          {isEditor ? (
            <EditIcon color="rgba(0,0,0,0.6)" />
          ) : (
            <MdLaunch color="rgba(0,0,0,0.6)" id="icon" opacity="0" />
          )}
        </Box>
      </Flex>
      <BingoTileDetails isEditor={isEditor} isOpen={isOpen} onClose={onClose} tile={tile} />
    </>
  );
};

export default BingoTile;
