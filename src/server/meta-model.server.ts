// Calls Meta's Llama API (OpenAI-compatible chat endpoint). Server-only: the key never reaches the browser.
const LLAMA_URL = "https://api.llama.com/compat/v1/chat/completions";
const DEFAULT_MODEL = "Llama-4-Maverick-17B-128E-Instruct-FP8";

export async function callMetaModel(prompt: string, model = DEFAULT_MODEL) {
  const apiKey = process.env["MODEL_API_KEY"];
  if (!apiKey) throw new Error("The Meta model key is not set up yet.");
  const response = await fetch(LLAMA_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`Meta model failed [${response.status}]: ${text}`);
    throw new Error(`Meta model request failed (${response.status}).`);
  }
  const json = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}
