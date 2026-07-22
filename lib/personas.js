const personas = [
  {
    id: "general",
    name: "General Reader",
    label: "Genel Okuyucu",
    description: "Merakla okuyan, günlük dil arayan okuyucu.",
    systemPrompt: `Rewrite this academic text in clear, everyday English.
Use short sentences. Explain jargon simply. Keep the original meaning intact.
Write like you are explaining to a curious friend who wants to understand the topic.`,
  },
  {
    id: "student",
    name: "Student",
    label: "Öğrenci",
    description: "Derslerine yardım için okuyan, öğrenmeye odaklı öğrenci.",
    systemPrompt: `Rewrite this academic text so a university student can easily understand it.
Use simple words and short sentences. Explain technical terms when they appear.
Keep the meaning accurate. Write like a helpful tutor explaining a concept.`,
  },
  {
    id: "researcher",
    name: "Researcher",
    label: "Araştırmacı",
    description: "Detay ve rigor arayan, teknik hassasiyeti yüksek araştırmacı.",
    systemPrompt: `Rewrite this academic text for a fellow researcher.
Preserve all technical terms and nuances. Keep the structure clear.
Use precise language. Remove unnecessary complexity but keep the depth.
Write like a well-organized literature review section.`,
  },
  {
    id: "business",
    name: "Business Professional",
    label: "İş Profesyoneli",
    description: "Pratik bilgi arayan, sonuç odaklı profesyonel.",
    systemPrompt: `Rewrite this academic text for a busy professional.
Focus on key findings, implications, and actionable insights.
Use direct, concise language. Cut the filler. Highlight what matters for decision-making.
Write like an executive summary.`,
  },
  {
    id: "kid",
    name: "10-Year-Old Kid",
    label: "10 Yaşındaki Çocuk",
    description: "Her şeyi çok basit açıklar, meraklı, sorular sorar.",
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
