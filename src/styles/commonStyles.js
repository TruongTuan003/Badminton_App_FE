import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Màu sắc chung
export const COLORS = {
  primary: '#92A3FD',
  primaryLight: '#C58BF2',
  secondary: '#EEA4CE',
  black: '#1D1617',
  white: '#FFFFFF',
  gray: '#7B6F72',
  lightGray: '#ADA4A5',
  background: '#FFFFFF',
  inputBackground: '#F7F8F8',
  border: '#E1E5E9',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
};

// Kích thước font chữ
export const SIZES = {
  // Tiêu đề
  largeTitle: 32,
  title: 26,
  subtitle: 20,
  
  // Text
  body1: 18,
  body2: 16,
  body3: 14,
  body4: 12,
  
  // Kích thước
  width,
  height,
};

// Font weight
export const FONTS = {
  bold: 'bold',
  semiBold: '600',
  medium: '500',
  regular: '400',
  light: '300',
};

// Shadow styles
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  primaryShadow: {
    shadowColor: '#92A3FD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Button styles
export const BUTTONS = {
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    ...SHADOWS.primaryShadow,
  },
  secondary: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
};

// Input styles
export const INPUTS = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    marginRight: 12,
    color: COLORS.primary,
  },
  text: {
    flex: 1,
    fontSize: SIZES.body2,
    paddingVertical: 0,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

export default {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  BUTTONS,
  INPUTS,
  SPACING,
};

