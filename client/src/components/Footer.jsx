import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';
import Cashapp from '../assets/cashapp.png';
import GemLogo from '../assets/gemlogo.png';
import GitHub from '../assets/github.png';

const Footer = () => (
  <Flex
    alignItems="center"
    backgroundColor={theme.colors.teal[500]}
    boxShadow="-4px -4px 8px 2px rgba(0, 0, 0, 0.07)"
    color={theme.colors.gray[700]}
    justifyContent="space-between"
    paddingX={['16px', '32px']}
    paddingBottom="32px"
    paddingTop={['32px', '64px']}
    width="100%"
    zIndex="4"
  >
    <Link
      alignItems="center"
      display="flex"
      href="https://www.discord.gg/eternalgems"
      target="_blank"
    >
      <Text display={['none', 'block']} marginRight="8px">
        discord
      </Text>
      <Box
        border="3px black solid"
        backgroundColor={theme.colors.teal[400]}
        borderRadius={['8px', '4px']}
      >
        <Image aria-hidden height={['42px', '22px']} src={GitHub} width={['42px', '22px']} />
      </Box>
    </Link>
    <Box backgroundColor={theme.colors.teal[400]} padding="10px" borderRadius="50%">
      <Image aria-hidden height={['60px', '80px']} src={GemLogo} width={['60px', '80px']} />
    </Box>
    <Link
      alignItems="center"
      display="flex"
      href="https://cash.app/$lemonlikesgirls/5.00"
      target="_blank"
    >
      <Box backgroundColor={theme.colors.teal[400]} borderRadius={['16px', '8px']}>
        <Image aria-hidden height={['44px', '28px']} src={Cashapp} width={['44px', '28px']} />
      </Box>
      <Text display={['none', 'block']} marginLeft="8px">
        donate
      </Text>
    </Link>
  </Flex>
);

export default Footer;
