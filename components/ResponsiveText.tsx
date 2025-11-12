// components/ResponsiveText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { scaleFont } from '../utils/responsive';

interface ResponsiveTextProps extends TextProps {
  size?: number;
  scaleFactor?: number;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  size = 16,
  scaleFactor = 0.5,
  style,
  ...props
}) => {
  return (
    <Text
      {...props}
      style={[
        { fontSize: scaleFont(size, scaleFactor) },
        style,
      ]}
    />
  );
};
