'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import type { UIMessage } from 'ai';

import { ArtifactCard } from './artifact-card';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

interface ChatPanelProps {
  projectSlug: string;
  projectTitle: string;
  wikiPageCount: number;
}

interface ParsedArtifact {
  type: string;
  title: string;
  content: string;
}

type Segment =
  | { kind: 'text'; content: string }
  | { kind: 'artifact'; artifact: ParsedArtifact };

function parseArtifacts(text: string): Segment[] {
  const segments: Segment[] = [];
  const artifactRegex = /:::artifact\{type="([^"]+)"\s+title="([^"]+)"\}\n([\s\S]*?):::/g;
  let lastIndex = 0;
  let match;

  while ((match = artifactRegex.exec(text)) !== null) {
    const beforeText = text.slice(lastIndex, match.index).trim();
    if (beforeText) {
      segments.push({ kind: 'text', content: beforeText });
    }

    segments.push({
      kind: 'artifact',
      artifact: {
        type: match[1],
        title: match[2],
        content: match[3].trim(),
      },
    });

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    segments.push({ kind: 'text', content: remaining });
  }

  return segments;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}


export function ChatPanel({ projectSlug, projectTitle, wikiPageCount }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      body: { projectSlug },
    }),
    [projectSlug],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue.trim() });
    setInputValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function useSuggestion(text: string) {
    setInputValue(text);
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">&#9813;</div>
            <h2 className="chat-empty-title">Fleet GTM Agent</h2>
            <p className="chat-empty-subtitle">
              Your strategist for <strong>{projectTitle}</strong>
              {wikiPageCount > 0 && (
                <> — loaded with {wikiPageCount} captured source{wikiPageCount !== 1 ? 's' : ''}</>
              )}
            </p>
            <div className="chat-suggestions">
              <SuggestionChip text="What does my competitive landscape look like?" onClick={useSuggestion} />
              <SuggestionChip text="Draft a positioning statement for my product" onClick={useSuggestion} />
              <SuggestionChip text="Who is my ideal customer? Build an ICP." onClick={useSuggestion} />
              <SuggestionChip text="Create a launch plan for the next 2 weeks" onClick={useSuggestion} />
            </div>
          </div>
        )}

        {messages.map((message) => {
          const text = getMessageText(message);

          if (message.role === 'user') {
            return (
              <div key={message.id} className="chat-message chat-message-user">
                <div className="chat-message-content">{text}</div>
              </div>
            );
          }

          const segments = parseArtifacts(text);

          return (
            <div key={message.id} className="chat-message chat-message-assistant">
              {segments.map((segment, i) => {
                if (segment.kind === 'text') {
                  return (
                    <div key={i} className="chat-message-content">
                      <MarkdownRenderer content={segment.content} />
                    </div>
                  );
                }

                return (
                  <ArtifactCard
                    key={i}
                    title={segment.artifact.title}
                    type={segment.artifact.type}
                    content={segment.artifact.content}
                    projectSlug={projectSlug}
                  />
                );
              })}
            </div>
          );
        })}

        {isLoading && (messages.length === 0 || messages[messages.length - 1].role === 'user') && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.5rem 1rem', color: '#fca5a5', fontSize: '0.8rem' }}>
          Connection error. Check that your LLM API key is configured.
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your GTM strategy..."
          rows={1}
          className="chat-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={isLoading || !inputValue.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  return (
    <button
      type="button"
      className="chat-suggestion-chip"
      onClick={() => onClick(text)}
    >
      {text}
    </button>
  );
}
