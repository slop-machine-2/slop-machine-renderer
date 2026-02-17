import "./index.css";
import { Composition, staticFile } from "remotion";
import {parseMedia} from '@remotion/media-parser';
import { SentenceSequences, SentenceSequencesSchema } from "./SentenceSequences";
import {ScriptSentence} from "./types/sentenceManifest";
import {OutputConfig} from "./types/configManifest";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicShortVideo"
        durationInFrames={1}
        fps={1}
        defaultProps={{
          config: {
            seed: 0,
            video: {
              fps: 1,
              width: 720,
              height: 1280,
            },
            personae: {
              prompt: '',
              theme: '',
              themeVolume: 0,
              personae: []
            },
            sentences: [],
            topic: {},
            satisfyingVideo: ''
          },
          satisfyingTotalFrames: 1,
          durationInFrames: 1,
          audioFiles: [] as {
            sentence: ScriptSentence,
            audioPath: string,
            illustrationPath: string,
            durationInFrames: number,
          }[],
        }}
        component={SentenceSequences}
        schema={SentenceSequencesSchema}
        // width={720}
        // height={1280}
        // width={1080}
        // height={1920}
        calculateMetadata={async () => {
          try {
            // 1. Fetch the manifest file first
            const manifestResponse = await fetch(staticFile("config.json"));
            if (!manifestResponse.ok) {
              throw new Error("Could not load config.json");
            }

            const config: OutputConfig = await manifestResponse.json();
            const sentences = config.sentences;

            // 2. Map through the known sentences to get subs and audio
            const audioFiles = await Promise.all(
              sentences.map(async (sentence, i) => {
                const index = i + 1;
                const audioPath = staticFile(`sentence_${index}.ogg`);
                const illustrationPath = staticFile(`sentence_${index}_illustration.mp4`);

                // Calculate duration based on the last timestamp in the sub file
                const lastWordEnd = sentence.wordsAlignment.length > 0 ? sentence.wordsAlignment[sentence.wordsAlignment.length - 1].end : 0;
                const durationInFrames = Math.ceil(lastWordEnd * config.video.fps);

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

            const satisfyingTotalFrames = Math.floor(satisfyingVideoData.durationInSeconds! * config.video.fps);
            const durationInFrames = Math.max(1, totalFrames);

            return {
              durationInFrames,
              fps: config.video.fps,
              width: config.video.width,
              height: config.video.height,
              props: {
                config,
                satisfyingTotalFrames,
                audioFiles,
                durationInFrames,
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