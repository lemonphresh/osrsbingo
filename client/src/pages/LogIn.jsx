import {
  Alert,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { WarningIcon } from '@chakra-ui/icons';
import useForm from '../hooks/useForm';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { LOGIN_USER } from '../graphql/mutations';
import { useMutation } from '@apollo/client';

const validatePassword = (pass) => !!pass && pass.length >= 7;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);

  const [loginUser, { data, loading, error }] = useMutation(LOGIN_USER);

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
  // zz todo
  const usernameError = useCallback(() => console.log(values.username), [values.username]);
  useEffect(() => {
    if (error) {
      setErrors([{ message: error.message }]);
    }
    if (data) {
      console.log({ data });
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
            {usernameError() && <FormErrorMessage>Username is required.</FormErrorMessage>}
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
            color={
              !validatePassword(values.password) ? theme.colors.gray[400] : theme.colors.gray[700]
            }
            disabled={!validatePassword(values.password)}
            marginTop="24px"
            onClick={onSubmit}
            width={['100%', '250px']}
          >
            Log In
          </Button>
        </form>
        <Flex backgroundColor={theme.colors.gray[300]} height="2px" marginTop="24px" width="100%" />

        <Text marginTop="16px">
          New here? Go to{' '}
          <NavLink to="/signup">
            <span style={{ color: theme.colors.blue[400], textDecoration: 'underline' }}>
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
