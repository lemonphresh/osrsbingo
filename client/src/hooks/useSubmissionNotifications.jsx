import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useSubscription } from '@apollo/client';
import {
  SUBMISSION_ADDED_SUB,
  SUBMISSION_REVIEWED_SUB,
  NODE_COMPLETED_SUB,
} from '../graphql/mutations';

export const useSubmissionNotifications = (
  submissions = [],
  isAdmin = false,
  eventName = '',
  refetchSubmissions = null,
  pollingInterval = 10000,
  eventId,
  allPendingIncompleteSubmissionsCount = 0
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
  const originalFaviconRef = useRef(null);
  const toast = useToast();

  const isSupported = notificationsApiSupported;

  // ===== Favicon Badge Functions =====
  const drawFaviconBadge = useCallback(
    (count) => {
      if (!isBrowser || count === 0) {
        // Restore original favicon
        if (originalFaviconRef.current) {
          const link =
            document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = originalFaviconRef.current;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        return;
      }

      try {
        if (!originalFaviconRef.current) {
          const existingLink = document.querySelector("link[rel*='icon']");
          originalFaviconRef.current = existingLink?.href || '/favicon.ico';
        }

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 32, 32);

          const badgeSize = 18;
          const x = canvas.width - badgeSize / 2 - 2;
          const y = badgeSize / 2 + 2;

          ctx.fillStyle = '#FF4B5C';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, badgeSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const displayCount = count > 99 ? '99+' : count.toString();
          ctx.fillText(displayCount, x, y);

          const link =
            document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = canvas.toDataURL();
          document.getElementsByTagName('head')[0].appendChild(link);
        };

        img.onerror = () => {
          console.warn('Could not load favicon for badge');
        };

        img.src = originalFaviconRef.current;
      } catch (error) {
        console.error('Error drawing favicon badge:', error);
      }
    },
    [isBrowser]
  );

  // Update favicon/title on pending count changes
  useEffect(() => {
    if (!isAdmin) return;

    const pendingToShow =
      typeof allPendingIncompleteSubmissionsCount === 'number'
        ? allPendingIncompleteSubmissionsCount
        : submissions.filter((s) => s.status === 'PENDING_REVIEW').length;
    drawFaviconBadge(allPendingIncompleteSubmissionsCount);

    document.title =
      pendingToShow > 0
        ? `(${pendingToShow}) OSRS Bingo Hub - Create and Share Bingo Boards`
        : `OSRS Bingo Hub - Create and Share Bingo Boards`;

    return () => {
      if (originalFaviconRef.current) {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = originalFaviconRef.current;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    };
  }, [submissions, isAdmin, eventName, drawFaviconBadge, allPendingIncompleteSubmissionsCount]);

  // ===== Sound helper =====
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

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
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      toast({
        title: 'Sound unavailable',
        description: 'Could not play notification sound',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [soundEnabled, toast]);

  // ===== Sound controls =====
  const enableSound = useCallback(() => {
    setSoundEnabled(true);
    localStorage.setItem('treasureHunt_sound_enabled', 'true');

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
    toast({ title: 'Sound disabled', status: 'info', duration: 3000 });
  }, [toast]);

  // Load saved prefs
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
    if (savedSound === 'true') setSoundEnabled(true);
  }, [isBrowser, notificationsApiSupported]);

  // Seed "seen" IDs
  useEffect(() => {
    if (submissions.length > 0 && !isInitialized.current) {
      submissions.forEach((sub) => previousSubmissionIds.current.add(sub.submissionId));
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

        const testNotif = new Notification('Gielinor Rush Notifications Enabled', {
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

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    localStorage.setItem('treasureHunt_notifications_enabled', 'false');
    toast({
      title: 'Notifications Disabled',
      description: 'You will no longer receive submission alerts',
      status: 'info',
      duration: 3000,
    });
  }, [toast]);

  const showOsNotification = useCallback((title, body, tag = undefined) => {
    try {
      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        requireInteraction: false,
        silent: true,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      console.error('❌ Notification error:', e);
    }
  }, []);

  // List-diff path (works with polling too)
  useEffect(() => {
    if (
      !isAdmin ||
      !notificationsEnabled ||
      permission !== 'granted' ||
      !isInitialized.current ||
      allPendingIncompleteSubmissionsCount === 0
    ) {
      return;
    }

    const newSubmissions = submissions.filter(
      (s) => !previousSubmissionIds.current.has(s.submissionId)
    );

    if (newSubmissions.length === 0) {
      return;
    }
    newSubmissions.forEach((s) => previousSubmissionIds.current.add(s.submissionId));

    const newPendingSubmissions = newSubmissions.filter((s) => s.status === 'PENDING_REVIEW');
    if (newPendingSubmissions.length === 0) return;

    if (notificationsEnabled && permission === 'granted') {
      playNotificationSound();
      const byNode = newPendingSubmissions.reduce((acc, sub) => {
        if (!acc[sub.nodeId]) acc[sub.nodeId] = [];
        acc[sub.nodeId].push(sub);
        return acc;
      }, {});
      Object.entries(byNode).forEach(([nodeId, subs]) => {
        const teamName = subs[0].team?.teamName || 'Unknown Team';
        const count = subs.length;
        showOsNotification(
          `New Submission${count > 1 ? 's' : ''} - ${eventName}`,
          `${teamName} submitted ${count} completion${count > 1 ? 's' : ''} for review`,
          `submission-${nodeId}`
        );
      });
    }

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
    showOsNotification,
    allPendingIncompleteSubmissionsCount,
  ]);

  // ===== Subscriptions (admins only; decoupled from OS permission) =====
  const canSubscribe = isAdmin && !!eventId;

  useSubscription(SUBMISSION_ADDED_SUB, {
    variables: { eventId },
    skip: !canSubscribe,
    onData: ({ data }) => {
      const sub = data.data?.submissionAdded;
      if (!sub) return;

      if (sub.submissionId) previousSubmissionIds.current.add(sub.submissionId);

      // Optional OS notif/sound
      if (notificationsEnabled && permission === 'granted' && sub.status === 'PENDING_REVIEW') {
        playNotificationSound();
        showOsNotification(
          `New Submission - ${eventName}`,
          `${sub.team?.teamName || 'A team'} submitted for node ${sub.nodeId}`,
          `submission-${sub.nodeId}`
        );
      }

      // Always refresh UI data
      refetchSubmissions?.();
    },
  });

  useSubscription(SUBMISSION_REVIEWED_SUB, {
    variables: { eventId },
    skip: !canSubscribe,
    onData: ({ data }) => {
      const sub = data.data?.submissionReviewed;
      if (!sub) return;

      if (notificationsEnabled && permission === 'granted') {
        const status =
          sub.status === 'APPROVED'
            ? 'approved ✅'
            : sub.status === 'DENIED'
            ? 'denied ❌'
            : sub.status;
        playNotificationSound();
        showOsNotification(
          `Submission ${status} - ${eventName}`,
          `${sub.team?.teamName || 'Team'}: node ${sub.nodeId}`,
          `submission-reviewed-${sub.submissionId || sub.nodeId}`
        );
      }

      refetchSubmissions?.();
    },
  });

  useSubscription(NODE_COMPLETED_SUB, {
    variables: { eventId },
    skip: !canSubscribe,
    onData: ({ data }) => {
      const ev = data.data?.nodeCompleted;
      if (!ev) return;

      if (notificationsEnabled && permission === 'granted') {
        playNotificationSound();
        showOsNotification(
          `Node completed - ${eventName}`,
          `${ev.teamName || 'Team'} completed ${ev.nodeName || ev.nodeId}`,
          `node-completed-${ev.nodeId}`
        );
      }

      refetchSubmissions?.();
    },
  });

  // ===== Polling fallback =====
  useEffect(() => {
    const canPoll = isAdmin && typeof refetchSubmissions === 'function';

    // If we have subscriptions, we can back off to a slower poll.
    const effectiveInterval = canSubscribe ? Math.max(30000, pollingInterval) : pollingInterval;

    if (!canPoll) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    refetchSubmissions();

    pollingIntervalRef.current = setInterval(() => {
      refetchSubmissions();
    }, Math.max(5000, effectiveInterval));

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAdmin, refetchSubmissions, pollingInterval, canSubscribe]);

  // Refetch on tab focus/visibility
  useEffect(() => {
    if (!isBrowser || typeof refetchSubmissions !== 'function') return;

    const onFocus = () => {
      if (isAdmin) refetchSubmissions();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAdmin) {
        refetchSubmissions();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isBrowser, isAdmin, refetchSubmissions]);

  return {
    isSupported,
    notificationsEnabled,
    permission,
    requestPermission,
    disableNotifications,
    soundEnabled,
    enableSound,
    disableSound,
  };
};

export default useSubmissionNotifications;
