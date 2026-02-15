import "./index.css";
import { Composition, staticFile } from "remotion";
import {parseMedia} from '@remotion/media-parser';
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
          seed: 0,
          satisfyingTotalFrames: 0,
          durationInFrames: 1,
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

            const satisfyingVideoData = await parseMedia({
              acknowledgeRemotionLicense: true,
              src: staticFile('satisfying.webm'),
              fields: {
                durationInSeconds: true,
              },
            });

            const satisfyingTotalFrames = Math.floor(satisfyingVideoData.durationInSeconds! * FPS);
            const durationInFrames = Math.max(1, totalFrames);

            return {
              durationInFrames,
              props: {
                seed: config.seed,
                satisfyingTotalFrames,
                audioFiles,
                durationInFrames
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