/**
 * Stable per-section and per-concept icon + color assignments.
 *
 * Each of the 16 curriculum sections gets a hand-curated icon and a
 * pastel color pair (defined as CSS vars in globals.css under
 * [data-theme="light"]). Colors lean warm in Fundamentals, cool in
 * Intermediate, neutral in Advanced — so tier identity reads even
 * when many tiles are visible at once.
 *
 * Each of the 57 concepts gets its own icon; it inherits its parent
 * section's color so tier/section grouping stays readable.
 */

import type { IconName } from "@/components/ui/icon";

export type SectionVisual = {
  icon: IconName;
  /** CSS-var name suffix — e.g. "amber" → uses --tile-amber-bg/--tile-amber-fg */
  color: string;
};

export const SECTION_VISUALS: Record<string, SectionVisual> = {
  // ── Fundamentals (warm spectrum) ────────────────────────────────
  "core-architecture":      { icon: "cpu",        color: "amber"  },
  "training-process":       { icon: "trending-up",color: "sage"   },
  "model-types":            { icon: "layers",     color: "lilac"  },
  "key-concepts":           { icon: "book-open",  color: "rose"   },
  "capabilities":           { icon: "sparkles",   color: "gold"   },
  "industry-basics":        { icon: "briefcase",  color: "sky"    },
  "practical-skills":       { icon: "wrench",     color: "coral"  },

  // ── Intermediate (cool spectrum) ────────────────────────────────
  "hardware-compute":       { icon: "server",     color: "blue"   },
  "scaling-data":           { icon: "database",   color: "cyan"   },
  "evaluation-alignment":   { icon: "target",     color: "mint"   },
  "geopolitics-regulation": { icon: "globe",      color: "red"    },
  "ethics-responsibility":  { icon: "shield",     color: "indigo" },
  "practical-decision-making": { icon: "git-branch", color: "honey" },

  // ── Advanced (neutral spectrum) ─────────────────────────────────
  "modern-non-llm-ai":          { icon: "box",      color: "stone" },
  "advanced-training-mechanics":{ icon: "atom",     color: "steel" },
  "research-meta-skills":       { icon: "compass",  color: "mauve" },
};

export const CONCEPT_VISUALS: Record<string, IconName> = {
  // ── Core Architecture ───────────────────────────────────────────
  "transformers":             "tree-structure",
  "attention-mechanisms":     "eye",
  "tokens":                   "text-aa",
  "embeddings":               "graph",

  // ── Training Process ────────────────────────────────────────────
  "pre-training":             "books",
  "rlhf":                     "thumbs-up",
  "rlvr":                     "check-circle",

  // ── Model Types ─────────────────────────────────────────────────
  "base-models":              "cube",
  "instruction-tuned-models": "chat-circle-text",
  "reasoning-models":         "brain",

  // ── Key Concepts ────────────────────────────────────────────────
  "system-prompts":           "scroll",
  "context-windows":          "frame-corners",
  "parameters":               "sliders",
  "training-vs-inference":    "arrows-left-right",
  "hallucinations":           "ghost",
  "jailbreaking":             "lock-open",

  // ── Capabilities ────────────────────────────────────────────────
  "tool-use":                 "wrench",
  "agentic-capabilities":     "robot",
  "multimodality":            "images-square",

  // ── Industry Basics ─────────────────────────────────────────────
  "major-ai-players":         "buildings",
  "open-source-vs-open-weights": "git-fork",
  "wrapper":                  "box",

  // ── Practical Skills ────────────────────────────────────────────
  "prompt-engineering":       "pen-nib",
  "api-basics":               "code",
  "rag":                      "magnifying-glass-plus",

  // ── Hardware & Compute ──────────────────────────────────────────
  "gpus":                     "graphics-card",
  "tpus":                     "circuitry",
  "accelerators":             "lightning",
  "training-costs":           "currency-dollar",
  "training-vs-inference-compute": "arrows-clockwise",

  // ── Scaling & Data ──────────────────────────────────────────────
  "scaling-laws":             "chart-line-up",
  "synthetic-data":           "flask",
  "fine-tuning":              "gear",

  // ── Evaluation & Alignment ──────────────────────────────────────
  "benchmarking-llms":        "medal",
  "ai-alignment":             "scales",
  "agi":                      "infinity",

  // ── Geopolitics & Regulation ────────────────────────────────────
  "us-china-ai-race":         "flag",
  "export-controls":          "lock",
  "ai-regulation":            "gavel",

  // ── Ethics & Responsibility ─────────────────────────────────────
  "bias-training-data":       "warning",
  "copyright-ip":             "copyright",
  "privacy-implications":     "eye-slash",

  // ── Practical Decision-Making ───────────────────────────────────
  "evaluating-llm-solutions": "list-checks",
  "cost-deployment-tradeoffs":"scales",
  "model-selection":          "caret-circle-down",

  // ── Modern Non-LLM AI ───────────────────────────────────────────
  "image-video-generation":   "image",
  "world-models":             "planet",
  "autonomous-driving":       "car",
  "alphafold-biomedical-ai":  "dna",
  "robotics-embodied-ai":     "robot",

  // ── Advanced Training Mechanics ─────────────────────────────────
  "emergent-abilities":       "sparkle",
  "in-context-learning":      "chat-circle-dots",
  "continual-learning":       "arrows-clockwise",
  "fine-tuning-specifics":    "sliders-horizontal",

  // ── Research & Meta-Skills ──────────────────────────────────────
  "reading-research-papers":  "file-text",
  "filtering-ai-hype":        "funnel",
  "interpretability":         "magnifying-glass",
};

const FALLBACK: SectionVisual = { icon: "book-open", color: "stone" };

export function getSectionVisual(slug: string): SectionVisual {
  return SECTION_VISUALS[slug] ?? FALLBACK;
}

export function getConceptVisual(conceptSlug: string, sectionSlug: string): SectionVisual {
  const section = getSectionVisual(sectionSlug);
  const icon = CONCEPT_VISUALS[conceptSlug];
  return icon ? { icon, color: section.color } : section;
}
