import { Block } from "@/components/templates";
import { EditableH2, EditableH3, EditableParagraph } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";
import { Badge } from "@/components/atoms/ui/badge";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Beta function approximation using the gamma function
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
 * Compact Beta Distribution Chart
 */
const BetaChart = ({ alpha, beta, color, height = 120 }: { alpha: number; beta: number; color: string; height?: number }) => {
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

    return pts.map(p => ({
      x: p.x,
      y: isFinite(p.y) ? p.y / (maxY || 1) : 0
    }));
  }, [alpha, beta]);

  const width = 200;
  const padding = { top: 10, right: 10, bottom: 25, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pathD = points.map((p, i) => {
    const x = padding.left + p.x * chartWidth;
    const y = padding.top + chartHeight - p.y * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = pathD + ` L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* X-axis labels */}
      {[0, 0.5, 1].map(tick => (
        <text
          key={tick}
          x={padding.left + tick * chartWidth}
          y={height - 5}
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
    </svg>
  );
};

/**
 * Observation sequence display with step-by-step updates
 */
const ObservationSequence = ({
  observations,
  designName,
  color,
  highlightStep
}: {
  observations: boolean[];
  designName: string;
  color: string;
  highlightStep: number;
}) => {
  // Calculate cumulative alpha and beta at each step
  const steps = useMemo(() => {
    const result: { alpha: number; beta: number; obs: boolean | null }[] = [
      { alpha: 1, beta: 1, obs: null } // Prior
    ];

    let alpha = 1;
    let beta = 1;

    for (const obs of observations) {
      if (obs) {
        alpha += 1;
      } else {
        beta += 1;
      }
      result.push({ alpha, beta, obs });
    }

    return result;
  }, [observations]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Observations:</span>
        {observations.map((obs, i) => (
          <Badge
            key={i}
            variant={obs ? "default" : "destructive"}
            className={`transition-all ${i < highlightStep ? 'opacity-100' : 'opacity-40'}`}
          >
            {obs ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> S</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> F</>
            )}
          </Badge>
        ))}
      </div>

      {/* Step-by-step update visualization */}
      <div className="flex items-center gap-1 py-2 px-1">
        {steps.slice(0, highlightStep + 1).map((step, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <div className={`text-center px-1.5 py-1 rounded min-w-[50px] ${i === highlightStep ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50'}`}>
              <div className="text-[9px] text-muted-foreground leading-tight whitespace-nowrap">
                {i === 0 ? 'Prior' : `Step ${i}`}
              </div>
              <div className="font-mono text-[10px] font-medium whitespace-nowrap" style={{ color }}>
                β({step.alpha},{step.beta})
              </div>
            </div>
            {i < Math.min(highlightStep, steps.length - 1) && (
              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Current distribution */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="text-center mb-2">
          <span className="font-medium" style={{ color }}>{designName}</span>
          <span className="text-muted-foreground"> — </span>
          <span className="font-mono">Beta({steps[highlightStep].alpha}, {steps[highlightStep].beta})</span>
        </div>
        <BetaChart
          alpha={steps[highlightStep].alpha}
          beta={steps[highlightStep].beta}
          color={color}
        />
      </div>
    </div>
  );
};

interface Q1PosteriorSectionProps {
  isPreview?: boolean;
}

/**
 * Section 3: Q1 - Deriving Posterior Distributions
 */
export const Q1PosteriorSection = ({ isPreview }: Q1PosteriorSectionProps) => {
  const [stepA, setStepA] = useState(0); // Start from step 0 (prior)
  const [stepB, setStepB] = useState(0);

  // Design A: [Success, Failure, Success, Success, Failure] => 3 successes, 2 failures
  const observationsA = [true, false, true, true, false];
  // Design B: [Success, Success, Success, Failure, Success] => 4 successes, 1 failure
  const observationsB = [true, true, true, false, true];

  // Final posteriors
  const posteriorA = { alpha: 1 + 3, beta: 1 + 2 }; // Beta(4, 3)
  const posteriorB = { alpha: 1 + 4, beta: 1 + 1 }; // Beta(5, 2)

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <Block id="block-q1-title" padding="lg" isPreview={isPreview}>
        <EditableH2 id="h2-q1-title" blockId="block-q1-title">
          Q1: Deriving the Posterior Distributions
        </EditableH2>
      </Block>

      {/* Question Statement */}
      <Block id="block-q1-question" padding="md" isPreview={isPreview}>
        <EditableParagraph id="para-q1-question" blockId="block-q1-question">
          Given the following observations, derive the posterior distributions of \(p_A\) and \(p_B\):
        </EditableParagraph>
        <div className="my-4 p-4 bg-muted/50 rounded-lg font-mono text-sm">
          <div><strong>Design A:</strong> [Success, Failure, Success, Success, Failure]</div>
          <div className="mt-2"><strong>Design B:</strong> [Success, Success, Success, Failure, Success]</div>
        </div>
      </Block>

      {/* Design A & B Analysis - Side by Side */}
      <Block id="block-q1-designs" padding="md" isPreview={isPreview}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Design A */}
          <div>
            <EditableH3 id="h3-design-a" blockId="block-q1-designs">
              Design A Analysis
            </EditableH3>
            <EditableParagraph id="para-design-a-count" blockId="block-q1-designs">
              Counting the observations: <strong>3 Successes</strong> and <strong>2 Failures</strong>
            </EditableParagraph>

            <div className="mt-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-muted-foreground">Step through observations:</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={stepA}
                  onChange={(e) => setStepA(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm font-mono">{stepA === 0 ? 'Prior' : `Step ${stepA}`}</span>
              </div>
              <ObservationSequence
                observations={observationsA}
                designName="Design A"
                color="#2563eb"
                highlightStep={stepA}
              />
            </div>
          </div>

          {/* Design B */}
          <div>
            <EditableH3 id="h3-design-b" blockId="block-q1-designs">
              Design B Analysis
            </EditableH3>
            <EditableParagraph id="para-design-b-count" blockId="block-q1-designs">
              Counting the observations: <strong>4 Successes</strong> and <strong>1 Failure</strong>
            </EditableParagraph>

            <div className="mt-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-muted-foreground">Step through observations:</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={stepB}
                  onChange={(e) => setStepB(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm font-mono">{stepB === 0 ? 'Prior' : `Step ${stepB}`}</span>
              </div>
              <ObservationSequence
                observations={observationsB}
                designName="Design B"
                color="#16a34a"
                highlightStep={stepB}
              />
            </div>
          </div>
        </div>
      </Block>

      {/* Final Answer */}
      <Block id="block-q1-answer" padding="md" isPreview={isPreview}>
        <EditableH3 id="h3-q1-answer" blockId="block-q1-answer">
          Answer
        </EditableH3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-700">Design A Posterior</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-blue-600 mb-2">
                  \(p_A \sim \text{"{Beta}"}(4, 3)\)
                </div>
                <div className="text-sm text-muted-foreground">
                  Prior: Beta(1,1) + 3 successes + 2 failures
                </div>
              </div>
              <div className="mt-4">
                <BetaChart alpha={posteriorA.alpha} beta={posteriorA.beta} color="#2563eb" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-700">Design B Posterior</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-green-600 mb-2">
                  \(p_B \sim \text{"{Beta}"}(5, 2)\)
                </div>
                <div className="text-sm text-muted-foreground">
                  Prior: Beta(1,1) + 4 successes + 1 failure
                </div>
              </div>
              <div className="mt-4">
                <BetaChart alpha={posteriorB.alpha} beta={posteriorB.beta} color="#16a34a" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Block>
    </div>
  );
};

export default Q1PosteriorSection;
