import { Block } from "@/components/templates";
import { EditableH2, EditableH3, EditableParagraph } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";
import { Button } from "@/components/atoms/ui/button";
import { Badge } from "@/components/atoms/ui/badge";
import { Play, RotateCcw, Trophy } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

/**
 * Beta function for sampling
 */
function logGamma(x: number): number {
  if (x <= 0) return 0;
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  const g = 7;
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let sum = coefficients[0];
  for (let i = 1; i < g + 2; i++) {
    sum += coefficients[i] / (x + i);
  }
  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}

function betaPDF(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0;
  if (alpha <= 0 || beta <= 0) return 0;
  const logBeta = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  const logPDF = (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta;
  return Math.exp(logPDF);
}

/**
 * Sample from Beta distribution using inverse transform sampling approximation
 */
function sampleBeta(alpha: number, beta: number): number {
  // Using the gamma distribution method
  const gammaA = gammaVariate(alpha);
  const gammaB = gammaVariate(beta);
  return gammaA / (gammaA + gammaB);
}

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

/**
 * Compact Beta Distribution Chart with sample point
 */
const BetaChartWithSample = ({
  alpha,
  beta,
  color,
  sampleValue,
  height = 140
}: {
  alpha: number;
  beta: number;
  color: string;
  sampleValue?: number;
  height?: number;
}) => {
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const numPoints = 100;
    let maxY = 0;

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      const safeX = Math.max(0.001, Math.min(0.999, x));
      const y = betaPDF(safeX, alpha, beta);
      pts.push({ x, y });
      if (y > maxY && isFinite(y)) maxY = y;
    }

    return {
      points: pts.map(p => ({
        x: p.x,
        y: isFinite(p.y) ? p.y / (maxY || 1) : 0
      })),
      maxY
    };
  }, [alpha, beta]);

  const width = 250;
  const padding = { top: 15, right: 15, bottom: 30, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pathD = points.points.map((p, i) => {
    const x = padding.left + p.x * chartWidth;
    const y = padding.top + chartHeight - p.y * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = pathD + ` L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  // Calculate sample point position
  const sampleX = sampleValue !== undefined ? padding.left + sampleValue * chartWidth : null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* X-axis labels */}
      {[0, 0.5, 1].map(tick => (
        <text
          key={tick}
          x={padding.left + tick * chartWidth}
          y={height - 8}
          textAnchor="middle"
          className="text-[10px] fill-muted-foreground"
        >
          {tick}
        </text>
      ))}

      {/* Filled area */}
      <path d={areaD} fill={color} fillOpacity="0.2" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />

      {/* Sample point */}
      {sampleX !== null && sampleValue !== undefined && (
        <>
          <line
            x1={sampleX}
            y1={padding.top}
            x2={sampleX}
            y2={padding.top + chartHeight}
            stroke={color}
            strokeWidth="2"
            strokeDasharray="4,2"
          />
          <circle
            cx={sampleX}
            cy={padding.top + chartHeight}
            r="6"
            fill={color}
          />
          <text
            x={sampleX}
            y={padding.top - 3}
            textAnchor="middle"
            className="text-xs font-bold"
            fill={color}
          >
            {sampleValue.toFixed(3)}
          </text>
        </>
      )}
    </svg>
  );
};

interface Q2SelectionSectionProps {
  isPreview?: boolean;
}

/**
 * Section 4: Q2 - Which Design to Select
 */
export const Q2SelectionSection = ({ isPreview }: Q2SelectionSectionProps) => {
  const [samples, setSamples] = useState<{ a: number; b: number; winner: 'A' | 'B' }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Posterior parameters from Q1
  const posteriorA = { alpha: 4, beta: 3 };
  const posteriorB = { alpha: 5, beta: 2 };

  // Run single Thompson Sampling step
  const runSingleSample = useCallback(() => {
    const sampleA = sampleBeta(posteriorA.alpha, posteriorA.beta);
    const sampleB = sampleBeta(posteriorB.alpha, posteriorB.beta);
    const winner = sampleB > sampleA ? 'B' : 'A';

    setSamples(prev => [...prev, { a: sampleA, b: sampleB, winner }]);
  }, []);

  // Run multiple samples
  const runMultipleSamples = useCallback(async (count: number) => {
    setIsRunning(true);
    for (let i = 0; i < count; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      runSingleSample();
    }
    setIsRunning(false);
  }, [runSingleSample]);

  // Reset samples
  const resetSamples = () => {
    setSamples([]);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const winsA = samples.filter(s => s.winner === 'A').length;
    const winsB = samples.filter(s => s.winner === 'B').length;
    const total = samples.length;
    return {
      winsA,
      winsB,
      percentA: total > 0 ? ((winsA / total) * 100).toFixed(1) : '0',
      percentB: total > 0 ? ((winsB / total) * 100).toFixed(1) : '0',
    };
  }, [samples]);

  // Get last sample for display
  const lastSample = samples.length > 0 ? samples[samples.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <Block id="block-q2-title" padding="lg" isPreview={isPreview}>
        <EditableH2 id="h2-q2-title" blockId="block-q2-title">
          Q2: Which Design Would Be Selected?
        </EditableH2>
      </Block>

      {/* Question Statement */}
      <Block id="block-q2-question" padding="md" isPreview={isPreview}>
        <EditableParagraph id="para-q2-question" blockId="block-q2-question">
          Based on the posterior distributions you derived, which design would the agent more likely
          select for the next user? Explain your reasoning.
        </EditableParagraph>
      </Block>

      {/* Thompson Sampling Explanation */}
      <Block id="block-q2-thompson" padding="md" isPreview={isPreview}>
        <EditableH3 id="h3-thompson" blockId="block-q2-thompson">
          How Thompson Sampling Works
        </EditableH3>
        <EditableParagraph id="para-thompson-1" blockId="block-q2-thompson">
          Thompson Sampling selects an action by:
        </EditableParagraph>
        <ol className="list-decimal list-inside mt-3 space-y-2 text-base leading-relaxed">
          <li><strong>Sample</strong> a value \(\theta_A\) from the posterior \(\text{"{Beta}"}(4, 3)\)</li>
          <li><strong>Sample</strong> a value \(\theta_B\) from the posterior \(\text{"{Beta}"}(5, 2)\)</li>
          <li><strong>Select</strong> the design with the higher sampled value</li>
        </ol>
      </Block>

      {/* Interactive Simulation */}
      <Block id="block-q2-simulation" padding="md" isPreview={isPreview}>
        <EditableH3 id="h3-simulation" blockId="block-q2-simulation">
          Interactive Simulation
        </EditableH3>
        <EditableParagraph id="para-simulation-intro" blockId="block-q2-simulation">
          Click the button to sample from both posteriors and see which design wins each round:
        </EditableParagraph>

        {/* Controls */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <Button
            onClick={runSingleSample}
            disabled={isRunning}
            className="gap-2"
          >
            <Play className="h-4 w-4" /> Sample Once
          </Button>
          <Button
            onClick={() => runMultipleSamples(10)}
            disabled={isRunning}
            variant="outline"
            className="gap-2"
          >
            Sample 10x
          </Button>
          <Button
            onClick={() => runMultipleSamples(100)}
            disabled={isRunning}
            variant="outline"
            className="gap-2"
          >
            Sample 100x
          </Button>
          <Button
            onClick={resetSamples}
            variant="ghost"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>

        {/* Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className={`border-2 transition-all ${lastSample?.winner === 'A' ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300' : 'border-blue-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                Design A
                {lastSample?.winner === 'A' && <Trophy className="h-5 w-5 text-yellow-500" />}
              </CardTitle>
              <div className="text-sm text-muted-foreground font-mono">Beta(4, 3)</div>
            </CardHeader>
            <CardContent>
              <BetaChartWithSample
                alpha={posteriorA.alpha}
                beta={posteriorA.beta}
                color="#2563eb"
                sampleValue={lastSample?.a}
              />
              {lastSample && (
                <div className="text-center mt-2">
                  <Badge variant="outline" className="font-mono">
                    θ_A = {lastSample.a.toFixed(3)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`border-2 transition-all ${lastSample?.winner === 'B' ? 'border-green-500 bg-green-50/50 ring-2 ring-green-300' : 'border-green-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                Design B
                {lastSample?.winner === 'B' && <Trophy className="h-5 w-5 text-yellow-500" />}
              </CardTitle>
              <div className="text-sm text-muted-foreground font-mono">Beta(5, 2)</div>
            </CardHeader>
            <CardContent>
              <BetaChartWithSample
                alpha={posteriorB.alpha}
                beta={posteriorB.beta}
                color="#16a34a"
                sampleValue={lastSample?.b}
              />
              {lastSample && (
                <div className="text-center mt-2">
                  <Badge variant="outline" className="font-mono">
                    θ_B = {lastSample.b.toFixed(3)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        {samples.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-center mb-3">
              <span className="font-medium">Results after {samples.length} samples:</span>
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.winsA}</div>
                <div className="text-sm text-muted-foreground">Design A wins ({stats.percentA}%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.winsB}</div>
                <div className="text-sm text-muted-foreground">Design B wins ({stats.percentB}%)</div>
              </div>
            </div>
          </div>
        )}
      </Block>

      {/* Answer */}
      <Block id="block-q2-answer" padding="md" isPreview={isPreview}>
        <EditableH3 id="h3-q2-answer" blockId="block-q2-answer">
          Answer
        </EditableH3>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-3">
          <EditableParagraph id="para-q2-answer" blockId="block-q2-answer">
            <strong>Design B is more likely to be selected.</strong> Here's why:
          </EditableParagraph>
          <ul className="list-disc list-inside mt-3 space-y-2 text-base leading-relaxed">
            <li>Design B's posterior \(\text{"{Beta}"}(5, 2)\) has a higher expected value: \(\frac{"{5}"}{"{5+2}"} = 0.714\) vs Design A's \(\frac{"{4}"}{"{4+3}"} = 0.571\)</li>
            <li>Design B's distribution is shifted more towards higher probabilities</li>
            <li>When we sample from both posteriors, Design B's samples will tend to be higher more often</li>
            <li>The simulation above demonstrates this — Design B typically wins around 70-75% of the time</li>
          </ul>
        </div>
      </Block>
    </div>
  );
};

export default Q2SelectionSection;
