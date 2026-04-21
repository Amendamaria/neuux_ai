export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CloudflareAIResponse = {
  result?: {
    response?: string | string[];
    output_text?: string;
  };
};

export async function aiChat(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare AI error:", errorText);
      throw new Error(errorText);
    }

    const data: CloudflareAIResponse = await response.json();

    let output = "";

    if (typeof data.result?.response === "string") {
      output = data.result.response;
    } else if (Array.isArray(data.result?.response)) {
      output = data.result.response.join(" ");
    } else if (typeof data.result?.output_text === "string") {
      output = data.result.output_text;
    }

    if (!output) {
      return "I couldn’t generate a proper response. Please try again.";
    }

    return output.trim();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("AI Chat Error:", message);

    return "Something went wrong while generating the response. Please try again.";
  }
}