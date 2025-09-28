import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';
import type { ImageSourcePropType } from 'react-native';

import LogoFullColor from '../assets/logo_brandcolor.svg';
import LogoWhite from '../assets/logo_white.svg';

const DefaultAvatar = require('../assets/default_avatar.png');

export const REMOTE_ASSET_BASE_URL = 'https://ilykxrtilsbymlncunua.supabase.co/storage/v1/object/public/assets';

export type SvgAsset = FC<SvgProps>;
export type ImageAsset = ImageSourcePropType;

export const LOGO_FULL_COLOR: SvgAsset = LogoFullColor;
export const LOGO_WHITE: SvgAsset = LogoWhite;
export const DEFAULT_AVATAR: ImageAsset = DefaultAvatar;

export const ASSETS = {
  logos: {
    fullColor: LOGO_FULL_COLOR,
    white: LOGO_WHITE,
  },
  images: {
    defaultAvatar: DEFAULT_AVATAR,
  },
  remoteBaseUrl: REMOTE_ASSET_BASE_URL,
} as const;

export default ASSETS;