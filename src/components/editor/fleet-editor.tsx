'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';

import { EditorToolbar } from './editor-toolbar';
import { SlashCommandExtension, SlashCommandMenu } from './slash-commands';
import { markdownToHtml, htmlToMarkdown } from './markdown-utils';

interface FleetEditorProps {
  content: string;
  onSave?: (markdown: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function FleetEditor({
  content,
  onSave,
  editable = true,
  placeholder = "Start writing, or press '/' for commands...",
}: FleetEditorProps) {
  const [mode, setMode] = useState<'edit' | 'source'>('edit');
  const [sourceContent, setSourceContent] = useState(content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialHtml = useRef(markdownToHtml(content));

  const debouncedSave = useCallback(
    (markdown: string) => {
      if (!onSave) return;

      setSaveStatus('unsaved');

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving');
        onSave(markdown);
        setSaveStatus('saved');
      }, 800);
    },
    [onSave]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      SlashCommandExtension,
    ],
    content: initialHtml.current,
    editable,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const md = htmlToMarkdown(html);
      setSourceContent(md);
      debouncedSave(md);
    },
    editorProps: {
      attributes: {
        class: 'fleet-editor-tiptap',
      },
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function handleModeToggle() {
    if (mode === 'edit') {
      // Switch to source: get current markdown from editor
      if (editor) {
        setSourceContent(htmlToMarkdown(editor.getHTML()));
      }
      setMode('source');
    } else {
      // Switch to edit: update editor with source content
      if (editor) {
        editor.commands.setContent(markdownToHtml(sourceContent));
      }
      setMode('edit');
    }
  }

  function handleSourceChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setSourceContent(value);
    debouncedSave(value);
  }

  return (
    <div className="fleet-editor">
      <div className="fleet-editor-header">
        {editable && mode === 'edit' && <EditorToolbar editor={editor} />}

        <div className="fleet-editor-header-right">
          {onSave && (
            <span className="fleet-editor-save-status">
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'unsaved' && 'Unsaved'}
            </span>
          )}

          {editable && (
            <button
              type="button"
              className="fleet-editor-mode-toggle"
              onClick={handleModeToggle}
              title={mode === 'edit' ? 'Switch to markdown' : 'Switch to editor'}
            >
              {mode === 'edit' ? 'Source' : 'Editor'}
            </button>
          )}
        </div>
      </div>

      <div className="fleet-editor-content">
        {mode === 'edit' ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            className="fleet-editor-source"
            value={sourceContent}
            onChange={handleSourceChange}
            spellCheck={false}
          />
        )}
      </div>

      {mode === 'edit' && <SlashCommandMenu />}
    </div>
  );
}
