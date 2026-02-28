import React from 'react';
import {
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Switch,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { AddIcon, InfoIcon } from '@chakra-ui/icons';
import EventAdminManager from './TreasureAdminManager';
import TreasureRefManager from './TreasureRefManager';

const EventSettingsTab = ({
  event,
  eventId,
  currentColors,
  colorMode,
  notificationsSupported,
  notificationsEnabled,
  notificationPermission,
  requestNotificationPermission,
  disableNotifications,
  handleGenerateMap,
  generateLoading,
  mapGenCooldownLeft,
  onCreateTeamOpen,
  onDiscordSetupOpen,
}) => (
  <Card bg={currentColors.cardBg}>
    <CardBody>
      <VStack align="stretch" spacing={4}>
        <Heading size="md" color={currentColors.textColor}>
          Event Configuration
        </Heading>

        {notificationsSupported && (
          <Card bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2} flex={1}>
                    <HStack>
                      <Text fontSize="2xl">{notificationsEnabled ? '🔔' : '🔕'}</Text>
                      <Heading size="sm" color={currentColors.textColor}>
                        Submission Notifications
                      </Heading>
                      {notificationsEnabled && (
                        <Badge colorScheme="green" fontSize="xs">
                          PUBLIC
                        </Badge>
                      )}
                      <HStack
                        borderLeft="1px solid gray"
                        paddingLeft={3}
                        marginLeft={2}
                        spacing={2}
                      >
                        {notificationsEnabled ? (
                          <>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => {
                                if (Notification.permission === 'granted') {
                                  if (
                                    localStorage.getItem('treasureHunt_sound_enabled') !== 'false'
                                  ) {
                                    const ac = new (window.AudioContext ||
                                      window.webkitAudioContext)();
                                    const playTone = (f, d, t) => {
                                      const o = ac.createOscillator();
                                      const g = ac.createGain();
                                      o.connect(g);
                                      g.connect(ac.destination);
                                      o.frequency.value = f;
                                      o.type = 'sine';
                                      g.gain.setValueAtTime(0, t);
                                      g.gain.linearRampToValueAtTime(0.3, t + 0.01);
                                      g.gain.exponentialRampToValueAtTime(0.01, t + d);
                                      o.start(t);
                                      o.stop(t + d);
                                    };
                                    const now = ac.currentTime;
                                    playTone(800, 0.1, now);
                                    playTone(600, 0.15, now + 0.1);
                                  }
                                  const n = new Notification('Test Notification', {
                                    body: 'If you can see this, notifications are working!',
                                    icon: '/favicon.ico',
                                    tag: 'manual-test',
                                    silent: true,
                                  });
                                  n.onclick = () => {
                                    window.focus();
                                    n.close();
                                  };
                                }
                              }}
                            >
                              Send Test
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={disableNotifications}
                            >
                              Disable
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={requestNotificationPermission}
                            isDisabled={notificationPermission === 'denied'}
                          >
                            Enable Notifications
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      {notificationsEnabled
                        ? "You'll receive browser notifications when new submissions arrive"
                        : 'Enable notifications to get alerts for new submissions'}
                    </Text>
                    {notificationPermission === 'denied' && (
                      <Text fontSize="xs" color="red.500">
                        ⚠️ Notifications are blocked. Please enable them in your browser settings.
                      </Text>
                    )}

                    {notificationsEnabled && (
                      <HStack
                        p={2}
                        bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                        borderRadius="md"
                        w="full"
                      >
                        <Text fontSize="2xl">🔊</Text>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={currentColors.textColor}
                          >
                            Notification Sound
                          </Text>
                          <Text
                            fontSize="xs"
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                          >
                            Play a sound when new submissions arrive
                          </Text>
                        </VStack>
                        <Switch
                          colorScheme="purple"
                          defaultChecked={
                            localStorage.getItem('treasureHunt_sound_enabled') !== 'false'
                          }
                          onChange={(e) => {
                            localStorage.setItem(
                              'treasureHunt_sound_enabled',
                              e.target.checked.toString()
                            );
                            if (e.target.checked) {
                              const ac = new (window.AudioContext || window.webkitAudioContext)();
                              const playTone = (f, d, t) => {
                                const o = ac.createOscillator();
                                const g = ac.createGain();
                                o.connect(g);
                                g.connect(ac.destination);
                                o.frequency.value = f;
                                o.type = 'sine';
                                g.gain.setValueAtTime(0, t);
                                g.gain.linearRampToValueAtTime(0.3, t + 0.01);
                                g.gain.exponentialRampToValueAtTime(0.01, t + d);
                                o.start(t);
                                o.stop(t + d);
                              };
                              const now = ac.currentTime;
                              playTone(800, 0.1, now);
                              playTone(600, 0.15, now + 0.1);
                            }
                          }}
                        />
                      </HStack>
                    )}
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        <hr />
        {event.status === 'DRAFT' && (
          <HStack gap={4}>
            <Button
              colorScheme="green"
              onClick={handleGenerateMap}
              isLoading={generateLoading}
              isDisabled={mapGenCooldownLeft > 0}
              animation={
                !event.nodes || event.nodes.length === 0
                  ? 'flashButton 1.5s ease-in-out infinite'
                  : 'none'
              }
              sx={{
                '@keyframes flashButton': {
                  '0%,100%': {
                    boxShadow: '0 0 0 0 rgba(72,187,120,0.7)',
                    transform: 'scale(1)',
                  },
                  '50%': {
                    boxShadow: '0 0 20px 5px rgba(72,187,120,0.9)',
                    transform: 'scale(1.05)',
                  },
                },
              }}
            >
              {event.nodes?.length > 0 ? 'Regenerate Map' : 'Generate Map'}
              {mapGenCooldownLeft > 0 && ` (${mapGenCooldownLeft}s)`}
            </Button>
            <Button
              leftIcon={<AddIcon />}
              bg={currentColors.turquoise.base}
              color="white"
              _hover={{ opacity: 0.8 }}
              onClick={onCreateTeamOpen}
            >
              Add Team
            </Button>
          </HStack>
        )}

        <Card bg={currentColors.purple.base} color="white" borderRadius="md">
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Icon as={InfoIcon} boxSize={5} />
                <Heading size="sm">Discord Integration</Heading>
              </HStack>
              <Text fontSize="sm">
                Connect your Discord server to let teams interact with the Treasure Hunt directly
                from Discord.
              </Text>
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                variant="solid"
                onClick={onDiscordSetupOpen}
                leftIcon={<InfoIcon />}
              >
                View Setup Instructions
              </Button>
            </VStack>
          </CardBody>
        </Card>
        <hr />
        <SimpleGrid columns={[1, 1, 2]} spacing={6}>
          <EventAdminManager event={event} onUpdate={() => window.location.reload()} />
          <TreasureRefManager event={event} />
        </SimpleGrid>
      </VStack>
    </CardBody>
  </Card>
);

export default EventSettingsTab;
