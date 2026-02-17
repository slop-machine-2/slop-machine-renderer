export type WordAlignment = {
  text: string;
  start: number;
  end: number;
}

export type ScriptSentence = {
  personaId?: string;
  posXRange: number,
  posXOffset: number;
  sentence: string;
  stance: string;
  illustration: string;
  illustrationVideo?: object;
  wordsAlignment: WordAlignment[];
}