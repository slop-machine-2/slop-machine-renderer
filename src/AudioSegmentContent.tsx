import {Html5Audio, useCurrentFrame, AbsoluteFill, useVideoConfig} from "remotion";
import {WordAlignment} from "./types/sentenceManifest";
import {SentenceSequenceProps} from "./SentenceSequences";

export const AudioSegmentContent: React.FC<{ file: SentenceSequenceProps, fps: number }> = ({ file, fps }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const scale = width / 1920;
  const currentTime = frame / fps;

  // 1. Group subtitles into "pages" (e.g., 7 words per page)
  const wordsPerPage = 7;
  const pages: WordAlignment[][] = [];
  for (let i = 0; i < file.sentence.wordsAlignment.length; i += wordsPerPage) {
    pages.push(file.sentence.wordsAlignment.slice(i, i + wordsPerPage));
  }

  // 2. Find the correct page
  // We look for the page where the CURRENT TIME is greater than or equal to
  // the start of the FIRST word on that page.
  const currentPageIndex = pages.findLastIndex((page) => {
    return currentTime >= page[0].start;
  });

  // Fallback to the first page only if we haven't reached the first word yet
  const activePageIndex = currentPageIndex === -1 ? 0 : currentPageIndex;
  const currentPage = pages[activePageIndex];

  return (
    <AbsoluteFill style={{justifyContent: "flex-end"}}>
      <Html5Audio src={file.audioPath} />

      <div style={{
        display: 'flex',
        alignSelf: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingBottom: 10 * scale,
        width: '92%',
        minHeight: '40%',
        alignContent: 'center'
      }}>
        {currentPage.map((item: WordAlignment, i: number) => {
          const isActive = currentTime >= item.start && currentTime <= item.end;

          return (
            <span
              key={`${item.start}-${i}`}
              style={{
                fontSize: 150 * scale,
                // fontSize: '400%',
                fontWeight: "900",
                // padding: "10px 15px",
                paddingRight: 30 * scale,
                paddingLeft: 30 * scale,
                color: isActive ? "#FFD700" : "white",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.05s ease-out",
                display: "inline-block",
                fontFamily: "Arial, sans-serif",
                textShadow: "5px 5px 20px rgba(0,0,0,0.8)",
                textTransform: "uppercase",
                // Performance tip: will-change helps with smooth scaling in Remotion
                willChange: "transform",
                background: isActive ? 'red' : 'unset',
                borderRadius: 30 * scale
              }}
            >
              {item.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};