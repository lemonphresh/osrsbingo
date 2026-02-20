import { Button, Flex, Image, Link as ChakraLink, Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';
// import Cashapp from '../assets/cashapp.png';
import Gnomechild from '../assets/gnomechild.png';
import Discord from '../assets/discord-small.png';
import WebCounter from './WebCounter';
import { Link } from 'react-router-dom';
import PleaseEffect from '../atoms/PleaseEffect';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Flex
      alignItems="center"
      backgroundColor={theme.colors.teal[500]}
      boxShadow="-4px -4px 8px 2px rgba(0, 0, 0, 0.07)"
      color={theme.colors.gray[700]}
      flexDirection="column"
      paddingX={['16px', '32px']}
      paddingBottom="32px"
      paddingTop={['32px', '48px']}
      width="100%"
      zIndex="4"
    >
      <Flex
        alignItems="center"
        flexDirection={['column', 'row']}
        gridGap={['16px', '32px']}
        justifyContent="space-between"
        maxW="600px"
        w="100%"
        mb="24px"
      >
        <Link to="/about">about</Link>
        <Link to="/faq">faq</Link>
        <Link to="/privacy">privacy</Link>
        <Link to="/terms">terms</Link>
        <Link to="/changelog">changelog</Link>
        <Link to="/stats">site stats</Link>
      </Flex>
      <Flex
        alignItems="center"
        flexDirection={['column', 'row']}
        gridGap={['16px', '32px']}
        justifyContent="space-between"
        w="100%"
      >
        <ChakraLink
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
        </ChakraLink>
        <PleaseEffect>
          <Link to="/support">
            <Button
              leftIcon={<Image alt="Gnomechild" src={Gnomechild} width="20px" height="20px" />}
              size="lg"
              colorScheme="gray"
              variant="solid"
            >
              Support the site
            </Button>
          </Link>
        </PleaseEffect>
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
      <Flex
        alignItems="center"
        flexDirection={['column', 'row']}
        gridGap={['16px', '32px']}
        justifyContent="center"
        maxW="600px"
        fontSize="12px"
        w="100%"
        mt="24px"
      >
        © {currentYear} OSRS Bingo Hub · Not affiliated with Jagex Ltd.
      </Flex>
    </Flex>
  );
};

export default Footer;
