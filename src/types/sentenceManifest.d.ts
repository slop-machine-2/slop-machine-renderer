export type WordAlignment = {
  text: string;
  start: number;
  end: number;
}

export interface SentenceManifest {
  sentence: string;
  stance: string;
  illustration: string;
  illustrationVideo?: object;
  wordsAlignment: WordAlignment[];
}