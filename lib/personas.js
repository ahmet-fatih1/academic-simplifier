const personas = [
  {
    id: "general",
    name: "General Reader",
    label: { tr: "Genel Okuyucu", en: "General Reader" },
    description: {
      tr: "Merakla okuyan, günlük dil arayan okuyucu.",
      en: "A curious reader looking for everyday language.",
    },
    systemPrompt: `Rewrite this academic text in clear, everyday English.
Use short sentences. Explain jargon simply. Keep the original meaning intact.
Write like you are explaining to a curious friend who wants to understand the topic.`,
  },
  {
    id: "student",
    name: "Student",
    label: { tr: "Öğrenci", en: "Student" },
    description: {
      tr: "Derslerine yardım için okuyan, öğrenmeye odaklı öğrenci.",
      en: "A student reading to understand, focused on learning.",
    },
    systemPrompt: `Rewrite this academic text so a university student can easily understand it.
Use simple words and short sentences. Explain technical terms when they appear.
Keep the meaning accurate. Write like a helpful tutor explaining a concept.`,
  },
  {
    id: "researcher",
    name: "Researcher",
    label: { tr: "Araştırmacı", en: "Researcher" },
    description: {
      tr: "Detay ve rigor arayan, teknik hassasiyeti yüksek araştırmacı.",
      en: "A researcher seeking detail, rigor, and technical precision.",
    },
    systemPrompt: `Rewrite this academic text for a fellow researcher.
Preserve all technical terms and nuances. Keep the structure clear.
Use precise language. Remove unnecessary complexity but keep the depth.
Write like a well-organized literature review section.`,
  },
  {
    id: "business",
    name: "Business Professional",
    label: { tr: "İş Profesyoneli", en: "Business Professional" },
    description: {
      tr: "Pratik bilgi arayan, sonuç odaklı profesyonel.",
      en: "A professional seeking practical, actionable insights.",
    },
    systemPrompt: `Rewrite this academic text for a busy professional.
Focus on key findings, implications, and actionable insights.
Use direct, concise language. Cut the filler. Highlight what matters for decision-making.
Write like an executive summary.`,
  },
  {
    id: "kid",
    name: "10-Year-Old Kid",
    label: { tr: "10 Yaşındaki Çocuk", en: "10-Year-Old Kid" },
    description: {
      tr: "Her şeyi çok basit açıklar, meraklı, sorular sorar.",
      en: "Explains everything simply, curious, asks questions.",
    },
    systemPrompt: `Rewrite this academic text so a 10-year-old child can understand it.
Use very simple words. Compare things to everyday life. Ask fun questions.
Make it sound like a curious kid explaining what they just learned to a friend.
No big words. Short sentences. Keep the meaning correct.`,
  },
];

export default personas;

export function getPersonaById(id) {
  return personas.find((p) => p.id === id) || personas[0];
}
