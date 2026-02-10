export type WordAlignment = {
  text: string;
  start: number;
  end: number;
}

export interface SentenceManifest {
  sentence: string;
  stance: string;
  illustration: string;
  illustrationVideoUrl?: string;
  wordsAlignment: WordAlignment[];
}