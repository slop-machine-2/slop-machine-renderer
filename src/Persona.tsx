import {Img, useCurrentFrame, useVideoConfig, random} from "remotion";
import {PersonaConfig} from "./types/configManifest";
import {Appearance, Slot} from "./types/sentenceManifest";
import {composePersonaStyle} from "./animations/composePersonaStyle";

const SLOT_X: Record<Slot, number> = {
  "far-left": 0.15,
  left: 0.3,
  center: 0.5,
  right: 0.7,
  "far-right": 0.85,
};

// Direction a character at this slot should face (toward screen center).
function desiredFacing(slot?: Slot): "left" | "right" | undefined {
  if (slot === "far-left" || slot === "left") return "right";
  if (slot === "far-right" || slot === "right") return "left";
  return undefined;
}

export const Persona: React.FC<{
  appearance: Appearance;
  persona: PersonaConfig;
  durationInFrames: number;
  s3RootEndpoint: string;
  seed: number;
}> = ({appearance, persona, durationInFrames, s3RootEndpoint, seed}) => {
  const frame = useCurrentFrame();
  const {fps, height, width} = useVideoConfig();
  const ratio = width / 1920;

  const stance = persona.stances.find((s) => s.name === appearance.stance);
  if (!stance) {
    throw new Error(
      `Stance "${appearance.stance}" not found on persona "${persona.id}"`,
    );
  }

  const playEntrance = appearance.isEntrance !== false;

  const animationStyle = composePersonaStyle({
    frame,
    durationInFrames,
    fps,
    width,
    height,
    playEntrance,
    stanceAnimations: stance.animations,
    appearanceAnimations: appearance.animations,
  });

  const xRatio = appearance.posX ?? (appearance.slot ? SLOT_X[appearance.slot] : 0.5);
  const posX = Math.floor(xRatio * width);

  // Seeded by persona id so a character keeps a stable height across lines.
  const minY = height * 0.03;
  const maxY = height * 0.1;
  const posY = Math.floor(random(seed + persona.id + "y") * (maxY - minY) + minY);

  const facing = stance.facing ?? "camera";
  const want = desiredFacing(appearance.slot);
  const mirror =
    appearance.mirror ??
    (Boolean(persona.mirrorable) && facing !== "camera" && want !== undefined && facing !== want);

  const baseTransform = mirror ? "translate(-50%) scaleX(-1)" : "translate(-50%)";
  const transform = animationStyle.transform
    ? `${baseTransform} ${animationStyle.transform}`
    : baseTransform;

  const assetKey = persona.assetId ?? persona.id;
  const stancePath = `${s3RootEndpoint}/personae/${assetKey}/${appearance.stance}.png`;

  return (
    <div style={{
      position: 'absolute',
      left: posX,
      top: posY,
      transform,
      ...(typeof animationStyle.opacity === "number" ? {opacity: animationStyle.opacity} : {}),
      width: persona.size * ratio
    }}>
      <Img
        src={stancePath}
        style={{
          width: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};
