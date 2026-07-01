import {AnimationSet} from "./configManifest";

export type WordAlignment = {
  text: string;
  start: number;
  end: number;
}

export type Slot = "far-left" | "left" | "center" | "right" | "far-right";

export type Appearance = {
  personaId: string;
  stance: string;
  slot?: Slot;
  posX?: number;
  isEntrance?: boolean;
  mirror?: boolean;
  animations?: AnimationSet;
}

export type ScriptSentence = {
  /** The speaker; also present in `appearances`. */
  personaId?: string;
  appearances: Appearance[];
  sentence: string;
  stance: string;
  illustration: string;
  illustrationVideo?: object;
  locationKey?: string;
  /** Theme/mood track that starts on this line (from the config palette), if any. */
  theme?: string;
  /** Background file name in the render folder (Pexels clip or room asset). */
  illustrationFile?: string;
  /** Whether the background is a still image or a video. */
  illustrationKind?: "image" | "video";
  wordsAlignment: WordAlignment[];
}