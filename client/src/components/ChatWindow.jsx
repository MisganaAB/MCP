import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem.jsx';

export default function ChatWindow({ messages, onSuggestionClick }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          <h3>Welcome to the MCP Learning Assistant! 🎓</h3>
          <p>
            This application demonstrates how a custom AI Agent Loop coordinates with an official Model Context Protocol (MCP) server over Streamable HTTP.
          </p>
          <div className="suggestions">
            <button
              className="suggestion-btn"
              onClick={() => onSuggestionClick("What documents are available in the local knowledge base?")}
              type="button"
            >
              📚 "What documents are available in the local knowledge base?"
            </button>
            <button
              className="suggestion-btn"
              onClick={() => onSuggestionClick("What does the MCP primer explain about hosts, clients, and servers?")}
              type="button"
            >
              📖 "What does the MCP primer explain about hosts, clients, and servers?"
            </button>
            <button
              className="suggestion-btn"
              onClick={() => onSuggestionClick("Search GitHub for repositories about model context protocol.")}
              type="button"
            >
              🐙 "Search GitHub for repositories about model context protocol."
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window" ref={scrollRef}>
      {messages.map((msg, index) => (
        <MessageItem key={index} message={msg} />
      ))}
    </div>
  );
}
