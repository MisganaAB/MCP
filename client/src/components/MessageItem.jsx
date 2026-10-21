import React from 'react';
import ToolExecutionBadge from './ToolExecutionBadge.jsx';

export default function MessageItem({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-item ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-bubble">
        {message.text}
      </div>
      {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
        <ToolExecutionBadge toolsUsed={message.toolsUsed} />
      )}
    </div>
  );
}
