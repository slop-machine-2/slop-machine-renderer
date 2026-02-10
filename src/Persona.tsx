import {Img, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate} from "remotion";

const PERSONA_WIDTH = 700;

export const Persona: React.FC<{ stance: string; seed: number }> = ({ stance, seed }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 200,
    },
  });

  // Maps the spring's 0-1 movement to your desired 0.8-1.0 size range
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);

  const randomX = Math.floor((Math.abs(Math.sin(seed) * (width * 0.6))) + (width * 0.2));
  const maxY = height * 0.4;
  const minY = height * 0.1;
  const randomY = Math.floor(Math.abs(Math.cos(seed) * maxY + minY));

  return (
    <div style={{
      position: 'absolute',
      left: randomX,
      top: randomY,
      transform: `translate(-50%, -50%) scaleY(${scale * 1.05})`,
      width: PERSONA_WIDTH
    }}>
      <Img
        src={staticFile(`persona/${stance}.png`)}
        style={{
          width: PERSONA_WIDTH,
          height: 'auto'
        }}
      />
    </div>
  );
};