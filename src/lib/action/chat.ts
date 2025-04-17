"use server";

import { prisma } from "../db";
// import { createAnthropic } from "@ai-sdk/anthropic";
// import OpenAI from "openai";
// const anthropic = createAnthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

export const getChat = async (id: string, userId: string) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return { data: chat };
  } catch (e: any) {
    console.log("error", e.message);
    return { data: null };
  }
};

export const getChats = async (userId: string) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    return { data: chats };
  } catch (e: any) {
    console.log("error", e.message);
    return { data: null };
  }
};

export const createNewChat = async (userId: string) => {
  try {
    const chat = await prisma.chat.create({
      data: { userId },
    });
    return { data: chat };
  } catch (e: any) {
    console.log("error", e.message);
    return { data: null };
  }
};

export const deleteChat = async (id: string, userId: string) => {
  try {
    const chat = await prisma.chat.delete({
      where: { id, userId },
    });
    return { data: chat };
  } catch (e: any) {
    console.log("error", e.message);
    return { data: null };
  }
};

export const generateChatResponse = async (
  message: string,
  chatId?: string
) => {
  try {
    const response = await fetch("https://beta.sree.shop/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "Provider-3/o3-mini",
        messages: [{ role: "user", content: message }],
        stream: false,
      }),
    });
    const data = await response.json();
    const repMessage = data.choices?.[0]?.message?.content;
    if (!repMessage) return { data: null };

    // const { text } = await generateText({
    //   model: anthropic("claude-3-haiku-20240307"),
    //   prompt: message,
    // });
    // if (!text) return { data: null };
    if (chatId) {
      await prisma.message.create({
        data: {
          question: message,
          answer: repMessage,
          chatId,
        },
      });
    }
    return { data: repMessage };
  } catch (e: any) {
    console.log("error", e.message);
    return { data: null };
  }
};
