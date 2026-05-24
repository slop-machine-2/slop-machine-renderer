import {
  AnimationContext,
  AnimationPhase,
  AnimationStyle,
  DEFAULT_PRESET_NAMES,
  getPreset,
} from "./registry";
import {AnimationSet, AnimationSpec} from "../types/configManifest";

type ComposeArgs = {
  frame: number;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  stanceAnimations?: AnimationSet;
  sentenceAnimations?: AnimationSet;
};

function resolveSpec(
  phase: AnimationPhase,
  stanceAnimations?: AnimationSet,
  sentenceAnimations?: AnimationSet,
): AnimationSpec | undefined {
  const sentenceSpec = sentenceAnimations?.[phase];
  if (sentenceSpec) return sentenceSpec;
  const stanceSpec = stanceAnimations?.[phase];
  if (stanceSpec) return stanceSpec;
  const defaultName = DEFAULT_PRESET_NAMES[phase];
  return defaultName ? {preset: defaultName} : undefined;
}

function runPhase(
  phase: AnimationPhase,
  ctx: Omit<AnimationContext, "params">,
  spec: AnimationSpec | undefined,
): AnimationStyle {
  if (!spec) return {};
  const preset = getPreset(phase, spec.preset);
  if (!preset) {
    throw new Error(`Unknown ${phase} animation preset: ${spec.preset}`);
  }
  const params = {...preset.defaults, ...(spec.params ?? {})};
  return preset.apply({...ctx, params});
}

export function composePersonaStyle({
  frame,
  durationInFrames,
  fps,
  width,
  height,
  stanceAnimations,
  sentenceAnimations,
}: ComposeArgs): AnimationStyle {
  const baseCtx = {frame, durationInFrames, fps, width, height};
  const phases: AnimationPhase[] = ["in", "active", "out"];
  const transforms: string[] = [];
  let opacity = 1;
  let opacityTouched = false;

  for (const phase of phases) {
    const spec = resolveSpec(phase, stanceAnimations, sentenceAnimations);
    const style = runPhase(phase, baseCtx, spec);
    if (style.transform) transforms.push(style.transform);
    if (typeof style.opacity === "number") {
      opacity *= style.opacity;
      opacityTouched = true;
    }
  }

  return {
    ...(transforms.length ? {transform: transforms.join(" ")} : {}),
    ...(opacityTouched ? {opacity} : {}),
  };
}
