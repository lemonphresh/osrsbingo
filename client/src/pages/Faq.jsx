import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Heading,
  Link,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';

const QAList = [
  {
    q: <Text>What if I would like to request a feature?</Text>,
    a: (
      <Text>
        I would encourage you to DM me on the{' '}
        <Link
          color={theme.colors.teal[300]}
          fontWeight="bold"
          href="https://www.discord.gg/eternalgems"
        >
          Eternal Gems Discord Server
        </Link>{' '}
        @buttlid and let me know. No guarantees, though. XP loss and all, you know.
      </Text>
    ),
  },
  {
    q: <Text>How do I get removed from an editors list?</Text>,
    a: (
      <Text>
        You'll have to contact the board owner to get removed from an editors list. If they've
        mysteriously disappeared, I suppose I could help remove you, too. However, if you're the
        owner, you can't remove yourself from an editors list, though that is typical CEO behavior
        of you to try.
      </Text>
    ),
  },
  {
    q: <Text>I love this product and also you. How can I support you?</Text>,
    a: (
      <Text>
        First of all, thank you. Secondly,{' '}
        <Link
          color={theme.colors.teal[300]}
          fontWeight="bold"
          href="https://cash.app/$lemonlikesgirls/5.00"
          target="_blank"
        >
          I accept CashApp donations
        </Link>
        .
      </Text>
    ),
  },
  {
    q: <Text>Was this website crafted by gnomes?</Text>,
    a: <Text>You are goddamn right.</Text>,
  },
  //   {
  //     q: <Text>stuff</Text>,
  //     a: <Text>stuff</Text>,
  //   },
];

const Faq = () => (
  <Flex
    alignItems="center"
    flex="1"
    flexDirection="column"
    justifyContent="flex-start"
    paddingY={['72px', '112px']}
    width="100%"
  >
    <Section flexDirection="column">
      <GemTitle>FAQ</GemTitle>
      <Accordion
        allowToggle
        borderRadius="12px"
        borderColor="transparent"
        maxWidth={['100%', '420px', '512px']}
        width="100%"
      >
        {QAList.map((i, idx) => (
          <AccordionItem
            backgroundColor={theme.colors.teal[700]}
            borderRadius="12px"
            marginY="8px"
            key={idx}
          >
            <AccordionButton height="64px">
              <Flex flex="1">
                <Heading size="sm" textAlign="left">
                  {i.q}
                </Heading>
              </Flex>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel display="flex" flexDirection="column" paddingY={4} textAlign="left">
              {i.a}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  </Flex>
);

export default Faq;
