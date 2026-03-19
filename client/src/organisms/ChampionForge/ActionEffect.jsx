import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

// ---- CSS Keyframes ----
// Slash marks: appear fully-formed, fade out with a slight drift — NOT scaleX grow
const slash = keyframes`
  0%   { opacity: 0; transform: rotate(-42deg) translateX(-4px); }
  18%  { opacity: 1; transform: rotate(-42deg) translateX(0);    }
  72%  { opacity: 0.9; transform: rotate(-42deg) translateX(0);  }
  100% { opacity: 0; transform: rotate(-42deg) translateX(5px);  }
`;

const slashAlt = keyframes`
  0%   { opacity: 0; transform: rotate(42deg) translateX(4px);   }
  18%  { opacity: 1; transform: rotate(42deg) translateX(0);     }
  72%  { opacity: 0.9; transform: rotate(42deg) translateX(0);   }
  100% { opacity: 0; transform: rotate(42deg) translateX(-5px);  }
`;

const ripple = keyframes`
  0%   { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
`;

const drip = keyframes`
  0%   { transform: translateY(0);    opacity: 1; }
  100% { transform: translateY(60px); opacity: 0; }
`;

const zap = keyframes`
  0%,100%               { opacity: 0;   }
  10%,30%,50%,70%,90%   { opacity: 1;   }
  20%,40%,60%,80%       { opacity: 0.2; }
`;

const orbTravel = keyframes`
  0%   { opacity: 0; left: 18%; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { opacity: 0; left: 72%; }
`;

const healPulse = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  35%  { transform: scale(1);   opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
`;

const starburst = keyframes`
  0%   { transform: scaleX(0.3); opacity: 1; }
  100% { transform: scaleX(2);   opacity: 0; }
`;

const spinFade = keyframes`
  0%   { transform: rotate(0deg)   scale(1);   opacity: 1; }
  100% { transform: rotate(300deg) scale(0.2); opacity: 0; }
`;

const riseUp = keyframes`
  0%   { transform: translateY(0);     opacity: 1; }
  100% { transform: translateY(-50px); opacity: 0; }
`;

// ---- Duration map (ms) ----
const DURATIONS = {
  slash:          480,
  critSlash:      560,
  doubleSlash:    720,
  shield:         750,
  fortressRipple: 850,
  lightning:      700,
  bleed:          800,
  drain:          900,
  heal:           800,
  explosion:      700,
  debuff:         700,
  buff:           750,
};

/**
 * ActionEffect
 *
 * Renders a CSS-drawn visual effect overlay inside a `position="relative"` arena container.
 *
 * Props:
 *   effectKey   — one of the keys in DURATIONS above
 *   targetSide  — 'left' | 'right' | 'center'
 *   onDone      — callback fired when the animation finishes
 */
export default function ActionEffect({ effectKey, targetSide, onDone }) {
  useEffect(() => {
    const dur = DURATIONS[effectKey] ?? 700;
    const t = setTimeout(onDone, dur + 50);
    return () => clearTimeout(t);
  }, [effectKey, onDone]);

  // cx/cy = center of the target champion's sprite body in the arena
  const cx = targetSide === 'left' ? '20%' : targetSide === 'right' ? '80%' : '47%';
  const cy = '60%';

  // Helper: absolutely positioned so (cx, cy) is the visual center of the effect
  const centered = (width, height) => ({
    position: 'absolute',
    left: cx,
    top: cy,
    marginLeft: `-${width / 2}px`,
    marginTop: `-${height / 2}px`,
    pointerEvents: 'none',
    zIndex: 20,
  });

  // Shared slash mark style — gradient fades to transparent at tips (pointed ends)
  const slashGrad = (r, g, b, a = 0.95) =>
    `linear-gradient(to right, transparent 0%, rgba(${r},${g},${b},${a}) 25%, rgba(255,255,255,0.95) 50%, rgba(${r},${g},${b},${a}) 75%, transparent 100%)`;

  switch (effectKey) {

    case 'slash':
      // 3 parallel claw marks: red, appear fully-formed, fade out
      return (
        <>
          {[[-13, 52], [0, 46], [13, 50]].map(([yOff, w], i) => (
            <Box
              key={i}
              {...centered(w, 3)}
              marginTop={`${-(3 / 2) + yOff}px`}
              w={`${w}px`} h="3px"
              borderRadius={0}
              style={{
                background: slashGrad(255, 55, 55),
                filter: 'drop-shadow(0 0 3px rgba(255,30,30,0.85))',
              }}
              animation={`${slash} 0.44s ${i * 40}ms ease-out forwards`}
            />
          ))}
        </>
      );

    case 'critSlash':
      // 3 orange marks going one way + 2 yellow marks crossing the other way
      return (
        <>
          {[[-14, 62], [0, 56], [14, 60]].map(([yOff, w], i) => (
            <Box
              key={`a${i}`}
              {...centered(w, 4)}
              marginTop={`${-(4 / 2) + yOff}px`}
              w={`${w}px`} h="4px"
              borderRadius={0}
              style={{
                background: slashGrad(255, 140, 0),
                filter: 'drop-shadow(0 0 4px rgba(255,120,0,0.9))',
              }}
              animation={`${slash} 0.48s ${i * 30}ms ease-out forwards`}
            />
          ))}
          {[[-8, 52], [8, 52]].map(([yOff, w], i) => (
            <Box
              key={`b${i}`}
              {...centered(w, 3)}
              marginTop={`${-(3 / 2) + yOff}px`}
              w={`${w}px`} h="3px"
              borderRadius={0}
              style={{
                background: slashGrad(255, 220, 0),
                filter: 'drop-shadow(0 0 3px rgba(255,210,0,0.85))',
              }}
              animation={`${slashAlt} 0.48s ${80 + i * 30}ms ease-out forwards`}
            />
          ))}
        </>
      );

    case 'doubleSlash':
      // Two sets of 3 marks, second set hits ~200ms after first
      return (
        <>
          {[[-11, 50], [0, 44], [11, 48]].map(([yOff, w], i) => (
            <Box
              key={`a${i}`}
              {...centered(w, 3)}
              marginTop={`${-(3 / 2) + yOff}px`}
              w={`${w}px`} h="3px"
              borderRadius={0}
              style={{
                background: slashGrad(255, 55, 55),
                filter: 'drop-shadow(0 0 2px rgba(255,30,30,0.8))',
              }}
              animation={`${slash} 0.42s ${i * 35}ms ease-out forwards`}
            />
          ))}
          {[[-9, 46], [0, 42], [9, 44]].map(([yOff, w], i) => (
            <Box
              key={`b${i}`}
              {...centered(w, 3)}
              marginTop={`${-(3 / 2) + yOff}px`}
              w={`${w}px`} h="3px"
              borderRadius={0}
              style={{
                background: slashGrad(255, 80, 80, 0.9),
                filter: 'drop-shadow(0 0 2px rgba(255,50,50,0.75))',
              }}
              animation={`${slash} 0.42s ${200 + i * 35}ms ease-out forwards`}
            />
          ))}
        </>
      );

    case 'shield':
      return (
        <Box
          {...centered(120, 120)}
          w="120px" h="120px" borderRadius="50%"
          border="4px solid" borderColor="cyan.300"
          boxShadow="0 0 20px 4px cyan, inset 0 0 20px rgba(0,255,255,0.15)"
          animation={`${ripple} 0.75s ease-out forwards`}
        />
      );

    case 'fortressRipple':
      return (
        <>
          <Box
            {...centered(140, 140)}
            w="140px" h="140px" borderRadius="50%"
            border="5px solid" borderColor="yellow.300"
            boxShadow="0 0 30px 8px rgba(255,215,0,0.9), inset 0 0 30px rgba(255,215,0,0.2)"
            animation={`${ripple} 0.85s ease-out forwards`}
          />
          <Box
            {...centered(100, 100)}
            w="100px" h="100px" borderRadius="50%"
            border="3px solid" borderColor="yellow.400"
            boxShadow="0 0 20px 4px rgba(255,215,0,0.7)"
            animation={`${ripple} 0.85s 0.1s ease-out forwards`}
          />
        </>
      );

    case 'lightning':
      return (
        <>
          <Box
            position="absolute" left="3%" top="48%" w="94%" h="6px"
            bg="blue.300"
            boxShadow="0 0 24px 8px rgba(100,160,255,1), 0 0 48px rgba(50,100,255,0.8)"
            borderRadius="full" pointerEvents="none" zIndex={20}
            animation={`${zap} 0.7s ease-out forwards`}
          />
          <Box
            position="absolute" left="3%" top="44%" w="94%" h="3px"
            bg="white"
            boxShadow="0 0 12px 4px rgba(200,220,255,0.9)"
            borderRadius="full" pointerEvents="none" zIndex={20}
            animation={`${zap} 0.7s 0.04s ease-out forwards`}
          />
        </>
      );

    case 'bleed':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              position="absolute"
              left={`calc(${cx} + ${i * 14 - 14}px)`}
              top={`calc(${cy} - 10px)`}
              w="8px" h="14px"
              bg="red.600"
              borderRadius="0 0 50% 50%"
              boxShadow="0 0 8px 2px rgba(180,0,0,0.8)"
              pointerEvents="none" zIndex={20}
              animation={`${drip} 0.7s ${i * 110}ms ease-in forwards`}
            />
          ))}
        </>
      );

    case 'drain':
      return (
        <Box
          position="absolute" top={`calc(${cy} - 8px)`}
          w="16px" h="16px"
          bg="purple.400" borderRadius="50%"
          boxShadow="0 0 20px 6px rgba(180,50,255,0.9)"
          pointerEvents="none" zIndex={20}
          animation={`${orbTravel} 0.9s ease-in-out forwards`}
        />
      );

    case 'heal':
      return (
        <>
          <Box
            position="absolute" left={`calc(${cx} - 4px)`} top={`calc(${cy} - 30px)`}
            w="8px" h="60px"
            bg="green.400" borderRadius="full"
            boxShadow="0 0 20px 6px rgba(0,200,80,0.9)"
            pointerEvents="none" zIndex={20}
            animation={`${healPulse} 0.8s ease-out forwards`}
          />
          <Box
            position="absolute" left={`calc(${cx} - 30px)`} top={`calc(${cy} - 4px)`}
            w="60px" h="8px"
            bg="green.400" borderRadius="full"
            boxShadow="0 0 20px 6px rgba(0,200,80,0.9)"
            pointerEvents="none" zIndex={20}
            animation={`${healPulse} 0.8s ease-out forwards`}
          />
        </>
      );

    case 'explosion':
      return (
        <>
          {[0, 45, 90, 135, 22, 67, 112, 157].map((deg, i) => (
            <Box
              key={deg}
              position="absolute"
              left={cx}
              top={cy}
              marginLeft="-4px"
              marginTop="-4px"
              w="60px" h="7px"
              bg={i < 4 ? 'orange.400' : 'yellow.300'}
              borderRadius="full"
              boxShadow={`0 0 ${i < 4 ? '16px 5px rgba(255,140,0,0.9)' : '10px 3px rgba(255,230,0,0.7)'}`}
              transformOrigin="left center" pointerEvents="none"
              zIndex={20}
              style={{ transform: `rotate(${deg}deg)` }}
              animation={`${starburst} 0.65s ${i >= 4 ? '0.1s' : ''} ease-out forwards`}
            />
          ))}
        </>
      );

    case 'debuff':
      return (
        <>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            const r = 30;
            return (
              <Box
                key={i}
                position="absolute"
                left={`calc(${cx} + ${Math.cos(angle) * r}px - 5px)`}
                top={`calc(${cy} + ${Math.sin(angle) * r}px - 5px)`}
                w="10px" h="10px"
                bg="yellow.300" borderRadius="50%"
                boxShadow="0 0 10px 3px rgba(255,230,0,0.9)"
                pointerEvents="none"
                zIndex={20}
                animation={`${spinFade} 0.65s ${i * 80}ms ease-out forwards`}
              />
            );
          })}
        </>
      );

    case 'buff':
      return (
        <>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            const r = 25;
            return (
              <Box
                key={i}
                position="absolute"
                left={`calc(${cx} + ${Math.cos(angle) * r}px - 4px)`}
                top={`calc(${cy} + ${Math.sin(angle) * r}px - 4px)`}
                w="8px" h="8px"
                bg="teal.300" borderRadius="50%"
                boxShadow="0 0 10px 3px rgba(0,200,200,0.9)"
                pointerEvents="none"
                zIndex={20}
                animation={`${riseUp} 0.7s ${i * 90}ms ease-out forwards`}
              />
            );
          })}
        </>
      );

    default:
      return null;
  }
}
