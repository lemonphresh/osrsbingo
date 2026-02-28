import React from 'react';
import { Image, Stat, StatGroup, StatLabel, StatNumber } from '@chakra-ui/react';
import { formatGP } from '../../utils/treasureHuntHelpers';
import Gold from '../../assets/gold-small.webp';
import Dossier from '../../assets/dossier.png';
import Clan from '../../assets/clan.png';

const EventStatBar = ({ event, teams, allPendingIncompleteSubmissionsCount, currentColors }) => (
  <StatGroup
    alignSelf="center"
    alignItems="center"
    maxWidth="740px"
    w="100%"
    justifyContent={['center', 'center', 'space-between']}
    flexDirection={['column', 'column', 'row']}
    gap={4}
  >
    <Stat
      bg={currentColors.cardBg}
      py="6px"
      minW={['216px', '216px', 'auto']}
      textAlign="center"
      borderRadius="md"
    >
      <StatLabel mb={2} color={currentColors.textColor}>
        Total Prize Pool
      </StatLabel>
      <Image h="32px" m="0 auto" src={Gold} />
      <StatNumber color={currentColors.green.base}>
        {event.eventConfig ? formatGP(event.eventConfig.prize_pool_total) : 'N/A'}
      </StatNumber>
    </Stat>
    <Stat
      bg={currentColors.cardBg}
      py="6px"
      minW={['216px', '216px', 'auto']}
      textAlign="center"
      borderRadius="md"
    >
      <StatLabel mb={2} color={currentColors.textColor}>
        Total Teams
      </StatLabel>
      <Image h="32px" m="0 auto" src={Clan} />
      <StatNumber color={currentColors.textColor}>{teams.length}</StatNumber>
    </Stat>
    <Stat
      bg={currentColors.cardBg}
      py="6px"
      minW={['216px', '216px', 'auto']}
      textAlign="center"
      borderRadius="md"
    >
      <StatLabel mb={2} color={currentColors.textColor}>
        Pending Submissions
      </StatLabel>
      <Image h="32px" m="0 auto" src={Dossier} />
      <StatNumber color={currentColors.textColor}>
        {allPendingIncompleteSubmissionsCount}
      </StatNumber>
    </Stat>
  </StatGroup>
);

export default EventStatBar;
