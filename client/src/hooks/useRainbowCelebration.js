import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import { keyframes, css } from '@emotion/react';
import confetti from 'canvas-confetti';

const RAINBOW = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'];

const FLAGS = [
  ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'],
  ['#55CDFC', '#F7A8B8', '#FFFFFF', '#F7A8B8', '#55CDFC'],
  ['#D52D00', '#FF9A56', '#FFFFFF', '#D362A4', '#A50062'],
  ['#FF218C', '#FFD800', '#21B1FF'],
  ['#FCF434', '#FFFFFF', '#9C59D1', '#2D2D2D'],
  ['#078D70', '#26CEA1', '#98E8C1', '#FFFFFF', '#7BADE2', '#5049CC', '#3D1A78'],
];

const fallDown = keyframes`
  0%   { transform: translateY(-30px) rotate(0deg);   opacity: 1; }
  80%  { opacity: 0.85; }
  100% { transform: translateY(115vh) rotate(35deg);  opacity: 0; }
`;

function MiniFlag({ stripes, size }) {
  const h = Math.round(size * 0.6);
  const stripeH = h / stripes.length;
  return (
    <svg
      width={size}
      height={h}
      style={{ borderRadius: 2, display: 'block', filter: 'drop-shadow(0 1px 5px rgba(0,0,0,0.5))' }}
    >
      {stripes.map((color, i) => (
        <rect key={i} x={0} y={i * stripeH} width={size} height={stripeH} fill={color} />
      ))}
    </svg>
  );
}

function fireTile() {
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { x: 0.5, y: 0.55 },
    colors: RAINBOW,
    zIndex: 9999,
    scalar: 1.1,
  });
}

function fireCapstone() {
  const colors = [...RAINBOW, '#FFD700'];
  confetti({ particleCount: 220, spread: 130, origin: { x: 0.5, y: 0.45 }, colors, zIndex: 9999, scalar: 1.25 });
  confetti({ particleCount: 60, spread: 90, origin: { x: 0.5, y: 0.45 }, colors: ['#FFD700', '#FFFDE7'], shapes: ['star'], scalar: 1.8, zIndex: 9999 });
  [300, 750].forEach((delay) => {
    setTimeout(() => {
      confetti({ particleCount: 70, angle: 65, spread: 65, origin: { x: 0, y: 0.6 }, colors, zIndex: 9999 });
      confetti({ particleCount: 70, angle: 115, spread: 65, origin: { x: 1, y: 0.6 }, colors, zIndex: 9999 });
    }, delay);
  });
}

function fireBoardConfetti() {
  const colors = [...RAINBOW, '#FFD700', '#FF69B4', '#FFFFFF'];
  const end = Date.now() + 5500;

  // Opening salvo
  confetti({ particleCount: 350, spread: 160, origin: { x: 0.5, y: 0.4 }, colors, zIndex: 9999, scalar: 1.5 });
  confetti({ particleCount: 120, spread: 130, origin: { x: 0.5, y: 0.4 }, colors: ['#FFD700', '#FFFFFF'], shapes: ['star'], scalar: 2.2, zIndex: 9999 });

  // Continuous cannons from both sides
  const frame = () => {
    confetti({ particleCount: 18, angle: 60, spread: 80, origin: { x: 0, y: 0.6 }, colors, zIndex: 9999 });
    confetti({ particleCount: 18, angle: 120, spread: 80, origin: { x: 1, y: 0.6 }, colors, zIndex: 9999 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Firework pops from various positions
  const fireworkPositions = [
    { x: 0.15, delay: 0 },
    { x: 0.85, delay: 600 },
    { x: 0.35, delay: 1200 },
    { x: 0.65, delay: 2000 },
    { x: 0.5,  delay: 2800 },
    { x: 0.25, delay: 3600 },
    { x: 0.75, delay: 4400 },
  ];
  fireworkPositions.forEach(({ x, delay }) => {
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 360, startVelocity: 38, decay: 0.9, origin: { x, y: 0.25 }, colors, gravity: 0.6, zIndex: 9999, scalar: 1.3 });
    }, delay);
  });
}

export function useRainbowCelebration() {
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);

  const spawnFlag = useCallback(() => {
    const stripes = FLAGS[Math.floor(Math.random() * FLAGS.length)];
    const x = Math.random() * 94;
    const size = 22 + Math.floor(Math.random() * 34);
    const duration = 3500 + Math.random() * 2000;
    const id = performance.now() + Math.random();
    setParticles((prev) => [...prev, { id, stripes, x, size, duration }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), duration + 300);
  }, []);

  const trigger = useCallback(
    (level) => {
      if (level === 'tile') {
        fireTile();
      } else if (level === 'capstone') {
        fireCapstone();
      } else if (level === 'board') {
        fireBoardConfetti();
      }

      // Flag rain at all levels — more flags for bigger celebrations
      if (intervalRef.current) clearInterval(intervalRef.current);
      const total = level === 'board' ? 55 : level === 'capstone' ? 20 : 8;
      const interval = level === 'board' ? 150 : level === 'capstone' ? 220 : 300;
      let count = 0;
      intervalRef.current = setInterval(() => {
        spawnFlag();
        count++;
        if (count >= total) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, interval);
    },
    [spawnFlag]
  );

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const overlay =
    particles.length > 0 ? (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        overflow="hidden"
        zIndex={9998}
      >
        {particles.map(({ id, stripes, x, size, duration }) => (
          <Box
            key={id}
            position="absolute"
            left={`${x}%`}
            top={0}
            css={css`animation: ${fallDown} ${duration}ms ease-in forwards;`}
          >
            <MiniFlag stripes={stripes} size={size} />
          </Box>
        ))}
      </Box>
    ) : null;

  return { trigger, overlay };
}
