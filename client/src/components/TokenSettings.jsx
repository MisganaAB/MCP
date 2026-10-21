import React from 'react';

export default function TokenSettings({ token, setToken }) {
  const handleReset = () => {
    setToken('mcp-secret-token-123');
  };

  const handleClear = () => {
    setToken('');
  };

  return (
    <div className="token-settings">
      <label htmlFor="bearer-token-input">Demo Bearer Token:</label>
      <input
        id="bearer-token-input"
        className="token-input"
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="e.g. mcp-secret-token-123 (leave blank to test unauthorized mode)"
      />
      <button className="btn-secondary" onClick={handleReset} type="button">
        Set Valid Token
      </button>
      <button className="btn-secondary" onClick={handleClear} type="button">
        Clear Token
      </button>
      <div className="token-note">
        ⚠️ <strong>Educational Note:</strong> This is a pre-shared bearer token verifying tool scopes (<code>github:read</code>, <code>knowledge:read</code>) at the server boundary. It is NOT full OAuth 2.1.
      </div>
    </div>
  );
}
