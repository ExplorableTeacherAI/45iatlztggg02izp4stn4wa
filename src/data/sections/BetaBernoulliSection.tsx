import { Block } from "@/components/templates";
import { EditableH3, EditableParagraph } from "@/components/atoms";
import { InlineScrubbleNumber } from "@/components/atoms/InlineScrubbleNumber";
import { useVar } from "@/stores";
import { useMemo } from "react";

/**
 * Beta function approximation using the gamma function (Stirling's approximation for larger values)
 */
function logGamma(x: number): number {
  if (x <= 0) return 0;
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  const g = 7;
  const coefficients = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
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
 * BetaDistributionChart - SVG visualization of Beta distribution
 */
const BetaDistributionChart = ({ alpha, beta, color = "#2563eb", label = "" }: { alpha: number; beta: number; color?: string; label?: string }) => {
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const numPoints = 200;
    let maxY = 0;

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      // Avoid exact 0 and 1
      const safeX = Math.max(0.001, Math.min(0.999, x));
      const y = betaPDF(safeX, alpha, beta);
      pts.push({ x, y });
      if (y > maxY && isFinite(y)) maxY = y;
    }

    // Normalize to fit in chart
    const normalizedPts = pts.map(p => ({
      x: p.x,
      y: isFinite(p.y) ? p.y / (maxY || 1) : 0
    }));

    return { points: normalizedPts, maxY };
  }, [alpha, beta]);

  const width = 550;
  const height = 350;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Create path
  const pathD = points.points.map((p, i) => {
    const x = padding.left + p.x * chartWidth;
    const y = padding.top + chartHeight - p.y * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create filled area path
  const areaD = pathD + ` L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(tick => (
        <g key={tick}>
          <line
            x1={padding.left + tick * chartWidth}
            y1={padding.top}
            x2={padding.left + tick * chartWidth}
            y2={padding.top + chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text
            x={padding.left + tick * chartWidth}
            y={padding.top + chartHeight + 20}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {tick}
          </text>
        </g>
      ))}

      {/* Y-axis */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#9ca3af"
        strokeWidth="1"
      />

      {/* X-axis */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#9ca3af"
        strokeWidth="1"
      />

      {/* Filled area */}
      <path
        d={areaD}
        fill={color}
        fillOpacity="0.2"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />

      {/* Labels */}
      <text
        x={padding.left + chartWidth / 2}
        y={height - 5}
        textAnchor="middle"
        className="text-sm fill-foreground"
      >
        p (probability)
      </text>

      <text
        x={15}
        y={padding.top + chartHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
        className="text-sm fill-foreground"
      >
        density
      </text>

      {label && (
        <text
          x={padding.left + chartWidth - 10}
          y={padding.top + 15}
          textAnchor="end"
          className="text-sm font-medium"
          fill={color}
        >
          {label}
        </text>
      )}
    </svg>
  );
};

interface BetaBernoulliSectionProps {
  isPreview?: boolean;
}

/**
 * Section 2: The Beta-Bernoulli Model
 *
 * This section explains how the Beta distribution works as a prior
 * and how Bayesian updating works with Bernoulli observations.
 */
export const BetaBernoulliSection = ({ isPreview }: BetaBernoulliSectionProps) => {
  const alphaDemo = useVar("betaAlphaDemo", 1);
  const betaDemo = useVar("betaBetaDemo", 1);

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <Block id="block-beta-title" padding="lg" isPreview={isPreview}>
        <EditableH3 id="h3-beta-model" blockId="block-beta-title">
          The Beta-Bernoulli Model
        </EditableH3>
      </Block>

      {/* Why Beta Distribution */}
      <Block id="block-beta-why" padding="md" isPreview={isPreview}>
        <EditableParagraph id="para-beta-why-1" blockId="block-beta-why">
          The <strong>Beta distribution</strong> is the perfect choice for modeling probabilities because:
        </EditableParagraph>
        <ul className="list-disc list-inside mt-3 space-y-2 text-base leading-relaxed">
          <li>It's defined on the interval \([0, 1]\) — exactly what we need for probabilities</li>
          <li>It's <strong>conjugate</strong> to the Bernoulli likelihood, meaning the posterior is also a Beta distribution</li>
          <li>Its shape is controlled by two parameters: \(\alpha\) (successes) and \(\beta\) (failures)</li>
        </ul>
      </Block>

      {/* Interactive Beta Distribution - Split Layout */}
      <Block id="block-beta-interactive" padding="md" isPreview={isPreview}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Text and controls */}
          <div className="space-y-4">
            <EditableParagraph id="para-beta-interactive" blockId="block-beta-interactive">
              Try adjusting the parameters to see how the Beta distribution changes shape.
            </EditableParagraph>
            <EditableParagraph id="para-beta-interactive-2" blockId="block-beta-interactive">
              Set \(\alpha\) to{" "}
              <InlineScrubbleNumber
                varName="betaAlphaDemo"
                defaultValue={1}
                min={0.1}
                max={20}
                step={0.5}
                color="#2563eb"
                formatValue={(v) => v.toFixed(1)}
              />{" "}
              and \(\beta\) to{" "}
              <InlineScrubbleNumber
                varName="betaBetaDemo"
                defaultValue={1}
                min={0.1}
                max={20}
                step={0.5}
                color="#dc2626"
                formatValue={(v) => v.toFixed(1)}
              />
              .
            </EditableParagraph>
            <EditableParagraph id="para-beta-interactive-hint" blockId="block-beta-interactive" size="sm">
              <em>Drag the numbers left or right to change their values and watch the distribution update in real-time.</em>
            </EditableParagraph>
          </div>

          {/* Right side - Visualization */}
          <div className="bg-muted/30 p-6 rounded-lg">
            <BetaDistributionChart
              alpha={alphaDemo}
              beta={betaDemo}
              color="#2563eb"
              label={`Beta(${alphaDemo.toFixed(1)}, ${betaDemo.toFixed(1)})`}
            />
          </div>
        </div>
      </Block>

      {/* Key Insights */}
      <Block id="block-beta-insights" padding="md" isPreview={isPreview}>
        <EditableParagraph id="para-beta-insights-title" blockId="block-beta-insights" size="lg">
          <strong>Key Observations:</strong>
        </EditableParagraph>
        <ul className="list-disc list-inside mt-3 space-y-2 text-base leading-relaxed">
          <li>When \(\alpha = \beta = 1\), the distribution is <strong>uniform</strong> (flat) — we have no prior preference</li>
          <li>When \(\alpha {">"} \beta\), the distribution shifts towards higher probabilities (more likely to succeed)</li>
          <li>When \(\alpha {"<"} \beta\), the distribution shifts towards lower probabilities (more likely to fail)</li>
          <li>Larger values of \(\alpha + \beta\) make the distribution more <strong>concentrated</strong> (more confident)</li>
        </ul>
      </Block>

      {/* Bayesian Update Rule */}
      <Block id="block-beta-update" padding="md" isPreview={isPreview}>
        <EditableH2 id="h2-update-rule" blockId="block-beta-update">
          The Bayesian Update Rule
        </EditableH2>
        <EditableParagraph id="para-update-intro" blockId="block-beta-update">
          The beauty of the Beta-Bernoulli model is that updating is simple. After observing data, the posterior is:
        </EditableParagraph>
        <div className="my-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
          <div className="text-lg">
            \[\text{"{Posterior}"} = \text{"{Beta}"}(\alpha + \text{"{successes}"}, \beta + \text{"{failures}"})\]
          </div>
        </div>
        <EditableParagraph id="para-update-explain" blockId="block-beta-update">
          Starting with a prior of \(\text{"{Beta}"}(1, 1)\), we simply <strong>add the number of successes to \(\alpha\)</strong> and
          <strong> add the number of failures to \(\beta\)</strong>. That's it!
        </EditableParagraph>
      </Block>
    </div>
  );
};

export default BetaBernoulliSection;
