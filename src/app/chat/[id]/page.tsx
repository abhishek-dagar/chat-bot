import React from "react";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat-interface";
import { auth } from "@/lib/auth";
import { getChat } from "@/lib/action/chat";

const Dashboard = async ({ params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const { id } = await params;
  if (!id) {
    redirect("/dashboard");
  }
  const { data } = await getChat(id, session.user?.id || "");
  const initialMessagesSections = [];
  const initialMessages = [];
  let index = 0;
  for (const message of data?.messages || []) {
    const messages = [
      {
        id: message.id + index+"user",
        role: "user" as any,
        content: message.question,
      },
      {
        id: message.id + index+"system",
        role: "system" as any,
        content: message.answer,
      },
    ];
    initialMessages.push(...messages);
    initialMessagesSections.push({
      id: message.id + index,
      role: "user",
      messages: messages as any,
      sectionIndex: index,
      isNewSection: false,
    });
    index++;
  }
  return (
    <ChatInterface
      chatId={id || ""}
      initialMessages={initialMessages}
      initialMessagesSections={initialMessagesSections}
    />
  );
};

export default Dashboard;
