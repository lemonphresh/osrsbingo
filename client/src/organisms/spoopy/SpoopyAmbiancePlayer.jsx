import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaChevronDown,
  FaChevronUp,
  FaPause,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';

// Floating spooky-lofi ambiance widget. Mounts a *youtube-nocookie* iframe
// (same domain rainbow uses on its "event not started" screen — reliably
// survives ad-blockers and tracking-protection extensions). Playback and
// volume are driven from our own controls via YouTube's postMessage bridge
// (`?enablejsapi=1`), so we don't need the external `iframe_api.js` script
// that gets blocked in most locked-down browser environments.
//
// The iframe stays mounted the whole session — even when collapsed — so
// audio keeps playing while the widget is hidden. Collapse just hides it
// visually via `visibility: hidden` (still in layout, so browsers don't
// throttle it as "background media").

const LS_KEY_COLLAPSED = 'spoopyAmbianceCollapsed';
const LS_KEY_VOLUME = 'spoopyAmbianceVolume';
const LS_KEY_PLAYING = 'spoopyAmbiancePlaying';
// Scoped per video so switching to a different loop later starts fresh.
const LS_KEY_TIME_PREFIX = 'spoopyAmbianceTime_';

const YT_ORIGIN = 'https://www.youtube-nocookie.com';

function readStoredTime(videoId) {
  try {
    const n = Number(localStorage.getItem(LS_KEY_TIME_PREFIX + videoId));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (_) {
    return 0;
  }
}

function writeStoredTime(videoId, seconds) {
  try {
    localStorage.setItem(LS_KEY_TIME_PREFIX + videoId, String(Math.max(0, Math.floor(seconds))));
  } catch (_) {}
}

// Tells the embedded player to run a function. YT's postMessage protocol
// accepts a JSON string with `{ event: 'command', func, args }`.
function sendCommand(iframe, func, args = []) {
  const win = iframe?.contentWindow;
  if (!win) return;
  try {
    win.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);
  } catch (_) {}
}

export default function SpoopyAmbiancePlayer({ videoId }) {
  // Default to collapsed + muted on FIRST visit so the widget isn't loud or
  // in the user's face. Once they touch it, their choices persist and get
  // restored on subsequent loads.
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(LS_KEY_COLLAPSED);
    return stored == null ? true : stored === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem(LS_KEY_VOLUME);
    const n = Number(stored);
    if (stored == null) return 0;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
  });
  // Playback state we drive ourselves. On first visit we default to
  // paused — the iframe still spins up (browser autoplay-muted keeps the
  // player warm) but our UI reads as "Play" so the button reflects
  // reality: no audible sound. Subsequent visits restore whatever the
  // user last chose.
  const [playing, setPlaying] = useState(() => {
    const stored = localStorage.getItem(LS_KEY_PLAYING);
    if (stored === null) return false;
    return stored === 'true';
  });
  const [ready, setReady] = useState(false);
  const iframeRef = useRef(null);
  // Latest reported currentTime from YT's infoDelivery messages. Written on
  // an interval + on hide so refresh picks up close to where we left off.
  const currentTimeRef = useRef(0);
  // Guard so we only apply the resume-seek once per mount.
  const seekedRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY_COLLAPSED, String(collapsed)); } catch (_) {}
  }, [collapsed]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY_VOLUME, String(volume)); } catch (_) {}
  }, [volume]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY_PLAYING, String(playing)); } catch (_) {}
  }, [playing]);

  // On mount we listen for the player's postMessage events. `onReady` fires
  // once when the player finishes booting; `infoDelivery` fires repeatedly
  // with state updates (including `currentTime`, which we need for resume).
  useEffect(() => {
    function onMessage(e) {
      if (e.origin !== YT_ORIGIN) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'onReady' || data?.event === 'infoDelivery') {
          setReady(true);
        }
        // currentTime shows up under two shapes depending on payload —
        // top-level on some messages, nested under `info` on others.
        const t = data?.info?.currentTime ?? data?.currentTime;
        if (Number.isFinite(t) && t > 0) {
          currentTimeRef.current = t;
        }
      } catch (_) {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Once the player signals ready: register as a state listener (so it
  // starts broadcasting infoDelivery updates back to us), apply the
  // persisted volume/mute/pause state, and seek to the last-known
  // position so refresh doesn't restart the loop from 0.
  useEffect(() => {
    if (!ready) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Registering as a listener is what makes YT push `infoDelivery`
    // messages back to us. Without this we can send commands but never
    // hear the currentTime updates.
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 'spoopy-ambiance' }),
        YT_ORIGIN,
      );
    } catch (_) {}

    sendCommand(iframe, 'setVolume', [volume]);
    if (volume > 0) sendCommand(iframe, 'unMute');
    if (!playing) sendCommand(iframe, 'pauseVideo');

    // One-shot resume seek. `seekTo(seconds, allowSeekAhead=true)` — the
    // second arg lets the request go through even if that segment isn't
    // buffered yet.
    if (!seekedRef.current) {
      const resumeAt = readStoredTime(videoId);
      if (resumeAt > 0) {
        try { sendCommand(iframe, 'seekTo', [resumeAt, true]); } catch (_) {}
      }
      seekedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Periodically flush the last-known currentTime to localStorage so a
  // refresh resumes near where we were. 3s cadence balances resume
  // accuracy against write frequency. Also flush on visibility change /
  // page hide to catch the "user closed the tab" case.
  useEffect(() => {
    if (!ready) return undefined;

    const flush = () => {
      if (playing && currentTimeRef.current > 0) {
        writeStoredTime(videoId, currentTimeRef.current);
      }
    };

    const timer = setInterval(flush, 3000);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);

    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
      flush();
    };
  }, [ready, playing, videoId]);

  const togglePlay = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setPlaying((wasPlaying) => {
      if (wasPlaying) {
        // Snapshot the current position before pausing so a refresh right
        // now still resumes from where we were.
        if (currentTimeRef.current > 0) writeStoredTime(videoId, currentTimeRef.current);
        sendCommand(iframe, 'pauseVideo');
        return false;
      }
      sendCommand(iframe, 'setVolume', [volume]);
      if (volume > 0) sendCommand(iframe, 'unMute');
      sendCommand(iframe, 'playVideo');
      return true;
    });
  }, [videoId, volume]);

  const handleVolume = useCallback((v) => {
    setVolume(v);
    const iframe = iframeRef.current;
    if (!iframe) return;
    sendCommand(iframe, 'setVolume', [v]);
    if (v === 0) {
      // Sliding down to 0 acts as a soft mute — we don't pause the video,
      // just silence it, so the user can slide back up without a restart.
      sendCommand(iframe, 'mute');
    } else {
      // First real interaction with volume from a muted state: unmute AND
      // kick playback back on if it was paused. This is the "touch the
      // slider to start the music" gesture — no separate play button needed.
      sendCommand(iframe, 'unMute');
      if (!playing) {
        sendCommand(iframe, 'playVideo');
        setPlaying(true);
      }
    }
  }, [playing]);

  if (!videoId) return null;

  // playlist=<id> is required for loop=1 to work on a single video.
  // enablejsapi=1 unlocks the postMessage bridge. origin= is best-practice
  // per YouTube's docs so cross-frame messages are scoped.
  const embedSrc =
    `${YT_ORIGIN}/embed/${videoId}` +
    `?autoplay=1&mute=1&loop=1&playlist=${videoId}` +
    `&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1` +
    `&origin=${encodeURIComponent(window.location.origin)}`;

  const muted = volume === 0;

  return (
    <Box
      position="fixed"
      bottom={{ base: 3, md: 5 }}
      right={{ base: 3, md: 5 }}
      zIndex={20}
      bg={SPOOPY_COLORS.night}
      border="1px solid"
      borderColor={SPOOPY_COLORS.nightMist}
      borderRadius="lg"
      p={2}
      boxShadow="0 10px 24px rgba(0,0,0,0.55)"
      color={SPOOPY_COLORS.paper}
    >
      <HStack spacing={2} justify="space-between">
        <HStack spacing={2}>
          <Tooltip label={playing ? 'pause ambiance' : 'play ambiance'} fontSize="xs">
            <IconButton
              size="xs"
              variant="ghost"
              color={SPOOPY_COLORS.pumpkinLight}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
              aria-label={playing ? 'pause ambiance' : 'play ambiance'}
              icon={playing ? <FaPause /> : <FaPlay />}
              onClick={togglePlay}
            />
          </Tooltip>
          <Text
            fontSize="xs"
            fontFamily={SPOOPY_FONTS.hand}
            opacity={0.85}
            display={{ base: 'none', md: 'block' }}
            whiteSpace="nowrap"
          >
            🎃 spooky ambiance
          </Text>
        </HStack>

        <HStack spacing={2} minW="110px">
          <Box color={muted ? SPOOPY_COLORS.paper : SPOOPY_COLORS.pumpkinLight} opacity={0.75}>
            {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
          </Box>
          <Slider
            aria-label="ambiance volume"
            value={volume}
            min={0}
            max={100}
            step={1}
            onChange={handleVolume}
            focusThumbOnChange={false}
          >
            <SliderTrack bg={SPOOPY_COLORS.nightMist} h="4px" borderRadius="full">
              <SliderFilledTrack bg={SPOOPY_COLORS.pumpkin} />
            </SliderTrack>
            <SliderThumb boxSize={3} bg={SPOOPY_COLORS.pumpkin} />
          </Slider>
        </HStack>

        <Tooltip label={collapsed ? 'show video' : 'hide video'} fontSize="xs">
          <IconButton
            size="xs"
            variant="ghost"
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            aria-label={collapsed ? 'show video' : 'hide video'}
            icon={collapsed ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setCollapsed((v) => !v)}
          />
        </Tooltip>
      </HStack>

      {/* The iframe stays mounted regardless of `collapsed` so audio keeps
          playing when the video is hidden. `visibility: hidden` (as opposed
          to `display: none` or unmounting) keeps the element in layout,
          which prevents Chrome from throttling it as background media. */}
      <Box
        mt={collapsed ? 0 : 2}
        width={{ base: '220px', md: '280px' }}
        style={{
          aspectRatio: '16/9',
          visibility: collapsed ? 'hidden' : 'visible',
          height: collapsed ? '1px' : undefined,
          overflow: 'hidden',
          pointerEvents: collapsed ? 'none' : 'auto',
        }}
        borderRadius="md"
        border={collapsed ? 'none' : '1px solid'}
        borderColor={SPOOPY_COLORS.nightMist}
      >
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={embedSrc}
          title="spoopy ambient loop"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ display: 'block', border: 'none' }}
        />
      </Box>
    </Box>
  );
}
