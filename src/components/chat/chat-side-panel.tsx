'use client';

import { useState } from 'react';
import { ChatPanel } from './chat-panel';

interface ChatSidePanelProps {
  projectSlug: string;
  projectTitle: string;
  wikiPageCount: number;
}

export function ChatSidePanel({ projectSlug, projectTitle, wikiPageCount }: ChatSidePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        className="war-room-panel-toggle"
        onClick={() => setCollapsed(false)}
        title="Open AI Chat"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>AI Chat</span>
      </button>
    );
  }

  return (
    <div className="war-room-chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-header-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>AI Chat</span>
        </div>
        <button
          type="button"
          className="chat-panel-close"
          onClick={() => setCollapsed(true)}
          title="Close panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      <ChatPanel
        projectSlug={projectSlug}
        projectTitle={projectTitle}
        wikiPageCount={wikiPageCount}
      />
    </div>
  );
}
