import { generateChatResponse } from "@/lib/action/chat";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    
    const { data } = await generateChatResponse(question);
    if (data) {
      return NextResponse.json({ answer: data }, { status: 200 });
    }
    return NextResponse.json(
      { answer: "Something went wrong" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new Response("Error processing chat request", { status: 500 });
  }
}
