import { Dimensions, PixelRatio } from 'react-native';

export function widthPercentageToDP(widthPercent: string | number): number {
  const screenWidth = Dimensions.get('window').width;
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
}

export function heightPercentageToDP(heightPercent: string | number): number {
  const screenHeight = Dimensions.get('window').height;
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
}

export const wp = widthPercentageToDP;
export const hp = heightPercentageToDP;
