exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY pa konfigire nan Netlify.");
    }

    const { imageBase64, mimeType, pair, timeframe } =
      JSON.parse(event.body || "{}");

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Voye yon imaj grafik anvan." })
      };
    }

    const image = imageBase64.replace(
      /^data:image\/[^;]+;base64,/,
      ""
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analize imaj grafik sa a pou edikasyon sèlman.
Pè: ${pair || "Pa presize"}.
Timeframe: ${timeframe || "Pa presize"}.
Idantifye tandans ak nivo sipò/rezistans si yo vizib.
Si enfòmasyon yo pa klè, reponn WAIT.
Pa garanti okenn pwofi.
Bay rezilta a an kreyòl ayisyen.`
              },
              {
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
                  data: image
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Gemini pa ka analize imaj la."
      );
    }

    const result =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("\n") || "WAIT";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
