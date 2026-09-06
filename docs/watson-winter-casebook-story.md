# Watson's Winter Casebook — Story Tree Draft

22 campaign nodes, 41 puzzles. Written in the "bumbling detective / exhausted-holiday-tourist self-aware nonsense" voice. All puzzles required.

**Nothing is grouped by region.** Each multi-clue node sends the team to completely different corners of Gielinor. Watson invents absurd "theories" to justify wild itineraries. The player character is tired, cold, and just wants to go home for a quiet holiday.

At **two choice points** the team picks which of Watson's competing theories to chase first — the other theory picks up automatically after. Watson's dialogue reacts to whichever they choose.

**Locations, NPC names, and specific spots do not appear in titles or main clue text — only in hints (behind an "are you sure" reveal gate).**

**Persistent notebook UI**: on every node page, a sidebar or bottom drawer shows the team's running "Detective's Notebook" — a growing list of every clue answer they've submitted so far, in the order they collected them. There's also a **"Current Prime Suspect"** free-text field the team can update any time. Both persist across nodes. The final scene (Node 19) pays off the notebook — Watson reviews it aloud, in growing horror at his own dictated nonsense.

---

## Node 1 — "A Weeping Colossus"

**Type**: Narrative + team name input
**Puzzles**: 0

**Scene**
Watson's Hosidius office. Rain outside. The door bursts open and Snowflake stumbles in, tracking mud with her enormous troll feet, sobbing softly into a hankie roughly the size of a bedsheet. She's clutching an empty gift box in one giant three-fingered hand.

**Watson**

> "You. All of you. You have been chosen. Snowflake here has suffered a great injustice, and I — Watson, master investigator, currently between master clue commissions — have accepted the case pro bono. A snowglobe, intended as a holiday gift for a certain enthusiastic troll of the north named after a body part he tried to consume at birth, has gone missing. That is all we know. That is enough."
>
> "You each carry a small notebook. Every answer you collect will be logged there for your convenience. There is also a field marked **Prime Suspect** — I encourage you to update it as your instincts sharpen. It is not, strictly speaking, necessary — I have already solved this case in my head and know precisely whodunnit. But if your suspicions happen to align with my own eventual conclusions, I shall regard you with slightly deeper professional respect. Not much. But some."

**Input**: Detective agency name (free text, saved to campaign)

**On advance**

> Snowflake nods gravely, a single fat troll tear rolling down her cheek and landing on the case files with a heavy _plop_.

**Next**: Node 2

---

## Node 2 — "Three Overnight Illuminations"

**Type**: Multi-puzzle (3 required)

**Watson**

> "Three hunches, all overnight. They cannot be more different from one another. Please pursue all three. I will remain here, thinking hard and staring stoically out my window. Report back — or don't, I'll be here."

**Character (aside)**

> _You look at the three leads. You look at the map. The three leads are in three different corners of the world. You sigh._

### Clue 2a

> _"A stone zealot, hooded in cold white, gazes eternally south from a place beside drink and splinters. Pilgrims kneel at his feet and beg forgiveness for their poor tool selection. Approach him. He will tell you what you lack."_

- **Answer**: `bronze pickaxe`
- **Hint**: Right-click for more than the default option.

### Clue 2b

> _"In a hot and dusty town, beside a clay oven, stands an equally dusty figure. Speak with him. During the exchange, YOUR character will describe the ways of some things as strange. Record what your character calls them."_

- **Answer**: `ancient beings`
- **Hint**: Nardah.

### Clue 2c

> _"Past marsh and cliff, in a hidden city of a bipedal race in Gielinor, a shopkeeper takes offense at being lumped in with a distant snow-dwelling cousin. He refuses to help further. Note the price of the first item in his shop and scram."_

- **Answer**: `1`
- **Hint**: Gu'Tanoth.

**Advance when**: all 3 solved
**Next**: Node 3

---

## Node 3 — "The Yellow Theory (Which Is Not About Yellow)"

**Type**: Multi-puzzle (3 required)

**Watson**

> "Three more leads. I've noticed a pattern — well, two of them involve beautiful things of nature. The third has nothing to do with anything, but I feel it belongs. Trust the pattern. Trust me."

### Clue 3a

> _"A shopkeeper of finest wares in a port town takes personal offense when patrons window-shop. Decline his goods and he will yell a word at you... a word which, in another timeline, would be the stage name of a mediocre white hiphop artist."_

- **Answer**: `riff-raff`
- **Hint**: Port Sarim.

### Clue 3b

> _"Beside a field of cabbages, in a mountainside settlement of witches and springs, grows a field of bright golden flowers. Count them. They are 'oh, so purdy'."_

- **Answer**: `13`
- **Hint**: Taverley.

### Clue 3c

> _"In the west wing of the guild that creates life, count the coniferous beauties that were not planted by any player. Snowflake claims they inspired the snowglobe's design. Cute."_

- **Answer**: `4`
- **Hint**: The Farmers Guild.

**Advance when**: all 3 solved
**Next**: Node 4

---

## Node 4 — "An Adversary of Some Volume"

**Type**: Single puzzle

**Watson**

> "There is an officer on a tropical island who remembers us... poorly. He runs some shipping routes, allegedly. Approach him. He will yell. Record what he yells."

### Clue 4

> _"Speak to the officer. He will greet you the same way every time, without fail, without patience, after you've uncovered his secrets. You take note of the demand he yells at you, verbatim, as you scuttle out of the office."_

- **Answer**: `Get out of my office!`
- **Hint**: Karamja shipyard. Five words, exact.

**Next**: Choice A

---

## Choice A — "Two Theories, Equally Compelling"

**Type**: Player choice (no puzzle)

**Watson**

> "I've been developing two mutually exclusive theories, my amateur little detective friends. Both feel correct. Please pursue one, and then the other. I make no claim as to which is more likely. Your choice."

**Choice** (any team member can pick):

- **A1. The Purchase Theory** — Snowflake was, essentially, out shopping. → Nodes 5 → 6 → 7 → 8
- **A2. The Weeping Theory** — Snowflake was, essentially, having a breakdown. → Nodes 6 → 5 → 8 → 7

Both paths converge at Node 9.

**Merge flavor at Node 9** (shown once, based on Choice A selection):

- _If A1 (Purchase first)_:
  > **Watson**: "The Purchase Theory first. Yes. I strongly suspected you'd begin there. A bold, mercantile instinct. Somewhat ill-founded in the results, I regret to report, but Watson never regrets a well-placed hypothesis. Onwards."
- _If A2 (Weeping first)_:
  > **Watson**: "The Weeping Theory first. Yes. I strongly suspected you'd begin there. A bold, emotionally attuned instinct. Somewhat ill-founded in the results, I regret to report, but Watson never regrets a well-placed hypothesis. Onwards."

**Next**: Node 5 or Node 6 depending on choice

---

## Node 5 — "A Study in Vendors"

**Type**: Multi-puzzle (3 required)

**Watson**

> "Three vendors, three purchases, three answers I demand. If any of them are useful I will eat my own hat."

**Character (aside)**

> _Witnessing that would be the best holiday gift I'd've ever received._

### Clue 5a

> _"A weary vendor in the market of a sizzling hot town sells cheap meat-on-a-stick. Ask him the price of the meat. This is both for the sake of your own hunger pangs, and for the case. Probably."_

- **Answer**: `3`
- **Hint**: Pollnivneach.

### Clue 5b

> _"In a coastal town celebrated for its lines and nets, one shop stocks one item unlike the others — small, round, and transparent. Purchase one and find the occupant. Examine when they're home."_

- **Answer**: `tiny greenfish`
- **Hint**: Catherby.

### Clue 5c

> _"In a house directly south of where one goes to wallop with reckless abandon, in a city of tall glass and crystals, a slim volume rests on a table. Examine it. Note what it is about."_

- **Answer**: `throne`
- **Hint**: Prifddinas.

**Advance when**: all 3 solved
**Next**: Node 6

---

## Node 6 — "Two Witnesses in Blissful Apathy"

**Type**: Multi-puzzle (2 required)

**Watson**

> "Two more witnesses. Both, I regret to inform you, will regard you as a personal inconvenience. Persevere anyway. Snowflake is counting on us. Well. On you, specifically."

### Clue 6a

> _"On the sand of a warm southern isle, an unbothered elder sells bulwarks to those wise enough to buy them. Ask him the price of the one he keeps on his back. He will regard the entire investigation as an inconvenience to his beautiful day."_

- **Answer**: `2500`
- **Hint**: Great Conch, in the far south.

### Clue 6b

> _"In the home of a certain grizzled elderly woman in the moss-choked eastern marshes, count the chairs. You could really use a good sit-down after all this walking. Alas, press on."_

- **Answer**: `3`
- **Hint**: The old crone's cottage, Morytania.

**Advance when**: both solved
**Next**: Node 7

---

## Node 7 — "A Cry for Help (With Garnish)"

**Type**: Single puzzle

**Watson**

> "Multiple witnesses reported Snowflake stumbling into a certain pirate bar to weep, before the case even began. I refuse to describe the establishment further out of respect for its clientele. Find it. Do not imbibe. Or do. Just get it done."

### Clue 7

> _"Behind the bar of a certain pirate haunt stands a barkeep who remembers everyone by their drink order. Ask him what he charges for the greenest cocktail on his menu — the one Snowflake claims to have wept into."_

- **Answer**: `20`
- **Hint**: The Pandemonium pub.

**Next**: Node 8

---

## Node 8 — "The Counting Directive"

**Type**: Multi-puzzle (2 required)

**Watson**

> "I have determined that the key to this case is counting. Two locations. Two counts. Do not think about it. Just count."

**Character (aside)**

> _You have started thinking about it. You cannot stop._

### Clue 8a

> _"On the ground floor of a certain southern coastal gem shop in a town known for its wine, sunshine and murder, count the crates."_

- **Answer**: `3`
- **Hint**: Aldarin, in Varlamore.

### Clue 8b

> _"In a village of beasts, in the shop where hides hang, count the skins pinned up to dry best they can given the damp swamp air."_

- **Answer**: `10`
- **Hint**: Canifis.

**Advance when**: both solved
**Next**: Node 9

---

## Node 9 — "Watson's Anagram Phase"

**Type**: Multi-puzzle (3 required)

**Watson**

> "For reasons I cannot fully explain, one of these three leads has been delivered to you as an anagram and the other two have not. I dictated them all in one sitting and now I'm committed to the format. Please solve as delivered. Do not question the framing."

**Character (aside)**

> _You have been anagramming letters at your kitchen table for forty minutes. You wonder how Watson came by his master investigator title. You suspect he may have anagrammed it himself._

### Clue 9a

> _"Solve this anagram: **MARTIAL OWL PROSE**. Find the person whose job title those letters spell. Ask them to list, in exact order, the items they process."_

- **Answer**: `wood, oak, teak, and mahogany`
- **Hint**: The unscrambled name: "sawmill operator."

### Clue 9b

> _"Beside an exposed altar on a hill of light, a pious figure with endless pockets will greet you with a beautiful word from his native tongue. Record it exactly."_

- **Answer**: `Nilsal`
- **Hint**: Ralos' Rise, in Varlamore.

### Clue 9c

> _"In the home of a wizard who grants very important corporeal wishes, a small green creature totally definitely confirms upon closer examination that the procedure is...?"_

- **Answer**: `safe`
- **Hint**: The Makeover Mage's house.

**Advance when**: all 3 solved
**Next**: Node 10

---

## Node 10 — "An Interview Best Avoided"

**Type**: Single puzzle

**Watson**

> "There is a witness in a volcanic city whose name is deliberately confusing. Once you decode it, look around him for snowglobe shipment containers. The count is the answer."

### Clue 10

> _"Solve this anagram (drop the hyphens once you've placed them): **ZAK HUT HEARTZ**. Find the hyphenated individual whose name those letters spell — you'll find him across from a great arena of combat. Do not speak with him. Simply count the closed containers within a few paces of where he stands."_

- **Answer**: `17`
- **Hint**: The unscrambled name: "TzHaar-Ket-Zuh."

**Next**: Node 11

---

## Node 11 — "The Careless Teleport"

**Type**: Single puzzle

**Watson**

> "A common source of navigational error involves two teleports in Kourend. Snowflake mixed them up while on her way here. So might you."

### Clue 11

> _"Use a teleport that leaves you in a place of glamour and beauty. Upon arrival, count the flowers of a particular species growing at your feet."_

- **Answer**: `4`
- **Hint**: Book of the Dead. Two teleports have similar flowers -- one is correct.

**Next**: Node 12

---

## Node 12 — "The Agricultural Delusions"

**Type**: Multi-puzzle (2 required)

**Watson**

> "Two agricultural leads. I do not know why. That is why we investigate."

### Clue 12a

> _"A farmer in a western village of white-flowered fields will stall by asking you to count his apple trees while he 'thinks' about whether he's seen a snowglobe. In your peripheral vision, you notice him hurriedly ushering the wealthy mayor's wife out the back of his barn. Count the trees anyway."_

- **Answer**: `35`
- **Hint**: Hosidius.

### Clue 12b

> _"Deep in a lawless northern depth, full of chasms only the most agile may cross, broken-down houses gape and crumble. Count the windows that remain intact. Do not tarry. Do not count the broken ones."_

- **Answer**: `14`
- **Hint**: Revenant Caves.

**Advance when**: both solved
**Next**: Node 13

---

## Node 13 — "A Whisper from the Trap Guild"

**Type**: Single puzzle

**Watson**

> "Something compelling came across my desk: hunters heard someone considering trolls as huntable creatures. Loosely related. Pursue anyway."

### Clue 13

> _"Ask a merchant in the sunny south the cost of a fur from a certain grey four-legged predator."_

- **Answer**: `65`
- **Hint**: The Hunter's Guild.

**Next**: Choice B

---

## Choice B — "Two Routes, Equally Objectionable"

**Type**: Player choice (no puzzle)

**Watson**

> "Two more sets of solid leads, my greenhorn little detective friends! I refuse to accompany you on either routes. There is simply too much work to do here! Too much tea left to consume! Choose your route, and hustle along. We don't have time to waste! Well, you don't."

**Choice** (any team member can pick):

- **B1. Brave the wastes first** → Nodes 14 → 15 → 16
- **B2. Face the enthusiasts first** → Nodes 16 → 15 → 14

Both paths converge at Node 17.

**Merge flavor at Node 17** (shown once, based on Choice B selection):

- _If B1 (Wastes first)_:
  > **Watson**: "The wastes first. I would have advised precisely this, had I been advising. Impressive fortitude — you're not dead, and that's more than I can say for the last group I sent. Sit for a moment. Have some tea. There is still much tea. Then, onwards."
- _If B2 (Enthusiasts first)_:
  > **Watson**: "The enthusiasts first. I would have advised precisely this, had I been advising. Very tactical — save the potentially fatal errand for later. Sit for a moment. Have some tea. There is still much tea. Then, onwards."

**Next**: Node 14 or Node 16 depending on choice

---

## Node 14 — "Three Neighborhoods of Regrettable Character"

**Type**: Multi-puzzle (3 required)

**Watson**

> "Three witnesses. Three neighborhoods of, shall we say, character. I would not, personally, spend an evening in any of them. But that is why I have you, my unblooded little detective friends. Do not linger."

### Clue 14a

> _"In a small port town, behind bars, sits a little green feller whose criminal résumé is deeply anticlimactic. Ask him what he did."_

- **Answer**: `pick some stuff up and take it away`
- **Hint**: Port Sarim jail.

### Clue 14b

> _"A drunk bartender in a small starter town swears he saw as many snowglobe-carrying patrons today as there are red seats at his bar. Count the red seats. He is unreliable — the truth is she went in and out this many times, but he cannot tell them apart."_

- **Answer**: `7`
- **Hint**: The Lumbridge pub. Red only.

### Clue 14c

> _"On the western shore of a sun-soaked island somewhere south, a hole yawns in the cliffside. Do not enter. Merely observe the mouth of it, but take note of what's deeper inside. You notice Healsha is peeking out from within as well, half-swallowed by a hole of impressive size. Typical. Wave, then get back to work."_

- **Answer**: `blockage`
- **Hint**: Same island as Elder Blunn (Great Conch).

**Advance when**: all 3 solved
**Next**: Node 15

---

## Node 15 — "Two Frauds of Modest Ambition"

**Type**: Multi-puzzle (2 required)

**Watson**

> "Two more witnesses, both, in their own quiet ways, frauds. Do not confront them. Simply count what betrays them, and let the numbers speak for themselves."

### Clue 15a

> _"Solve this anagram: **SEVEN WARN STAGE HIT NO**. Find the man whose full name and title those letters spell. Despite his title, he cannot do such a thing. You notice his books are all about mazes and booby traps. You chuckle. Booby. Ha. Count the books."_

- **Answer**: `6`
- **Hint**: The unscrambled name: "Swensen the Navigator."

### Clue 15b

> _"In the crafting store of a small town where many make their first home, shiny things are displayed on stands. Count the stands. They are pretending to be worth more than they are."_

- **Answer**: `4`
- **Hint**: Rimmington. Only the necklace stands.

**Advance when**: both solved
**Next**: Node 16

---

## Node 16 — "Three Zealots of Singular Passion"

**Type**: Multi-puzzle (3 required)

**Watson**

> "Three witnesses, each unreasonably passionate about a singular thing. I cannot relate at all. Do not encourage them. Do not compliment their taste. Get the answers, and leave."

### Clue 16a

> _"Near a northern desert carpet, an animal with questionable posture will refuse to speak until you promise it a reward. Record what reward it demands."_

- **Answer**: `banana`
- **Hint**: Northernmost Pollnivneach magic carpet.

### Clue 16b

> _"A vendor in a mountainside springs town is overjoyed to speak with anyone at all. Ask him the price of a two-handed weapon made of... *checks notes* blue. Right."_

- **Answer**: `2600`
- **Hint**: Taverley sword shop.

### Clue 16c

> _"An extremely drunk local in a cold village slurs the same unintelligible word at you, twice, while trying to place the name to the face. Write it down exactly as he mumbles it. In the corner, you see Lexi muttering to herself about ghost orbs and axolotls. You wave, and get on your way. She flips you off and cackles."_

- **Answer**: `Whatshyerfayshe`
- **Hint**: Rellekka.

**Advance when**: all 3 solved
**Next**: Node 17

---

## Node 17 — "Watson's Wild Hunches"

**Type**: Multi-puzzle (5 required)

**Watson**

> "I have five final hunches. None are grounded in evidence I would defend. All five must be pursued. Trust me. Or don't. Do it regardless, you're being paid. Ha, Snowflake, did you hear that last bit? They think they're getting paid. Oh, crumbs, I didn't end the dictation."

**Character (aside)**

> _You have been to seventeen places today. You have counted twelve different kinds of thing. Your feet hurt. You are so tired. You could've sworn Watson just said something about there not being payment at the end of this?_

### Clue 17a

> _"In a building of a mountainside springs town where you have once used crystal to reveal treasures, an absolute beauty will greet you with a compliment, provided you've earned it. She uses a specific word for your recent journey. Record the word."_

- **Answer**: `exploits`
- **Hint**: Same building as the Taverley crystal chest.

### Clue 17b

> _"Outside a well-known tower riddled with horrible monsters stand two large statues of equally horrid things. Examine one. Note what it depicts, in the plainest possible terms."_

- **Answer**: `big monster`
- **Hint**: Outside the Slayer Tower.

### Clue 17c

> _"On the top floor of a building with an oven, in a town of totems and magic, sits a crispy plant in a pot. It has been through things. You can relate. Examine it. Note what it has seen."_

- **Answer**: `better days`
- **Hint**: Auburnvale.

### Clue 17d

> _"West of the great cavern entrance surrounded by capybara, tropical birds and great jungle trees stand two figures near their own lonely trees — or perhaps reunited at last if you've already helped them before — a pair who, upon examination, have shared intentions with one another. Note the location where love has led them both."_

- **Answer**: `places less explored`
- **Hint**: West of Tonali Cavern (near Aldarin).

### Clue 17e

> _"South of a rocky, crimson outcrop, accessible only by boat, a fallen creature lies still. Examine it, note what we feel we ought to place upon its eyes."_

- **Answer**: `law runes`
- **Hint**: South of Red Rock. Ship access only.

**Advance when**: all 5 solved
**Next**: Node 18

---

## Node 18 — "The Final Aimless Errand"

**Type**: Multi-puzzle (5 required)

**Watson**

> "Final round, my tenderfoot little detective friends. Five loose ends. All, I must confess, wildly inconsequential in hindsight. But alas, paperwork is paperwork. Please complete them all. This is what closes cases. Probably."

**Character (aside)**

> _You have been on the road for what feels like the entire holiday season. You have not showered, though this is nothing out of the ordinary. You are running out of snacks, and this is a problem. You want, more than anything, to sit down in a warm house and drink something warm and enjoy some holiday tunes. But Watson has "just five more."_

### Clue 18a

> _"In a shop of shafts in a busy northeast city, sits a man astonished that anyone asks him prices, most simply grab and go. Ask him what his greenest item costs."_

- **Answer**: `80`
- **Hint**: Lowe's shop in Varrock.

### Clue 18b

> _"In the market of a desert town of woven walls and long shadows, a merchant is suspiciously eager for gossip about the case. In reality, he is just deeply bored. Open his shop and note the price of the third item on offer."_

- **Answer**: `140`
- **Hint**: Pollnivneach market.

### Clue 18c

> _"Solve this anagram: **ROOTIZ**. Find the grumpy shopkeeper in a city of subterranean stone whose name those letters spell. His shop tagline claims to gear you up — for what, exactly?"_

- **Answer**: `the mines`
- **Hint**: The unscrambled name: "Tizoro."

### Clue 18d

> _"Solve this anagram: **RENO AND**. Find the king whose (first) name those letters spell. He will urgently summon you regarding the case. He does not have information about the case, but would like to know if you've seen his long lost cousin, Lexi, recently. 'She always was the smallest gnome of the bunch,' he chortled. He is wearing pants of a certain color, which you note in your detective notebook for some reason."_

- **Answer**: `green`
- **Hint**: The unscrambled name: "Narnode."

### Clue 18e

> _"Solve this anagram: **MOIRLY**. Find the food expert whose (first) name those letters spell. In the corner of the building, Kiuyu is dipping what seems to be a bag of nuts in soy sauce. Avoid eye contact. Nervously count the knives on the workstation nearby. You might need them."_

- **Answer**: `2`
- **Hint**: The unscrambled name: "Romily."

**Advance when**: all 5 solved
**Next**: Node 19

---

## Node 19 — "The Long Walk Back"

**Type**: Narrative (no puzzle)

**Scene**
The team returns to Watson's Hosidius office. The rain from the first day has become snow. Somewhere between the third and thirtieth clue you stopped caring what the weather was doing. You are simply cold, everywhere, all the time. This is not how you imagined you'd spend the holidays.

**Character (aside)**

> _You have crossed the map more times than you care to count. You have interviewed a monkey. You have counted sunflowers. You have solved anagrams for reasons that remain unclear. Like seriously, why did he do that, he had the name right there, for Saradomin's sake. You have nothing to show for any of it. The snowglobe is nowhere to be found. It was not shipped. It was not eaten. It was not hidden in a barn or a cave or a jail. In fact, you're not sure any of these leads you've pursued had literally anything to do with one another. But you've dutifully written down every single thing Watson told you to. That's what the notebook was for._

**Watson (looking up from his desk, hopeful)**

> "So? Where is it? Which lead panned out? Which witness confessed? Which clue closed the case? Show me the notebook. Let me review the evidence."

**Character**

> _You hand him the notebook. The whole thing._

**Watson (adjusting his monocle, flipping open the first page)**

> "Bronze pickaxe. Ancient beings. One coin. Riff-raff. Thirteen sunflowers. Four pines. Get out of my office."
>
> (flipping)
>
> "Three coins. Tiny greenfish. Throne. Twenty-five hundred. Three chairs. Twenty coin cocktail? In this economy? Three crates. Ten hides."
>
> (flipping faster)
>
> "Wood, oak, teak, and mahogany. Nilsal. Safe. Seventeen crates. Four Lancalliums. Thirty-five apple trees. Fourteen windows."
>
> (flipping so fast the pages tear)
>
> "Sixty-five. Pick some stuff up and take it away. Seven stools. Blockage. Six books. Four necklace displays. Banana. Twenty-six hundred. Whatshyerfayshe."
>
> (voice rising)
>
> "Exploits. Big monster. Better days. Places less explored. Law runes. Eighty. One-forty. For the mines. Green pants. TWO KNIVES."
>
> (long, terrible silence)
>
> "…what the hell am I supposed to do with this?"

**Character**

> _You dictated these clues._

**Watson (staring at the notebook)**

> "Hm. Quite right."

**Character**

> _Yes._

**Watson**

> "Indeed."

Snowflake, who has been standing quietly in the corner of Watson's office this entire time sniffling into her bedsheet-sized hankie, looks up. Her big troll lower lip trembles.

**Snowflake**

> "I… I hoped so much…"

**Advance button**: "Comfort Snowflake"

**Next**: Node 20

---

## Node 20 — "The Confession"

**Type**: Narrative + summary render
**Puzzles**: 0

**Scene**
Snowflake slumps. Her enormous troll legs give out and she flops onto the floorboards with a heavy _WHOMP_ that shakes the case files off Watson's desk.

The impact scatters something.

A small pile of dark, dense, chewy-looking objects that had been stacked next to where she was situated.

**Character (aside)**

> _Rock cakes. She's been stress snacking. There must be a dozen of them piled here. Or, were a dozen. They're rolling now, some coming to rest against the case files, others tumbling toward the fire._

Snowflake stares at the scatter. Her eyes lock on something in the middle of the pile.

**Character (aside)**

> _Under the top layer of rock cakes, half-covered, gleaming with the faintest flicker of enchanted snow inside…_
>
> _…a snowglobe._

**Snowflake (slowly)**

> "…oh."
>
> "…oh no."
>
> "…I was… I was so hungry. I put gift down. I forgot. I sat on pile. Oh no. Oh no no no."

Snowflake buries her big troll face in her three-fingered hands, shoulders heaving. The snowglobe sits in the middle of the scatter, entirely fine.

**Character**

> _You look at Watson. Watson looks at you. Nobody speaks. Somewhere to the north, presumably, My Arm is waiting._

**Character (after a beat)**

> _You pick up the snowglobe. You clean the crumbs off. Without awaiting the orders from Watson, you start the long walk north to deliver it. The sooner you can get this over with, the sooner you can have some hot cocoa by the warmth of the fireplace in Blue Moon Inn, your favorite tavern during the holidays._

**Watson (via note as you leave)**

> "Case closed. The invoice has been sent to my accountant, who is Watson. I expect my payment from you within the week. You are dismissed. Happy holidays. From the Casebook of Watson, over."

**Character**

> _Deep sigh. Happy holidays, indeed._

**Summary render**
The final page renders as Watson's official Casebook Report:

- Team name (from Node 1 input)
- Full path taken (which order they hit the choice-node branches)
- Per-node time (start → advance)
- Hint usage flags (which clues used hints)
- Total case duration
- Final line: _"Case declared solved by defendant. Investigators exonerated. Damages waived."_
- Shareable format for Discord (image export)

**Campaign complete**

---

## Structural notes for implementation

- **Node types**: `narrative` (no puzzle), `single_puzzle`, `multi_puzzle` (all sub-puzzles required), `choice` (player picks between two reorderings — both paths get done)
- **Answer matching**: lowercase, trim whitespace, accept `accept: []` variants list per puzzle
- **Hint reveal**: click → "Are you sure?" confirmation dialog → reveal. Record `hint_used: true` on that puzzle.
- **Timer**: `page_started_at` set when node first rendered for the team, `page_ended_at` set when advanced. Multi-puzzle nodes have one wrap-around timer for the whole node.
- **Team advance**: any team member can advance. Live updates for other members.
- **Admin view**: table of all campaigns showing team, current node, total elapsed, node-by-node breakdown.
- **41 puzzles total** across 22 campaign nodes (20 gameplay nodes + 2 narrative bookends + 2 choice nodes counted as gameplay).
- **Spoiler policy**: campaign titles, sub-puzzle titles, and clue text never name NPCs, locations, or specific spots. All spoilers are confined to the `Hint` field, which is behind an "are you sure" reveal gate.
- **No geographic clustering**: no multi-puzzle node contains two clues from the same region. Watson's briefings invent absurd theories to justify the scattered itineraries.
- **Character asides**: `character_aside` blocks appear in a distinct visual style (italic, indented, no speaker attribution) to convey the player character's exhaustion and internal monologue.
- **Detective's Notebook UI**: persistent sidebar (or bottom drawer, or toggle-open panel) present on every gameplay node. Contents:
  - **Answers log**: every clue answer the team has submitted, in chronological order, with the node they came from. Displayed as `"[Answer]" — from [Node title]` or similar.
  - **Current Prime Suspect**: free-text input field, updatable at any time by any team member. Only the latest value shows. Optional history log (all past guesses) can render in the final summary as a running gag ("You cycled through 7 different prime suspects: Grum → the Monkey → the sassy jewellery displays → Snowflake herself (!) → …").
  - **Summary payoff**: at Node 19, Watson reads the answers log aloud (see script). The final Casebook Report also renders both the full answers log AND the suspect-guess history.
