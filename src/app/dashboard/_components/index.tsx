"use client";
import { createNewChat, deleteChat, getChats } from "@/lib/action/chat";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  LoaderIcon,
  MessageSquare,
  PlusCircleIcon,
  TrashIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "next-auth/react";

const DashboardClient = ({ userId }: { userId: string }) => {
  const [chats, setChats] = useState<any>([]);
  const [loading, setLoading] = useState<
    "fetching" | "creating" | "deleting" | null
  >("fetching");
  const router = useRouter();
  const fetchChats = async () => {
    setLoading("fetching");
    if (!userId) return;
    const { data } = await getChats(userId);
    console.log(data);
    if (data) setChats(data);
    setLoading(null);
  };
  const createChat = async () => {
    if (!userId) return;
    setLoading("creating");
    const { data } = await createNewChat(userId);
    if (data) {
      router.push(`/chat/${data.id}`);
    }
  };
  const handleDeleteChat = async (id: string) => {
    if (!userId) return;
    setLoading("deleting");
    const { data } = await deleteChat(id, userId);
    if (data) {
      setChats((prev: any) => prev.filter((chat: any) => chat.id !== id));
    }
    setLoading(null);
  };
  useEffect(() => {
    fetchChats();
  }, [userId]);
  return loading === "fetching" ? (
    <div className="h-screen w-screen flex justify-center items-center overflow-hidden">
      <LoaderIcon className="animate-spin" />
      Loading...
    </div>
  ) : (
    <div className="p-4 md:p-6">
      <div className="flex flex-col h-full gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
          {/* <Search onSearch={setSearchQuery} /> */}
          <Button variant={"outline"} onClick={() => signOut()}>
            Log Out
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Button
            variant={"outline"}
            className="overflow-hidden transition-all hover:shadow-md h-full min-h-[200px]"
            onClick={createChat}
            disabled={loading !== null}
          >
            {loading === "creating" ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <PlusCircleIcon />
            )}
            New Chat
          </Button>
          {chats.length > 0 &&
            chats.map((chat: any) => (
              <Link href={`/chat/${chat.id}`} key={chat.id}>
                <ChatCard chat={chat} handleDeleteChat={handleDeleteChat} />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

interface Chat {
  id: string;
  title: string;
  messages: any;
}

interface ChatCardProps {
  chat: Chat;
  handleDeleteChat: (id: string) => void;
}

export function ChatCard({ chat, handleDeleteChat }: ChatCardProps) {
  const timeAgo = chat.messages[0]?.createdAt
    ? formatDistanceToNow(new Date(chat.messages[0]?.createdAt), {
        addSuffix: true,
      })
    : "";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md relative gap-0">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{chat.title || "Chat"}</h3>
          <Button
            variant={"outline"}
            size={"icon"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteChat(chat.id);
            }}
            className="absolute top-2 right-2 z-10"
          >
            <TrashIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 gap-0">
        <p className="text-sm text-muted-foreground font-semibold line-clamp-2">
          User: {chat.messages[0]?.question}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {chat.messages[0]?.answer}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MessageSquare size={14} />
          <span>Chat</span>
        </div>
        <span>{timeAgo}</span>
      </CardFooter>
    </Card>
  );
}

export default DashboardClient;
