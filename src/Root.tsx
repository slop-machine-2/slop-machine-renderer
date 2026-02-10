import "./index.css";
import { Composition, staticFile } from "remotion";
import { SentenceSequences, SentenceSequencesSchema } from "./SentenceSequences";
import {SentenceManifest} from "./types/sentenceManifest";
import {ConfigManifest} from "./types/configManifest";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicShortVideo"
        durationInFrames={1}
        defaultProps={{
          audioFiles: [] as {
            sentence: SentenceManifest,
            audioPath: string,
            illustrationPath: string,
            durationInFrames: number,
          }[],
        }}
        component={SentenceSequences}
        schema={SentenceSequencesSchema}
        fps={FPS}
        width={1080}
        height={1920}
        calculateMetadata={async () => {
          try {
            // 1. Fetch the manifest file first
            const manifestResponse = await fetch(staticFile("config.json"));
            if (!manifestResponse.ok) {
              throw new Error("Could not load config.json");
            }

            const config: ConfigManifest = await manifestResponse.json();
            const sentences = config.sentences;

            // 2. Map through the known sentences to get subs and audio
            const audioFiles = await Promise.all(
              sentences.map(async (sentence, i) => {
                const index = i + 1;
                const audioPath = staticFile(`sentence_${index}.ogg`);
                const illustrationPath = staticFile(`sentence_${index}_illustration.mp4`);

                // Calculate duration based on the last timestamp in the sub file
                const lastWordEnd = sentence.wordsAlignment.length > 0 ? sentence.wordsAlignment[sentence.wordsAlignment.length - 1].end : 0;
                const durationInFrames = Math.ceil(lastWordEnd * FPS);

                return {
                  sentence,
                  audioPath,
                  illustrationPath,
                  durationInFrames,
                };
              })
            );

            // 3. Calculate total timeline length
            const totalFrames = audioFiles.reduce((acc, file) => acc + file.durationInFrames, 0);

            return {
              durationInFrames: Math.max(1, totalFrames),
              props: {
                audioFiles,
              },
            };
          } catch (err) {
            console.error("Metadata calculation failed:", err);
            return { durationInFrames: 1 };
          }
        }}
      />
    </>
  );
};