import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const TrippyBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Create a slow, looping rotation for the colors
  const rotation = interpolate(frame, [0, fps * 10], [0, 360], {
    extrapolateLeft: "extend",
    extrapolateRight: "extend",
  });

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // The "Background" - using a multi-stop gradient
    background: `linear-gradient(${rotation}deg, #ff00c1, #9400ff, #00fff0, #ff00c1)`,
    // backgroundSize: '400% 400%',
  };

  const blurOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    // inset: '-50%', // Larger than screen to cover edges after blur
    background: 'radial-gradient(circle at center, transparent, rgba(0,0,0,0.3))',
    backdropFilter: 'blur(60px)', // Softens the colors into a "trippy" mesh
    transform: `rotate(${rotation * -0.5}deg)`, // Counter-rotation for extra movement
  };

  const contentContainer: React.CSSProperties = {
    position: 'relative',
    width: '95%', // Adjust these values to change border thickness
    height: '95%',
    backgroundColor: 'black', // The "cutout" for your content
    borderRadius: '20px',
    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      <div style={blurOverlayStyle} />

      {children ? (
        <div style={contentContainer}>
          {children}
        </div>
      ) : null}
    </div>
  );
};