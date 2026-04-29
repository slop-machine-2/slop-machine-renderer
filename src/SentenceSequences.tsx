import {Html5Audio, Loop, OffthreadVideo, random, Sequence} from "remotion";
import {z} from "zod";
import {AudioSegmentContent} from "./AudioSegmentContent";
import {Persona} from "./Persona";
import {TrippyBackground} from "./TrippyBackground";
import {ScriptSentence} from "./types/sentenceManifest";
import {OutputConfig} from "./types/configManifest";

export const SentenceSequenceSchema = z.object({
  sentence: z.custom<ScriptSentence>(),
  audioPath: z.string(),
  illustrationPath: z.string(),
  personaStancePath: z.string(),
  durationInFrames: z.number().min(1),
});

export const SentenceSequencesSchema = z.object({
  config: z.custom<OutputConfig>(),
  processedSentenceAudios: z.array(SentenceSequenceSchema),
  satisfyingTotalFrames: z.number(),
  durationInFrames: z.number(),
  renderId: z.string(),
  s3Endpoint: z.string(),
  s3RootEndpoint: z.string()
});

type SentenceSequencesProps = z.infer<typeof SentenceSequencesSchema>;
export type SentenceSequenceProps = z.infer<typeof SentenceSequenceSchema>;

export const SentenceSequences: React.FC<SentenceSequencesProps> = ({
                                                                      config,
                                                                      processedSentenceAudios,
                                                                      satisfyingTotalFrames,
                                                                      durationInFrames,
                                                                      s3Endpoint,
                                                                      s3RootEndpoint,
                                                                      renderId
                                                                    }) => {
  let cumulativeFramesTrippy = 0;
  let cumulativeFrames = 0;

  const maxStartFrame = Math.max(0, satisfyingTotalFrames - durationInFrames);
  const randomStartFrame = Math.floor(random(config.seed) * maxStartFrame);

  if (!renderId) {
    return (<></>)
  }

  return (
    <>
      {/* 1. Global Elements (Satisfying video & Theme Music) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%'
        }}
      >
        <Loop durationInFrames={satisfyingTotalFrames}>
          <OffthreadVideo
            src={`${s3Endpoint}/satisfying.webm`}
            style={{width: '100%', height: '101%', objectFit: 'cover'}}
            trimBefore={randomStartFrame}
            muted
          />
        </Loop>
      </div>

      <Html5Audio src={`${s3RootEndpoint}/assets/themes/${config.personae.theme}.ogg`}
                  volume={config.personae.themeVolume} loop/>

      {/* 2. Dynamic Content Layer (Background + Persona + Audio) */}
      {/* The Dynamic Background for this specific segment */}
      <div style={{height: '60%', width: '100%', position: 'absolute', top: 0}}>
        <TrippyBackground>
          {processedSentenceAudios.map((file, index) => {
            const isLast = index === processedSentenceAudios.length - 1;
            const adjustedDuration = isLast
              ? file.durationInFrames + Math.ceil(config.video.fps * (config.personae.endPaddingDurationMs / 1000))
              : file.durationInFrames;
            const startFrame = cumulativeFramesTrippy;
            cumulativeFramesTrippy += file.durationInFrames;

            return (
              <Sequence
                key={index + 'trippy'}
                from={startFrame}
                durationInFrames={adjustedDuration}
              >
                <OffthreadVideo
                  src={file.illustrationPath}
                  style={{
                    width: '100%',
                    height: '101%',
                    objectFit: 'cover'
                  }}
                  muted
                />
              </Sequence>
            );
          })}
        </TrippyBackground>
      </div>


      {processedSentenceAudios.map((processedSentenceAudio, index) => {
        const isLast = index === processedSentenceAudios.length - 1;
        const adjustedDuration = isLast
          ? processedSentenceAudio.durationInFrames + Math.ceil(config.video.fps * (config.personae.endPaddingDurationMs / 1000))
          : processedSentenceAudio.durationInFrames;

        const startFrame = cumulativeFrames;
        const persona = config.personae.personae.find(p => p.id === processedSentenceAudio.sentence.personaId);
        if (!persona) {
          throw new Error('Persona not found!!')
        }

        cumulativeFrames += processedSentenceAudio.durationInFrames;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={adjustedDuration}
          >
            <Persona processedSentenceAudio={processedSentenceAudio} seed={config.seed + index} persona={persona}/>
            <AudioSegmentContent processedSentenceAudio={processedSentenceAudio} fps={config.video.fps}/>
          </Sequence>
        );
      })}
    </>
  );
};