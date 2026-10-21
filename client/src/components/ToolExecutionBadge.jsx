import React, { useState } from 'react';

export default function ToolExecutionBadge({ toolsUsed }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!toolsUsed || toolsUsed.length === 0) {
    return null;
  }

  return (
    <div className="tool-badge-container">
      <div
        className="tool-badge-header"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to view tool execution details"
      >
        <span>⚙️</span>
        <span>
          Executed {toolsUsed.length} MCP {toolsUsed.length === 1 ? 'tool' : 'tools'} {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div className="tool-details">
          {toolsUsed.map((tool, index) => (
            <div key={index} className="tool-item">
              <div>
                <strong>Turn {tool.iteration}:</strong> <code>{tool.name}</code>
                {tool.isError && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>(Error)</span>}
              </div>
              <div style={{ color: '#94a3b8', margin: '0.2rem 0' }}>
                Arguments: {JSON.stringify(tool.args)}
              </div>
              {tool.snippet && (
                <div style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  Result snippet: {tool.snippet}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
