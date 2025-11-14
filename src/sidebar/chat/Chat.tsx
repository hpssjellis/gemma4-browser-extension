import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  BackgroundMessages,
  BackgroundTasks,
  ChatMessage,
  ResponseStatus,
} from "../../shared/types.ts";
import { Button, InputText } from "../theme";
import cn from "../utils/classnames.ts";
import MessageContent from "./MessageContent.tsx";

interface FormParams {
  input: string;
}

export default function Chat() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<FormParams>({
    defaultValues: {
      input:
        "Whats the best transport method for today based in the weather in London?",
    },
  });
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    chrome.runtime.sendMessage(
      {
        type: BackgroundTasks.AGENT_GET_MESSAGES,
      },
      (resp) => {
        setMessages(resp.messages);
      }
    );

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === BackgroundMessages.MESSAGES_UPDATE) {
        setMessages(message.messages);
      }
    });
  }, []);

  const onSubmit = (data: FormParams) => {
    setIsLoading(true);
    reset();

    chrome.runtime.sendMessage(
      {
        type: BackgroundTasks.AGENT_GENERATE_TEXT,
        prompt: data.input,
      },
      (resp) => {
        if (resp.status === ResponseStatus.ERROR) {
          alert(resp.error);
        }
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {(messages || []).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-chrome-text-secondary">
              Start a conversation by typing a message below
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[85%] rounded-md px-4 py-3",
                message.role === "user"
                  ? "ml-auto bg-chrome-accent-primary text-chrome-bg-primary"
                  : "bg-chrome-bg-secondary"
              )}
            >
              {/*<div className="mb-1 text-xs font-medium opacity-70">
                {message.role === "user" ? "You" : message.role}
              </div>*/}
              <div className="text-sm">
                {message.role === "user" ? (
                  message.content
                ) : (
                  <MessageContent
                    content={message.content}
                    tools={message.tools}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-chrome-border px-6 py-4 bg-chrome-bg-secondary">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <Controller
            name="input"
            control={control}
            rules={{ required: "Message is required" }}
            render={({ field }) => (
              <InputText
                {...field}
                id="chat-input"
                label="Message"
                placeholder="Type your message..."
                disabled={isLoading}
                error={errors.input?.message}
                hideLabel
                className="flex-1"
              />
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            color="primary"
            variant="solid"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
