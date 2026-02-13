import { type ReactElement } from "react";
import { FullWidthLayout } from "@/components/layouts";
import { IntroductionSection } from "./sections/IntroductionSection";
import { BetaBernoulliSection } from "./sections/BetaBernoulliSection";

// Initialize variables from this file's variable definitions
import { useVariableStore } from "@/stores";
import { getDefaultValues } from "./variables";
useVariableStore.getState().initialize(getDefaultValues());

/**
 * Multi-armed Bandit Lab - Interactive Explorable Explanation
 *
 * This lesson covers:
 * 1. Introduction to A/B testing with Thompson Sampling
 * 2. The Beta-Bernoulli Model
 * 3. Q1: Deriving Posterior Distributions
 * 4. Q2: Which Design to Select
 * 5. Q3: Exploration vs Exploitation
 */

export const blocks: ReactElement[] = [
    // Section 1: Introduction
    <FullWidthLayout key="layout-intro" maxWidth="xl">
        <IntroductionSection />
    </FullWidthLayout>,

    // Section 2: The Beta-Bernoulli Model
    <FullWidthLayout key="layout-beta" maxWidth="xl">
        <BetaBernoulliSection />
    </FullWidthLayout>,
];
