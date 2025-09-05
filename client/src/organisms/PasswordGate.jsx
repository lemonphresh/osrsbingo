import { useState } from 'react';
import { Button, FormControl, FormLabel, Input, VStack, Text } from '@chakra-ui/react';

export default function PasswordGate(props) {
  const { onAuthed, submitOverride } = props;
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitOverride(password);
      onAuthed();
    } catch (err) {
      setError(err?.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ width: '100%', maxWidth: 420 }}>
      <VStack align="stretch" spacing={4}>
        <FormControl>
          <FormLabel>Enter password</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        {error && <Text color="red.400">{error}</Text>}
        <Button type="submit" isLoading={loading}>
          Enter
        </Button>
      </VStack>
    </form>
  );
}
