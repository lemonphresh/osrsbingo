# champion forge - how it all works

a full breakdown of stats, gear, combat, and everything in between.

---

## your champion's stats

every champion has 5 stats. they all start from a base and stack with whatever gear you equip.

| stat        | what it does                                              |
| ----------- | --------------------------------------------------------- |
| **attack**  | your raw damage output each hit                           |
| **defense** | reduces incoming damage from every hit                    |
| **speed**   | whoever has higher speed goes first. that's it.           |
| **crit**    | % chance to land a crit (x1.5 damage). hard capped at 75% |
| **hp**      | total health. hit 0 and you're dead                       |

**base stats with no gear at all:** 8 atk, 0 def, 0 spd, 0% crit, 150 hp.

---

## gear slots

there are two tracks: **pvmer** and **skiller**. your role determines which slots you can fill.

### pvmer drop slots (6 slots)

earned from boss/combat drops. this is where most of your offensive power comes from.

---

**weapon** - your biggest source of attack and crit. rare and epic weapons have specials.

| rarity   | attack | crit   | speed |
| -------- | ------ | ------ | ----- |
| common   | 10-14  | 2-4%   | 5-9   |
| uncommon | 18-28  | 5-10%  | 7-15  |
| rare     | 30-38  | 12-18% | 12-22 |
| epic     | 58-65  | 20-22% | 18-20 |

---

**helm, chest, legs** - your main defensive slots. rare/epic also add a bit of attack.

| rarity   | defense (avg per piece) | hp (avg per piece) |
| -------- | ----------------------- | ------------------ |
| common   | 8-15                    | 8-18               |
| uncommon | 22-28                   | 18-30              |
| rare     | 34-40                   | 30-45              |
| epic     | 52-58                   | 60-75              |

---

**gloves** - unique in that they scale both attack AND defense roughly equally. good for mixed builds.

| rarity   | attack | defense | hp    | crit |
| -------- | ------ | ------- | ----- | ---- |
| common   | 4-5    | 5-6     | 5-6   | 2-3% |
| uncommon | 10-12  | 12-14   | 12-15 | 6-8% |
| rare     | 20     | 22      | 25    | 14%  |
| epic     | 30     | 35      | 40    | 20%  |

---

**boots** - highest speed in the game, plus some defense and hp. epic boots add +30 speed.

| rarity   | defense | hp    | speed | crit |
| -------- | ------- | ----- | ----- | ---- |
| common   | 4-8     | 5-8   | 5-8   | 0-1% |
| uncommon | 12-18   | 12-18 | 10-16 | 3-5% |
| rare     | 20      | 25    | 22    | 12%  |
| epic     | 30      | 40    | 30    | 18%  |

---

**trinket** - a small bonus slot also from pvmer drops. passive stats only. dupes are allowed once you've collected every unique trinket.

| rarity   | typical bonuses                                      |
| -------- | ---------------------------------------------------- |
| common   | small spread of atk/def/spd/crit/hp                  |
| uncommon | more focused - some are pure def, some are pure crit |
| rare     | atk 10-15, crit 10-12, hp 22-35, sometimes a special |
| epic     | atk 16-20, crit 18, hp 38-42, always a special       |

---

### skiller drop slots (4 slots)

earned from gathering/skill drops.

---

**shield** - the highest single-slot defense in the game. big for tanking.

| rarity   | defense | hp    |
| -------- | ------- | ----- |
| common   | 10-14   | 12-18 |
| uncommon | 24-28   | 28-32 |
| rare     | 38-42   | 45-50 |
| epic     | 62      | 75    |

---

**ring, amulet, cape** - balanced accessories with spread across all stats. rare/epic versions have specials.

| rarity   | attack | defense | hp    | crit   |
| -------- | ------ | ------- | ----- | ------ |
| common   | 2-4    | 2-5     | 5-8   | 1-3%   |
| uncommon | 5-12   | 8-14    | 15-20 | 5-8%   |
| rare     | 12-15  | 18-22   | 30-35 | 10-14% |
| epic     | 20-25  | 28-35   | 50-55 | 18-22% |

---

## consumables (skiller only)

these go in your consumable slots and can be used mid-battle via the item tab. each one is **single-use and gone after you use it**. you can bring up to **4 consumables** per battle (event admins can adjust this cap).

### food - instant hp restore

| item              | heal   | rarity   |
| ----------------- | ------ | -------- |
| boar rib          | 40 hp  | common   |
| hunter's stew     | 65 hp  | uncommon |
| hero's feast      | 90 hp  | rare     |
| warlord's banquet | 120 hp | epic     |

### potions - temporary stat buffs

| item              | effect                  | rarity   |
| ----------------- | ----------------------- | -------- |
| berserker draught | +12 attack for 2 turns  | common   |
| ironhide salve    | +18 defense for 2 turns | uncommon |
| quickfoot elixir  | +14 speed for 2 turns   | rare     |
| sharpeye tincture | +15% crit for 3 turns   | epic     |

### elixirs - stronger effects

| item                | effect                            | rarity |
| ------------------- | --------------------------------- | ------ |
| bloodmoss paste     | +8 attack permanently this battle | rare   |
| champion's blessing | +15 to ALL stats for 1 turn       | rare   |
| voidheart elixir    | heal 50 hp + remove a debuff      | epic   |

### utility - offence and disruption

| item            | effect                            | rarity   |
| --------------- | --------------------------------- | -------- |
| blinding powder | enemy misses their next attack    | common   |
| voidfire flask  | 35 magic damage (ignores defense) | uncommon |
| ashroot dust    | enemy loses 10 attack for 2 turns | rare     |
| hexbolt vial    | 60 magic damage (ignores defense) | epic     |

---

## special abilities

rare and epic gear can roll with a special ability. you can only use your special **once per battle**. after that the button greys out permanently.

if you have multiple pieces of gear with specials, you pick which one fires during the outfitting phase. there's a special picker in the loadout screen that shows every special you have equipped and lets you choose. the one you pick is what gets used in battle.

if you don't pick, it defaults to the first one in slot order:
`weapon > helm > chest > legs > gloves > boots > shield > ring > amulet > cape > trinket`

the others don't contribute their special, but their regular stats still count.

### the 6 specials

**cleave**
80% of your normal attack + applies **bleed** to the target (5 damage per turn for 3 turns). good for fights where the bleed ticks can finish someone off. comes on: axes, legs, shields, capes, trinkets.

**ambush**
guaranteed critical hit (x1.5) that **completely ignores the target's defense**. one of the best damage specials, especially against tanky builds. comes on: daggers/wands, helms, boots, legs, amulets, trinkets.

**barrage**
two separate hits at 65% power each, both with independent crit rolls. great if your crit stat is high - two chances to land a x1.5 multiplier. comes on: daggers, chest, gloves, capes.

**chain lightning**
1.2x your attack stat, **completely bypasses defense**. no crit involved. on an epic weapon (58-65 atk) this hits for roughly 60-90 raw damage. the cleanest burst nuke in the game. comes on: staffs, legs, rings.

**lifesteal**
your normal attack + you heal 30% of the damage dealt. effectively a free food item on top of every regular hit. good for staying alive in long fights. comes on: swords, chests, gloves, capes, rings, trinkets.

**fortress**
activates a 60% damage reduction shield for 2 turns. purely defensive - use it when you're in trouble and need to survive long enough to eat or wait out a bleed. comes on: helms, chests, shields, trinkets.

---

## how a battle turn works

battles are strictly **alternating turns** - you go, then they go, repeat.

whoever has higher **speed** goes first. after the first turn, speed is irrelevant.

each turn you pick one of four actions:

**attack**
roll damage against the opponent. if they're in defend stance, they take 60% less. landing an attack clears their defend stance.

**defend**
take a defensive stance. you take 60% less damage from the NEXT hit that lands on you. doesn't protect against defense-piercing moves (ambush, chain lightning, voidfire flask, etc.). you have to re-defend every turn you want the protection - it's not persistent.

**special**
use your special ability. one use only. pick the right moment.

**item**
use one of your consumables. takes your full turn, so timing matters - don't waste it on 40 hp of food when you're at full health.

---

## the damage formula

when someone attacks, here's exactly what happens:

```
base = max(1, attacker_attack - defender_defense x 0.3)
variance = random between 0.85 and 1.15
crit = random roll, fires if roll < min(crit_chance, 75%)
defend = x0.4 multiplier if defender chose defend last turn

final = round(base x variance x defend_mult x crit_mult)
minimum 1 - you always deal at least 1 damage
```

**what this means in practice:**

- defense never completely negates damage. you always take at least 1 per hit.
- defense reduces damage by 0.3x the stat. so 100 defense cancels out 30 attack from the attacker's roll.
- epic full armor is around 230 total defense, which cancels 69 attack. that means an epic attacker at 65 weapon attack is still fighting `max(1, 65 - 69)` = 1 base... BUT most epic setups stack attack across helm/chest/legs/gloves too, pushing real attack to 100-130, which changes the picture a lot.
- crit is capped at 75%. at cap, 3 out of 4 hits are crits (x1.5).
- defend cuts damage to 40%, which is huge - very strong play if you read that the opponent is about to nuke you.

### expected damage by gear tier (no defend, average roll, ~50% crit rate)

| scenario                       | atk  | def  | avg dmg/hit | ~turns to kill |
| ------------------------------ | ---- | ---- | ----------- | -------------- |
| naked vs naked                 | 8    | 0    | ~9          | ~17 turns      |
| full common vs full common     | ~25  | ~50  | ~13         | ~20 turns      |
| full uncommon vs full uncommon | ~60  | ~120 | ~24         | ~28 turns      |
| full rare vs full rare         | ~100 | ~180 | ~46         | ~25 turns      |
| full epic vs full epic         | ~130 | ~230 | ~61         | ~28 turns      |

(hp also scales with gear - rare builds have ~400+ hp, epic builds have ~500+ hp, which extends fights further)

---

## status effects

**bleed** - ticks 5 damage per turn for 3 turns on whoever got cleaved. applied at the end of their turn. stacks if you get cleaved again while already bleeding.

**fortress** - 60% damage reduction for 2 turns. applies to ALL incoming damage including specials. stacks multiplicatively with defend (defend + fortress = you take only 16% of normal damage for one hit - very powerful combo if you can time it).

**defend** - a flag, not a lasting effect. cleared the moment you take a hit. you have to re-activate it each turn you want the protection.

**blind** - from blinding powder. the blinded fighter completely misses their next attack. lasts 1 turn.

**weaken** - from ashroot dust. reduces the target's attack by 10 for 2 turns. the damage reduction is real and applied to every hit during the window.

**buffs** (from potions/elixirs) - apply immediately and last for the duration shown on the label. they affect your actual damage and defense during those turns, not just the display.

---

## a few things worth knowing

**speed only matters for first turn.** don't sacrifice attack or defense just to go first - after turn 1 it does nothing.

**specials are one-time.** hold them for when they matter - chain lightning to finish someone low, fortress when you're in danger and need to eat without dying, lifesteal to top off mid-fight.

**consumables are extremely powerful.** a warlord's banquet mid-fight is 120 free hp. skillers who load up on food and utility can completely flip a fight that looked lost.

**you can only use your first special.** the slot order is: weapon > helm > chest > legs > gloves > boots > shield > ring > amulet > cape > trinket. the first one in that list fires. if you have rare boots and a rare weapon, weapon wins. plan around this - don't stock a rare slot if its special will never fire.

**defend + fortress is the strongest defensive combo in the game.** fortress reduces all incoming by 60%, defend reduces by another 60% - together you take 16% of a hit. the catch: you have to have used your special (fortress) already AND chosen defend that same turn. powerful stall but it costs your special for the whole battle.
