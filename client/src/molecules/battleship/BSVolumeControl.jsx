import React, { useEffect, useState } from 'react';
import {
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from '@chakra-ui/react';
import { FaVolumeMute, FaVolumeDown, FaVolumeUp } from 'react-icons/fa';
import { getBSVolume, setBSVolume, subscribeBSVolume } from '../../utils/battleship/bsAudio';

function volumeIcon(v) {
  if (v <= 0) return FaVolumeMute;
  if (v < 0.5) return FaVolumeDown;
  return FaVolumeUp;
}

// Compact icon-button that opens a slider popover. Volume is persisted in
// localStorage and applied globally to all battleship sounds.
export default function BSVolumeControl({ size = 'xs' }) {
  const [volume, setVolume] = useState(getBSVolume());

  useEffect(() => subscribeBSVolume(setVolume), []);

  const Icon = volumeIcon(volume);

  return (
    <Popover placement="bottom-end" isLazy>
      <PopoverTrigger>
        <IconButton
          size={size}
          variant="outline"
          borderColor="#1a4028"
          color={volume <= 0 ? '#6b9e78' : '#4ade80'}
          _hover={{ borderColor: '#4ade80', color: '#4ade80' }}
          aria-label="Adjust sound volume"
          icon={<Icon />}
        />
      </PopoverTrigger>
      <PopoverContent bg="#091a10" borderColor="#1a4028" w="200px">
        <PopoverArrow bg="#091a10" borderColor="#1a4028" />
        <PopoverBody>
          <HStack spacing={3} align="center">
            <Text
              fontFamily="mono"
              fontSize="10px"
              color="#6b9e78"
              letterSpacing="wider"
              textTransform="uppercase"
              minW="34px"
            >
              Vol
            </Text>
            <Slider
              aria-label="volume"
              value={Math.round(volume * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(v) => setBSVolume(v / 100)}
              colorScheme="green"
            >
              <SliderTrack bg="#1a4028">
                <SliderFilledTrack bg="#22c55e" />
              </SliderTrack>
              <SliderThumb bg="#4ade80" />
            </Slider>
            <Text fontFamily="mono" fontSize="10px" color="#d4f0da" minW="28px" textAlign="right">
              {Math.round(volume * 100)}
            </Text>
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
