import { Composition } from "remotion";
import { MACDDivergence } from "./MACDDivergence";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MACDDivergence"
      component={MACDDivergence}
      durationInFrames={3390}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
