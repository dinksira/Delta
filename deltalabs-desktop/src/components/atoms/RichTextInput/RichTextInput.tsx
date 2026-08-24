/**
 * RichTextInput
 * Atomic Level: Atom
 * 
 * A rich text editor component for formatted text input.
 * Note: Currently wrapping a simple textarea for prototyping. In production, 
 * this should wrap a library like Slate.js, Quill, or Tiptap.
 */

"use client";

import React from 'react';
import type { RichTextInputProps } from './RichTextInput.types';
import { Field, Textarea } from '@/components/theme';

export const RichTextInput: React.FC<RichTextInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Write something...',
  minHeight = '150px',
  className = '',
  label,
  error,
  ...props
}) => {
  return (
    <Field label={label} error={error} className={className}>
      <div className="flex flex-col border border-border-default rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-shadow">
        {/* Mock Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-border-subtle bg-surface-muted">
          <button type="button" className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-default rounded transition-colors" aria-label="Bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
          </button>
          <button type="button" className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-default rounded transition-colors" aria-label="Italic">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
          </button>
          <button type="button" className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-default rounded transition-colors" aria-label="Underline">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
          </button>
          <div className="w-px h-4 bg-border-default mx-1" />
          <button type="button" className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-default rounded transition-colors" aria-label="List">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button type="button" className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-default rounded transition-colors" aria-label="Code">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </button>
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          className="border-0 focus:ring-0 rounded-none rounded-b-md resize-y"
          style={{ minHeight }}
          {...props}
        />
      </div>
    </Field>
  );
};

RichTextInput.displayName = 'RichTextInput';
