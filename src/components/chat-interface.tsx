"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { generateChatResponse } from "@/lib/action/chat";

type MessageType = "user" | "system";

interface Message {
  id: string;
  content: string;
  role: MessageType;
  completed?: boolean;
  newSection?: boolean;
}

interface MessageSection {
  id: string;
  messages: Message[];
  isNewSection: boolean;
  isActive?: boolean;
  sectionIndex: number;
}

interface StreamingWord {
  id: number;
  text: string;
}

// Faster word delay for smoother streaming
const WORD_DELAY = 40; // ms per word
const CHUNK_SIZE = 2; // Number of words to add at once

interface ChatInterfaceProps {
  chatId: string;
  initialMessages?: Message[];
  initialMessagesSections?: MessageSection[];
}

export default function ChatInterface({
  chatId,
  initialMessages = [],
  initialMessagesSections = [],
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const newSectionRef = useRef<HTMLDivElement>(null);
  const [hasTyped, setHasTyped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageSections, setMessageSections] = useState<MessageSection[]>(
    initialMessagesSections
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [viewportHeight, setViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(
    new Set()
  );
  const [isGenerating, setIsGenerating] = useState(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const shouldFocusAfterStreamingRef = useRef(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile and get viewport height
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);

      // Capture the viewport height
      const vh = window.innerHeight;
      setViewportHeight(vh);

      // Apply fixed height to main container on mobile
      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`;
      }
    };

    checkMobileAndViewport();

    // Set initial height
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile
        ? `${viewportHeight}px`
        : "100svh";
    }

    // Update on resize
    window.addEventListener("resize", checkMobileAndViewport);

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport);
    };
  }, [isMobile, viewportHeight]);

  // Organize messages into sections
  useEffect(() => {
    if (messages.length === 0) {
      setMessageSections([]);
      return;
    }

    const sections: MessageSection[] = [];
    let currentSection: MessageSection = {
      id: `section-${Date.now()}-0`,
      messages: [],
      isNewSection: false,
      sectionIndex: 0,
    };

    messages.forEach((message) => {
      if (message.newSection) {
        // Start a new section
        if (currentSection.messages.length > 0) {
          // Mark previous section as inactive
          sections.push({
            ...currentSection,
            isActive: false,
          });
        }

        // Create new active section
        const newSectionId = `section-${Date.now()}-${sections.length}`;
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        };

        // Update active section ID
      } else {
        // Add to current section
        currentSection.messages.push(message);
      }
    });

    // Add the last section if it has messages
    if (currentSection.messages.length > 0) {
      sections.push(currentSection);
    }

    setMessageSections(sections);
  }, [messages]);

  // Scroll to maximum position when new section is created, but only for sections after the first
  useEffect(() => {
    if (messageSections.length > 1) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current;

        if (scrollContainer) {
          // Scroll to maximum possible position
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [messageSections]);

  // Focus the textarea on component mount (only on desktop)
  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [isMobile]);

  // Set focus back to textarea after streaming ends (only on desktop)
  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current && !isMobile) {
      focusTextarea();
      shouldFocusAfterStreamingRef.current = false;
    }
  }, [isStreaming, isMobile]);

  const focusTextarea = () => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  };

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking directly on the container, not on buttons or other interactive elements
    if (
      e.target === e.currentTarget ||
      (e.currentTarget === inputContainerRef.current &&
        !(e.target as HTMLElement).closest("button"))
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const simulateTextStreaming = async (text: string) => {
    // Split text into words
    const words = text.split(" ");
    let currentIndex = 0;
    setStreamingWords([]);
    setIsStreaming(true);

    return new Promise<void>((resolve) => {
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          // Add a few words at a time
          const nextIndex = Math.min(currentIndex + CHUNK_SIZE, words.length);
          const newWords = words.slice(currentIndex, nextIndex);

          setStreamingWords((prev) => [
            ...prev,
            {
              id: Date.now() + currentIndex,
              text: newWords.join(" ") + " ",
            },
          ]);

          currentIndex = nextIndex;
        } else {
          clearInterval(streamInterval);
          resolve();
        }
      }, WORD_DELAY);
    });
  };

  const getAIResponse = async (userMessage: string) => {
    const response = await generateChatResponse(userMessage, chatId);
    if (response.data) {
      return response.data;
    }
    return "Something went wrong";
  };

  const simulateAIResponse = async (userMessage: string) => {
    // Create a new message with empty content
    const messageId = Date.now().toString();
    setStreamingMessageId(messageId);
    setIsGenerating(messageId as any);

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        content: "",
        role: "system",
      },
    ]);
    const response = await getAIResponse(userMessage);
    setIsGenerating(null);

    // Add a delay before the second vibration
    setTimeout(() => {
      // Add vibration when streaming begins
      navigator.vibrate(50);
    }, 200); // 200ms delay to make it distinct from the first vibration

    // Stream the text
    await simulateTextStreaming(response);

    // Update with complete message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: response, completed: true }
          : msg
      )
    );

    // Add to completed messages set to prevent re-animation
    setCompletedMessages((prev) => new Set(prev).add(messageId));

    // Add vibration when streaming ends
    navigator.vibrate(50);

    // Reset streaming state
    setStreamingWords([]);
    setStreamingMessageId(null);
    setIsStreaming(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Only allow input changes when not streaming
    if (!isStreaming) {
      setInputValue(newValue);

      if (newValue.trim() !== "" && !hasTyped) {
        setHasTyped(true);
      } else if (newValue.trim() === "" && hasTyped) {
        setHasTyped(false);
      }

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 160));
        textarea.style.height = `${newHeight}px`;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      // Add vibration when message is submitted
      navigator.vibrate(50);

      const userMessage = inputValue.trim();

      // Add as a new section if messages already exist
      const shouldAddNewSection = messages.length > 0;

      const newUserMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        role: "user" as MessageType,
        newSection: shouldAddNewSection,
      };

      // Reset input before starting the AI response
      setInputValue("");
      setHasTyped(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Add the message after resetting input
      setMessages((prev) => [...prev, newUserMessage]);

      // Only focus the textarea on desktop, not on mobile
      if (!isMobile) {
        focusTextarea();
      } else {
        // On mobile, blur the textarea to dismiss the keyboard
        if (textareaRef.current) {
          textareaRef.current.blur();
        }
      }

      // Start AI response
      simulateAIResponse(userMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Cmd+Enter on both mobile and desktop
    if (!isStreaming && e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    // Only handle regular Enter key (without Shift) on desktop
    if (!isStreaming && !isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessage = (message: Message) => {
    const isCompleted = completedMessages.has(message.id);

    return (
      <div
        key={message.id}
        className={cn(
          "flex flex-col",
          message.role === "user" ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl",
            message.role === "user"
              ? "bg-white border border-gray-200 rounded-br-none"
              : "text-gray-900"
          )}
        >
          {/* For user messages or completed system messages, render without animation */}
          {isGenerating === message.id && (
            <span className="flex items-center gap-2 text-sm">
              <LoaderCircleIcon className="animate-spin" />
              Generating
            </span>
          )}
          {message.content && (
            <span
              className={
                message.role === "system" && !isCompleted
                  ? "animate-fade-in"
                  : ""
              }
            >
              {message.content}
            </span>
          )}

          {/* For streaming messages, render with animation */}
          {message.id === streamingMessageId && (
            <span className="inline">
              {streamingWords.map((word) => (
                <span key={word.id} className="animate-fade-in inline">
                  {word.text}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={mainContainerRef}
      className="bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: isMobile ? `${viewportHeight}px` : "100svh" }}
    >
      <header className="fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-20 bg-gray-50">
        <div className="w-full flex items-center justify-between px-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>

          <h1 className="text-base font-medium text-gray-800">v0 Chat</h1>

          <div />
        </div>
      </header>

      <div
        ref={chatContainerRef}
        className="flex-grow pb-32 pt-12 px-4 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messageSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              ref={
                sectionIndex === messageSections.length - 1 &&
                section.isNewSection
                  ? newSectionRef
                  : null
              }
            >
              {section.isNewSection && (
                <div
                  // style={
                  //   section.isActive && shouldApplyHeight(section.sectionIndex)
                  //     ? { height: `${getContentHeight()}px` }
                  //     : {}
                  // }
                  className="pt-4 flex flex-col justify-start"
                >
                  {section.messages.map((message) => renderMessage(message))}
                </div>
              )}

              {!section.isNewSection && (
                <div>
                  {section.messages.map((message) => renderMessage(message))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div
            ref={inputContainerRef}
            className={cn(
              "relative w-full rounded-3xl border border-gray-200 bg-white p-3 cursor-text",
              isStreaming && "opacity-80"
            )}
            onClick={handleInputContainerClick}
          >
            <div className="pb-9">
              <Textarea
                ref={textareaRef}
                placeholder={
                  isStreaming ? "Waiting for response..." : "Ask Anything"
                }
                className="min-h-[24px] max-h-[160px] w-full rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-base pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Ensure the textarea is scrolled into view when focused
                  if (textareaRef.current) {
                    textareaRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              />
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200",
                    hasTyped ? "bg-black scale-110" : "bg-gray-200"
                  )}
                  disabled={!inputValue.trim() || isStreaming}
                >
                  <ArrowUp
                    className={cn(
                      "h-4 w-4 transition-colors",
                      hasTyped ? "text-white" : "text-gray-500"
                    )}
                  />
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
