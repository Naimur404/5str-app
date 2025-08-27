import React from 'react';
import Svg, { Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export const AppLogo: React.FC<LogoProps> = ({ size = 120, showText = false }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4F46E5" stopOpacity="1" />
          <Stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Background Circle */}
      <Circle
        cx="60"
        cy="60"
        r="55"
        fill="url(#grad)"
        stroke="#ffffff"
        strokeWidth="2"
      />
      
      {/* Star shape for 5str */}
      <SvgText
        x="60"
        y="50"
        fontSize="48"
        fontWeight="bold"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="System"
      >
        5
      </SvgText>
      
      {/* Small star */}
      <SvgText
        x="60"
        y="80"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        fill="#FFC107"
        fontFamily="System"
      >
        ★
      </SvgText>
      
      {showText && (
        <SvgText
          x="60"
          y="95"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="System"
        >
          5str
        </SvgText>
      )}
    </Svg>
  );
};
