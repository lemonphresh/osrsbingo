import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Alert,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { WarningIcon } from '@chakra-ui/icons';
import { FaLock } from 'react-icons/fa';
import useForm from '../hooks/useForm';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { LOGIN_USER } from '../graphql/mutations';
import { useMutation } from '@apollo/client';
import usePageTitle from '../hooks/usePageTitle';

const validatePassword = (pass) => !!pass && pass.length >= 4;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  usePageTitle('Log In');

  const [loginUser, { data, error }] = useMutation(LOGIN_USER);

  const { onChange, onSubmit, values } = useForm(
    () => {
      loginUser({
        variables: { username: values.username, password: values.password },
      });
    },
    {
      username: null,
      password: null,
    }
  );

  useEffect(() => {
    if (error) {
      setErrors([{ message: error.message }]);
    }
    if (data) {
      localStorage.setItem('authToken', data.loginUser.token);

      login(data.loginUser);
      navigate(`/user/${data.loginUser.user.id}`);
    }
  }, [data, error, login, navigate]);

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      justifyContent="center"
      marginX={['8px', '24px']}
      my={['32px', '64px']}
    >
      <Section
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        maxWidth="525px"
        width="100%"
      >
        <form
          style={{
            display: 'flex',
            flexDirection: 'column',
            gridGap: '16px',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <GemTitle>Welcome back!</GemTitle>
          {errors.map((error) => (
            <Alert
              backgroundColor={theme.colors.pink[100]}
              borderRadius="8px"
              key={error.message}
              marginY="16px"
              textAlign="center"
            >
              <Text color={theme.colors.pink[500]}>
                <WarningIcon
                  alignSelf={['flex-start', undefined]}
                  color={theme.colors.pink[500]}
                  marginRight="8px"
                  marginBottom="4px"
                  height="14px"
                  width="14px"
                />
                {error.message}
              </Text>
            </Alert>
          ))}
          <FormControl isInvalid={values.username?.length === 0} isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              onChange={onChange}
              name="username"
              type="text"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              autoComplete="password"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              defaultValue={values.password}
              onChange={onChange}
              name="password"
              type="password"
            />
          </FormControl>
          <Button
            alignSelf="center"
            backgroundColor={theme.colors.green[200]}
            marginTop="24px"
            onClick={onSubmit}
            width={['100%', '250px']}
          >
            Log In
          </Button>
        </form>

        {/* Forgot Password Accordion */}
        <Accordion allowToggle width="100%" mt={6}>
          <AccordionItem border="none">
            <AccordionButton px={0} _hover={{ bg: 'transparent' }} justifyContent="center">
              <Text fontSize="sm" color={theme.colors.gray[300]}>
                Forgot your password?
              </Text>
              <AccordionIcon color={theme.colors.gray[500]} ml={1} />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Box
                bg={theme.colors.gray[100]}
                borderRadius="lg"
                p={4}
                borderLeft="3px solid"
                borderColor={theme.colors.yellow[400]}
              >
                <VStack align="start" spacing={3}>
                  <Flex align="center" gap={2}>
                    <FaLock color={theme.colors.yellow[600]} size={14} />
                    <Text fontWeight="bold" fontSize="sm" color={theme.colors.gray[700]}>
                      Here's the deal...
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color={theme.colors.gray[600]} lineHeight="1.6">
                    Passwords are fully encrypted and can't be recovered—not even by me. I also
                    don't collect emails (on purpose!) to protect your data from breaches, so
                    implementing a password recovery feature isn't an option. This is a feature, not
                    a bug. 🔒
                  </Text>
                  <Text
                    fontSize="sm"
                    color={theme.colors.gray[600]}
                    lineHeight="1.6"
                    fontWeight="medium"
                  >
                    Your options:
                  </Text>
                  <VStack align="start" spacing={1} pl={2}>
                    <Text fontSize="sm" color={theme.colors.gray[600]}>
                      • Create a new account and duplicate your old boards (they're still there!)
                    </Text>
                    <Text fontSize="sm" color={theme.colors.gray[600]}>
                      • Reach out to{' '}
                      <ChakraLink
                        href="https://www.discord.gg/eternalgems"
                        isExternal
                        color={theme.colors.green[500]}
                        textDecoration="underline"
                      >
                        @buttlid on the Eternal Gems Discord server
                      </ChakraLink>{' '}
                      to delete the old account. There's a ticket system in place :)
                    </Text>
                  </VStack>
                  <Text fontSize="xs" color={theme.colors.gray[500]} fontStyle="italic" pt={1}>
                    Sorry for the inconvenience, but your security is really important to me.
                  </Text>
                </VStack>
              </Box>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Flex backgroundColor={theme.colors.gray[300]} height="2px" marginTop="24px" width="100%" />

        <Text marginTop="16px">
          New here? Go to{' '}
          <NavLink to="/signup">
            <span style={{ color: theme.colors.green[400], textDecoration: 'underline' }}>
              the sign up page
            </span>
            .
          </NavLink>
        </Text>
      </Section>
    </Flex>
  );
};

export default Login;
