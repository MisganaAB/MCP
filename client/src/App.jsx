import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow.jsx';
import MessageInput from './components/MessageInput.jsx';
import TokenSettings from './components/TokenSettings.jsx';
import './styles/app.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [bearerToken, setBearerToken] = useState('mcp-secret-token-123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (userText) => {
    const userMessage = { role: 'user', text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          bearerToken: bearerToken
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        text: data.reply,
        toolsUsed: data.toolsUsed || []
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error: ${err.message}`,
          toolsUsed: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span>🤖</span>
          <span>MCP Learning Assistant</span>
        </h1>
        <div className="status-badge">Streamable HTTP Active</div>
      </header>

      <TokenSettings token={bearerToken} setToken={setBearerToken} />

      <ChatWindow
        messages={messages}
        onSuggestionClick={handleSendMessage}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
