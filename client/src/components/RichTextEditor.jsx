import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Eye,
  Edit3,
  Code2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { isValidUrl, normalizeUrl, renderRichContent, isContentEmpty } from '../utils/richText';

const RichTextEditor = ({
  id = 'input-blog-content',
  name = 'content',
  value = '',
  onChange,
  placeholder = 'Write your story with rich formatting...',
  minHeight = '320px',
  required = true,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState('source'); // 'source' | 'visual' | 'preview'
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState('');

  const visualEditorRef = useRef(null);
  const textareaRef = useRef(null);
  const savedSelectionRange = useRef(null);

  // Synchronize visual editor with incoming external value
  useEffect(() => {
    if (visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== value) {
        visualEditorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Handle content change from Visual editor
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      if (onChange) {
        onChange({ target: { name, value: html } });
      }
    }
  };

  // Handle content change from Source textarea
  const handleSourceChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Save selection before opening link modal
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRange.current = sel.getRangeAt(0).cloneRange();
      const selected = sel.toString().trim();
      if (selected) {
        setLinkText(selected);
      }
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRange.current);
    }
  };

  // Execute formatting command in Visual Mode
  const executeVisualCommand = (command, val = null) => {
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      document.execCommand(command, false, val);
      handleVisualInput();
    }
  };

  // Apply formatting in Source Mode (textarea)
  const applySourceFormatting = (prefix, suffix, defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = textarea.value || '';
    const selectedText = currentVal.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    textarea.value = newVal;
    if (onChange) {
      onChange({ target: { name, value: newVal } });
    }

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Unified Toolbar Handlers
  const handleFormatBold = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('bold');
    } else {
      applySourceFormatting('<strong>', '</strong>', 'Bold text');
    }
  };

  const handleFormatItalic = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('italic');
    } else {
      applySourceFormatting('<em>', '</em>', 'Italic text');
    }
  };

  const handleFormatH2 = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('formatBlock', '<h2>');
    } else {
      applySourceFormatting('<h2>', '</h2>', 'Heading 2');
    }
  };

  const handleFormatH3 = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('formatBlock', '<h3>');
    } else {
      applySourceFormatting('<h3>', '</h3>', 'Heading 3');
    }
  };

  const handleFormatBulletList = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('insertUnorderedList');
    } else {
      applySourceFormatting('<ul>\n  <li>', '</li>\n</ul>', 'List item');
    }
  };

  const handleFormatOrderedList = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('insertOrderedList');
    } else {
      applySourceFormatting('<ol>\n  <li>', '</li>\n</ol>', 'List item');
    }
  };

  const handleFormatQuote = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('formatBlock', '<blockquote>');
    } else {
      applySourceFormatting('<blockquote>', '</blockquote>', 'Quote text');
    }
  };

  const handleFormatCode = () => {
    if (activeTab === 'visual') {
      executeVisualCommand('formatBlock', '<pre>');
    } else {
      applySourceFormatting('<code>', '</code>', 'code snippet');
    }
  };

  // Link Dialog Handlers
  const handleOpenLinkModal = () => {
    saveSelection();
    setLinkUrl('');
    setLinkError('');
    setShowLinkModal(true);
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setLinkError('Please enter a valid web destination URL.');
      return;
    }

    if (!isValidUrl(linkUrl)) {
      setLinkError('Invalid link URL format. Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    const safeUrl = normalizeUrl(linkUrl);
    const textToInsert = linkText.trim() || safeUrl;

    if (activeTab === 'visual') {
      restoreSelection();
      executeVisualCommand('createLink', safeUrl);
    } else {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const currentVal = textarea.value || '';
        const selectedText = currentVal.substring(start, end) || textToInsert;
        const anchorHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
        const newVal = currentVal.substring(0, start) + anchorHtml + currentVal.substring(end);
        textarea.value = newVal;
        if (onChange) {
          onChange({ target: { name, value: newVal } });
        }
      }
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setLinkError('');
  };


  // Calculate word count
  const plainText = (value || '').replace(/<[^>]*>?/gm, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="rich-text-editor-container" style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', overflow: 'hidden' }}>
      {/* Top Toolbar */}
      <div
        className="rich-text-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-medium)',
          gap: '0.5rem'
        }}
      >
        {/* Formatting Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            id="btn-format-bold"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatBold}
            disabled={disabled || activeTab === 'preview'}
            title="Bold"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <Bold size={15} />
          </button>

          <button
            type="button"
            id="btn-format-italic"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatItalic}
            disabled={disabled || activeTab === 'preview'}
            title="Italic"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <Italic size={15} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-medium)', margin: '0 0.2rem' }} />

          <button
            type="button"
            id="btn-format-h2"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatH2}
            disabled={disabled || activeTab === 'preview'}
            title="Heading 2"
            style={{ padding: '0.4rem 0.6rem', fontWeight: 700 }}
          >
            <Heading2 size={16} />
          </button>

          <button
            type="button"
            id="btn-format-h3"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatH3}
            disabled={disabled || activeTab === 'preview'}
            title="Subheading 3"
            style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}
          >
            <Heading3 size={16} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-medium)', margin: '0 0.2rem' }} />

          <button
            type="button"
            id="btn-format-bullet-list"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatBulletList}
            disabled={disabled || activeTab === 'preview'}
            title="Bullet List"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <List size={16} />
          </button>

          <button
            type="button"
            id="btn-format-ordered-list"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatOrderedList}
            disabled={disabled || activeTab === 'preview'}
            title="Numbered List"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ListOrdered size={16} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-medium)', margin: '0 0.2rem' }} />

          <button
            type="button"
            id="btn-format-quote"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatQuote}
            disabled={disabled || activeTab === 'preview'}
            title="Blockquote"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <Quote size={15} />
          </button>

          <button
            type="button"
            id="btn-format-code"
            className="btn btn-ghost btn-sm"
            onClick={handleFormatCode}
            disabled={disabled || activeTab === 'preview'}
            title="Code Block"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <Code size={15} />
          </button>

          <button
            type="button"
            id="btn-format-link"
            className="btn btn-ghost btn-sm"
            onClick={handleOpenLinkModal}
            disabled={disabled || activeTab === 'preview'}
            title="Insert Link"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <LinkIcon size={15} />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            id="btn-tab-visual"
            className={`btn btn-sm ${activeTab === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('visual')}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Edit3 size={13} />
            <span>Visual</span>
          </button>

          <button
            type="button"
            id="btn-tab-source"
            className={`btn btn-sm ${activeTab === 'source' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('source')}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Code2 size={13} />
            <span>HTML</span>
          </button>

          <button
            type="button"
            id="btn-tab-preview"
            className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('preview')}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body Area */}
      <div style={{ position: 'relative', minHeight }}>
        {/* Visual Mode: ContentEditable Area */}
        <div
          id="rich-text-visual-editor"
          ref={visualEditorRef}
          contentEditable={!disabled}
          onInput={handleVisualInput}
          className="rich-text-content"
          style={{
            display: activeTab === 'visual' ? 'block' : 'none',
            padding: '1.25rem',
            minHeight,
            outline: 'none',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            background: 'var(--bg-surface)'
          }}
          data-placeholder={placeholder}
        />

        {/* Source Mode: Textarea (Always mounted for seamless form bindings & tests) */}
        <textarea
          id={id}
          ref={textareaRef}
          name={name}
          className="form-textarea"
          value={value}
          onChange={handleSourceChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{
            display: activeTab === 'source' ? 'block' : 'none',
            width: '100%',
            height: '100%',
            minHeight,
            padding: '1.25rem',
            border: 'none',
            borderRadius: 0,
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            resize: 'vertical'
          }}
        />

        {/* Hidden Fallback Textarea in Visual/Preview Mode so page.fill('#id') and native form submit always work */}
        {activeTab !== 'source' && (
          <textarea
            id={`${id}-sync-fallback`}
            tabIndex={-1}
            aria-hidden="true"
            value={value}
            onChange={handleSourceChange}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: 0,
              height: 0
            }}
          />
        )}

        {/* Live Preview Mode */}
        {activeTab === 'preview' && (
          <div
            id="rich-text-preview-pane"
            className="rich-text-content"
            style={{
              padding: '1.5rem',
              minHeight,
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)'
            }}
            dangerouslySetInnerHTML={{
              __html: renderRichContent(value) || `<p class="text-muted" style="font-style: italic;">No formatted content to preview.</p>`
            }}
          />
        )}
      </div>

      {/* Editor Status Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.45rem 1rem',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>
          Mode: <strong style={{ color: 'var(--primary)' }}>{activeTab.toUpperCase()}</strong> &bull; Rich Formatting Enabled
        </span>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      </div>

      {/* Link Insertion Modal / Popover */}
      {showLinkModal && (
        <div
          id="link-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLinkModal(false);
          }}
        >
          <div
            id="link-modal"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '440px',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <LinkIcon size={18} style={{ color: 'var(--primary)' }} />
                Insert Hyperlink
              </h3>
              <button
                type="button"
                id="btn-close-link-modal"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowLinkModal(false)}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {linkError && (
              <div
                id="link-error-banner"
                className="alert alert-danger"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fb7185'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{linkError}</span>
              </div>
            )}

            <div
              className="link-modal-form"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertLink(e);
                }
              }}
            >
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-link-text" className="form-label" style={{ fontSize: '0.825rem' }}>
                  Anchor Text (Optional)
                </label>
                <input
                  type="text"
                  id="input-link-text"
                  className="form-input"
                  placeholder="e.g. Read the official documentation"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="input-link-url" className="form-label" style={{ fontSize: '0.825rem' }}>
                  Destination URL <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="input-link-url"
                  className="form-input"
                  placeholder="https://example.com/article"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    if (linkError) setLinkError('');
                  }}
                  autoFocus
                />
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  Supports web links (https://, http://) or mailto: links.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  id="btn-cancel-link"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowLinkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-insert-link"
                  className="btn btn-primary btn-sm"
                  onClick={handleInsertLink}
                >
                  <Check size={14} />
                  <span>Insert Link</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
