import showdown from "showdown";

import { type ChatMessageTool } from "../../shared/types.ts";
import { Loader } from "../theme";
import MessageToolCall from "./MessageToolCall.tsx";

const converter = new showdown.Converter();

export default function MessageContent({
  content,
  tools = [],
}: {
  content: string;
  tools: Array<ChatMessageTool>;
}) {
  return (
    <div className="space-y-6">
      {tools && tools.length > 0 && <MessageToolCall tools={tools} />}
      {Boolean(content) ? (
        <div
          className="prose prose-invert prose-li:text-sm prose-headings:text-sm prose-p:text-sm prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-hr:my-4 max-w-none"
          dangerouslySetInnerHTML={{
            __html: converter.makeHtml(content),
          }}
        />
      ) : (
        <p className="flex items-center gap-3">
          <Loader size="sm" /> loading..
        </p>
      )}
    </div>
  );
}
