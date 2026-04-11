import { useEffect, useState, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { css, keyframes } from '@emotion/react';

export const HOLIDAY_PREF_KEY = 'holidayEmojisDisabled';
export const HOLIDAY_PREF_EVENT = 'holidayEmojisPrefChanged';
export const HOLIDAY_TEST_EVENT = 'holidayEmojisTest';

const fallAnim = keyframes`
  0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.85; }
  15%  { opacity: 0.85; }
  80%  { opacity: 0.6; }
  100% { transform: translateY(200px) rotate(20deg); opacity: 0; }
`;

const fallCss = css`
  animation: ${fallAnim} 5.5s ease-in forwards;
`;

// Pride flags matching OSRS rainbow cape variants
const PRIDE_FLAGS = [
  { name: 'Rainbow',     stripes: ['#E40303','#FF8C00','#FFED00','#008026','#004DFF','#750787'] },
  { name: 'Trans',       stripes: ['#55CDFC','#F7A8B8','#FFFFFF','#F7A8B8','#55CDFC'] },
  { name: 'Lesbian',     stripes: ['#D52D00','#FF9A56','#FFFFFF','#D362A4','#A50062'] },
  { name: 'Bisexual',    stripes: ['#D60270','#D60270','#9B4F96','#0038A8','#0038A8'] },
  { name: 'Asexual',     stripes: ['#000000','#A4A4A4','#FFFFFF','#810081'] },
  { name: 'Pansexual',   stripes: ['#FF218C','#FFD800','#21B1FF'] },
  { name: 'Non-binary',  stripes: ['#FCF434','#FFFFFF','#9C59D1','#2D2D2D'] },
  { name: 'Genderqueer', stripes: ['#B57EDC','#FFFFFF','#4A8123'] },
  { name: 'Gay men',     stripes: ['#078D70','#26CEA1','#98E8C1','#FFFFFF','#7BADE2','#5049CC','#3D1A78'] },
];

function MiniFlag({ stripes }) {
  const h = 18;
  const w = 28;
  const stripeH = h / stripes.length;
  return (
    <svg width={w} height={h} style={{ borderRadius: 2, display: 'block' }}>
      {stripes.map((color, i) => (
        <rect key={i} x={0} y={i * stripeH} width={w} height={stripeH} fill={color} />
      ))}
    </svg>
  );
}

export const HOLIDAYS = {
  "Valentine's Day": { type: 'emoji', items: ['❤️', '💕', '💝', '🌹', '💌'] },
  'Easter':          { type: 'emoji', items: ['🥚', '🐣', '🐰', '🌷', '🌸'] },
  'Pride':           { type: 'flags', items: PRIDE_FLAGS },
  'Halloween':       { type: 'emoji', items: ['🎃', '🦇', '👻', '💀', '🕷️'] },
  'Guy Fawkes':      { type: 'emoji', items: ['🎆', '🎇', '🔥', '💥', '✨'] },
  'Christmas':       { type: 'emoji', items: ['🎄', '🕎', '⛄', '❄️', '🎁'] },
};

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getCurrentHoliday() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 2 && day === 14) return HOLIDAYS["Valentine's Day"];

  const easter = getEasterDate(now.getFullYear());
  const diff = Math.round((now - easter) / (1000 * 60 * 60 * 24));
  if (diff >= -3 && diff <= 4) return HOLIDAYS['Easter'];

  if (month === 6)               return HOLIDAYS['Pride'];
  if (month === 10)              return HOLIDAYS['Halloween'];
  if (month === 11 && day === 5) return HOLIDAYS['Guy Fawkes'];
  if (month === 12)              return HOLIDAYS['Christmas'];
  return null;
}

export const isHolidayActive = () => getCurrentHoliday() !== null;

export default function HolidayEmojiFall() {
  const activeHoliday = useMemo(() => getCurrentHoliday(), []);
  const [particles, setParticles] = useState([]);
  const [disabled, setDisabled] = useState(() => !!localStorage.getItem(HOLIDAY_PREF_KEY));
  const [testHoliday, setTestHoliday] = useState(null);

  useEffect(() => {
    const handler = () => setDisabled(!!localStorage.getItem(HOLIDAY_PREF_KEY));
    window.addEventListener(HOLIDAY_PREF_EVENT, handler);
    return () => window.removeEventListener(HOLIDAY_PREF_EVENT, handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setTestHoliday(e.detail);
      setParticles([]);
      setTimeout(() => setTestHoliday(null), 5000);
    };
    window.addEventListener(HOLIDAY_TEST_EVENT, handler);
    return () => window.removeEventListener(HOLIDAY_TEST_EVENT, handler);
  }, []);

  const holiday = testHoliday ?? activeHoliday;

  useEffect(() => {
    if (!holiday || (disabled && !testHoliday)) return;

    const interval = setInterval(() => {
      const id = performance.now() + Math.random();
      const item = holiday.items[Math.floor(Math.random() * holiday.items.length)];
      const x = Math.random() * 94;
      setParticles((prev) => [...prev, { id, item, type: holiday.type, x }]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 5700);
    }, 700);

    return () => clearInterval(interval);
  }, [holiday, disabled, testHoliday]);

  if (!holiday || (disabled && !testHoliday)) return null;

  return (
    <Box
      position="absolute"
      top="100%"
      left={0}
      right={0}
      height="210px"
      pointerEvents="none"
      overflow="hidden"
      zIndex={3}
    >
      {particles.map(({ id, item, type, x }) => (
        <Box
          key={id}
          position="absolute"
          left={`${x}%`}
          top={0}
          fontSize="22px"
          userSelect="none"
          css={fallCss}
        >
          {type === 'flags' ? <MiniFlag stripes={item.stripes} /> : item}
        </Box>
      ))}
    </Box>
  );
}
