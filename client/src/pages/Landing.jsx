import React, { useEffect } from 'react';
import { Button, Flex, Image, Text } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import OsrsWikiLogo from '../assets/osrswikilogo.png';
import { useAuth } from '../providers/AuthProvider';
import theme from '../theme';
import { NavLink, useNavigate } from 'react-router-dom';

/* 
  current todo (11/20):
    * add logout button to user details page
  
    * figure out username validation conditions 
    * clean up server files

*/

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/user/${user.id}`);
    }
  }, [navigate, user]);

  return (
    <Flex
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
    >
      <Flex flexDirection={['column', 'column', 'column', 'row']} gridGap="32px">
        <Section flexDirection="column" width="100%">
          <GemTitle>OSRS Bingo Hub</GemTitle>
          <Text marginX={['0px', '16px', '56px', '16px']}>
            There should be some intro text here describing briefly what this website has to offer.
            Beneath this will be a little image of an example bingo board when I can take one. Have
            a frog instead.
          </Text>
          <Image
            margin="0 auto"
            maxHeight="124px"
            maxWidth="124px"
            src="https://png.pngtree.com/png-vector/20240122/ourmid/pngtree-green-toad-frog-png-image_11454296.png"
          />
        </Section>
        <Section flexDirection="column" width="100%">
          <GemTitle>Get Started</GemTitle>
          <Text marginBottom="8px" marginX={['0px', '16px', '56px', '16px']}>
            Log in or sign up to access the wonderful world of OSRS bingo, you damn sweat.
          </Text>
          <Flex
            height="100%"
            flexDirection="column"
            gridGap="24px"
            marginX={['0px', '16px', '56px']}
            marginY={['16px', '16px', '56px']}
          >
            <NavLink to="/login">
              <Button
                backgroundColor={theme.colors.pink[400]}
                height={['64px', '56px']}
                width="100%"
              >
                Log In
              </Button>
            </NavLink>
            <NavLink to="/signup">
              <Button
                backgroundColor={theme.colors.blue[300]}
                height={['64px', '56px']}
                width="100%"
              >
                Sign Up
              </Button>
            </NavLink>
          </Flex>
        </Section>
      </Flex>
      <Text marginTop="32px" textAlign="center">
        <span style={{ fontWeight: 'bold' }}>Questions?</span> Go to{' '}
        <NavLink to="/faq">
          <span style={{ color: theme.colors.blue[400], textDecoration: 'underline' }}>
            the FAQ
          </span>
          .
        </NavLink>
      </Text>

      <Flex
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        marginTop="56px"
        width="100%"
      >
        <Text color={theme.colors.gray[400]} marginBottom="24px">
          This project uses an API courtesy of:{' '}
        </Text>
        <Image maxWidth="450px" src={OsrsWikiLogo} width={['225px', '325px', '450px']} />
      </Flex>
    </Flex>
  );
};

export default Landing;
