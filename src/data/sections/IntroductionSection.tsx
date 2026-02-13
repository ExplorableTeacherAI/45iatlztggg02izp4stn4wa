import { Block } from "@/components/templates";
import { EditableH1, EditableH2, EditableParagraph } from "@/components/atoms";

interface IntroductionSectionProps {
  isPreview?: boolean;
}

/**
 * Introduction Section - Multi-armed Bandit Lab
 *
 * This section introduces the A/B testing scenario using Thompson Sampling
 * with a Bernoulli likelihood and Beta prior.
 */
export const IntroductionSection = ({ isPreview }: IntroductionSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Main Title */}
      <Block id="block-intro-title" padding="lg" isPreview={isPreview}>
        <EditableH1 id="h1-lab-title" blockId="block-intro-title">
          Lab Week 4: Multi-armed Bandit
        </EditableH1>
      </Block>

      {/* Introduction Heading */}
      <Block id="block-intro-heading" padding="md" isPreview={isPreview}>
        <EditableH2 id="h2-introduction" blockId="block-intro-heading">
          Introduction
        </EditableH2>
      </Block>

      {/* Introduction Text */}
      <Block id="block-intro-text" padding="md" isPreview={isPreview}>
        <EditableParagraph id="para-intro-1" blockId="block-intro-text">
          You are tasked with conducting a sequential A/B test of two interface designs.
          Users perform a task using one of the interfaces, and we observe an outcome of
          either <strong>Success</strong> or <strong>Failure</strong>.
        </EditableParagraph>
        <EditableParagraph id="para-task" blockId="block-intro-text">
          Your task is to formulate this A/B test as a <strong>multi-armed bandit problem</strong> using
          a <strong>Thompson sampling</strong> approach with a <strong>Bernoulli likelihood</strong> and
          a <strong>Beta prior</strong>.
        </EditableParagraph>
      </Block>

      {/* Mathematical Model */}
      <Block id="block-model" padding="md" isPreview={isPreview}>
        <EditableH2 id="h2-model" blockId="block-model">
          

        </EditableH2>
        <EditableParagraph id="para-model-intro" blockId="block-model">
          For each interface design, we model the probability of a successful interaction
          \(p_i\) (e.g., a click or conversion) as follows:
        </EditableParagraph>
        <div className="my-6 p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-lg">
            \[p_i \sim \text{"{Beta}"}(1, 1)\]
          </div>
          <div className="text-lg mt-2">
            \[x_i \sim \text{"{Bernoulli}"}(p_i)\]
          </div>
        </div>
        <EditableParagraph id="para-model-explain" blockId="block-model">
          Here, \(\text{"{Beta}"}(1,1)\) is a <strong>uniform prior</strong> over \([0,1]\), meaning we start with
          no preference about the success probability. Each observation \(x_i\) is either 1 (Success)
          or 0 (Failure).
        </EditableParagraph>
      </Block>
    </div>
  );
};

export default IntroductionSection;
