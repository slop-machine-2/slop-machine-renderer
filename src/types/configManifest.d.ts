import {SentenceManifest} from "./sentenceManifest";

export type PersonaConfig = {
  personaName: string;
  theme: string;
  promptPersonality: string;
  stances: string[];
  voiceId: string;
}

export type ConfigManifest = {
  persona: PersonaConfig,
  sentences: SentenceManifest[]
};