export enum ResponseStatus {
  SUCCESS,
  ERROR,
  STARTED,
}

export enum BackgroundTasks {
  EXTRACT_FEATURES,
  INITIALIZE_MODELS,
  AGENT_GENERATE_TEXT,
  AGENT_GET_MESSAGES,
  AGENT_CLEAR,
}

export enum BackgroundMessages {
  DOWNLOAD_PROGRESS,
  MESSAGES_UPDATE,
}

export type Dtype = "fp32" | "fp16" | "q4" | "q4f16";

export interface ChatMessageUser {
  role: "user";
  content: string;
}

export interface ChatMessageTool {
  name: string;
  functionSignature: string;
  id: string;
  result: string;
}

export interface ChatMessageAssistant {
  role: "assistant";
  content: string;
  tools: Array<ChatMessageTool>;
}

export type ChatMessage = ChatMessageUser | ChatMessageAssistant;
