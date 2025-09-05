import { Alert, AlertIcon, AlertTitle, AlertDescription, Button, HStack } from '@chakra-ui/react';
import theme from '../theme';

export default function UpdateBanner({ onRefresh, onDismiss }) {
  return (
    <Alert
      colorScheme="pink"
      textColor={theme.colors.light.textColor}
      status="info"
      borderRadius="md"
    >
      <AlertIcon />
      <HStack justify="space-between" w="100%">
        <AlertTitle>New calendar changes available</AlertTitle>
        <AlertDescription display={{ base: 'none', md: 'block' }}>
          Someone updated the schedule since you opened this page.
        </AlertDescription>
        <HStack>
          <Button size="sm" onClick={onRefresh}>
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </HStack>
      </HStack>
    </Alert>
  );
}
