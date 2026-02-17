import {SentenceManifest} from "./sentenceManifest";

export type PersonaConfig = {
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

export type OutputConfig = {
  seed: number;
  video: {
    fps: number;
  };
  persona: PersonaConfig;
  sentences: SentenceManifest[];
  topic: object;
  satisfyingVideo: string;
};