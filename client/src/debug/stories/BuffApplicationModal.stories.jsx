import React from 'react';
import { Button } from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { StoryPage, StoryLayout } from '../StoryLayout';

import { MOCK_NODES } from '../mocks/nodes';
import { MOCK_BUFFS } from '../mocks/buffs';
import BuffApplicationModal from '../../organisms/TreasureHunt/TreasureBuffApplicationModal';

function BuffAppScenario({ title, description, tags, node, buffs }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <StoryLayout title={title} description={description} tags={tags}>
      <Button size="sm" colorScheme="purple" onClick={onOpen}>
        Open Buff Modal
      </Button>
      <BuffApplicationModal
        isOpen={isOpen}
        onClose={onClose}
        node={node}
        availableBuffs={buffs}
        onApplyBuff={(buffId) => console.log('[debug] applyBuff', buffId)}
      />
    </StoryLayout>
  );
}

export default function BuffApplicationModalStories() {
  return (
    <StoryPage
      title="BuffApplicationModal"
      description="Buff selection modal — lets a team member pick a buff to reduce a node's objective requirement."
    >
      <BuffAppScenario
        title="Single applicable buff — kills node"
        description="One kill buff available, shows reduction preview on select"
        tags={['happy path', 'member', 'buff']}
        node={MOCK_NODES.standard_available}
        buffs={MOCK_BUFFS.minor_kill}
      />

      <BuffAppScenario
        title="Multiple applicable buffs — kills node"
        description="Kill buff and universal buff both apply — player must choose"
        tags={['happy path', 'member', 'buff']}
        node={MOCK_NODES.standard_available}
        buffs={[...MOCK_BUFFS.minor_kill, ...MOCK_BUFFS.universal]}
      />

      <BuffAppScenario
        title="XP node — moderate XP buff"
        description="XP gain objective with a matching XP reduction buff"
        tags={['happy path', 'member', 'buff']}
        node={MOCK_NODES.standard_medium_available}
        buffs={MOCK_BUFFS.moderate_xp}
      />

      <BuffAppScenario
        title="No applicable buffs"
        description="Team has buffs but none match this objective type — shows empty state alert"
        tags={['empty state', 'member', 'buff']}
        node={MOCK_NODES.standard_available}
        buffs={MOCK_BUFFS.moderate_xp}
      />

      <BuffAppScenario
        title="No buffs at all"
        description="Team has zero active buffs"
        tags={['empty state', 'member']}
        node={MOCK_NODES.standard_available}
        buffs={MOCK_BUFFS.none}
      />
    </StoryPage>
  );
}
