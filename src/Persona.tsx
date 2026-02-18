import {Img, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate, random} from "remotion";
import {ScriptSentence} from "./types/sentenceManifest";
import {PersonaConfig} from "./types/configManifest";

export const Persona: React.FC<{ sentence: ScriptSentence; seed: number; persona: PersonaConfig }> = ({ sentence, seed, persona }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ratio = width / 1920;

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

  const minY = height * 0.03;
  const maxY = height * 0.1;
  const randomX = Math.floor(random(seed + "x") * (width * sentence.posXRange) + (width * sentence.posXOffset));
  const randomY = Math.floor(random(seed + "y") * (maxY - minY) + minY);

  return (
    <div style={{
      position: 'absolute',
      left: randomX,
      top: randomY,
      transform: `translate(-50%) scaleY(${scale * 1.05})`,
      width: persona.size * ratio
    }}>
      <Img
        src={staticFile(`persona/${sentence.personaId}/${sentence.stance}.png`)}
        style={{
          width: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};