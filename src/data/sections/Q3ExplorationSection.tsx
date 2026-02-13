import { Block } from "@/components/templates";
import { EditableH2, EditableH3, EditableParagraph } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

interface Q3ExplorationSectionProps {
  isPreview?: boolean;
}

/**
 * Section 5: Q3 - Exploration vs Exploitation
 */
export const Q3ExplorationSection = ({ isPreview }: Q3ExplorationSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Section Title */}
      <Block id="block-q3-title" padding="lg" isPreview={isPreview}>
        <EditableH2 id="h2-q3-title" blockId="block-q3-title">
          Q3: Exploration vs Exploitation
        </EditableH2>
      </Block>

      {/* Question Statement */}
      <Block id="block-q3-question" padding="md" isPreview={isPreview}>
        <EditableParagraph id="para-q3-question" blockId="block-q3-question">
          Suppose you need to conduct this A/B test with 1000 users in a sequential manner.
          Explain how Thompson sampling (or bandit algorithms in general) helps balance
          exploration and exploitation in this context.
        </EditableParagraph>
      </Block>

      {/* Explanation */}
      <Block id="block-q3-explain" padding="md" isPreview={isPreview}>
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
      <Block id="block-q3-thompson" padding="md" isPreview={isPreview}>
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

      {/* Answer */}
      <Block id="block-q3-answer" padding="md" isPreview={isPreview}>
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
