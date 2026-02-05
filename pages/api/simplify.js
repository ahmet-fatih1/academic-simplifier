export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY bulunamadı!' });
  }

  try {
    // DOĞRU MODEL: gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Rewrite this in very simple English (B1 level): ${text}`
              }
            ]
          }
        ]
      }),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error('Gemini hatası:', responseText);
      return res.status(response.status).json({ 
        error: 'Gemini API hatası',
        details: responseText
      });
    }

    const data = JSON.parse(responseText);
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sonuç bulunamadı";

    res.status(200).json({ result });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ 
      error: 'Hata oluştu',
      details: error.message
    });
  }
}