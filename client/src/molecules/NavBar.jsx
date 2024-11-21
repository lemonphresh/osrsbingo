import { Flex, Image, Link, Text } from '@chakra-ui/react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import theme from '../theme';
import Cashapp from '../assets/cashapp.png';
import GemLogo from '../assets/gemlogo.png';
import GnomeChild from '../assets/gnomechild.png';
import { useAuth } from '../providers/AuthProvider';

const NavBar = () => {
  const { user } = useAuth();

  return (
    <Flex
      alignItems="center"
      backgroundColor={theme.colors.orange[300]}
      borderBottom={`4px ${theme.colors.yellow[600]} solid`}
      boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
      color={theme.colors.gray[700]}
      justifyContent="space-between"
      paddingX={['16px', '32px']}
      paddingY="16px"
      position="relative"
    >
      <Link
        alignItems="center"
        display="flex"
        href="https://cash.app/$lemonlikesgirls/5.00"
        target="_blank"
      >
        <Image aria-hidden height={['40px', '20px']} src={Cashapp} width={['40px', '20px']} />
        <Text display={['none', 'block']} marginLeft="8px">
          donate
        </Text>
      </Link>
      <Flex
        alignItems="center"
        backgroundColor={theme.colors.orange[400]}
        borderRadius="50%"
        boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
        height={['125px', '100px']}
        justifyContent="center"
        marginTop={['3px', '25px']}
        padding="8px"
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        width={['125px', '100px']}
      >
        <NavLink to={user ? `/user/${user.id}` : '/'}>
          <Image aria-hidden height={['110px', '80px']} src={GemLogo} width={['110px', '80px']} />
        </NavLink>
      </Flex>

      <Link alignItems="center" display="flex" href={user ? `/user/${user.id}` : '/login'}>
        <Text display={['none', 'block']} marginRight="8px">
          {user ? user.username : 'log in'}
        </Text>
        <Image
          aria-hidden
          filter="drop-shadow(1px 0 0 black) 
        drop-shadow(0 1px 0 black)
        drop-shadow(-1px 0 0 black) 
        drop-shadow(0 -1px 0 black)"
          height={['40px', '20px']}
          src={GnomeChild}
          width={['40px', '20px']}
        />
      </Link>
    </Flex>
  );
};

export default NavBar;
