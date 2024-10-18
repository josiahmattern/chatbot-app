"use client";

import { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import ClipboardJS from "clipboard";
import "prismjs/themes/prism-tomorrow.css"; // Dark Prism theme

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef(null);

  useEffect(() => {
    Prism.highlightAll();
    new ClipboardJS(".copy-button");
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok)
        throw new Error("Failed to communicate with the chatbot");

      const data = await response.json();
      const botMessage = { role: "bot", content: data.script };
      setMessages([...newMessages, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        { role: "bot", content: "Error communicating with the chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const formatMessage = (message) => {
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;

    const withCodeBlocks = message.replace(
      codeBlockPattern,
      (_, language = "plaintext", code) =>
        `<div class="rounded-lg border border-neutral-600 bg-base-200 shadow-xl my-6 overflow-hidden">
           <div class="flex justify-between items-center bg-base-300 px-3 py-2">
             <span class="text-sm font-semibold text-base-content">${language}</span>
             <button class="text-sm hover:text-secondary text-base-content" data-clipboard-text="${code}">
               copy
             </button>
           </div>
           <pre class="m-0 p-3 text-sm"><code class="language-${language} text-base-content">${Prism.highlight(
             code.trim(),
             Prism.languages[language] || Prism.languages.plaintext,
             language,
           )}</code></pre>
         </div>`,
    );

    return (
      <div
        className="my-2"
        dangerouslySetInnerHTML={{ __html: withCodeBlocks }}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content">
      <header className="border-b border-base-300">
        <div className="max-w-7xl mx-auto py-4 px-6 text-center">
          <h1 className="text-3xl font-bold text-base-content">AI Assistant</h1>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"} mb-3`}
            >
              <div
                className={`chat-bubble border border-base-300 bg-base-200 shadow-sm px-3 py-2 text-base-content`}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center space-x-2">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <span className="text-sm text-base-content">
                Bot is typing...
              </span>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 bg-base-300 border-t border-base-200 p-4">
        <div className="max-w-7xl mx-auto flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="input input-ghost w-full bg-base-100 text-base-content"
          />
          <button onClick={sendMessage} className="btn btn-secondary">
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
