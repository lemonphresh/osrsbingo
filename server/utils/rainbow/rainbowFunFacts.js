'use strict';

const TILE_FUN_FACTS = {
  R1: {
    fact: "The Mattachine Society was founded in Los Angeles in 1950 by Harry Hay. The name came from medieval French jesters who performed masked, letting them speak uncomfortable truths in public that couldn't be said openly. It was a deliberate metaphor for gay men living double lives.",
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  R2: {
    fact: 'Harvey Milk was assassinated in 1978, just 11 months into his term on the San Francisco Board of Supervisors. He was the first openly gay elected official in California. His message going into that role was simple: "Hope will never be silent."',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  R3: {
    fact: 'Christine Jorgensen was a decorated WWII veteran who became one of the first Americans publicly known to have gender reassignment surgery, in 1952. Rather than disappear from public life, she leaned in and spent decades advocating for transgender people.',
    source: 'Smithsonian Magazine',
    sourceUrl: 'https://www.smithsonianmag.com',
  },
  R4: {
    fact: 'The red ribbon as an HIV/AIDS awareness symbol was created in 1991 by the Visual AIDS Artists Caucus in New York City. It was first worn at the 1991 Tony Awards and spread from there. What started as a small act of visibility became one of the most recognized symbols in modern public health history.',
    source: 'Visual AIDS',
    sourceUrl: 'https://www.visualaids.org',
  },
  R5: {
    fact: 'ACT UP was founded in New York City in 1987 and became one of the most effective activist organizations in American history. By staging Die-Ins at the FDA and on Wall Street, they forced the federal government to cut HIV drug approval times from a decade to under two years.',
    source: 'ACT UP Oral History Project',
    sourceUrl: 'https://www.actuporalhistory.org',
  },
  R6: {
    fact: "The Stonewall Uprising lasted six days after police raided the bar on June 28, 1969. Within months, the Gay Liberation Front and Gay Activists Alliance had formed. Within a year, Pride marches were happening in four cities. It's hard to overstate how fast things moved after that night.",
    source: 'National Park Service',
    sourceUrl: 'https://www.nps.gov/ston',
  },
  R7: {
    fact: 'In 2016, President Obama designated the Stonewall Inn and Christopher Park as the Stonewall National Monument. It was the first US national monument dedicated to LGBTQIA+ history, and the Stonewall Inn still operates as a bar today in the same building where the uprising began.',
    source: 'National Park Service',
    sourceUrl: 'https://www.nps.gov/ston',
  },

  O1: {
    fact: 'Sylvia Rivera and Marsha P. Johnson founded STAR (Street Transvestite Action Revolutionaries) in New York City in 1970 to house and support homeless LGBTQIA+ youth. No other organizations were doing it. Rivera put it plainly: "I was a revolutionary."',
    source: 'Sylvia Rivera Law Project',
    sourceUrl: 'https://srlp.org',
  },
  O2: {
    fact: "Bayard Rustin organized the 1963 March on Washington and was one of Martin Luther King Jr.'s closest strategic advisors. He was pushed out of public-facing roles for years because he was openly gay. President Obama posthumously awarded him the Presidential Medal of Freedom in 2013.",
    source: 'National Archives',
    sourceUrl: 'https://www.archives.gov',
  },
  O3: {
    fact: "The first Pride march was held on June 28, 1970, exactly one year after Stonewall. Marches happened simultaneously in New York, Los Angeles, San Francisco, and Chicago. They were small by today's standards, but they were the direct seed of what became a global movement.",
    source: 'GLAAD',
    sourceUrl: 'https://www.glaad.org',
  },
  O4: {
    fact: "The American Psychiatric Association removed homosexuality from the DSM in 1973. That change didn't come quietly: LGBTQIA+ activists had spent years disrupting APA conferences, presenting research, and forcing the conversation until the organization had to take a real look at its own assumptions.",
    source: 'American Psychiatric Association',
    sourceUrl: 'https://www.psychiatry.org',
  },
  O5: {
    fact: 'The Daughters of Bilitis was the first lesbian political and social organization in the United States, founded in San Francisco in 1955 by Del Martin and Phyllis Lyon. Their newsletter, The Ladder, ran for 16 years and reached people across the country who had never seen positive lesbian representation anywhere.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  O6: {
    fact: "Edie Windsor and Thea Spyer were together for 44 years. When Spyer died in 2009, the federal government charged Windsor $363,000 in estate taxes because their Canadian marriage wasn't recognized. Windsor sued, and her case became United States v. Windsor, which struck down DOMA at the Supreme Court in 2013.",
    source: 'Lambda Legal',
    sourceUrl: 'https://www.lambdalegal.org',
  },
  O7: {
    fact: "Alan Turing cracked the Nazi Enigma code and his work is credited with shortening WWII by years. The British government's reward was a 1952 conviction for being gay, followed by chemical castration. He died in 1954. The UK formally apologized in 2009 and issued a royal pardon in 2013.",
    source: 'Science Museum UK',
    sourceUrl: 'https://www.sciencemuseum.org.uk',
  },

  Y1: {
    fact: 'Morgan Carpenter designed the intersex pride flag in 2013 for Intersex Human Rights Australia. The yellow and purple were chosen specifically because neither color is associated with gender. The unbroken circle represents wholeness and the right of intersex people to make decisions about their own bodies.',
    source: 'Intersex Human Rights Australia',
    sourceUrl: 'https://ihra.org.au',
  },
  Y2: {
    fact: "Billie Jean King won 39 Grand Slam titles. In 1973, she beat Bobby Riggs in the Battle of the Sexes in front of 90 million TV viewers. She later founded the Women's Tennis Association and the Women's Sports Foundation, and was publicly out decades before most athletes would have considered it.",
    source: "National Women's History Museum",
    sourceUrl: 'https://www.womenshistory.org',
  },
  Y3: {
    fact: 'The Trevor Project launched in 1998 as the first 24-hour crisis line for LGBTQIA+ youth in the US and is now the largest suicide prevention organization for that community in the world. One of their key findings: LGBTQIA+ youth with at least one accepting adult in their life are 40% less likely to attempt suicide.',
    source: 'The Trevor Project',
    sourceUrl: 'https://www.thetrevorproject.org',
  },
  Y4: {
    fact: 'Frank Kameny was fired from the US Army Map Service in 1957 for being gay. Instead of accepting it, he spent the next 50 years fighting back. He founded the DC Mattachine Society, picketed the White House in 1965, coined the phrase "Gay is Good," and played a central role in getting homosexuality removed from the DSM.',
    source: 'Library of Congress',
    sourceUrl: 'https://www.loc.gov',
  },
  Y5: {
    fact: 'Henry Gerber founded the Society for Human Rights in Chicago in 1924, the first chartered gay rights organization in US history. Police shut it down within months, arresting its members. Its founding documents still exist and are held in the National Archives.',
    source: 'National Archives',
    sourceUrl: 'https://www.archives.gov',
  },
  Y6: {
    fact: 'Audre Lorde called herself "Black, lesbian, mother, warrior, poet" and meant all of it simultaneously. Her 1984 collection Sister Outsider is foundational to intersectional feminist theory, and her writing on the erotic as a source of power reframed what it means for marginalized people to insist on joy.',
    source: 'Academy of American Poets',
    sourceUrl: 'https://poets.org',
  },
  Y7: {
    fact: "James Baldwin was openly gay at a time when that and being Black were both targets. His novels Giovanni's Room (1956) and The Fire Next Time (1963) wove together race, sexuality, and American identity in ways that made a lot of people deeply uncomfortable. That was the point.",
    source: 'National Museum of African American History and Culture',
    sourceUrl: 'https://nmaahc.si.edu',
  },

  G1: {
    fact: 'The Netherlands became the first country in the modern era to legalize same-sex marriage on April 1, 2001, after already introducing registered partnerships in 1998. More than 35 countries have followed since, and today over 1.3 billion people live in countries where marriage equality is the law.',
    source: 'Human Rights Campaign',
    sourceUrl: 'https://www.hrc.org',
  },
  G2: {
    fact: 'Phyllis Lyon and Del Martin co-founded the Daughters of Bilitis in 1955 and were together for 55 years. They were the first couple married when California briefly legalized same-sex marriage in 2004, and married again in 2008 when it was made permanent. Del Martin died two months later.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  G3: {
    fact: "Georgina Beyer was elected to New Zealand's Parliament in 1999, becoming the world's first openly transgender member of a national legislature. She served until 2007 and used her platform to advocate for LGBTQIA+ rights and the decriminalization of sex work.",
    source: 'New Zealand Parliament',
    sourceUrl: 'https://www.parliament.nz',
  },
  G4: {
    fact: 'New Zealand became the 13th country to legalize same-sex marriage in 2013. After the bill passed, members of Parliament spontaneously started singing a Maori love song in the chamber. It went viral, and it was genuinely moving.',
    source: 'Human Rights Campaign',
    sourceUrl: 'https://www.hrc.org',
  },
  G5: {
    fact: 'The first Gay Games were held in San Francisco in 1982, founded by Olympic decathlete Tom Waddell as an explicitly inclusive sporting event. By the 1994 Gay Games in New York, over 12,000 athletes from 44 countries showed up. That year, they had more participants than the 1984 Olympics.',
    source: 'Federation of Gay Games',
    sourceUrl: 'https://www.gaygames.org',
  },
  G6: {
    fact: "José Sarria was a drag performer at San Francisco's Black Cat Café who ran for the Board of Supervisors in 1961, becoming the first openly gay person to run for public office in the United States. He got nearly 6,000 votes and didn't win, but he proved it was possible. A generation of candidates pointed to him later.",
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  G7: {
    fact: 'The National LGBTQIA Task Force was founded in 1973 and is one of the oldest LGBTQIA+ civil rights organizations in the US. It co-organized the first National March on Washington for Lesbian and Gay Rights in 1979, which drew over 100,000 people at a time when that was a genuinely dangerous thing to do publicly.',
    source: 'National LGBTQIA Task Force',
    sourceUrl: 'https://www.thetaskforce.org',
  },

  B1: {
    fact: "Monica Helms designed the transgender flag in 1999. The blue and pink stripes represent boys and girls, and the white stripe in the middle is for people who are transitioning, intersex, or don't identify within those categories. It was first flown at a Pride parade in Phoenix in 2000.",
    source: 'Smithsonian National Museum of American History',
    sourceUrl: 'https://americanhistory.si.edu',
  },
  B2: {
    fact: 'Lawrence v. Texas reached the Supreme Court in 2003 and struck down every remaining sodomy law in the country in a 6-3 decision. The ruling held that consensual intimacy between adults was constitutionally protected. It also explicitly overturned Bowers v. Hardwick, a 1986 ruling that had gone the other direction.',
    source: 'Lambda Legal',
    sourceUrl: 'https://www.lambdalegal.org',
  },
  B3: {
    fact: 'In 2014, Laverne Cox became the first openly transgender person nominated for a Primetime Emmy and the first to appear on the cover of Time magazine. The Time cover headline was "The Transgender Tipping Point," and it turned out to be an accurate read of the moment.',
    source: 'GLAAD',
    sourceUrl: 'https://www.glaad.org',
  },
  B4: {
    fact: "Tammy Baldwin was the first openly gay candidate elected to the US House in 1998 and the first elected to the Senate in 2012, both from Wisconsin. She's been reelected multiple times and has one of the longest continuous records of open LGBTQIA+ service in Congress.",
    source: 'LGBTQIA+ Victory Fund',
    sourceUrl: 'https://victoryfund.org',
  },
  B5: {
    fact: 'Pete Buttigieg became the first openly gay person confirmed to a US Cabinet position in 2021 as Secretary of Transportation. During his 2020 presidential run, he was the first openly gay candidate to win delegates in a major-party primary, starting with the Iowa caucuses.',
    source: 'Human Rights Campaign',
    sourceUrl: 'https://www.hrc.org',
  },
  B6: {
    fact: 'San Francisco passed the first domestic partnership ordinance in any US city in 1989, extending benefits to same-sex city employees. Within a decade, hundreds of cities, counties, and private companies had adopted similar policies. It built the legal infrastructure that made marriage equality feel imaginable.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  B7: {
    fact: 'Gerry Studds came out on the floor of the US House of Representatives in 1983, becoming the first member of Congress to publicly acknowledge being gay. His Massachusetts constituents kept reelecting him until he retired in 1997.',
    source: 'US House of Representatives',
    sourceUrl: 'https://history.house.gov',
  },

  I1: {
    fact: "The Stonewall Inn in 1969 was a Mafia-owned bar that operated without a liquor license and regularly paid off police to avoid raids. The fact that a riot started there is a good reminder that the spark for a movement doesn't always come from an ideal situation.",
    source: 'National Park Service',
    sourceUrl: 'https://www.nps.gov/ston',
  },
  I2: {
    fact: "The Compton's Cafeteria Riot happened in San Francisco's Tenderloin in August 1966, three years before Stonewall. Transgender women, drag queens, and sex workers fought back against a police sweep. It's the first known instance of organized LGBTQIA+ resistance to police harassment in the United States.",
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  I3: {
    fact: 'Virginia Prince launched Transvestia magazine in 1960 and founded Tri-Ess in 1976, creating one of the first organized communities for transgender and gender-nonconforming people in the US. She was building networks through postal correspondence long before the internet made any of this easier.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  I4: {
    fact: "Alfred Kinsey's Sexual Behavior in the Human Male came out in 1948 and quietly upended a lot of assumptions. His data showed same-sex attraction was far more common than the culture admitted. The Kinsey Scale challenged the idea that sexuality is simply binary, and it was controversial enough that Congress investigated his funding.",
    source: 'Kinsey Institute',
    sourceUrl: 'https://www.kinseyinstitute.org',
  },
  I5: {
    fact: 'Barbara Gittings founded the New York Daughters of Bilitis in 1958 and was one of the first people organizing public LGBTQIA+ demonstrations in the US, including pickets at the White House and Pentagon in the 1960s. She later spent years inside the American Library Association pushing them to build actual LGBTQIA+ collections.',
    source: 'American Library Association',
    sourceUrl: 'https://www.ala.org',
  },
  I6: {
    fact: "Kye Allums came out as a transgender man in 2010 while playing women's basketball at George Washington University, becoming the first openly transgender athlete in NCAA Division I sports. He kept playing and used the visibility to push conversations about trans inclusion in athletics that are still ongoing.",
    source: 'NCAA',
    sourceUrl: 'https://www.ncaa.org',
  },
  I7: {
    fact: "Renée Richards won the right to play in the 1977 US Open after the New York Supreme Court ruled against the USTA's chromosome-testing policy. It was the first time a court had ruled that chromosomes alone couldn't determine gender eligibility in sports, and the implications have been cited in policy debates ever since.",
    source: 'USTA',
    sourceUrl: 'https://www.usta.com',
  },

  V1: {
    fact: 'The pink triangle was used by the Nazis to mark gay men in concentration camps. An estimated 10,000 to 15,000 gay men were imprisoned. LGBTQIA+ activists reclaimed the symbol in the 1970s, and ACT UP adopted it in the 1980s alongside the slogan "Silence = Death." The act of reclaiming it was itself a political statement.',
    source: 'US Holocaust Memorial Museum',
    sourceUrl: 'https://www.ushmm.org',
  },
  V2: {
    fact: 'Oscar Wilde was convicted of "gross indecency" in 1895 and sentenced to two years of hard labor. His imprisonment became a symbol of state persecution of gay men and his writing afterward, especially The Ballad of Reading Gaol, remains some of the most powerful literature to come out of that kind of injustice.',
    source: 'British Library',
    sourceUrl: 'https://www.bl.uk',
  },
  V3: {
    fact: 'Queer Nation was founded in New York City in 1990 and actively reclaimed the word "queer" from a slur. Their pamphlet "Queers Read This," distributed at NYC Pride that year, became a landmark piece of activist writing. The opening line: "Being queer means leading a different sort of life."',
    source: 'LGBTQIA+ Victory Fund',
    sourceUrl: 'https://victoryfund.org',
  },
  V4: {
    fact: 'The UN Human Rights Council passed its first resolution on LGBTQIA+ rights in 2011, sponsored by South Africa. The report that followed documented state-sanctioned violence and discrimination across the globe. It was the first time the UN formally acknowledged that LGBTQIA+ people needed human rights protections.',
    source: 'United Nations',
    sourceUrl: 'https://www.un.org',
  },
  V5: {
    fact: "Magnus Hirschfeld opened the Institut für Sexualwissenschaft in Berlin in 1919, the world's first institute dedicated to sexual research and LGBTQIA+ advocacy. It offered gender-affirming care and housed a massive archive. The Nazis burned it in 1933 in one of the most famous book burnings in history.",
    source: 'Magnus Hirschfeld Society',
    sourceUrl: 'https://www.hirschfeld-gesellschaft.de',
  },
  V6: {
    fact: 'PFLAG started in 1973 when Jeanne Manford marched at NYC Pride with her gay son Morty and was approached by so many LGBTQIA+ people begging her to talk to their parents that she started hosting meetings. What began in a church basement now has over 400 chapters and is the largest family LGBTQIA+ support organization in the world.',
    source: 'PFLAG',
    sourceUrl: 'https://pflag.org',
  },
  V7: {
    fact: "Leslie Feinberg's Stone Butch Blues, published in 1993, was the first novel to center a transgender working-class character as the hero. It connected trans liberation to labor politics in a way nobody else was doing. Feinberg later made the full novel free to download so cost wouldn't be a barrier to reading it.",
    source: 'Leslie Feinberg archives',
    sourceUrl: 'https://www.lesliefeinberg.net',
  },

  C1: {
    fact: 'Red stands for Life on the original pride flag. Gilbert Baker, who designed the original pride flag in 1978, chose it deliberately. Queer people had just lived through years of loss and erasure, and claiming life as something worth celebrating was a statement. The red stripe is a reminder that survival itself is an act of resistance.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  C2: {
    fact: 'Orange stands for Healing on the original pride flag. Gilbert Baker, who designed the original pride flag in 1978, included it as an acknowledgment that the community was, and always would be, in the process of recovering, from violence, from grief, from the ongoing weight of living in a world that had not yet made space for them.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  C3: {
    fact: "Yellow stands for Sunlight on the original pride flag. It's about visibility: being seen, stepping into the open after generations of being told to hide. Gilbert Baker, who designed the original pride flag in 1978, wanted the flag to be something you could see from a distance, something undeniable, and yellow carries that energy.",
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  C4: {
    fact: "Green stands for Nature on the original pride flag. At a time when queer identity was routinely called unnatural, Baker's inclusion of green was a direct rebuttal. Queer people have always existed, and they always will. The natural world is far more varied than the people trying to police it ever wanted to admit.",
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  C5: {
    fact: 'Blue stands for Magic and Art on the original pride flag, represented then by a turquoise stripe. Queer culture has always been deeply tied to art, performance, and the creation of beauty...often as a survival mechanism. Gilbert Baker, who designed the original pride flag in 1978, saw that as something worth naming and honoring in the flag itself.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  C6: {
    fact: 'Indigo stands for Serenity on the original pride flag. Not the serenity of having peace handed to you, but the kind you build yourself: the calm that comes from community, from finding people who see you, from not having to explain yourself anymore. Gilbert Baker, who designed the original pride flag in 1978, knew that was worth fighting for.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
  C7: {
    fact: 'Violet stands for Spirit on the original pride flag. Gilbert Baker, who designed the original pride flag in 1978, was talking about the intangible thing that keeps a community together through loss and struggle. The part of queer identity that is deeper than politics or visibility, the sense that there is something worth carrying forward.',
    source: 'GLBT Historical Society',
    sourceUrl: 'https://www.glbthistory.org',
  },
};

module.exports = { TILE_FUN_FACTS };
