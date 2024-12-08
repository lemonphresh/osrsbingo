import {
  Alert,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { InfoIcon, WarningIcon } from '@chakra-ui/icons';
import useForm from '../hooks/useForm';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { useMutation } from '@apollo/client';
import { CREATE_USER } from '../graphql/mutations';

const validatePasswords = (p1, p2) => p1 === p2;

const totalFormValidation = (values) =>
  values.password?.length > 0 &&
  values.confirmedPassword?.length > 0 &&
  validatePasswords(values.password, values.confirmedPassword) &&
  // zz validate length of username
  values.username?.length !== 0;

const SignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);

  const [createUser, { loading }] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      login(data.createUser);
      navigate(`/user/${data.createUser.id}`);
    },
    onError: (err) => {
      setErrors([err.message]);
    },
  });

  const { onChange, onSubmit, values } = useForm(
    async () => {
      if (totalFormValidation(values)) {
        const { data } = await createUser({
          variables: {
            username: values.username,
            password: values.password,
            rsn: values.rsn || '',
            permissions: 'user',
          },
        });

        if (data?.createUser?.token) {
          localStorage.setItem('authToken', data.createUser.token);
        }
      }
    },
    {
      username: null,
      password: null,
      confirmedPassword: null,
      rsn: null,
      permissions: 'user',
    }
  );

  const passwordError = useCallback(
    () => validatePasswords(values.password, values.confirmedPassword),
    [values.password, values.confirmedPassword]
  );

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
        marginY="64px"
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
          <GemTitle>Get Started</GemTitle>
          <Text>
            Already have an account?{' '}
            <NavLink to="/login">
              <span style={{ color: theme.colors.green[400], textDecoration: 'underline' }}>
                Log in here
              </span>
              .
            </NavLink>
          </Text>
          <Flex
            backgroundColor={theme.colors.gray[300]}
            height="2px"
            marginBottom="24px"
            width="100%"
          />

          {errors.map((error) => (
            <Alert
              backgroundColor={theme.colors.pink[100]}
              borderRadius="8px"
              key={error.message + 'a'}
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
              autoComplete="username"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              maxLength={16}
              onChange={onChange}
              name="username"
              type="text"
            />
            <FormHelperText color={theme.colors.gray[400]}>
              <InfoIcon
                alignSelf={['flex-start', undefined]}
                color={theme.colors.green[400]}
                marginX="8px"
                marginBottom="4px"
                height="14px"
                width="14px"
              />
              Enter a username. (Max length of 16 characters.)
            </FormHelperText>
          </FormControl>
          <FormControl isInvalid={values.RSN?.length === 0}>
            <FormLabel>RSN</FormLabel>
            <Input
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              maxLength={16}
              onChange={onChange}
              name="rsn"
              type="text"
            />
            <FormHelperText color={theme.colors.gray[400]}>
              <InfoIcon
                alignSelf={['flex-start', undefined]}
                color={theme.colors.green[400]}
                marginX="8px"
                marginBottom="4px"
                height="14px"
                width="14px"
              />
              Enter your RSN. (Optional, but helpful.)
            </FormHelperText>
          </FormControl>
          <FormControl isInvalid={passwordError() && values.password?.length === 0} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              autoComplete="new-password"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              defaultValue={values.password}
              onChange={onChange}
              name="password"
              type="password"
            />
            {!passwordError() && values.password?.length === 0 ? (
              <FormHelperText color={theme.colors.gray[400]}>Enter your password.</FormHelperText>
            ) : (
              <FormErrorMessage>Passwords must match.</FormErrorMessage>
            )}
          </FormControl>
          <FormControl
            isInvalid={passwordError() && values.confirmedPassword?.length === 0}
            isRequired
          >
            <FormLabel>Confirm password</FormLabel>
            <Input
              autoComplete="new-password"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              defaultValue={values.confirmedPassword}
              onChange={onChange}
              name="confirmedPassword"
              type="password"
            />
            {!passwordError() && values.confirmedPassword?.length === 0 ? (
              <FormHelperText color={theme.colors.gray[400]}>
                Re-enter your password.
              </FormHelperText>
            ) : (
              <FormErrorMessage>Passwords must match.</FormErrorMessage>
            )}
          </FormControl>
          {loading && errors.length === 0 && (
            <Flex alignSelf="center" gridGap="16px" justifySelf="center">
              Loading
            </Flex>
          )}
          <Button
            alignSelf="center"
            backgroundColor={theme.colors.green[200]}
            color={!totalFormValidation(values) ? theme.colors.gray[400] : theme.colors.gray[700]}
            disabled={!totalFormValidation(values)}
            marginTop="24px"
            onClick={onSubmit}
            width={['100%', '250px']}
          >
            Sign Up
          </Button>
        </form>
      </Section>
    </Flex>
  );
};

export default SignUp;
