const defaultKeyEncoded = "QVEuQWI4Uk42TElyRjQwbUstVHdodTViZGhrUUpCcFZoaTVXRHZWWjJEX2Y5VFZidExwb0E=";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || Buffer.from(defaultKeyEncoded, "base64").toString("utf-8");
const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const systemName = payload.systemName || "籤詩";
    const stickNum = payload.stickNum || "";
    const ganzhi = payload.ganzhi || "";
    const poem = payload.poem || "";
    const story = payload.story || "";
    const meaning = payload.meaning || "";
    const question = payload.question || "綜合運勢";

    const prompt = `你是一位溫暖、有智慧的解籤命理師，擅長用親切、鼓勵人心的語氣為求籤者解讀籤詩。

籤詩系統：${systemName}
籤號：${stickNum}（${ganzhi}）
詩曰：${poem}
典故：${story}
聖意：${meaning}

求籤者想請示的事項：「${question}」

請針對求籤者的問題，結合籤詩詩意與典故，給予一段約150-250字、溫馨具體、繁體中文的解籤建議。語氣要溫暖、正向、有智慧，避免空泛，盡量結合籤詩內容給出具體建議。不要用條列式，用自然流暢的段落文字。直接輸出最終的解籤內容本身，不要輸出任何思考過程、字數統計、條件確認或任何非解籤內容的文字。`;

    const geminiBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 3000
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "gemini_error", detail: errText })
      };
    }

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    const parts = candidate && candidate.content && candidate.content.parts;
    const text = parts ? parts.map(p => p.text || "").join("").trim() : "";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text, model: MODEL })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "server_error", message: err.message })
    };
  }
};
