const N8N_WEBHOOK_URL =
  "https://n8n-service-alteat.onrender.com/webhook/ea91077d-37f4-42c8-853d-55dd2ae3e33e/chat";

type ChatbotRequest = {
  method?: string;
  body?: Record<string, unknown>;
};

type ChatbotResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ChatbotResponse;
  end: () => void;
  json: (payload: unknown) => void;
  send: (payload: string) => void;
};

export default async function handler(req: ChatbotRequest, res: ChatbotResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const upstreamResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const responseBody = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader(
      "Content-Type",
      upstreamResponse.headers.get("content-type") ?? "application/json",
    );
    res.send(responseBody);
  } catch (error) {
    console.error("Chatbot proxy failed:", error);
    res.status(502).json({ error: "Failed to reach chatbot service" });
  }
}