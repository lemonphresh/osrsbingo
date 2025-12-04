import { useSubscription, useQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import { TREASURE_ACTIVITY_SUBSCRIPTION, GET_TREASURE_ACTIVITIES } from '../graphql/mutations';

export const useActivityFeed = (eventId, teams = []) => {
  const [activities, setActivities] = useState([]);

  // Load historical activities
  const { data: historyData, loading: historyLoading } = useQuery(GET_TREASURE_ACTIVITIES, {
    variables: { eventId, limit: 50 },
    skip: !eventId,
  });

  // Subscribe to new activities
  const { data: subData, error } = useSubscription(TREASURE_ACTIVITY_SUBSCRIPTION, {
    variables: { eventId },
    skip: !eventId,
  });

  // Load history on mount
  useEffect(() => {
    if (historyData?.getTreasureActivities) {
      const formatted = historyData.getTreasureActivities.map((activity) => {
        const team = teams.find((t) => t.teamId === activity.teamId);

        // Parse timestamp - handle both string numbers and ISO strings
        let timestamp;
        if (activity.timestamp) {
          const parsed = Number(activity.timestamp);
          timestamp = !isNaN(parsed) ? new Date(parsed) : new Date(activity.timestamp);
        } else {
          timestamp = new Date();
        }

        return {
          ...activity,
          team,
          timestamp,
          ...activity.data,
        };
      });
      setActivities(formatted);
    }
  }, [historyData, teams]);

  // Add new activities from subscription
  useEffect(() => {
    if (subData?.treasureHuntActivity) {
      const activity = subData.treasureHuntActivity;
      const team = teams.find((t) => t.teamId === activity.teamId);

      let timestamp;
      if (activity.timestamp) {
        const parsed = Number(activity.timestamp);
        timestamp = !isNaN(parsed) ? new Date(parsed) : new Date(activity.timestamp);
      } else {
        timestamp = new Date();
      }

      const formattedActivity = {
        ...activity,
        team,
        timestamp,
        ...activity.data,
      };

      setActivities((prev) => {
        if (prev.find((a) => a.id === activity.id)) return prev;
        return [formattedActivity, ...prev.slice(0, 49)];
      });
    }
  }, [subData, teams]);

  return {
    activities,
    loading: historyLoading,
    error,
  };
};
