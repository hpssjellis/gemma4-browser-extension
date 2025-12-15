import { ContentTasks } from "../shared/types.ts";
import extractWebsiteParts from "./utils/extractWebsiteParts.ts";
import highlightParagraph from "./utils/highlightParagraph.ts";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === ContentTasks.EXTRACT_PAGE_DATA) {
    const main =
      document.querySelector("main") || document.querySelector("body");

    const parts = extractWebsiteParts(main);

    sendResponse({
      parts,
    });
  }

  if (message.type === ContentTasks.HIGHLIGHT_ELEMENTS) {
    highlightParagraph(message.payload.id);
    sendResponse({ success: true });
  }

  if (message.type === ContentTasks.CLEAR_HIGHLIGHTS) {
    const allElements = document.querySelectorAll('[style*="outline"]');
    allElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.outline = "";
      htmlElement.style.backgroundColor = "";
    });

    sendResponse({ success: true });
  }

  return true;
});
