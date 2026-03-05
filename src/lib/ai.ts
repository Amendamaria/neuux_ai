/* src/lib/ai.ts */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function aiChat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 1500
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudflare AI response error:", errorText);
    throw new Error(errorText);
  }

  const data = await response.json();

  return data?.result?.response ?? "";
}