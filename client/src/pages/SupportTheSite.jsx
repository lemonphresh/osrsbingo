import React from 'react';
import { useQuery } from '@apollo/client';
import { Link as ChakraLink, Flex, Image } from '@chakra-ui/react';
import Selfie from '../assets/selfie.webp';
import Section from '../atoms/Section';
import GnomeChild from '../assets/gnomechild-small.webp';
import { FaCoffee, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled, isChampionForgeEnabled } from '../config/featureFlags';
import PleaseEffect from '../atoms/PleaseEffect';
import { GET_ACTIVE_RAINBOW_EVENT } from '../graphql/rainbowBingoOperations';

const SelfieCircle = ({ size = 120 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #FFB6C1, #DDA0DD)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
      border: '3px solid rgba(255,255,255,0.2)',
    }}
  >
    <Image
      src={Selfie}
      alt="Selfie of a blonde, femme software engineer, smiling."
      borderRadius="50%"
      boxSize={`${size - 6}px`}
    />
  </div>
);

export default function SupportPage() {
  usePageTitle('Support the Site');

  const { data: eventData } = useQuery(GET_ACTIVE_RAINBOW_EVENT, {
    fetchPolicy: 'cache-and-network',
  });
  const activeEvent = eventData?.getActiveRainbowEvent;
  const isJune = new Date().getMonth() === 5;
  const showEventCallout = !!activeEvent && activeEvent.status === 'ACTIVE';
  const showJuneCallout = isJune && !showEventCallout;

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        minHeight: '100vh',
        padding: '64px 36px',
        color: '#e2e8f0',
      }}
    >
      <Section flexDirection="column" style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header - just me */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <SelfieCircle size={90} />
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: 'white' }}>
              Hey, I'm Lemon <span style={{ fontSize: 24 }}>🍋</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#F4D35E', fontSize: 14 }}>
              the dweeb behind OSRS Bingo Hub
            </p>
          </div>
        </div>
        {/* Just... talking */}
        <Flex flexDirection="column" gap={3} style={{ fontSize: 15 }}>
          <p style={{ marginTop: 0 }}>
            So here's the deal gamers: I made this site for my clan a while back because I wanted a
            better way to do bingo events. Then other nerds started using it. Then a <em>lot</em> of
            nerds started using it. Now there's like 3,000+ boards on here, I shipped Gielinor Rush
            (team treasure hunts), Blind Draft, and I just finished building{' '}
            <strong>Champion Forge</strong> (full clan tournaments with drafts, outfitting, and
            live bracket battles{isChampionForgeEnabled() ? ', go try it!' : ', coming soon'}).
          </p>

          <p>
            I'm not a company, and there's no team. It's literally just me in my wretched little
            goblin cave writing code and afking on OSRS. The site doesn't run ads because I hate ads
            and have a feeling you do too.
          </p>

          <p>But servers cost money! Here's roughly what I'm paying:</p>

          <ul style={{ margin: '16px 0', paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              Heroku hosting — <strong>~$50/mo</strong>
            </li>
            <li style={{ marginBottom: 8 }}>
              Database (PostgreSQL) — <strong>~$25/mo</strong>{' '}
              {(isGielinorRushEnabled() || isChampionForgeEnabled()) && (
                <span style={{ color: '#F4D35E', fontSize: 13 }}>
                  (growing fast with all these new game modes)
                </span>
              )}
            </li>
            <li>
              Domain + random stuff — <strong>~$15/mo</strong>
            </li>
          </ul>

          <p>
            That's about <strong style={{ color: '#F4D35E' }}>$90/month</strong> out of my pocket to
            keep this thing running, and as much as I love doing it, that adds up fast. I don't know
            if you've seen the price of groceries lately, but whew. Boy howdy.
          </p>

          <p>
            If OSRS Bingo Hub has been useful to you or your clan, if it's made your events more fun
            or saved you the hassle of making spreadsheets, I'd really appreciate any support you
            can throw my way. Even a few bucks helps.
          </p>

          <p>
            And if you're broke (I get it, we're all buying bonds except maybe you stinky irons),
            just sharing the site with your friends is huge. 💛
          </p>
        </Flex>
        {/* June / Pride Month callout */}
        {showJuneCallout && (
          <div
            style={{
              marginTop: 28,
              background: 'rgba(0, 180, 140, 0.08)',
              border: '1px solid rgba(0, 180, 140, 0.3)',
              borderRadius: 12,
              padding: '16px 20px',
            }}
          >
            <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#4dd9ac', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🏳️‍🌈 Pride Month — June 2026
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#cbd5e0', lineHeight: 1.7 }}>
              Any and all support to this site this month goes directly to{' '}
              <a href="https://www.thetrevorproject.org" target="_blank" rel="noopener noreferrer" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                The Trevor Project
              </a>
              , the world's largest suicide prevention organization for LGBTQ+ youth.{' '}
              {activeEvent?.startDate ? (
                <>
                  <Link to="/eg-rainbow" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                    Eternal Gems' Rainbow Bingo
                  </Link>{' '}
                  starts{' '}
                  {new Date(activeEvent.startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  .
                </>
              ) : (
                <>
                  <Link to="/eg-rainbow" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                    Eternal Gems' Rainbow Bingo
                  </Link>{' '}
                  is coming this June.
                </>
              )}{' '}
              You can also{' '}
              <a href="https://www.thetrevorproject.org/donate/" target="_blank" rel="noopener noreferrer" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                donate to them directly
              </a>
              .
            </p>
          </div>
        )}
        {/* Rainbow Bingo event live callout */}
        {showEventCallout && (
          <div
            style={{
              marginTop: 28,
              background: 'rgba(0, 180, 140, 0.08)',
              border: '1px solid rgba(0, 180, 140, 0.3)',
              borderRadius: 12,
              padding: '16px 20px',
            }}
          >
            <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#4dd9ac', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🏳️‍🌈 Rainbow Bingo is live!
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#cbd5e0', lineHeight: 1.7 }}>
              For the duration of{' '}
              <Link to="/eg-rainbow" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                Eternal Gems' Rainbow Bingo event
              </Link>
              , all support to this site goes directly to{' '}
              <a href="https://www.thetrevorproject.org" target="_blank" rel="noopener noreferrer" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                The Trevor Project
              </a>
              , the world's largest suicide prevention organization for LGBTQ+ youth. You can also{' '}
              <a href="https://www.thetrevorproject.org/donate/" target="_blank" rel="noopener noreferrer" style={{ color: '#4dd9ac', textDecoration: 'underline' }}>
                donate to them directly
              </a>
              .
            </p>
          </div>
        )}
        {/* Buttons - simple */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          <PleaseEffect>
            <ChakraLink
              href="https://cash.app/$lemonlikesgirls"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#F4D35E',
                color: '#1a1a1a',
                padding: '14px 28px',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 15,
              }}
              target="_blank"
            >
              <FaHeart size={18} /> Donate (CashApp)
            </ChakraLink>
          </PleaseEffect>
          <PleaseEffect>
            <ChakraLink
              href="https://ko-fi.com/A667UUO"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: 'white',
                padding: '14px 28px',
                borderRadius: 8,
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: 15,
              }}
              target="_blank"
            >
              <FaCoffee size={18} /> Ko-fi
            </ChakraLink>
          </PleaseEffect>
        </div>
        {/* Sign off */}
        <p style={{ marginTop: 48, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Thanks for reading this far. Love you. Fuck ICE. 🫶 <br /> If you really like reading,
          check out the{' '}
          <span style={{ color: '#F4D35E' }}>
            <Link to="/changelog">changelog</Link>
          </span>{' '}
          to see a more in-depth history of the site.
        </p>
        <Image aria-hidden height={['48px', '32px']} src={GnomeChild} width={['48px', '32px']} />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>— Lemon (RSN: butt looker)</p>
      </Section>
    </div>
  );
}
