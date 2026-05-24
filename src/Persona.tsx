import {Img, useCurrentFrame, useVideoConfig, random} from "remotion";
import {PersonaConfig} from "./types/configManifest";
import {SentenceSequenceProps} from "./SentenceSequences";
import {composePersonaStyle} from "./animations/composePersonaStyle";

export const Persona: React.FC<{ processedSentenceAudio: SentenceSequenceProps; seed: number; persona: PersonaConfig }> = ({ processedSentenceAudio, seed, persona }) => {
  const scriptSentence = processedSentenceAudio.sentence;

  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ratio = width / 1920;

  const stance = persona.stances.find((s) => s.name === scriptSentence.stance);
  if (!stance) {
    throw new Error(`Stance "${scriptSentence.stance}" not found on persona "${persona.id}"`);
  }

  const animationStyle = composePersonaStyle({
    frame,
    durationInFrames: processedSentenceAudio.durationInFrames,
    fps,
    width,
    height,
    stanceAnimations: stance.animations,
    sentenceAnimations: scriptSentence.animations,
  });

  const minY = height * 0.03;
  const maxY = height * 0.1;
  const randomX = Math.floor(random(seed + "x") * (width * scriptSentence.posXRange) + (width * scriptSentence.posXOffset));
  const randomY = Math.floor(random(seed + "y") * (maxY - minY) + minY);

  const baseTransform = "translate(-50%)";
  const transform = animationStyle.transform
    ? `${baseTransform} ${animationStyle.transform}`
    : baseTransform;

  return (
    <div style={{
      position: 'absolute',
      left: randomX,
      top: randomY,
      transform,
      ...(typeof animationStyle.opacity === "number" ? {opacity: animationStyle.opacity} : {}),
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
