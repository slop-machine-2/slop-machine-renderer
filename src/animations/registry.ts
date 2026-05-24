import {spring, interpolate} from "remotion";

export type AnimationPhase = "in" | "active" | "out";

export type AnimationParams = Record<string, number | string | boolean>;

export type AnimationContext = {
  frame: number;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  params: AnimationParams;
};

export type AnimationStyle = {
  transform?: string;
  opacity?: number;
};

export type AnimationPreset = {
  name: string;
  phase: AnimationPhase;
  defaults: AnimationParams;
  apply: (ctx: AnimationContext) => AnimationStyle;
};

const popDefault: AnimationPreset = {
  name: "pop-default",
  phase: "in",
  defaults: {
    damping: 14,
    stiffness: 200,
    fromScaleY: 0.8,
    toScaleY: 1.0,
    overshootScaleY: 1.05,
  },
  apply: ({frame, fps, params}) => {
    const entrance = spring({
      frame,
      fps,
      config: {
        damping: Number(params.damping),
        stiffness: Number(params.stiffness),
      },
    });
    const scaleY = interpolate(
      entrance,
      [0, 1],
      [Number(params.fromScaleY), Number(params.toScaleY)],
    );
    return {transform: `scaleY(${scaleY * Number(params.overshootScaleY)})`};
  },
};

const shake: AnimationPreset = {
  name: "shake",
  phase: "in",
  defaults: {
    amplitudeX: 30,
    amplitudeY: 15,
    frequency: 2.4,
    durationMs: 300,
  },
  apply: ({frame, fps, width, params}) => {
    const durationFrames = (Number(params.durationMs) / 1000) * fps;
    if (frame >= durationFrames) return {};
    const ratio = width / 1920;
    const envelope = 1 - frame / durationFrames;
    const fx = Number(params.frequency);
    const ax = Number(params.amplitudeX) * ratio * envelope;
    const ay = Number(params.amplitudeY) * ratio * envelope;
    const dx = Math.sin(frame * fx) * ax;
    const dy = Math.cos(frame * fx * 1.3) * ay;
    return {transform: `translate(${dx}px, ${dy}px)`};
  },
};

const PRESETS: Record<AnimationPhase, Record<string, AnimationPreset>> = {
  in: {[popDefault.name]: popDefault, [shake.name]: shake},
  active: {},
  out: {},
};

export const DEFAULT_PRESET_NAMES: Record<AnimationPhase, string | null> = {
  in: "pop-default",
  active: null,
  out: null,
};

export function getPreset(phase: AnimationPhase, name: string): AnimationPreset | undefined {
  return PRESETS[phase]?.[name];
}
