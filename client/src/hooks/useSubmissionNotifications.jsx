import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

export const useSubmissionNotifications = (
  submissions = [],
  isAdmin = false,
  eventName = '',
  refetchSubmissions = null,
  pollingInterval = 30000
) => {
  const isBrowser = typeof window !== 'undefined';
  const notificationsApiSupported = isBrowser && 'Notification' in window;

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState(
    notificationsApiSupported ? Notification.permission : 'default'
  );
  const [soundEnabled, setSoundEnabled] = useState(false);

  const previousSubmissionIds = useRef(new Set());
  const isInitialized = useRef(false);
  const pollingIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const toast = useToast();

  const isSupported = notificationsApiSupported;

  // ===== Sound helper function =====
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) {
      return;
    }

    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Create a pleasant two-tone notification sound
      const playTone = (frequency, duration, startTime) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Smooth envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play two-tone "ding-dong" sound
      const now = audioContext.currentTime;
      playTone(800, 0.1, now); // Higher pitch
      playTone(600, 0.15, now + 0.1); // Lower pitch
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      // If Web Audio fails, show a warning
      toast({
        title: 'Sound unavailable',
        description: 'Could not play notification sound',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [soundEnabled, toast]);

  // ===== Sound control functions =====
  const enableSound = useCallback(() => {
    // Test the sound immediately (requires user gesture)
    setSoundEnabled(true);
    localStorage.setItem('treasureHunt_sound_enabled', 'true');

    // Play a test sound to verify it works
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const playTone = (frequency, duration, startTime) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playTone(800, 0.1, now);
      playTone(600, 0.15, now + 0.1);

      toast({
        title: 'Sound enabled',
        description: 'You will hear alerts for new submissions',
        status: 'success',
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to enable sound:', err);
      setSoundEnabled(false);
      localStorage.setItem('treasureHunt_sound_enabled', 'false');
      toast({
        title: 'Could not enable sound',
        description: 'Your browser may have blocked audio',
        status: 'warning',
        duration: 4000,
      });
    }
  }, [toast]);

  const disableSound = useCallback(() => {
    setSoundEnabled(false);
    localStorage.setItem('treasureHunt_sound_enabled', 'false');
    toast({
      title: 'Sound disabled',
      status: 'info',
      duration: 3000,
    });
  }, [toast]);

  // Load saved prefs (notifications + sound)
  useEffect(() => {
    if (!isBrowser) return;

    const savedNotif = localStorage.getItem('treasureHunt_notifications_enabled');
    const savedSound = localStorage.getItem('treasureHunt_sound_enabled');

    if (
      savedNotif === 'true' &&
      notificationsApiSupported &&
      Notification.permission === 'granted'
    ) {
      setNotificationsEnabled(true);
    }

    if (savedSound === 'true') {
      setSoundEnabled(true);
    }
  }, [isBrowser, notificationsApiSupported]);

  // Initialize previous submissions on first load
  useEffect(() => {
    if (submissions.length > 0 && !isInitialized.current) {
      submissions.forEach((sub) => {
        previousSubmissionIds.current.add(sub.submissionId);
      });
      isInitialized.current = true;
    }
  }, [submissions]);

  // Request permission
  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support notifications',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('treasureHunt_notifications_enabled', 'true');

        toast({
          title: 'Notifications Enabled',
          description: "You'll be notified of new submissions",
          status: 'success',
          duration: 3000,
        });

        // Send test notification
        const testNotif = new Notification('Treasure Hunt Notifications Enabled', {
          body: `You'll receive alerts for new submissions in ${eventName}`,
          icon: '/favicon.ico',
          tag: 'test-notification',
        });

        testNotif.onclick = () => {
          window.focus();
          testNotif.close();
        };

        return true;
      } else {
        console.warn('⚠️ Permission denied');
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          status: 'warning',
          duration: 5000,
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  };

  // Disable notifications
  const disableNotifications = useCallback(() => {
    console.log('🔕 Disabling notifications');
    setNotificationsEnabled(false);
    localStorage.setItem('treasureHunt_notifications_enabled', 'false');
    toast({
      title: 'Notifications Disabled',
      description: 'You will no longer receive submission alerts',
      status: 'info',
      duration: 3000,
    });
  }, [toast]);

  // Detect new submissions and notify + sound
  useEffect(() => {
    if (!isAdmin || !notificationsEnabled || permission !== 'granted' || !isInitialized.current) {
      return;
    }

    const newSubmissions = submissions.filter(
      (s) => !previousSubmissionIds.current.has(s.submissionId)
    );

    if (newSubmissions.length === 0) {
      console.log('✅ No new submissions to notify about');
      return;
    }

    // Track them so we don't re-alert
    newSubmissions.forEach((s) => previousSubmissionIds.current.add(s.submissionId));

    // Only notify for pending
    const newPendingSubmissions = newSubmissions.filter((s) => s.status === 'PENDING_REVIEW');

    if (newPendingSubmissions.length === 0) return;

    // Play sound ONCE for all new submissions
    playNotificationSound();

    // Group by node and notify
    const byNode = newPendingSubmissions.reduce((acc, sub) => {
      if (!acc[sub.nodeId]) acc[sub.nodeId] = [];
      acc[sub.nodeId].push(sub);
      return acc;
    }, {});

    Object.entries(byNode).forEach(([nodeId, subs]) => {
      const teamName = subs[0].team?.teamName || 'Unknown Team';
      const count = subs.length;

      try {
        const n = new Notification(`New Submission${count > 1 ? 's' : ''} - ${eventName}`, {
          body: `${teamName} submitted ${count} completion${count > 1 ? 's' : ''} for review`,
          icon: '/favicon.ico',
          tag: `submission-${nodeId}`,
          requireInteraction: false,
          silent: true, // We play our own sound
        });

        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (e) {
        console.error('❌ Notification error:', e);
      }
    });

    // In-app toast
    toast({
      title: `New Submission${newPendingSubmissions.length > 1 ? 's' : ''}`,
      description: `${newPendingSubmissions.length} new submission${
        newPendingSubmissions.length > 1 ? 's' : ''
      } pending review`,
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  }, [
    submissions,
    isAdmin,
    notificationsEnabled,
    permission,
    eventName,
    toast,
    playNotificationSound,
  ]);

  // ===== Polling effect =====
  useEffect(() => {
    const canPoll =
      notificationsEnabled &&
      isAdmin &&
      permission === 'granted' &&
      typeof refetchSubmissions === 'function';

    if (!canPoll) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    refetchSubmissions();

    pollingIntervalRef.current = setInterval(() => {
      refetchSubmissions();
    }, Math.max(5000, pollingInterval));

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [notificationsEnabled, isAdmin, permission, refetchSubmissions, pollingInterval]);

  // ===== Refetch on tab focus =====
  useEffect(() => {
    if (!isBrowser || typeof refetchSubmissions !== 'function') return;

    const onFocus = () => {
      if (notificationsEnabled && isAdmin) {
        refetchSubmissions();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && notificationsEnabled && isAdmin) {
        refetchSubmissions();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isBrowser, notificationsEnabled, isAdmin, refetchSubmissions]);

  return {
    isSupported,
    notificationsEnabled,
    permission,
    requestPermission,
    disableNotifications,
    // Sound controls
    soundEnabled,
    enableSound,
    disableSound,
  };
};

export default useSubmissionNotifications;
