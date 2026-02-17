import {Html5Audio, Html5Video, random, Sequence, staticFile} from "remotion";
import { z } from "zod";
import {AudioSegmentContent} from "./AudioSegmentContent";
import {Persona} from "./Persona";
import {TrippyBackground} from "./TrippyBackground";
import {SentenceManifest} from "./types/sentenceManifest";

export const SentenceSequenceSchema = z.object({
  sentence: z.custom<SentenceManifest>(),
  audioPath: z.string(),
  illustrationPath: z.string(),
  durationInFrames: z.number().min(1),
});

export const SentenceSequencesSchema = z.object({
  audioFiles: z.array(SentenceSequenceSchema),
  seed: z.number(),
  satisfyingTotalFrames: z.number(),
  durationInFrames: z.number(),
  fps: z.number(),
});

type SentenceSequencesProps = z.infer<typeof SentenceSequencesSchema>;
export type SentenceSequenceProps = z.infer<typeof SentenceSequenceSchema>;

export const SentenceSequences: React.FC<SentenceSequencesProps> = ({
  audioFiles,
  seed,
  satisfyingTotalFrames,
  durationInFrames,
  fps
}) => {
  let cumulativeFramesTrippy = 0;
  let cumulativeFrames = 0;

  const maxStartFrame = Math.max(0, satisfyingTotalFrames - durationInFrames);
  const randomStartFrame = Math.floor(random(seed) * maxStartFrame);

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
        <Html5Video
          src={staticFile("satisfying.webm")}
          style={{ width: '100%', height: '101%', objectFit: 'cover' }}
          startFrom={randomStartFrame}
          muted
          loop
        />
      </div>

      <Html5Audio src={staticFile("theme.ogg")} volume={0.2} loop />

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
                <Html5Video
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
        cumulativeFrames += file.durationInFrames;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={file.durationInFrames}
          >
            <Persona stance={file.sentence.stance} seed={seed + index} />
            <AudioSegmentContent file={file} fps={fps} />
          </Sequence>
        );
      })}
    </>
  );
};