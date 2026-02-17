/**
 * XMLHttpRequest Polyfill for Chrome Extensions
 *
 * This polyfill provides XMLHttpRequest functionality using the Fetch API,
 * which is necessary for Chrome extension service workers where XMLHttpRequest
 * is not available.
 *
 * Usage:
 * Import this file BEFORE importing @huggingface/transformers or onnxruntime-web
 *
 * Example:
 * ```javascript
 * import './XMLHttpRequestPolyfill.js';
 * import { AutoModelForCausalLM } from '@huggingface/transformers';
 * ```
 */

// Always define and install the polyfill in service workers
class XMLHttpRequestPolyfill {
  // Ready state constants
  static UNSENT = 0;
  static OPENED = 1;
  static HEADERS_RECEIVED = 2;
  static LOADING = 3;
  static DONE = 4;

  // Public properties
  responseType: XMLHttpRequestResponseType = "";
  response: any = null;
  responseText: string = "";
  responseXML: Document | null = null;
  responseURL: string = "";
  status: number = 0;
  statusText: string = "";
  readyState: number = XMLHttpRequestPolyfill.UNSENT;
  withCredentials: boolean = false;

  // Instance constants for compatibility
  readonly UNSENT = 0;
  readonly OPENED = 1;
  readonly HEADERS_RECEIVED = 2;
  readonly LOADING = 3;
  readonly DONE = 4;

  // Event handlers
  onload: ((ev: any) => any) | null = null;
  onerror: ((ev: any) => any) | null = null;
  onprogress: ((ev: any) => any) | null = null;
  onreadystatechange: ((ev: any) => any) | null = null;
  onabort: ((ev: any) => any) | null = null;
  ontimeout: ((ev: any) => any) | null = null;
  onloadstart: ((ev: any) => any) | null = null;
  onloadend: ((ev: any) => any) | null = null;

  // Private properties
  private _method: string = "GET";
  private _url: string = "";
  private _async: boolean = true;
  private _headers: Record<string, string> = {};
  private _aborted: boolean = false;
  private _timeout: number = 0;
  private _responseHeaders?: Record<string, string>;
  // @ts-ignore - stored for potential future use in the fetch-based implementation
  private _overriddenMimeType?: string;

  constructor() {
    this.readyState = XMLHttpRequestPolyfill.UNSENT;
  }

  /**
   * Opens the request
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - URL to request
   * @param {boolean} async - Whether to perform async request (default: true)
   */
  open(method: string, url: string, async = true) {
    this._method = method.toUpperCase();
    this._url = url;
    this._async = async;
    this._aborted = false;
    this.responseURL = url;
    this.readyState = XMLHttpRequestPolyfill.OPENED;
    this._triggerReadyStateChange();
  }

  /**
   * Sets a request header
   * @param {string} header - Header name
   * @param {string} value - Header value
   */
  setRequestHeader(header: string, value: string) {
    this._headers[header] = value;
  }

  /**
   * Sends the request
   * @param {*} body - Request body (optional)
   */
  send(body: any = null) {
    if (this.readyState !== XMLHttpRequestPolyfill.OPENED) {
      throw new DOMException(
        "Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED."
      );
    }

    // Check if synchronous request
    if (!this._async) {
      throw new Error(
        "Synchronous XMLHttpRequest is not supported in service workers or modern web contexts. " +
          "The code attempting to use sync XHR must be updated to use async requests. " +
          "This is a limitation of the Fetch API which is always asynchronous."
      );
    }

    // Trigger loadstart event
    if (this.onloadstart) {
      this.onloadstart({ type: "loadstart", target: this });
    }

    this.readyState = XMLHttpRequestPolyfill.HEADERS_RECEIVED;
    this._triggerReadyStateChange();

    const fetchOptions: RequestInit = {
      method: this._method,
      headers: this._headers,
    };

    if (body) {
      fetchOptions.body = body;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;

    // Set up timeout if specified
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (this._timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort();
        if (this.ontimeout) {
          this.ontimeout({ type: "timeout", target: this });
        }
      }, this._timeout);
    }

    // Perform the fetch request
    fetch(this._url, fetchOptions)
      .then((response) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (this._aborted) return;

        this.status = response.status;
        this.statusText = response.statusText;
        this.readyState = XMLHttpRequestPolyfill.LOADING;
        this._triggerReadyStateChange();

        // Store response headers
        this._responseHeaders = {};
        response.headers.forEach((value, key) => {
          this._responseHeaders[key.toLowerCase()] = value;
        });

        // Handle different response types
        if (this.responseType === "arraybuffer") {
          return response.arrayBuffer();
        } else if (this.responseType === "blob") {
          return response.blob();
        } else if (this.responseType === "json") {
          return response.json();
        } else if (this.responseType === "document") {
          return response.text().then((text) => {
            const parser = new DOMParser();
            return parser.parseFromString(text, "text/html");
          });
        } else {
          // Default to text
          return response.text();
        }
      })
      .then((data) => {
        if (this._aborted) return;

        this.response = data;

        // Set responseText for text-based responses
        if (typeof data === "string") {
          this.responseText = data;
        }

        // Set responseXML for document responses
        if (this.responseType === "document") {
          this.responseXML = data;
        }

        this.readyState = XMLHttpRequestPolyfill.DONE;
        this._triggerReadyStateChange();

        // Trigger load event
        if (this.onload) {
          this.onload({ type: "load", target: this });
        }

        // Trigger loadend event
        if (this.onloadend) {
          this.onloadend({ type: "loadend", target: this });
        }
      })
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (this._aborted) {
          if (this.onabort) {
            this.onabort({ type: "abort", target: this });
          }
          if (this.onloadend) {
            this.onloadend({ type: "loadend", target: this });
          }
          return;
        }

        this.readyState = XMLHttpRequestPolyfill.DONE;
        this._triggerReadyStateChange();

        // Trigger error event
        if (this.onerror) {
          this.onerror({
            type: "error",
            target: this,
            error: error,
          });
        }

        // Trigger loadend event
        if (this.onloadend) {
          this.onloadend({ type: "loadend", target: this });
        }
      });
  }

  /**
   * Aborts the request
   */
  abort() {
    this._aborted = true;
    this.readyState = XMLHttpRequestPolyfill.UNSENT;
  }

  /**
   * Gets all response headers as a string
   * @returns {string} All response headers
   */
  getAllResponseHeaders() {
    if (!this._responseHeaders) return "";

    return Object.entries(this._responseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");
  }

  /**
   * Gets a specific response header
   * @param {string} name - Header name
   * @returns {string|null} Header value or null if not found
   */
  getResponseHeader(name: string) {
    if (!this._responseHeaders) return null;
    return this._responseHeaders[name.toLowerCase()] || null;
  }

  /**
   * Sets the timeout value
   */
  set timeout(value) {
    this._timeout = value;
  }

  get timeout() {
    return this._timeout;
  }

  /**
   * Overrides the MIME type
   * @param {string} mimeType - MIME type to set
   */
  overrideMimeType(mimeType: string) {
    // Store for potential future use (not currently used in fetch-based implementation)
    this._overriddenMimeType = mimeType;
  }

  /**
   * Triggers the readystatechange event
   * @private
   */
  _triggerReadyStateChange() {
    if (this.onreadystatechange) {
      this.onreadystatechange({ type: "readystatechange", target: this });
    }
  }

  /**
   * Add event listener (stub for compatibility)
   */
  addEventListener(type: string, listener: any) {
    // Map to the appropriate property
    const eventName = `on${type}` as keyof this;
    if (eventName in this) {
      (this as any)[eventName] = listener;
    }
  }

  /**
   * Remove event listener (stub for compatibility)
   */
  removeEventListener(type: string, listener: any) {
    // Map to the appropriate property
    const eventName = `on${type}` as keyof this;
    if (eventName in this && (this as any)[eventName] === listener) {
      (this as any)[eventName] = null;
    }
  }

  /**
   * Dispatch event (stub for compatibility)
   */
  dispatchEvent(_event: Event): boolean {
    return true;
  }
}

// Install the polyfill - always install in service workers since native XMLHttpRequest won't work
if (typeof XMLHttpRequest === "undefined") {
  globalThis.XMLHttpRequest = XMLHttpRequestPolyfill as any;
} else {
  // Even if XMLHttpRequest exists, in service workers it won't work, so force the polyfill
  globalThis.XMLHttpRequest = XMLHttpRequestPolyfill as any;
}

export default XMLHttpRequest;
