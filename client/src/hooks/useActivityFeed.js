import { useSubscription, useQuery } from '@apollo/client';
import { useState, useEffect, useRef } from 'react';
import { TREASURE_ACTIVITY_SUB, GET_TREASURE_ACTIVITIES } from '../graphql/mutations';

export const useActivityFeed = (eventId, teams = []) => {
  const [activities, setActivities] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Stable ref for teams — avoids stale closure without re-running effects
  const teamsRef = useRef(teams);
  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  // Buffer incoming subscription events that arrive before history loads
  const pendingRef = useRef([]);

  const { data: historyData, loading: historyLoading } = useQuery(GET_TREASURE_ACTIVITIES, {
    variables: { eventId, limit: 50 },
    skip: !eventId,
  });

  const { data: subData, error } = useSubscription(TREASURE_ACTIVITY_SUB, {
    variables: { eventId },
    skip: !eventId,
  });

  const formatActivity = (activity) => {
    const team = teamsRef.current.find((t) => t.teamId === activity.teamId);
    let timestamp;
    if (activity.timestamp) {
      const parsed = Number(activity.timestamp);
      timestamp = !isNaN(parsed) ? new Date(parsed) : new Date(activity.timestamp);
    } else {
      timestamp = new Date();
    }
    return { ...activity, team, timestamp, ...activity.data };
  };

  // Load history — then flush any buffered subscription events
  useEffect(() => {
    if (!historyData?.getTreasureActivities) return;

    const formatted = historyData.getTreasureActivities.map(formatActivity);
    const ids = new Set(formatted.map((a) => a.id));

    // Merge buffered subscription events that aren't already in history
    const merged = [...pendingRef.current.filter((a) => !ids.has(a.id)), ...formatted];
    pendingRef.current = [];

    setActivities(merged.slice(0, 50));
    setHistoryLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyData]);

  // Handle incoming subscription events
  useEffect(() => {
    if (!subData?.treasureHuntActivity) return;
    const activity = subData.treasureHuntActivity;
    const formatted = formatActivity(activity);

    if (!historyLoaded) {
      // Buffer until history is ready — avoid duplicates in the buffer
      pendingRef.current = pendingRef.current.find((a) => a.id === activity.id)
        ? pendingRef.current
        : [formatted, ...pendingRef.current];
      return;
    }

    setActivities((prev) => {
      if (prev.find((a) => a.id === activity.id)) return prev; // dedup
      return [formatted, ...prev.slice(0, 49)];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subData, historyLoaded]);

  return { activities, loading: historyLoading, error };
};
