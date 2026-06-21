import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
} from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { WhatIsDivergenceScene } from "./scenes/WhatIsDivergenceScene";
import { BullishDivergenceScene } from "./scenes/BullishDivergenceScene";
import { BearishDivergenceScene } from "./scenes/BearishDivergenceScene";
import { HiddenBullishScene } from "./scenes/HiddenBullishScene";
import { HiddenBearishScene } from "./scenes/HiddenBearishScene";
import { OutroScene } from "./scenes/OutroScene";

export const MACDDivergence: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0e1a" }}>
      <Audio src={staticFile("narration.mp3")} />

      <Sequence from={0} durationInFrames={360}>
        <IntroScene />
      </Sequence>

      <Sequence from={360} durationInFrames={555}>
        <WhatIsDivergenceScene />
      </Sequence>

      <Sequence from={915} durationInFrames={495}>
        <BullishDivergenceScene />
      </Sequence>

      <Sequence from={1410} durationInFrames={510}>
        <BearishDivergenceScene />
      </Sequence>

      <Sequence from={1920} durationInFrames={450}>
        <HiddenBullishScene />
      </Sequence>

      <Sequence from={2370} durationInFrames={450}>
        <HiddenBearishScene />
      </Sequence>

      <Sequence from={2820} durationInFrames={570}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
