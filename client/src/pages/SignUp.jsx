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
import usePageTitle from '../hooks/usePageTitle';

const validatePasswords = (p1, p2) => p1 === p2;

const totalFormValidation = (values, hasAcknowledged) =>
  values.password?.length > 0 &&
  values.confirmedPassword?.length > 0 &&
  validatePasswords(values.password, values.confirmedPassword) &&
  values.username?.length !== 0 &&
  hasAcknowledged;

const HelperText = ({ text }) => (
  <FormHelperText color={theme.colors.gray[400]}>
    <InfoIcon
      color={theme.colors.green[400]}
      marginX="8px"
      marginBottom="4px"
      height="14px"
      width="14px"
    />
    {text}
  </FormHelperText>
);

const SignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [hasAcknowledgedPassword, setHasAcknowledgedPassword] = useState(false);

  usePageTitle('Sign Up');

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

  const passwordsMatch = useCallback(
    () => validatePasswords(values.password, values.confirmedPassword),
    [values.password, values.confirmedPassword]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && totalFormValidation(values, hasAcknowledgedPassword)) {
      onSubmit(e);
    }
  };

  const isValid = totalFormValidation(values, hasAcknowledgedPassword);

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
        <GemTitle>Get Started</GemTitle>
        <Text mt={2}>
          Already have an account?{' '}
          <NavLink to="/login">
            <span style={{ color: theme.colors.green[400], textDecoration: 'underline' }}>
              Log in here
            </span>
          </NavLink>
          .
        </Text>

        <Flex backgroundColor={theme.colors.gray[300]} height="2px" marginY="24px" width="100%" />

        <Flex flexDirection="column" gap="16px" width="100%">
          {errors.map((error) => (
            <Alert
              backgroundColor={theme.colors.pink[100]}
              borderRadius="8px"
              key={error}
              textAlign="center"
            >
              <Text color={theme.colors.pink[500]}>
                <WarningIcon
                  color={theme.colors.pink[500]}
                  marginRight="8px"
                  marginBottom="2px"
                  height="14px"
                  width="14px"
                />
                {error}
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
            <Box
              position="absolute"
              right="30px"
              top="50%"
              transform="translateY(-50%)"
              opacity={0.15}
              fontSize="160px"
            >
              🛡️
            </Box>
            <VStack align="stretch" spacing={3} position="relative" zIndex={1}>
              <HStack spacing={3}>
                <Box backgroundColor="rgba(0,0,0,0.15)" borderRadius="full" padding="8px">
                  <LockIcon color="#1F271B" boxSize={5} />
                </Box>
                <Text color="#1F271B" fontWeight="semibold" fontSize="lg">
                  Write Down Your Password!
                </Text>
              </HStack>
              <Text color="#1F271B" fontSize="sm" lineHeight="1.6">
                <strong>There is no password recovery.</strong> We intentionally do not collect
                emails to protect your OSRS account credentials from potential data breaches.
                Everything is encrypted, so Lemon The Dev can't recover it either.
              </Text>
              <Box backgroundColor="rgba(0,0,0,0.1)" borderRadius="8px" padding="12px">
                <Text color="#1F271B" fontSize="sm" fontWeight="medium">
                  Use a password manager or write it somewhere safe. If you forget, you'll need a
                  new account and could lose your boards.
                </Text>
              </Box>
            </VStack>
          </Box>

          <FormControl isInvalid={values.username?.length === 0} isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              autoComplete="username"
              autoFocus
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              maxLength={16}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              name="username"
              type="text"
            />
            <HelperText text="Max 16 characters." />
          </FormControl>

          <FormControl isInvalid={values.displayName?.length === 0} isRequired>
            <FormLabel>Display Name</FormLabel>
            <Input
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              maxLength={16}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              name="displayName"
              type="text"
            />
            <HelperText text="This is shown publicly. Max 16 characters." />
          </FormControl>

          <FormControl>
            <FormLabel>
              RSN{' '}
              <Text as="span" fontSize="sm" color={theme.colors.gray[400]}>
                (optional)
              </Text>
            </FormLabel>
            <Input
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              maxLength={16}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              name="rsn"
              type="text"
            />
            <HelperText text="Your in-game name. Helpful but not required." />
          </FormControl>

          <FormControl isInvalid={!passwordsMatch() && values.password?.length > 0} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              autoComplete="new-password"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              name="password"
              type="password"
            />
            <FormErrorMessage>Passwords must match.</FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!passwordsMatch() && values.confirmedPassword?.length > 0}
            isRequired
          >
            <FormLabel>Confirm Password</FormLabel>
            <Input
              autoComplete="new-password"
              backgroundColor={theme.colors.gray[300]}
              color={theme.colors.gray[700]}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              name="confirmedPassword"
              type="password"
            />
            <FormErrorMessage>Passwords must match.</FormErrorMessage>
          </FormControl>

          {/* Acknowledgment Checkbox */}
          <Box
            backgroundColor={
              hasAcknowledgedPassword ? 'rgba(255,255,255,0.8)' : theme.colors.gray[200]
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
                I understand there is <strong>no password recovery</strong> and I've saved my
                password somewhere safe.
              </Text>
            </Checkbox>
          </Box>

          <Button
            alignSelf="center"
            backgroundColor={theme.colors.green[200]}
            color={isValid ? theme.colors.gray[700] : theme.colors.gray[400]}
            isDisabled={!isValid}
            isLoading={loading}
            loadingText="Creating account..."
            onClick={(e) => {
              if (isValid) onSubmit(e);
            }}
            marginTop="8px"
            width={['100%', '250px']}
            _hover={{
              backgroundColor: isValid ? theme.colors.green[300] : theme.colors.green[200],
            }}
          >
            Sign Up
          </Button>
        </Flex>
      </Section>
    </Flex>
  );
};

export default SignUp;
