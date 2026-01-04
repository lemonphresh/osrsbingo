import {
  Alert,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { InfoIcon, LockIcon, WarningIcon } from '@chakra-ui/icons';
import useForm from '../hooks/useForm';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { useMutation } from '@apollo/client';
import { CREATE_USER } from '../graphql/mutations';

const validatePasswords = (p1, p2) => p1 === p2;

const totalFormValidation = (values, hasAcknowledged) =>
  values.password?.length > 0 &&
  values.confirmedPassword?.length > 0 &&
  validatePasswords(values.password, values.confirmedPassword) &&
  values.username?.length !== 0 &&
  hasAcknowledged;

const SignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [hasAcknowledgedPassword, setHasAcknowledgedPassword] = useState(false);

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
      if (totalFormValidation(values, hasAcknowledgedPassword)) {
        const { data } = await createUser({
          variables: {
            username: values.username,
            displayName: values.displayName,
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
      displayName: null,
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
          onSubmit={(e) => {
            e.preventDefault();
            if (totalFormValidation(values, hasAcknowledgedPassword)) {
              onSubmit();
            }
          }}
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

          {/* Password Warning Banner */}
          <Box
            background="linear-gradient(135deg, #F4D35E 0%, #EE964B 100%)"
            borderRadius="12px"
            padding="16px"
            position="relative"
            overflow="hidden"
            boxShadow="0 4px 12px rgba(244, 211, 94, 0.3)"
          >
            {/* Decorative shield icon background */}
            <Box
              position="absolute"
              right="30px"
              top="50%"
              transform="translateY(-50%)"
              opacity={0.15}
              fontSize="80px"
            >
              🛡️
            </Box>

            <VStack align="stretch" spacing={3} position="relative" zIndex={1}>
              <HStack spacing={3}>
                <Box backgroundColor="rgba(0,0,0,0.15)" borderRadius="full" padding="8px">
                  <LockIcon color="#1F271B" boxSize={5} />
                </Box>
                <Text color="#1F271B" fontWeight="bold" fontSize="lg">
                  Write Down Your Password!
                </Text>
              </HStack>

              <Text color="#1F271B" fontSize="sm" lineHeight="1.6">
                <strong>There is no password recovery.</strong> We intentionally do not collect
                emails to protect your OSRS account credentials from potential data breaches.
              </Text>

              <Box backgroundColor="rgba(0,0,0,0.1)" borderRadius="8px" padding="12px">
                <Text color="#1F271B" fontSize="sm" fontWeight="medium">
                  Tip: Use a password manager or write it somewhere safe. If you forget your
                  password, you'll need to create a new account, and potentially lose all your
                  boards!
                </Text>
              </Box>
            </VStack>
          </Box>

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
          <FormControl isInvalid={values.displayName?.length === 0} isRequired>
            <FormLabel>Display Name</FormLabel>
            <Input
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              maxLength={16}
              onChange={onChange}
              name="displayName"
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
              Enter a PUBLIC display name. (Max length of 16 characters.)
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

          {/* Acknowledgment Checkbox */}
          <Box
            backgroundColor={
              hasAcknowledgedPassword ? 'rgba(255,255,255, 0.8)' : theme.colors.gray[200]
            }
            borderRadius="8px"
            borderWidth="2px"
            borderColor={hasAcknowledgedPassword ? theme.colors.green[200] : theme.colors.gray[300]}
            padding="16px"
            transition="all 0.2s ease"
          >
            <Checkbox
              colorScheme="green"
              borderColor={theme.colors.pink[400]}
              isChecked={hasAcknowledgedPassword}
              onChange={(e) => setHasAcknowledgedPassword(e.target.checked)}
              size="lg"
            >
              <Text fontSize="sm" color={theme.colors.gray[600]} marginLeft="8px">
                I understand there is <strong>no password recovery</strong> and I have saved my
                password somewhere safe.
              </Text>
            </Checkbox>
          </Box>

          {loading && errors.length === 0 && (
            <Flex alignSelf="center" gridGap="16px" justifySelf="center">
              Loading
            </Flex>
          )}
          <Button
            alignSelf="center"
            backgroundColor={theme.colors.green[200]}
            color={
              !totalFormValidation(values, hasAcknowledgedPassword)
                ? theme.colors.gray[400]
                : theme.colors.gray[700]
            }
            disabled={!totalFormValidation(values, hasAcknowledgedPassword)}
            marginTop="24px"
            type="submit"
            width={['100%', '250px']}
            _hover={{
              backgroundColor: totalFormValidation(values, hasAcknowledgedPassword)
                ? theme.colors.green[300]
                : theme.colors.green[200],
            }}
          >
            Sign Up
          </Button>
        </form>
      </Section>
    </Flex>
  );
};

export default SignUp;
