'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';

interface SlashCommand {
  label: string;
  description: string;
  icon: string;
  action: (editor: Editor) => void;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    label: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet List',
    description: 'Unordered list',
    icon: '•',
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Numbered List',
    description: 'Ordered list',
    icon: '1.',
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Task List',
    description: 'Checklist with checkboxes',
    icon: '☑',
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Code Block',
    description: 'Fenced code block',
    icon: '{ }',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Blockquote',
    description: 'Quoted text block',
    icon: '"',
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Divider',
    description: 'Horizontal rule',
    icon: '—',
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    label: 'Table',
    description: '3×3 table with header',
    icon: '⊞',
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

const slashCommandPluginKey = new PluginKey('slashCommand');

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: slashCommandPluginKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== '/') return false;

            const { state } = view;
            const { $from } = state.selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

            // Only trigger at start of line or after space
            if (textBefore.length === 0 || textBefore.endsWith(' ')) {
              // Dispatch custom event to open menu
              setTimeout(() => {
                const coords = view.coordsAtPos(state.selection.from);
                window.dispatchEvent(
                  new CustomEvent('fleet-slash-command', {
                    detail: { x: coords.left, y: coords.bottom + 4, editor },
                  })
                );
              }, 10);
            }

            return false;
          },
        },
      }),
    ];
  },
});

export function SlashCommandMenu() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const editorRef = useRef<Editor | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  const close = useCallback(() => {
    setOpen(false);
    setFilter('');
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    function handleSlashCommand(e: Event) {
      const detail = (e as CustomEvent).detail;
      editorRef.current = detail.editor;
      setPosition({ x: detail.x, y: detail.y });
      setFilter('');
      setSelectedIndex(0);
      setOpen(true);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        executeCommand(filtered[selectedIndex]);
      } else if (e.key === 'Backspace') {
        if (filter.length === 0) {
          close();
        } else {
          setFilter((f) => f.slice(0, -1));
          setSelectedIndex(0);
        }
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        setFilter((f) => f + e.key);
        setSelectedIndex(0);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }

    window.addEventListener('fleet-slash-command', handleSlashCommand);
    if (open) {
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('fleet-slash-command', handleSlashCommand);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, filter, selectedIndex, filtered, close]);

  function executeCommand(cmd: SlashCommand) {
    const editor = editorRef.current;
    if (!editor) return;

    // Delete the "/" character that triggered the menu
    const { state } = editor.view;
    const { from } = state.selection;
    const textBefore = state.doc.textBetween(from - 1 - filter.length, from, '');
    if (textBefore.startsWith('/')) {
      editor.chain().focus().deleteRange({ from: from - 1 - filter.length, to: from }).run();
    }

    cmd.action(editor);
    close();
  }

  if (!open || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="slash-command-menu"
      style={{ left: position.x, top: position.y }}
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.label}
          type="button"
          className={`slash-command-item ${i === selectedIndex ? 'selected' : ''}`}
          onClick={() => executeCommand(cmd)}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <span className="slash-command-icon">{cmd.icon}</span>
          <span className="slash-command-text">
            <span className="slash-command-label">{cmd.label}</span>
            <span className="slash-command-desc">{cmd.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
