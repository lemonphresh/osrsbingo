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
import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { InfoIcon, WarningIcon } from '@chakra-ui/icons';
import useForm from '../hooks/useForm';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';

const validatePasswords = (p1, p2) => p1 === p2;

const totalFormValidation = (values) =>
  values.password?.length > 0 &&
  values.confirmedPassword?.length > 0 &&
  validatePasswords(values.password, values.confirmedPassword) &&
  // zz validate length of username
  values.email?.length > 0 &&
  values.username?.length !== 0;

const SignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [registerUserCb, setRegisterUserCb] = useState(null);
  const [res, setRes] = useState();

  const { onChange, onSubmit, values } = useForm(registerUserCb, {
    username: null,
    email: null,
    password: null,
    confirmedPassword: null,
  });

  useEffect(() => {
    if (totalFormValidation(values)) {
      const callback = async () => {
        setIsLoading(true);
        const response = await axios.post(`/auth/signup`, values);

        if (response.data.errors) {
          setErrors(response.data.errors);
          return;
        }

        if (response.data) {
          setRes(response.data);
          login(response.data);
        }
      };

      setRegisterUserCb(() => callback);
    }
  }, [login, values]);

  useEffect(() => {
    if (res) {
      // zz get user id in response
      setIsLoading(false);
      navigate(`/user/${res.id}`);
    }
  }, [navigate, res]);

  const usernameError = useCallback(() => console.log(values.username), [values.username]);
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
              <span style={{ color: theme.colors.blue[400], textDecoration: 'underline' }}>
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
              key={error.message}
              marginY="16px"
              textAlign="center"
            >
              <Text>
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
          {isLoading && errors.length === 0 && (
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
