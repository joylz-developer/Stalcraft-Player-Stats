import React from 'react';
import { cn } from '../utils/cn';
import { renderFormulaToHTML, parseFormulaHTML } from '../utils/formulas';

export const FormulaInput = React.forwardRef(({ value, onChange, onFocus, onBlur, placeholder, className }: any, ref) => {
  const divRef = React.useRef<HTMLDivElement>(null);
  const lastSelection = React.useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (divRef.current?.contains(range.commonAncestorContainer)) {
        lastSelection.current = range.cloneRange();
      }
    }
  };

  React.useEffect(() => {
    if (divRef.current && document.activeElement !== divRef.current) {
      divRef.current.innerHTML = renderFormulaToHTML(value);
    }
  }, [value]);

  React.useImperativeHandle(ref, () => ({
    insertAttribute: (attr: string) => {
      if (!divRef.current) return;
      divRef.current.focus();
      if (lastSelection.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(lastSelection.current);
      }
      const html = renderFormulaToHTML(`{${attr}}`);
      document.execCommand('insertHTML', false, html);
      saveSelection();
      onChange(parseFormulaHTML(divRef.current));
    }
  }));

  const handleInput = () => {
    if (divRef.current) {
      saveSelection();
      onChange(parseFormulaHTML(divRef.current));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div
      ref={divRef}
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={(e) => {
        saveSelection();
        if (onBlur) onBlur(e);
      }}
      onKeyUp={saveSelection}
      onMouseUp={saveSelection}
      className={cn("empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500 cursor-text whitespace-pre-wrap break-all", className)}
      data-placeholder={placeholder}
    />
  );
});
