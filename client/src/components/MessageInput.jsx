import React, { useState } from 'react';

export default function MessageInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <textarea
        className="message-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message or question about MCP or GitHub... (Press Enter to send)"
        rows={1}
        disabled={isLoading}
      />
      <button
        className="btn-send"
        type="submit"
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? 'Thinking...' : 'Send'}
      </button>
    </form>
  );
}
