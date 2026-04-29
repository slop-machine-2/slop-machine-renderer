import {Img, useCurrentFrame, spring, useVideoConfig, interpolate, random} from "remotion";
import {PersonaConfig} from "./types/configManifest";
import {SentenceSequenceProps} from "./SentenceSequences";

export const Persona: React.FC<{ processedSentenceAudio: SentenceSequenceProps; seed: number; persona: PersonaConfig }> = ({ processedSentenceAudio, seed, persona }) => {
  const scriptSentence = processedSentenceAudio.sentence;

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
  const randomX = Math.floor(random(seed + "x") * (width * scriptSentence.posXRange) + (width * scriptSentence.posXOffset));
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
        src={processedSentenceAudio.personaStancePath}
        style={{
          width: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};