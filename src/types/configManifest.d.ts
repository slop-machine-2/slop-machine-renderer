import {ScriptSentence} from "./sentenceManifest";

export type PersonaConfig = {
  id: string;
  size: number;
  personaName: string;
  theme: string;
  themeVolume: number;
  language: "en-US" | "fr-FR";
  promptPersonality: string;
  promptVideoMeta: string;
  stances: string[];
  elevenLabsVoiceId: string;
  kokoroVoiceId: string;
};

export type PersonaGroupConfig = {
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