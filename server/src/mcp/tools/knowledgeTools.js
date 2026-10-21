import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs/promises';
import { KNOWLEDGE_BASE_DIR } from '../../config.js';
import { checkToolScope } from '../auth.js';

const ALLOWED_EXTENSIONS = ['.md', '.json'];

/**
 * Validates and safely resolves a file path strictly within the knowledge base directory.
 * Throws an informative Error if path traversal is attempted or the extension is disallowed.
 *
 * @param {string} requestedFilename - Filename requested by client or model
 * @returns {Promise<string>} The canonical resolved safe path
 */
export async function resolveSafeKnowledgePath(requestedFilename) {
  if (!requestedFilename || typeof requestedFilename !== 'string') {
    throw new Error('Filename must be a non-empty string.');
  }

  // Reject null bytes or obvious traversal characters
  if (requestedFilename.includes('\0')) {
    throw new Error('Access denied: Invalid null byte in path.');
  }

  // Strip all directory path prefixes using path.basename
  const safeBaseName = path.basename(requestedFilename.trim());
  const ext = path.extname(safeBaseName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Access denied: Only ${ALLOWED_EXTENSIONS.join(' and ')} files can be accessed. Received: ${ext || 'none'}`);
  }

  // Resolve target path and verify it stays strictly inside KNOWLEDGE_BASE_DIR
  const resolvedPath = path.resolve(KNOWLEDGE_BASE_DIR, safeBaseName);
  const normalizedBase = path.resolve(KNOWLEDGE_BASE_DIR);

  if (!resolvedPath.startsWith(normalizedBase + path.sep) && resolvedPath !== normalizedBase) {
    throw new Error('Access denied: Attempted directory traversal outside knowledge base.');
  }

  return resolvedPath;
}

export const listKnowledgeBaseFilesTool = {
  name: 'list_knowledge_base_files',
  config: {
    description: 'List all available educational documents in the local knowledge base. Requires [knowledge:read] scope.',
    inputSchema: {}
  },
  handler: async (_args, extra) => {
    const scopeCheck = checkToolScope(extra, 'knowledge:read');
    if (!scopeCheck.allowed) {
      return {
        isError: true,
        content: [{ type: 'text', text: scopeCheck.error }]
      };
    }

    try {
      const files = await fs.readdir(KNOWLEDGE_BASE_DIR);
      const allowed = files.filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()));

      return {
        content: [{
          type: 'text',
          text: `Available Knowledge Base Documents (${allowed.length}):\n` + allowed.map(f => `- ${f}`).join('\n')
        }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to read knowledge base directory: ${err.message}` }]
      };
    }
  }
};

export const readKnowledgeBaseTool = {
  name: 'read_knowledge_base',
  config: {
    description: 'Read the contents of an educational document from the local knowledge base. Requires [knowledge:read] scope.',
    inputSchema: {
      filename: z.string().min(1).describe('Name of the document to read (e.g. "mcp_primer.md", "security_guide.md", "course_faq.json")')
    }
  },
  handler: async ({ filename }, extra) => {
    const scopeCheck = checkToolScope(extra, 'knowledge:read');
    if (!scopeCheck.allowed) {
      return {
        isError: true,
        content: [{ type: 'text', text: scopeCheck.error }]
      };
    }

    try {
      const safePath = await resolveSafeKnowledgePath(filename);
      const content = await fs.readFile(safePath, 'utf-8');

      return {
        content: [{
          type: 'text',
          text: `--- Start of [${path.basename(safePath)}] ---\n\n${content}\n\n--- End of [${path.basename(safePath)}] ---`
        }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error reading document [${filename}]: ${err.message}`
        }]
      };
    }
  }
};
