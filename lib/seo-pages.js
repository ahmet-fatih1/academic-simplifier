export const SITE_URL = "https://simplify-academic.vercel.app";
export const BRAND_NAME = "Simplify Academic";

export const HOME_SEO = {
  path: "",
  title: "Simplify Academic — Free AI Text Simplifier for Academic Papers",
  description:
    "Paste any text, paragraph, or academic paper and get a clear, simple version in seconds. Keeps technical terms intact. 5 free simplifications a day, no sign-up.",
};

export const SEO_PAGES = [
  {
    slug: "paragraph-simplifier",
    navLabel: "Paragraph Simplifier",
    title: "Paragraph Simplifier — Simplify Any Paragraph Free with AI",
    description:
      "Simplify a paragraph in seconds. Paste a hard-to-read paragraph and get a clear, plain-English version that keeps the original meaning. Free, no sign-up.",
    h1: "Paragraph Simplifier: make any paragraph easy to read",
    intro:
      "Paste a dense paragraph below and get a shorter, clearer version in plain English. Your meaning stays the same — only the difficult words and long sentences go away.",
    sections: [
      {
        heading: "How to simplify a paragraph",
        paragraphs: [
          "1. Paste your paragraph into the box above, or upload a PDF. 2. Pick who the text is for — a general reader, a student, a researcher, a business reader, or a 10-year-old. 3. Press Simplify and copy the result.",
          "Every result comes with a short bullet summary and a meaning check, so you can see whether anything important was lost.",
        ],
      },
      {
        heading: "Why use an AI paragraph simplifier?",
        paragraphs: [
          "Long paragraphs full of jargon slow readers down. A simplifier rewrites them at a B1 English level: short sentences, common words, and the same facts.",
          "Unlike a general paraphrasing tool, this simplifier lets you protect technical terms. Add words like “p-value” or “CRISPR” to the protected list and they will stay exactly as written.",
        ],
      },
    ],
    example: {
      before:
        "Notwithstanding the considerable heterogeneity observed across the sampled cohorts, the aggregated findings suggest a statistically robust association between sleep duration and cognitive performance.",
      after:
        "The groups we studied were quite different from each other. Even so, the combined results show a clear link between how long people sleep and how well they think.",
    },
    faq: [
      {
        q: "Is the paragraph simplifier free?",
        a: "Yes. You can simplify 5 paragraphs a day for free without creating an account. Pro removes the daily limit.",
      },
      {
        q: "Will simplifying change the meaning of my paragraph?",
        a: "The tool is instructed to keep the original meaning, and each result includes an automatic meaning check that flags higher-risk rewrites so you can re-run them with the quality model.",
      },
      {
        q: "Can I simplify more than one paragraph at once?",
        a: "Yes. You can paste several paragraphs or upload a PDF, and the whole text is simplified together.",
      },
    ],
  },
  {
    slug: "simplify-research-paper",
    navLabel: "Research Paper Simplifier",
    title: "Simplify a Research Paper with AI — Free Paper Simplifier",
    description:
      "Upload a research paper PDF or paste a section and get a plain-English explanation in seconds. Keeps key scientific terms. Free to try, no sign-up.",
    h1: "Simplify research papers into plain English",
    intro:
      "Upload a research paper PDF or paste any section — abstract, methods, results, or discussion — and get a clear explanation you can actually follow.",
    sections: [
      {
        heading: "Read research papers faster",
        paragraphs: [
          "Research papers are written for specialists. Dense terminology, passive voice, and long sentences make them hard to read, even inside your own field.",
          "Simplify Academic rewrites each section in clear English while keeping the findings, numbers, and key terms intact. Choose the Student persona for study notes or the Researcher persona to keep more technical detail.",
        ],
      },
      {
        heading: "Built for academic text",
        paragraphs: [
          "PDF upload: drop in a paper and the text is extracted in your browser before it is simplified.",
          "Protected terms: list the terms that must not change, such as gene names, methods, or acronyms.",
          "Follow-up chat: ask questions about the simplified text, like “what does this result mean?” or “what are the limitations?”.",
        ],
      },
    ],
    example: {
      before:
        "Our results indicate that the intervention elicited a statistically significant attenuation of systolic blood pressure (p < 0.01) relative to the placebo arm, although the effect size was modest.",
      after:
        "The treatment lowered the top blood pressure number more than the placebo did. This difference was unlikely to be due to chance (p < 0.01), but the effect was small.",
    },
    faq: [
      {
        q: "Can I upload a whole research paper as a PDF?",
        a: "Yes. Upload the PDF and the text is extracted automatically. For very long papers, simplifying one section at a time gives the clearest results.",
      },
      {
        q: "Is my paper stored on your servers?",
        a: "No. Your text is sent to the AI model to generate the simplified version and is not stored after the response is returned.",
      },
      {
        q: "Does it keep scientific terms correct?",
        a: "Key terms are kept, and you can add your own list of protected terms that will never be changed.",
      },
    ],
  },
  {
    slug: "abstract-simplifier",
    navLabel: "Abstract Simplifier",
    title: "Abstract Simplifier — Explain a Paper Abstract in Simple Terms",
    description:
      "Paste a scientific abstract and get a simple explanation of what the study did and found. Free AI abstract simplifier for students and researchers.",
    h1: "Explain any paper abstract in simple terms",
    intro:
      "An abstract is the fastest way to decide if a paper matters to you — when you can understand it. Paste one below and get a plain-English version in seconds.",
    sections: [
      {
        heading: "What you get",
        paragraphs: [
          "A simplified version of the abstract, a short bullet summary of the main points, and a meaning check that compares the simplified text with the original.",
          "Use it to screen papers for a literature review, prepare for a journal club, or understand studies outside your field.",
        ],
      },
      {
        heading: "Tips for better results",
        paragraphs: [
          "Paste the full abstract, including the background and conclusion sentences, so the model has enough context.",
          "If the abstract uses field-specific terms you want to keep, add them to Protected terms under Advanced settings.",
        ],
      },
    ],
    example: {
      before:
        "We present a novel transformer-based architecture that leverages sparse attention mechanisms to achieve state-of-the-art performance on long-document summarization benchmarks while reducing computational overhead by 40%.",
      after:
        "We built a new AI model that reads long documents more efficiently. It summarizes them better than earlier models and needs 40% less computing power.",
    },
    faq: [
      {
        q: "Who is the abstract simplifier for?",
        a: "Students, researchers reading outside their field, journalists, and anyone who wants to understand what a study found without reading the full paper.",
      },
      {
        q: "Can I choose how simple the result is?",
        a: "Yes. Pick a persona — from Researcher (more technical) to 10-Year-Old Kid (simplest). Pro users can also set how much shorter the result should be.",
      },
    ],
  },
  {
    slug: "sentence-simplifier",
    navLabel: "Sentence Simplifier",
    title: "Sentence Simplifier — Simplify Sentences Online Free",
    description:
      "Turn long, complex sentences into short, clear ones. Free AI sentence simplifier that keeps your meaning and technical terms. No sign-up needed.",
    h1: "Sentence Simplifier: rewrite complex sentences clearly",
    intro:
      "Paste a long or confusing sentence and get a short, clear version. Great for essays, reports, emails, and academic writing.",
    sections: [
      {
        heading: "Simplify sentences without losing meaning",
        paragraphs: [
          "Complex sentences often stack several ideas together. The simplifier splits them into shorter sentences, replaces rare words with common ones, and keeps every fact.",
          "Because each result includes a meaning check, you can quickly see whether the simplified sentence still says the same thing.",
        ],
      },
      {
        heading: "When to use a sentence simplifier",
        paragraphs: [
          "Making your own writing easier to read, explaining a difficult sentence from a textbook, or preparing text for non-native English readers.",
        ],
      },
    ],
    example: {
      before:
        "In light of the aforementioned considerations, it is imperative that stakeholders endeavor to ascertain the feasibility of the proposed initiative prior to its implementation.",
      after: "Because of these points, everyone involved should check if the plan can work before starting it.",
    },
    faq: [
      {
        q: "Is the sentence simplifier free?",
        a: "Yes, 5 simplifications per day are free with no account. Pro gives unlimited use.",
      },
      {
        q: "Does it work for non-academic text?",
        a: "Yes. It works for any English text, although it is tuned to handle academic and technical writing especially well.",
      },
    ],
  },
];

export function findSeoPage(slug) {
  return SEO_PAGES.find((page) => page.slug === slug);
}
