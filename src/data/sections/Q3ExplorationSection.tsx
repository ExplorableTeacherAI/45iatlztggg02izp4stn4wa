import { Block } from "@/components/templates";
import { EditableH2, EditableH3, EditableParagraph } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";
import { Button } from "@/components/atoms/ui/button";
import { Progress } from "@/components/atoms/ui/progress";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

/**
 * Sample from Beta distribution
 */
function gammaVariate(shape: number): number {
  if (shape < 1) {
    return gammaVariate(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1/3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x, v;
    do {
      x = normalVariate();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function normalVariate(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleBeta(alpha: number, beta: number): number {
  const gammaA = gammaVariate(alpha);
  const gammaB = gammaVariate(beta);
  return gammaA / (gammaA + gammaB);
}

interface SimulationState {
  userCount: number;
  alphaA: number;
  betaA: number;
  alphaB: number;
  betaB: number;
  selectionsA: number;
  selectionsB: number;
  successesA: number;
  successesB: number;
  history: { user: number; selected: 'A' | 'B'; success: boolean }[];
}

/**
 * Line chart for cumulative selections
 */
const SelectionChart = ({ history, maxUsers }: { history: SimulationState['history']; maxUsers: number }) => {
  const data = useMemo(() => {
    const points: { user: number; cumA: number; cumB: number }[] = [];
    let cumA = 0;
    let cumB = 0;

    for (let i = 0; i < history.length; i++) {
      if (history[i].selected === 'A') cumA++;
      else cumB++;

      // Sample every 10 users or at specific points
      if (i % 10 === 0 || i === history.length - 1) {
        points.push({ user: i + 1, cumA, cumB });
      }
    }

    return points;
  }, [history]);

  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 60, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxY = Math.max(data.length > 0 ? Math.max(...data.map(d => Math.max(d.cumA, d.cumB))) : 100, 10);

  // Create paths
  const pathA = data.map((d, i) => {
    const x = padding.left + (d.user / maxUsers) * chartWidth;
    const y = padding.top + chartHeight - (d.cumA / maxY) * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const pathB = data.map((d, i) => {
    const x = padding.left + (d.user / maxUsers) * chartWidth;
    const y = padding.top + chartHeight - (d.cumB / maxY) * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(tick => (
        <line
          key={tick}
          x1={padding.left}
          y1={padding.top + tick * chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + tick * chartHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* X-axis labels */}
      {[0, 250, 500, 750, 1000].map(tick => (
        <text
          key={tick}
          x={padding.left + (tick / maxUsers) * chartWidth}
          y={height - 10}
          textAnchor="middle"
          className="text-[10px] fill-muted-foreground"
        >
          {tick}
        </text>
      ))}

      {/* X-axis label */}
      <text
        x={padding.left + chartWidth / 2}
        y={height - 0}
        textAnchor="middle"
        className="text-xs fill-muted-foreground"
      >
        Users
      </text>

      {/* Y-axis label */}
      <text
        x={15}
        y={padding.top + chartHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
        className="text-xs fill-muted-foreground"
      >
        Cumulative Selections
      </text>

      {/* Lines */}
      {pathA && <path d={pathA} fill="none" stroke="#2563eb" strokeWidth="2" />}
      {pathB && <path d={pathB} fill="none" stroke="#16a34a" strokeWidth="2" />}

      {/* Legend */}
      <rect x={width - 55} y={padding.top} width="12" height="12" fill="#2563eb" />
      <text x={width - 40} y={padding.top + 10} className="text-[10px] fill-foreground">Design A</text>
      <rect x={width - 55} y={padding.top + 18} width="12" height="12" fill="#16a34a" />
      <text x={width - 40} y={padding.top + 28} className="text-[10px] fill-foreground">Design B</text>
    </svg>
  );
};

/**
 * Section 5: Q3 - Exploration vs Exploitation
 */
export const Q3ExplorationSection = () => {
  // True success probabilities (unknown to the agent)
  const trueProbA = 0.5;
  const trueProbB = 0.7;

  const [state, setState] = useState<SimulationState>({
    userCount: 0,
    alphaA: 1,
    betaA: 1,
    alphaB: 1,
    betaB: 1,
    selectionsA: 0,
    selectionsB: 0,
    successesA: 0,
    successesB: 0,
    history: [],
  });

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50); // ms per user
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Single step of simulation
  const runStep = useCallback(() => {
    setState(prev => {
      if (prev.userCount >= 1000) return prev;

      // Thompson Sampling: sample from both posteriors
      const sampleA = sampleBeta(prev.alphaA, prev.betaA);
      const sampleB = sampleBeta(prev.alphaB, prev.betaB);

      // Select the design with higher sample
      const selected: 'A' | 'B' = sampleA > sampleB ? 'A' : 'B';

      // Simulate outcome based on true probabilities
      const trueProb = selected === 'A' ? trueProbA : trueProbB;
      const success = Math.random() < trueProb;

      // Update state
      const newState = { ...prev };
      newState.userCount = prev.userCount + 1;

      if (selected === 'A') {
        newState.selectionsA = prev.selectionsA + 1;
        if (success) {
          newState.alphaA = prev.alphaA + 1;
          newState.successesA = prev.successesA + 1;
        } else {
          newState.betaA = prev.betaA + 1;
        }
      } else {
        newState.selectionsB = prev.selectionsB + 1;
        if (success) {
          newState.alphaB = prev.alphaB + 1;
          newState.successesB = prev.successesB + 1;
        } else {
          newState.betaB = prev.betaB + 1;
        }
      }

      newState.history = [...prev.history, { user: prev.userCount + 1, selected, success }];

      return newState;
    });
  }, []);

  // Run simulation
  useEffect(() => {
    if (isRunning && state.userCount < 1000) {
      intervalRef.current = setTimeout(() => {
        runStep();
      }, speed);
    } else if (state.userCount >= 1000) {
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isRunning, state.userCount, runStep, speed]);

  // Control functions
  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setState({
      userCount: 0,
      alphaA: 1,
      betaA: 1,
      alphaB: 1,
      betaB: 1,
      selectionsA: 0,
      selectionsB: 0,
      successesA: 0,
      successesB: 0,
      history: [],
    });
  };
  const handleFastForward = () => {
    setIsRunning(false);
    // Run remaining steps instantly
    let currentState = { ...state };
    while (currentState.userCount < 1000) {
      const sampleA = sampleBeta(currentState.alphaA, currentState.betaA);
      const sampleB = sampleBeta(currentState.alphaB, currentState.betaB);
      const selected: 'A' | 'B' = sampleA > sampleB ? 'A' : 'B';
      const trueProb = selected === 'A' ? trueProbA : trueProbB;
      const success = Math.random() < trueProb;

      currentState.userCount++;
      if (selected === 'A') {
        currentState.selectionsA++;
        if (success) {
          currentState.alphaA++;
          currentState.successesA++;
        } else {
          currentState.betaA++;
        }
      } else {
        currentState.selectionsB++;
        if (success) {
          currentState.alphaB++;
          currentState.successesB++;
        } else {
          currentState.betaB++;
        }
      }
      currentState.history = [...currentState.history, { user: currentState.userCount, selected, success }];
    }
    setState(currentState);
  };

  // Calculate statistics
  const successRateA = state.selectionsA > 0 ? (state.successesA / state.selectionsA * 100).toFixed(1) : '0';
  const successRateB = state.selectionsB > 0 ? (state.successesB / state.selectionsB * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <Block id="block-q3-title" padding="lg">
        <EditableH2 id="h2-q3-title" blockId="block-q3-title">
          Q3: Exploration vs Exploitation
        </EditableH2>
      </Block>

      {/* Question Statement */}
      <Block id="block-q3-question" padding="md">
        <EditableParagraph id="para-q3-question" blockId="block-q3-question">
          Suppose you need to conduct this A/B test with 1000 users in a sequential manner.
          Explain how Thompson sampling (or bandit algorithms in general) helps balance
          exploration and exploitation in this context.
        </EditableParagraph>
      </Block>

      {/* Explanation */}
      <Block id="block-q3-explain" padding="md">
        <EditableH3 id="h3-tradeoff" blockId="block-q3-explain">
          The Exploration-Exploitation Trade-off
        </EditableH3>
        <EditableParagraph id="para-tradeoff" blockId="block-q3-explain">
          In sequential decision-making, we face a fundamental dilemma:
        </EditableParagraph>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-700">Exploration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Try different options to learn more about their true success rates.
              This helps us make better decisions in the long run, but may result
              in short-term losses.
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-emerald-700">Exploitation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Choose the option that currently appears best based on our knowledge.
              This maximizes immediate reward, but we might miss discovering a
              better option.
            </CardContent>
          </Card>
        </div>
      </Block>

      {/* Thompson Sampling Benefits */}
      <Block id="block-q3-thompson" padding="md">
        <EditableH3 id="h3-thompson-benefits" blockId="block-q3-thompson">
          How Thompson Sampling Balances Both
        </EditableH3>
        <EditableParagraph id="para-thompson-balance" blockId="block-q3-thompson">
          Thompson Sampling elegantly handles this trade-off through <strong>probability matching</strong>:
        </EditableParagraph>
        <ul className="list-disc list-inside mt-3 space-y-2 text-base leading-relaxed">
          <li><strong>Early on:</strong> When we have little data, posteriors are wide (uncertain), so both designs have a reasonable chance of being sampled higher — this encourages <em>exploration</em></li>
          <li><strong>Over time:</strong> As we gather more data, posteriors become narrower (confident), and the better design gets selected more often — this shifts towards <em>exploitation</em></li>
          <li><strong>Automatic adaptation:</strong> Unlike fixed strategies (like ε-greedy), Thompson Sampling naturally adjusts based on uncertainty — no manual tuning required!</li>
        </ul>
      </Block>

      {/* Simulation */}
      <Block id="block-q3-simulation" padding="md">
        <EditableH3 id="h3-simulation" blockId="block-q3-simulation">
          Live Simulation: 1000 Users
        </EditableH3>
        <EditableParagraph id="para-sim-intro" blockId="block-q3-simulation">
          Watch how Thompson Sampling allocates users between designs over time.
          The true success rates are: Design A = 50%, Design B = 70% (unknown to the agent).
        </EditableParagraph>

        {/* Controls */}
        <div className="flex gap-3 mt-4 flex-wrap items-center">
          {!isRunning ? (
            <Button onClick={handleStart} disabled={state.userCount >= 1000} className="gap-2">
              <Play className="h-4 w-4" /> Start
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline" className="gap-2">
              <Pause className="h-4 w-4" /> Pause
            </Button>
          )}
          <Button onClick={handleFastForward} disabled={state.userCount >= 1000} variant="outline" className="gap-2">
            <FastForward className="h-4 w-4" /> Complete
          </Button>
          <Button onClick={handleReset} variant="ghost" className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <input
              type="range"
              min={10}
              max={200}
              value={200 - speed}
              onChange={(e) => setSpeed(200 - Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{state.userCount} / 1000 users</span>
          </div>
          <Progress value={state.userCount / 10} />
        </div>

        {/* Chart */}
        <div className="mt-6 bg-muted/30 p-4 rounded-lg">
          <SelectionChart history={state.history} maxUsers={1000} />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-700">Design A</CardTitle>
              <div className="text-xs text-muted-foreground">True rate: 50%</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Times selected:</span>
                  <span className="font-mono font-bold">{state.selectionsA}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successes:</span>
                  <span className="font-mono">{state.successesA}</span>
                </div>
                <div className="flex justify-between">
                  <span>Observed rate:</span>
                  <span className="font-mono">{successRateA}%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Posterior:</span>
                  <span className="font-mono">Beta({state.alphaA}, {state.betaA})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-700">Design B</CardTitle>
              <div className="text-xs text-muted-foreground">True rate: 70%</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Times selected:</span>
                  <span className="font-mono font-bold">{state.selectionsB}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successes:</span>
                  <span className="font-mono">{state.successesB}</span>
                </div>
                <div className="flex justify-between">
                  <span>Observed rate:</span>
                  <span className="font-mono">{successRateB}%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Posterior:</span>
                  <span className="font-mono">Beta({state.alphaB}, {state.betaB})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Block>

      {/* Answer */}
      <Block id="block-q3-answer" padding="md">
        <EditableH3 id="h3-q3-answer" blockId="block-q3-answer">
          Answer
        </EditableH3>
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mt-3">
          <EditableParagraph id="para-q3-answer" blockId="block-q3-answer">
            Thompson Sampling balances exploration and exploitation through <strong>posterior sampling</strong>:
          </EditableParagraph>
          <ol className="list-decimal list-inside mt-3 space-y-3 text-base leading-relaxed">
            <li>
              <strong>Uncertainty-driven exploration:</strong> When posteriors overlap significantly
              (early in the experiment), the algorithm naturally explores both options because
              either could produce a higher sample.
            </li>
            <li>
              <strong>Evidence-driven exploitation:</strong> As data accumulates and one design
              clearly outperforms, its posterior concentrates at higher values, making it
              increasingly likely to be selected.
            </li>
            <li>
              <strong>Graceful transition:</strong> The shift from exploration to exploitation
              happens automatically without requiring hyperparameter tuning (unlike ε-greedy
              which needs a fixed ε value).
            </li>
            <li>
              <strong>Regret minimization:</strong> Over 1000 users, Thompson Sampling quickly
              identifies Design B as superior and allocates most users to it, minimizing
              "regret" (opportunities lost by not always choosing the best option).
            </li>
          </ol>
        </div>
      </Block>
    </div>
  );
};

export default Q3ExplorationSection;
