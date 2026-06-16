import {ScriptSentence} from "./sentenceManifest";

export type AnimationSpec = {
  preset: string;
  params?: Record<string, number | string | boolean>;
};

export type AnimationSet = {
  in?: AnimationSpec;
  active?: AnimationSpec;
  out?: AnimationSpec;
};

export type StanceConfig = {
  name: string;
  facing?: "left" | "right" | "camera";
  animations?: AnimationSet;
};

export type PersonaConfig = {
  id: string;
  /** S3 asset key; defaults to `id`. See the app-side PersonaConfig. */
  assetId?: string;
  size: number;
  mirrorable?: boolean;
  personaName: string;
  theme: string;
  themeVolume: number;
  language: "en-US" | "fr-FR";
  promptPersonality: string;
  promptVideoMeta: string;
  stances: StanceConfig[];
  elevenLabsVoiceId: string;
  kokoroVoiceId: string;
};

export type PersonaGroupConfig = {
  endPaddingDurationMs: number;
  prompt: string;
  theme: string;
  themeVolume: number;
  personae: PersonaConfig[];
}

export type OutputConfig = {
  seed: number;
  video: {
    fps: number;
    width: number;
    height: number;
  };
  personae: PersonaGroupConfig;
  sentences: ScriptSentence[];
  topic: object;
  satisfyingVideo: string;
};