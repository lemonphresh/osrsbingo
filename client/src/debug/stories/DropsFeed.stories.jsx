import React from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { DropsFeed } from '../../organisms/ClanStats';

// ── Mock data ──────────────────────────────────────────────────────────────────

const makeDrop = (id, player, item, value, daysAgo = 0) => ({
  id,
  discordMessageId: `msg_${id}`,
  player,
  type: 'drop',
  item,
  value,
  droppedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  month: '2026-05',
});

const makePet = (id, player, pet, daysAgo = 0) => ({
  id,
  discordMessageId: `msg_pet_${id}`,
  player,
  type: 'pet',
  item: pet,
  value: null,
  droppedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  month: '2026-05',
});

const DROPS_ONLY = [
  makeDrop(1, 'Zezima', 'Twisted bow', 1_800_000_000, 0),
  makeDrop(2, 'Woox', 'Scythe of vitur (uncharged)', 650_000_000, 1),
  makeDrop(3, 'B0aty', 'Tumeken\'s shadow (uncharged)', 850_000_000, 2),
  makeDrop(4, 'Settled', 'Elysian spirit shield', 400_000_000, 3),
  makeDrop(5, 'PureEssence', 'Zaryte crossbow', 100_000_000, 5),
  makeDrop(6, 'IronBob', 'Ancestral robe top', 75_000_000, 7),
  makeDrop(7, 'Nooblet99', 'Bandos chestplate', 18_500_000, 8),
];

const PETS_ONLY = [
  makePet(1, 'Zezima', 'Tangleroot', 0),
  makePet(2, 'Woox', 'Olmlet', 2),
  makePet(3, 'CasualScaper', 'Baby mole', 10),
];

const MIXED = [
  makeDrop(1, 'Zezima', 'Twisted bow', 1_800_000_000, 0),
  makePet(2, 'Woox', 'Olmlet', 1),
  makeDrop(3, 'B0aty', 'Scythe of vitur (uncharged)', 650_000_000, 2),
  makePet(4, 'CasualScaper', 'Tangleroot', 3),
  makeDrop(5, 'Settled', 'Tumeken\'s shadow (uncharged)', 850_000_000, 4),
  makeDrop(6, 'PureEssence', 'Elysian spirit shield', 400_000_000, 6),
  makePet(7, 'IronGoat', 'Lil\' Zik', 8),
  makeDrop(8, 'Nooblet99', 'Bandos chestplate', 18_500_000, 10),
];

// ── Stories ────────────────────────────────────────────────────────────────────

export default function DropsFeedStories() {
  return (
    <StoryPage
      title="DropsFeed"
      description="TrackScape drop feed shown on ClanStats — high value drops and pet drops with month navigation."
    >
      <StoryLayout
        title="Mixed drops and pets"
        description="Both high value drops and pets in the same month"
        tags={['happy path']}
      >
        <DropsFeed mockDrops={MIXED} />
      </StoryLayout>

      <StoryLayout
        title="High value drops only"
        description="Several big drops, no pets this month"
        tags={['happy path']}
      >
        <DropsFeed mockDrops={DROPS_ONLY} />
      </StoryLayout>

      <StoryLayout
        title="Pets only"
        description="Lucky pet month, no high value drops"
        tags={['happy path']}
      >
        <DropsFeed mockDrops={PETS_ONLY} />
      </StoryLayout>

      <StoryLayout
        title="Empty state"
        description="No drops recorded for the month"
        tags={['empty state']}
      >
        <DropsFeed mockDrops={[]} />
      </StoryLayout>
    </StoryPage>
  );
}
