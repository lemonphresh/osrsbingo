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
  const audioContextRef = useRef(null);
  const toast = useToast();

  const isSupported = notificationsApiSupported;

  // Update document title whenever the pending count changes
  useEffect(() => {
    if (!isAdmin) return;

    const count =
      typeof allPendingIncompleteSubmissionsCount === 'number'
        ? allPendingIncompleteSubmissionsCount
        : submissions.filter((s) => s.status === 'PENDING_REVIEW').length;

    document.title =
      count > 0
        ? `(${count}) OSRS Bingo Hub - Create and Share Bingo Boards`
        : 'OSRS Bingo Hub - Create and Share Bingo Boards';

    return () => {
      document.title = 'OSRS Bingo Hub - Create and Share Bingo Boards';
    };
  }, [allPendingIncompleteSubmissionsCount, isAdmin, submissions]);

  const pendingToShow =
    typeof allPendingIncompleteSubmissionsCount === 'number'
      ? allPendingIncompleteSubmissionsCount
      : submissions.filter((s) => s.status === 'PENDING_REVIEW').length;

  // ===== Sound =====
  const playTones = useCallback((audioContext, tones) => {
    tones.forEach(([frequency, duration, startTime]) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      playTones(ctx, [
        [800, 0.1, now],
        [600, 0.15, now + 0.1],
      ]);
    } catch (err) {
      console.error('❌ Error playing sound:', err);
      toast({ title: 'Sound unavailable', status: 'warning', duration: 3000, isClosable: true });
    }
  }, [soundEnabled, toast, getAudioContext, playTones]);

  const enableSound = useCallback(() => {
    setSoundEnabled(true);
    localStorage.setItem('treasureHunt_sound_enabled', 'true');
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      playTones(ctx, [
        [800, 0.1, now],
        [600, 0.15, now + 0.1],
      ]);
      toast({ title: 'Sound enabled', status: 'success', duration: 3000 });
    } catch (err) {
      console.error('Failed to enable sound:', err);
      setSoundEnabled(false);
      localStorage.setItem('treasureHunt_sound_enabled', 'false');
      toast({ title: 'Could not enable sound', status: 'warning', duration: 4000 });
    }
  }, [toast, getAudioContext, playTones]);

  const disableSound = useCallback(() => {
    setSoundEnabled(false);
    localStorage.setItem('treasureHunt_sound_enabled', 'false');
    toast({ title: 'Sound disabled', status: 'info', duration: 3000 });
  }, [toast]);

  // ===== Load saved prefs =====
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

  // ===== Seed "seen" IDs on first load =====
  useEffect(() => {
    if (submissions.length > 0 && !isInitialized.current) {
      submissions.forEach((s) => previousSubmissionIds.current.add(s.submissionId));
      isInitialized.current = true;
    }
  }, [submissions]);

  // ===== OS Notification helpers =====
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
        const n = new Notification('Gielinor Rush Notifications Enabled', {
          body: `You'll receive alerts for new submissions in ${eventName}`,
          icon: '/favicon.ico',
          tag: 'test-notification',
        });
        n.onclick = () => {
          window.focus();
          n.close();
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
    } catch (err) {
      console.error('❌ Error requesting notification permission:', err);
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

  const showOsNotification = useCallback((title, body, tag) => {
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

  // ===== New submission diff — fires when submissions array changes =====
  useEffect(() => {
    if (
      !isAdmin ||
      !notificationsEnabled ||
      permission !== 'granted' ||
      !isInitialized.current ||
      allPendingIncompleteSubmissionsCount === 0
    )
      return;

    const newSubs = submissions.filter((s) => !previousSubmissionIds.current.has(s.submissionId));
    if (newSubs.length === 0) return;

    newSubs.forEach((s) => previousSubmissionIds.current.add(s.submissionId));

    const newPending = newSubs.filter((s) => s.status === 'PENDING_REVIEW');
    if (newPending.length === 0) return;

    playNotificationSound();

    // Group by node so we fire one OS notification per node rather than per submission
    const byNode = newPending.reduce((acc, sub) => {
      (acc[sub.nodeId] = acc[sub.nodeId] || []).push(sub);
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

    toast({
      title: `New Submission${newPending.length > 1 ? 's' : ''}`,
      description: `${newPending.length} new submission${
        newPending.length > 1 ? 's' : ''
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

  // ===== WebSocket subscriptions (admin only) =====
  const canSubscribe = isAdmin && !!eventId;

  useSubscription(SUBMISSION_ADDED_SUB, {
    variables: { eventId },
    skip: !canSubscribe,
    onData: ({ data }) => {
      const sub = data.data?.submissionAdded;
      if (!sub) return;
      if (sub.submissionId) previousSubmissionIds.current.add(sub.submissionId);
      if (notificationsEnabled && permission === 'granted' && sub.status === 'PENDING_REVIEW') {
        playNotificationSound();
        showOsNotification(
          `New Submission - ${eventName}`,
          `${sub.team?.teamName || 'A team'} submitted for node ${sub.nodeId}`,
          `submission-${sub.nodeId}`
        );
      }
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
        const statusLabel =
          sub.status === 'APPROVED'
            ? 'approved ✅'
            : sub.status === 'DENIED'
            ? 'denied ❌'
            : sub.status;
        playNotificationSound();
        showOsNotification(
          `Submission ${statusLabel} - ${eventName}`,
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

  // ===== Refetch on tab focus / visibility =====
  useEffect(() => {
    if (!isBrowser || typeof refetchSubmissions !== 'function') return;
    const onFocus = () => {
      if (isAdmin) refetchSubmissions();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isAdmin) refetchSubmissions();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
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
    pendingCount: pendingToShow,
  };
};

export default useSubmissionNotifications;
