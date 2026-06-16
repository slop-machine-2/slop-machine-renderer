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
  wordsAlignment: WordAlignment[];
}