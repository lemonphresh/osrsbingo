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
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';

// Floating ambient-audio widget for /spoopy-event. Loads a YouTube video
// invisibly and gives the user a play/pause + volume control. Autoplay is
// intentionally never triggered — browsers block audible autoplay without
// a user gesture, so the first play requires a click.
//
// State persists to localStorage so the user's choice carries across page
// reloads. Ad-blockers that block youtube.com will cause the API script
// to fail — we detect that and hide the widget so nothing looks broken.

const YT_API_SRC = 'https://www.youtube.com/iframe_api';
const LS_KEY_VOL = 'spoopyAmbianceVolume';
const LS_KEY_ENABLED = 'spoopyAmbianceEnabled';
// Playback position (in seconds) that the user was last at. Persisted while
// playing so a refresh doesn't restart the whole loop from 0. Scoped by
// videoId so switching to a new loop starts fresh.
const LS_KEY_TIME_PREFIX = 'spoopyAmbianceTime_';

function readStoredTime(videoId) {
  try {
    const raw = Number(localStorage.getItem(LS_KEY_TIME_PREFIX + videoId));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  } catch (_) {
    return 0;
  }
}

function writeStoredTime(videoId, seconds) {
  try {
    localStorage.setItem(LS_KEY_TIME_PREFIX + videoId, String(Math.max(0, Math.floor(seconds))));
  } catch (_) {}
}

// Load the YT IFrame API once, return a promise that resolves when the
// global `YT.Player` is ready. Cached so multiple mounts share one load.
let ytApiPromise = null;
function loadYouTubeApi() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);

    const priorCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof priorCallback === 'function') priorCallback();
      resolve(window.YT);
    };

    const existing = document.querySelector(`script[src="${YT_API_SRC}"]`);
    if (existing) return; // waiting on the same script

    const script = document.createElement('script');
    script.src = YT_API_SRC;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load YouTube API'));
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

export default function SpoopyAmbiancePlayer({ videoId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = Number(localStorage.getItem(LS_KEY_VOL));
    return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 40;
  });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const wantedPlayingRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY_VOL, String(volume)); } catch (_) {}
  }, [volume]);

  useEffect(() => {
    let cancelled = false;
    let player = null;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        player = new YT.Player(containerRef.current, {
          height: '1',
          width: '1',
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: videoId, // required for loop=1 to work on a single video
            playsinline: 1,
            modestbranding: 1,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              e.target.setVolume(volume);
              playerRef.current = e.target;
              setReady(true);
              // Restore prior enabled state — but only start playing if the
              // user had it on and the browser lets us. Muted playback is
              // allowed without a gesture, but we don't want silent audio,
              // so we skip auto-resume and let the user click.
            },
            onStateChange: (e) => {
              // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused,
              // 3 buffering, 5 cued
              if (e.data === 1) setIsPlaying(true);
              else if (e.data === 2 || e.data === 0) {
                setIsPlaying(false);
                if (e.data === 0) {
                  // Video ended — the loop wraps back to 0, so the stored
                  // resume-time from earlier in this play would jump us
                  // forward on a refresh. Reset it so the next start is
                  // fresh.
                  try { writeStoredTime(videoId, 0); } catch (_) {}
                  // Loop safety net — some videos don't loop cleanly via
                  // the param alone. If the user wanted playback, kick
                  // it back on.
                  if (wantedPlayingRef.current) {
                    try { e.target.playVideo(); } catch (_) {}
                  }
                }
              }
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      try { player?.destroy?.(); } catch (_) {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Periodically snapshot the current time to localStorage while playing so
  // a refresh can resume where the user left off. 3s cadence balances "good
  // enough resume" against localStorage write frequency.
  useEffect(() => {
    if (!ready) return undefined;
    const tick = () => {
      const p = playerRef.current;
      if (!p) return;
      if (typeof p.getPlayerState !== 'function') return;
      // YT.PlayerState.PLAYING === 1
      if (p.getPlayerState() !== 1) return;
      try { writeStoredTime(videoId, p.getCurrentTime()); } catch (_) {}
    };
    saveTimerRef.current = setInterval(tick, 3000);

    // Also save on tab hide / page unload so the last few seconds don't get
    // lost. `pagehide` covers the mobile-safari case better than `beforeunload`.
    const flush = () => tick();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);

    return () => {
      clearInterval(saveTimerRef.current);
      saveTimerRef.current = null;
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
      flush();
    };
  }, [ready, videoId]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      wantedPlayingRef.current = false;
      // Snapshot current position before pausing so a refresh right now
      // still resumes where we were.
      try { writeStoredTime(videoId, p.getCurrentTime()); } catch (_) {}
      p.pauseVideo();
      try { localStorage.setItem(LS_KEY_ENABLED, 'false'); } catch (_) {}
    } else {
      wantedPlayingRef.current = true;
      p.setVolume(volume);
      // Resume from wherever the user left off across the refresh. seekTo
      // second arg = true means "allow seek ahead" so the request goes
      // through even if that segment isn't buffered yet.
      const resumeAt = readStoredTime(videoId);
      if (resumeAt > 0) {
        try { p.seekTo(resumeAt, true); } catch (_) {}
      }
      p.playVideo();
      try { localStorage.setItem(LS_KEY_ENABLED, 'true'); } catch (_) {}
    }
  }, [isPlaying, volume, videoId]);

  const handleVolume = useCallback((v) => {
    setVolume(v);
    playerRef.current?.setVolume?.(v);
  }, []);

  if (failed) return null;

  const muted = volume === 0;

  return (
    <>
      {/* The invisible YouTube player. Sits offscreen so it never affects
          layout. Kept in the DOM so the player can control it. */}
      <Box
        position="fixed"
        left="-9999px"
        top="-9999px"
        width="1px"
        height="1px"
        aria-hidden="true"
        pointerEvents="none"
      >
        <div ref={containerRef} />
      </Box>

      <Box
        position="fixed"
        bottom={{ base: 3, md: 5 }}
        right={{ base: 3, md: 5 }}
        zIndex={20}
        bg={SPOOPY_COLORS.night}
        color={SPOOPY_COLORS.paper}
        border="1px solid"
        borderColor={SPOOPY_COLORS.nightMist}
        borderRadius="full"
        px={3}
        py={2}
        boxShadow="0 10px 24px rgba(0,0,0,0.55)"
        opacity={ready ? 1 : 0.5}
        transition="opacity 200ms ease-out"
      >
        <HStack spacing={3} align="center">
          <Tooltip
            label={isPlaying ? 'pause spooky ambiance' : 'play spooky ambiance'}
            fontSize="xs"
          >
            <IconButton
              size="sm"
              aria-label={isPlaying ? 'pause spooky ambiance' : 'play spooky ambiance'}
              icon={isPlaying ? <FaPause /> : <FaPlay />}
              variant="ghost"
              color={SPOOPY_COLORS.pumpkinLight}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
              isDisabled={!ready}
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
            {ready ? (isPlaying ? '🎃 spooky ambiance' : 'ambiance') : 'loading…'}
          </Text>

          <HStack spacing={2} align="center" minW="110px">
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
              isDisabled={!ready}
            >
              <SliderTrack bg={SPOOPY_COLORS.nightMist} h="4px" borderRadius="full">
                <SliderFilledTrack bg={SPOOPY_COLORS.pumpkin} />
              </SliderTrack>
              <SliderThumb boxSize={3} bg={SPOOPY_COLORS.pumpkin} />
            </Slider>
          </HStack>
        </HStack>
      </Box>
    </>
  );
}
