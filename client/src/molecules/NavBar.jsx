import { Flex, Icon, Image, Text } from '@chakra-ui/react';
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import theme from '../theme';
import GemLogo from '../assets/gemlogo.png';
import GnomeChild from '../assets/gnomechild.png';
import { useAuth } from '../providers/AuthProvider';
import { css } from '@emotion/react';
import { MdContactSupport } from 'react-icons/md';

const NavBar = () => {
  const { user } = useAuth();

  return (
    <Flex
      alignItems="center"
      backgroundColor={`rgba(50, 104, 107, 1)`}
      borderBottom={`4px ${theme.colors.teal[800]} solid`}
      boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
      color={theme.colors.gray[200]}
      justifyContent="space-between"
      paddingX={['16px', '32px']}
      paddingY="16px"
      position="relative"
    >
      <Link style={{ display: 'flex', alignItems: 'center' }} to="/faq">
        <Icon
          aria-hidden
          as={MdContactSupport}
          color={theme.colors.blue[300]}
          height={['48px', '32px']}
          width={['48px', '32px']}
        />
        <Text display={['none', 'block']} fontWeight="semibold" marginLeft="8px">
          faq
        </Text>
      </Link>
      <Flex
        alignItems="center"
        backgroundColor={theme.colors.gray[400]}
        borderRadius="50%"
        boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
        css={css`
          position: absolute;
          background: ${theme.colors.teal[600]};
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;

          &::before {
            content: '';
            zindex: 0;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0.3) 25%,
              rgba(0, 0, 0, 0.1) 50%,
              rgba(255, 255, 255, 0.3) 75%
            );
            background-size: 200% 100%;
            transition: background 0.4s ease;
            pointer-events: none;
          }

          &:hover::before {
            animation: glimmer 1.5s infinite linear;
          }

          @keyframes glimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
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
        <NavLink
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
          }}
          to={user ? `/user/${user.id}` : '/'}
        >
          <Image
            aria-hidden
            height={['110px', '80px']}
            src={GemLogo}
            width={['110px', '80px']}
            loading="lazy"
          />
        </NavLink>
      </Flex>

      <Link
        style={{ display: 'flex', alignItems: 'center' }}
        to={user ? `/user/${user.id}` : '/login'}
      >
        <Text display={['none', 'block']} fontWeight="semibold" marginRight="8px">
          {user ? user.username : 'log in'}
        </Text>
        <Image aria-hidden height={['48px', '32px']} src={GnomeChild} width={['48px', '32px']} />
      </Link>
    </Flex>
  );
};

export default NavBar;
