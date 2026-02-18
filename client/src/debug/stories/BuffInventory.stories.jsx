import React from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { MOCK_BUFFS } from '../mocks/buffs';
import { useColorMode } from '@chakra-ui/react';
import BuffInventory from '../../organisms/TreasureHunt/TreasureBuffInventory';

function BuffScenario({ title, description, tags, buffs }) {
  const { colorMode } = useColorMode();
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <BuffInventory
        buffs={buffs}
        colorMode={colorMode}
        onBuffClick={(buff) => console.log('[debug] buff clicked', buff)}
      />
    </StoryLayout>
  );
}

export default function BuffInventoryStories() {
  return (
    <StoryPage
      title="BuffInventory"
      description="Displays a team's active buff inventory. Buffs are clickable to view applicable nodes."
    >
      <BuffScenario
        title="Empty — no buffs"
        description="Team has no active buffs"
        tags={['empty state']}
        buffs={MOCK_BUFFS.none}
      />

      <BuffScenario
        title="Single minor kill buff"
        description="One kill reduction buff at 25%"
        tags={['buff']}
        buffs={MOCK_BUFFS.minor_kill}
      />

      <BuffScenario
        title="Single moderate XP buff"
        description="One XP reduction buff at 50%"
        tags={['buff']}
        buffs={MOCK_BUFFS.moderate_xp}
      />

      <BuffScenario
        title="Major item buff"
        description="Powerful 75% item collection reduction"
        tags={['buff']}
        buffs={MOCK_BUFFS.major_item}
      />

      <BuffScenario
        title="Universal buff"
        description="Applies to any objective type"
        tags={['buff']}
        buffs={MOCK_BUFFS.universal}
      />

      <BuffScenario
        title="Full inventory — all types"
        description="All four buff types active simultaneously"
        tags={['buff', 'happy path']}
        buffs={MOCK_BUFFS.multiple}
      />
    </StoryPage>
  );
}
