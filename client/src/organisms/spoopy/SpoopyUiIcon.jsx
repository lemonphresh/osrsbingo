import React from 'react';
import { Box } from '@chakra-ui/react';
import {
  FaBookOpen,
  FaCamera,
  FaCheck,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaEye,
  FaFileImport,
  FaFlask,
  FaLock,
  FaMapMarkedAlt,
  FaMedal,
  FaMusic,
  FaSearch,
  FaSignInAlt,
  FaSyncAlt,
  FaTrophy,
  FaUser,
  FaUserShield,
} from 'react-icons/fa';
import {
  GiCandleLight,
  GiDoorway,
  GiGhost,
  GiPartyPopper,
  GiPumpkin,
  GiSkullCrossedBones,
  GiSpookyHouse,
  GiWrappedSweet,
} from 'react-icons/gi';

const ICONS = {
  admin: FaUserShield,
  camera: FaCamera,
  candy: GiWrappedSweet,
  candle: GiCandleLight,
  check: FaCheck,
  door: GiDoorway,
  external: FaExternalLinkAlt,
  eye: FaEye,
  flask: FaFlask,
  ghost: GiGhost,
  house: GiSpookyHouse,
  import: FaFileImport,
  lock: FaLock,
  map: FaMapMarkedAlt,
  medal: FaMedal,
  music: FaMusic,
  party: GiPartyPopper,
  pumpkin: GiPumpkin,
  refs: GiCandleLight,
  rules: FaBookOpen,
  search: FaSearch,
  signIn: FaSignInAlt,
  skull: GiSkullCrossedBones,
  sync: FaSyncAlt,
  trophy: FaTrophy,
  user: FaUser,
  warning: FaExclamationTriangle,
};

export default function SpoopyUiIcon({ name, ...props }) {
  const component = ICONS[name];
  if (!component) return null;
  return (
    <Box
      as={component}
      aria-hidden="true"
      focusable="false"
      flexShrink={0}
      verticalAlign="-0.125em"
      {...props}
    />
  );
}
