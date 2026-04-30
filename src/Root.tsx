import "./index.css";
import { Composition } from "remotion";
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
        width={1}
        height={1}
        defaultProps={{
          config: {
            seed: 0,
            video: {
              fps: 1,
              width: 720,
              height: 1280,
            },
            personae: {
              endPaddingDurationMs: 0,
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
          s3Endpoint: process.env.REMOTION_APP_S3_HTTP_HOST || '',
          s3RootEndpoint: '',
          renderId: '',
          processedSentenceAudios: [] as {
            sentence: ScriptSentence,
            audioPath: string,
            illustrationPath: string,
            personaStancePath: string,
            durationInFrames: number,
          }[],
        }}
        component={SentenceSequences}
        schema={SentenceSequencesSchema}
        calculateMetadata={async ({ props }) => {
          try {
            let config: OutputConfig = props.config;
            const renderId = props.renderId || '';
            const s3RootEndpoint = `http://${props.s3Endpoint}`;
            const s3Endpoint = `${s3RootEndpoint}/output/${renderId}`;

            if (props.renderId && process.env.NODE_ENV === 'development') {
              const s3config = await fetch(`${s3Endpoint}/config.json`);
              config = await s3config.json();
            }

            const processedSentenceAudios = config.sentences.map((sentence, i) => {
              const index = i + 1;
              const lastWordEnd = sentence.wordsAlignment.at(-1)?.end ?? 0;

              return {
                sentence,
                audioPath: `${s3Endpoint}/sentence_${index}.ogg`,
                illustrationPath: `${s3Endpoint}/sentence_${index}_illustration.mp4`,
                personaStancePath: `${s3RootEndpoint}/personae/${sentence.personaId}/${sentence.stance}.png`,
                durationInFrames: Math.ceil(lastWordEnd * config.video.fps),
              };
            });

            const totalFrames = processedSentenceAudios.reduce((acc, file) => acc + file.durationInFrames, 0);

            const satisfyingVideoData = await parseMedia({
              acknowledgeRemotionLicense: true,
              src: `${s3Endpoint}/satisfying.webm`,
              fields: {
                durationInSeconds: true,
              },
            });

            const satisfyingTotalFrames = Math.floor(satisfyingVideoData.durationInSeconds! * config.video.fps);
            const endPaddingFrames = Math.ceil(config.video.fps * ((config.personae.endPaddingDurationMs || 0) / 1000));
            const durationInFrames = Math.max(1, totalFrames + endPaddingFrames);

            return {
              durationInFrames,
              fps: config.video.fps,
              width: config.video.width,
              height: config.video.height,
              props: {
                config,
                satisfyingTotalFrames,
                processedSentenceAudios,
                durationInFrames,
                renderId,
                s3Endpoint,
                s3RootEndpoint
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