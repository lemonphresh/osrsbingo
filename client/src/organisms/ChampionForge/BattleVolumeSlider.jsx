import { useState } from 'react';
import {
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
} from '@chakra-ui/react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { getBattleVolume, setBattleVolume } from '../../utils/soundEngine';

export default function BattleVolumeSlider() {
  const [vol, setVol] = useState(() => getBattleVolume());

  const handleChange = (v) => {
    setVol(v);
    setBattleVolume(v);
  };

  const Icon = vol === 0 ? FaVolumeMute : FaVolumeUp;

  return (
    <HStack spacing={2} w="108px" flexShrink={0}>
      <Tooltip label={vol === 0 ? 'Unmute' : 'Mute'} placement="top" hasArrow>
        <span>
          <Icon
            style={{ color: '#a0aec0', width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }}
            onClick={() => handleChange(vol === 0 ? 0.65 : 0)}
          />
        </span>
      </Tooltip>
      <Slider min={0} max={1} step={0.05} value={vol} onChange={handleChange} size="sm" flex={1}>
        <SliderTrack bg="gray.600" h="3px">
          <SliderFilledTrack bg="yellow.500" />
        </SliderTrack>
        <SliderThumb boxSize="11px" bg="yellow.400" />
      </Slider>
    </HStack>
  );
}
