import {Html5Audio, Loop, OffthreadVideo, random, Sequence, staticFile} from "remotion";
import { z } from "zod";
import {AudioSegmentContent} from "./AudioSegmentContent";
import {Persona} from "./Persona";
import {TrippyBackground} from "./TrippyBackground";
import {ScriptSentence} from "./types/sentenceManifest";
import {OutputConfig} from "./types/configManifest";

export const SentenceSequenceSchema = z.object({
  sentence: z.custom<ScriptSentence>(),
  audioPath: z.string(),
  illustrationPath: z.string(),
  durationInFrames: z.number().min(1),
});

export const SentenceSequencesSchema = z.object({
  config: z.custom<OutputConfig>(),
  audioFiles: z.array(SentenceSequenceSchema),
  satisfyingTotalFrames: z.number(),
  durationInFrames: z.number(),
});

type SentenceSequencesProps = z.infer<typeof SentenceSequencesSchema>;
export type SentenceSequenceProps = z.infer<typeof SentenceSequenceSchema>;

export const SentenceSequences: React.FC<SentenceSequencesProps> = ({
  config,
  audioFiles,
  satisfyingTotalFrames,
  durationInFrames,
}) => {
  let cumulativeFramesTrippy = 0;
  let cumulativeFrames = 0;

  const maxStartFrame = Math.max(0, satisfyingTotalFrames - durationInFrames);
  const randomStartFrame = Math.floor(random(config.seed) * maxStartFrame);

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
            src={staticFile("satisfying.webm")}
            style={{ width: '100%', height: '101%', objectFit: 'cover' }}
            trimBefore={randomStartFrame}
            muted
          />
        </Loop>
      </div>

      <Html5Audio src={staticFile("theme.ogg")} volume={config.personae.themeVolume} loop />

      {/* 2. Dynamic Content Layer (Background + Persona + Audio) */}
      {/* The Dynamic Background for this specific segment */}
      <div style={{ height: '60%', width: '100%', position: 'absolute', top: 0 }}>
        <TrippyBackground>
          {audioFiles.map((file, index) => {
            const startFrame = cumulativeFramesTrippy;
            cumulativeFramesTrippy += file.durationInFrames;

            return (
              <Sequence
                key={index + 'trippy'}
                from={startFrame}
                durationInFrames={file.durationInFrames}
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


      {audioFiles.map((file, index) => {
        const startFrame = cumulativeFrames;
        const persona = config.personae.personae.find(p => p.id === file.sentence.personaId);
        if (!persona) {
          throw new Error('Persona not found!!')
        }

        cumulativeFrames += file.durationInFrames;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={file.durationInFrames}
          >
            <Persona sentence={file.sentence} seed={config.seed + index} persona={persona} />
            <AudioSegmentContent file={file} fps={config.video.fps} />
          </Sequence>
        );
      })}
    </>
  );
};