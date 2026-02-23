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
  const originalFaviconRef = useRef(null);
  // Cache the loaded favicon Image element so we never re-fetch it
  const faviconImgRef = useRef(null);
  const toast = useToast();

  const isSupported = notificationsApiSupported;

  // ===== Favicon Badge =====
  // Draws a red badge onto the favicon canvas. Reuses a single cached Image
  // so the browser only makes one request for /favicon.ico per session.
  const drawFaviconBadge = useCallback(
    (count) => {
      if (!isBrowser) return;

      if (count === 0) {
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

        const renderBadge = (img) => {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
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
          ctx.fillText(count > 99 ? '99+' : count.toString(), x, y);

          const link =
            document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = canvas.toDataURL();
          document.getElementsByTagName('head')[0].appendChild(link);
        };

        if (faviconImgRef.current) {
          // Already loaded — draw immediately, no network request
          renderBadge(faviconImgRef.current);
        } else {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            faviconImgRef.current = img; // cache for all future calls
            renderBadge(img);
          };
          img.onerror = () => console.warn('Could not load favicon for badge');
          img.src = originalFaviconRef.current;
        }
      } catch (err) {
        console.error('Error drawing favicon badge:', err);
      }
    },
    [isBrowser]
  );

  // Update favicon + document title whenever the pending count changes
  useEffect(() => {
    if (!isAdmin) return;

    const count =
      typeof allPendingIncompleteSubmissionsCount === 'number'
        ? allPendingIncompleteSubmissionsCount
        : submissions.filter((s) => s.status === 'PENDING_REVIEW').length;

    drawFaviconBadge(count);
    document.title =
      count > 0
        ? `(${count}) OSRS Bingo Hub - Create and Share Bingo Boards`
        : 'OSRS Bingo Hub - Create and Share Bingo Boards';

    return () => {
      // Restore original favicon on unmount
      if (originalFaviconRef.current) {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = originalFaviconRef.current;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    };
  }, [allPendingIncompleteSubmissionsCount, isAdmin, drawFaviconBadge, submissions]);
  // NOTE: intentionally removed `submissions` and `eventName` from the dep array —
  // `allPendingIncompleteSubmissionsCount` is the authoritative count and is already derived
  // from submissions upstream, so re-running on raw `submissions` just doubles the work.

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
