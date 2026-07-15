import { useState } from "react";
import TimerController from "@/components/TimerController";
import "@/App.css";

function App() {
  const [mainSeconds, setMainSeconds] = useState(0);
  const [innerSeconds, setInnerSeconds] = useState(0);

  // TODO: Implement the following invariant when pressing "start"
  // // Invariant: 0 <= inner <= main. Shrinking the main timer below the inner
  // // timer drags the inner timer down with it.
  // const changeMain = (next: number) => {
  //   setMainSeconds(next);
  //   setInnerSeconds((inner) => Math.min(inner, next));
  // };

  return (
    <main>
      <h1>Timekeeper</h1>
      <TimerController
        label="Sharing Time"
        currentTotalSeconds={mainSeconds}
        onUpdate={setMainSeconds}
        maximumSeconds={59999} // 999 minutes, 59 seconds
      />
      <TimerController
        label="Warning Time"
        currentTotalSeconds={innerSeconds}
        onUpdate={setInnerSeconds}
        maximumSeconds={mainSeconds}
      />
    </main>
  );
}

export default App;
