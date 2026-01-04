import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';
// import Cashapp from '../assets/cashapp.png';
import GemLogo from '../assets/gemlogo-small.png';
import Discord from '../assets/discord-small.png';
import WebCounter from './WebCounter';

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
      <Flex
        alignItems="center"
        border="2px black solid"
        backgroundColor={theme.colors.teal[400]}
        borderRadius="8px"
        height={['48px', '28px']}
        padding="2px"
      >
        <Image alt="Discord logo" src={Discord} width={['40px', '20px']} loading="lazy" />
      </Flex>
    </Link>
    <Box backgroundColor={theme.colors.teal[400]} padding="10px" borderRadius="50%">
      <Image
        aria-hidden
        height={['60px', '80px']}
        src={GemLogo}
        width={['60px', '80px']}
        loading="lazy"
      />
    </Box>
    {/* <Link
      alignItems="center"
      display="flex"
      href="https://cash.app/$lemonlikesgirls/5.00"
      target="_blank"
    >
      <Box backgroundColor={theme.colors.teal[400]} borderRadius={['16px', '8px']}>
        <Image
          alt="Cashapp logo"
          height={['44px', '28px']}
          src={Cashapp}
          width={['44px', '28px']}
          loading="lazy"
        />
      </Box>
      <Text display={['none', 'block']} marginLeft="8px">
        donate
      </Text>
    </Link> */}
    <WebCounter />
  </Flex>
);

export default Footer;
