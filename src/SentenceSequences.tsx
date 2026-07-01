import {Html5Audio, Img, Loop, OffthreadVideo, Video, random, Sequence} from "remotion";
import {z} from "zod";
import {AudioSegmentContent} from "./AudioSegmentContent";
import {Persona} from "./Persona";
import {ScriptSentence} from "./types/sentenceManifest";
import {OutputConfig} from "./types/configManifest";
import {Separator} from "./Separator";

export const SentenceSequenceSchema = z.object({
  sentence: z.custom<ScriptSentence>(),
  audioPath: z.string(),
  illustrationPath: z.string(),
  illustrationKind: z.string(),
  // True for a looping room background (a Video that fills the whole scene),
  // false for a one-shot Pexels clip (OffthreadVideo).
  loop: z.boolean(),
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
  let cumulativeFrames = 0;

  const maxStartFrame = Math.max(0, satisfyingTotalFrames - durationInFrames);
  const randomStartFrame = Math.floor(random(config.seed) * maxStartFrame);

  if (!renderId) {
    return (<></>)
  }

  // Merge consecutive lines that share the same background file into one
  // continuous Sequence, so a scene that stays in the same room never restarts
  // its clip mid-scene. A change in source path (a new room, or a per-line
  // Pexels clip) starts a new segment — i.e. a real cut.
  const endPaddingFrames = Math.ceil(
    config.video.fps * ((config.personae.endPaddingDurationMs || 0) / 1000),
  );
  type BgSegment = { path: string; kind: string; loop: boolean; from: number; duration: number };
  const bgSegments: BgSegment[] = [];
  let bgAcc = 0;
  for (const file of processedSentenceAudios) {
    const last = bgSegments[bgSegments.length - 1];
    if (last && last.path === file.illustrationPath) {
      last.duration += file.durationInFrames;
    } else {
      bgSegments.push({
        path: file.illustrationPath,
        kind: file.illustrationKind,
        loop: file.loop,
        from: bgAcc,
        duration: file.durationInFrames,
      });
    }
    bgAcc += file.durationInFrames;
  }
  // The final background covers the trailing end-padding, like the audio layer.
  if (bgSegments.length) {
    bgSegments[bgSegments.length - 1].duration += endPaddingFrames;
  }

  // Theme (background music) segments. Each line plays its own theme when the
  // writer assigned one (a mood shift), otherwise the base `config.personae.theme`.
  // Consecutive lines sharing a theme merge into one looping segment so the music
  // never restarts mid-mood; a change of theme starts a new track exactly on the
  // frame that line begins. Lines with no theme AND no base track play silence.
  type ThemeSegment = { theme: string; from: number; duration: number };
  const themeSegments: ThemeSegment[] = [];
  let themeAcc = 0;
  for (const file of processedSentenceAudios) {
    const theme = file.sentence.theme || config.personae.theme || '';
    const last = themeSegments[themeSegments.length - 1];
    if (last && last.theme === theme) {
      last.duration += file.durationInFrames;
    } else {
      themeSegments.push({ theme, from: themeAcc, duration: file.durationInFrames });
    }
    themeAcc += file.durationInFrames;
  }
  if (themeSegments.length) {
    themeSegments[themeSegments.length - 1].duration += endPaddingFrames;
  }

  return (
    <>
      {/* 1. Theme Music — one looping track per mood segment (see themeSegments) */}
      {themeSegments.map((seg, index) =>
        seg.theme ? (
          <Sequence
            key={'theme-' + index}
            from={seg.from}
            durationInFrames={seg.duration}
          >
            <Html5Audio
              src={`${s3RootEndpoint}/assets/themes/${seg.theme}.ogg`}
              volume={config.personae.themeVolume}
              loop
            />
          </Sequence>
        ) : null,
      )}

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

      {/* 2. Dynamic Content Layer (Background + Persona + Audio) */}
      {/* One Sequence per merged background segment (continuous across a scene) */}
      <div style={{height: '60%', width: '100%', position: 'absolute', top: 0}}>
        {bgSegments.map((seg, index) => {
          const style = {width: '100%', height: '101%', objectFit: 'cover'} as const;
          return (
            <Sequence
              key={'bg-' + index}
              from={seg.from}
              durationInFrames={seg.duration}
            >
              {seg.kind === 'image' ? (
                <Img src={seg.path} style={style}/>
              ) : seg.loop ? (
                // Room video: loop so it fills the whole scene without resetting.
                <Video src={seg.path} style={style} muted loop/>
              ) : (
                <OffthreadVideo src={seg.path} style={style} muted/>
              )}
            </Sequence>
          );
        })}
      </div>

      <Separator/>

      {processedSentenceAudios.map((processedSentenceAudio, index) => {
        const isLast = index === processedSentenceAudios.length - 1;
        const adjustedDuration = isLast
          ? processedSentenceAudio.durationInFrames + Math.ceil(config.video.fps * (config.personae.endPaddingDurationMs / 1000))
          : processedSentenceAudio.durationInFrames;

        const startFrame = cumulativeFrames;
        cumulativeFrames += processedSentenceAudio.durationInFrames;

        const sentence = processedSentenceAudio.sentence;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={adjustedDuration}
          >
            {sentence.appearances.map((appearance, ai) => {
              const persona = config.personae.personae.find(p => p.id === appearance.personaId);
              if (!persona) {
                throw new Error('Persona not found: ' + appearance.personaId)
              }
              return (
                <Persona
                  key={ai}
                  appearance={appearance}
                  persona={persona}
                  durationInFrames={processedSentenceAudio.durationInFrames}
                  s3RootEndpoint={s3RootEndpoint}
                  seed={config.seed}
                />
              );
            })}
            <AudioSegmentContent processedSentenceAudio={processedSentenceAudio} fps={config.video.fps}/>
          </Sequence>
        );
      })}

      {/* First-frame image (Shorts thumbnail): a single frame at index 0, full-bleed
          on top of everything, so YouTube grabs it as the cover. Invisible in playback. */}
      {config.firstFrameImage ? (
        <Sequence from={0} durationInFrames={1}>
          <Img
            src={`${s3Endpoint}/${config.firstFrameImage}`}
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 100}}
          />
        </Sequence>
      ) : null}
    </>
  );
};