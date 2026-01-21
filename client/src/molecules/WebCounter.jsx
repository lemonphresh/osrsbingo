import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Flex, Text, Spinner, Icon } from '@chakra-ui/react';
import { FaEye } from 'react-icons/fa';
import { INCREMENT_VISIT } from '../graphql/mutations';
import { GET_VISIT_COUNT } from '../graphql/queries';

const WebCounter = () => {
  const [displayCount, setDisplayCount] = useState(null);
  const { data, loading, error } = useQuery(GET_VISIT_COUNT);
  const [incrementVisit] = useMutation(INCREMENT_VISIT);

  useEffect(() => {
    const recordVisit = async () => {
      // Only increment if we haven't already this session
      const hasVisited = sessionStorage.getItem('hasVisited');
      if (hasVisited) {
        return; // Don't increment again
      }

      try {
        const { data } = await incrementVisit();
        if (data?.incrementVisit) {
          setDisplayCount(data.incrementVisit);
          sessionStorage.setItem('hasVisited', 'true');
        }
      } catch (err) {
        console.error('Error incrementing visit:', err);
      }
    };
    recordVisit();
  }, [incrementVisit]);

  useEffect(() => {
    if (data?.getVisitCount && !displayCount) {
      setDisplayCount(data.getVisitCount);
    }
  }, [data, displayCount]);

  if (loading && !displayCount) {
    return (
      <Flex alignItems="center" gap={2}>
        <Spinner size="xs" color="gray.500" />
      </Flex>
    );
  }

  if (error) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      gap={2}
      paddingX={3}
      paddingY={1.5}
      borderRadius="md"
      bg="gray.50"
      _dark={{ bg: 'gray.700' }}
    >
      <Icon as={FaEye} color="gray.600" _dark={{ color: 'gray.400' }} boxSize={4} />
      <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: 'gray.300' }}>
        {displayCount?.toLocaleString() || '0'} visits
      </Text>
    </Flex>
  );
};

export default WebCounter;
