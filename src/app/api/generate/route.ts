import { NextResponse } from "next/server";
import { callOpenAICompatible, makeDemoResponse, parseGenerateRequest } from "../../../lib/llm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseGenerateRequest(body);

    if (!payload.userPrompt) {
      return NextResponse.json({ error: "User prompt is required." }, { status: 400 });
    }

    const demoMode = process.env.DEMO_MODE !== "false";
    const result = demoMode ? makeDemoResponse(payload) : await callOpenAICompatible(payload);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
