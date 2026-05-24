import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const Separator: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Create a scaling ratio based on a standard 1920px width
  const ratio = width / 1920;

  // Pulse effect for the glow
  const opacity = interpolate(
    Math.sin(frame / 10),
    [-1, 1],
    [0.8, 1]
  );

  // Scale the thickness and shadow based on resolution
  const thickness = 10 * ratio;
  const shadowBlur = 10 * ratio;
  const backgroundPosition = (frame * 3) * ratio;

  return (
    <div
      style={{
        position: 'absolute',
        top: '60%',
        left: 0,
        right: 0,
        height: thickness,
        transform: 'translateY(140%)',
        background: `linear-gradient(90deg, #ff007b, #f9d423, #ff007b)`,
        backgroundSize: '200% 100%',
        backgroundPosition: `${backgroundPosition}px 0`,
        boxShadow: `0 0 ${shadowBlur * opacity}px #03dac6`,
        opacity: opacity,
      }}
    />
  );
};