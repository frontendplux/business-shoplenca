import React, { useEffect, useRef, useState } from 'react';

const COLOR_SWATCHES = [
  { color: '#111827', label: 'Ink Black' },
  { color: '#7b1d8e', label: 'Brand Purple' },
  { color: '#e11d48', label: 'Crimson Rose' },
  { color: '#d97706', label: 'Amber Gold' },
  { color: '#059669', label: 'Emerald' },
  { color: '#2563eb', label: 'Royal Blue' },
];

const HIGHLIGHT_SWATCHES = [
  { color: '#fef08a', label: 'Yellow Highlight' },
  { color: '#f3e8ff', label: 'Purple Highlight' },
  { color: '#dcfce7', label: 'Green Highlight' },
  { color: '#fee2e2', label: 'Rose Highlight' },
];

/**
 * RichTextEditor — Studio-Grade Tailwind v4 WYSIWYG Document, Book & Product Editor
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing your chapter, article, or product story here...',
  minHeight = 260,
  label = '',
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isInternalChange = useRef(false);

  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'paper' | 'html'
  const [fullscreen, setFullscreen] = useState(false);
  const [activePopover, setActivePopover] = useState(null); // null | 'link' | 'image' | 'color'
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [stats, setStats] = useState({ words: 0, chars: 0, paragraphs: 0, readMin: 1 });

  const computeStats = (htmlStr) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlStr || '';
    const plain = (tmp.textContent || tmp.innerText || '').trim();
    const chars = plain.length;
    const words = plain ? plain.split(/\s+/).length : 0;
    const pCount = tmp.querySelectorAll('p, h1, h2, h3, h4, li, blockquote').length || (words > 0 ? 1 : 0);
    const readMin = Math.max(1, Math.ceil(words / 200));
    setStats({ words, chars, paragraphs: pCount, readMin });
  };

  useEffect(() => {
    if (viewMode !== 'html' && editorRef.current) {
      if (!isInternalChange.current && editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
    computeStats(value);
  }, [value, viewMode]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    isInternalChange.current = true;
    computeStats(html);
    if (onChange) onChange(html);
  };

  const exec = (cmd, arg = null) => {
    if (viewMode === 'html') return;
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, arg);
      emitChange();
    }
  };

  const insertHtmlSnippet = (snippet) => {
    if (viewMode === 'html') {
      const nextVal = (value || '') + '\n' + snippet;
      computeStats(nextVal);
      if (onChange) onChange(nextVal);
      return;
    }
    exec('insertHTML', snippet);
  };

  const handleConfirmLink = () => {
    if (!linkUrl || linkUrl === 'https://') {
      setActivePopover(null);
      return;
    }
    if (linkText.trim()) {
      insertHtmlSnippet(
        `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a> `
      );
    } else {
      exec('createLink', linkUrl);
    }
    setLinkUrl('https://');
    setLinkText('');
    setActivePopover(null);
  };

  const handleConfirmImageUrl = () => {
    if (!imageUrl.trim()) return;
    insertHtmlSnippet(
      `<figure style="margin:14px 0;"><img src="${imageUrl.trim()}" alt="${
        imageAlt.trim() || 'Illustration'
      }" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.08);" />${
        imageAlt.trim()
          ? `<figcaption style="font-size:12px;color:#6b7280;text-align:center;margin-top:6px;">${imageAlt.trim()}</figcaption>`
          : ''
      }</figure><p><br/></p>`
    );
    setImageUrl('');
    setImageAlt('');
    setActivePopover(null);
  };

  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        insertHtmlSnippet(
          `<figure style="margin:14px 0;"><img src="${dataUrl}" alt="${
            file.name
          }" style="max-width:100%;height:auto;border-radius:10px;" /></figure><p><br/></p>`
        );
        setActivePopover(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Smart 1-Click Templates
  const insertChapterTemplate = () => {
    insertHtmlSnippet(`
      <h2>Chapter Title: The Turning Point</h2>
      <blockquote>"Every great journey begins with a single bold decision."</blockquote>
      <p><strong>I</strong>t was early morning when the marketplace came alive. Write your opening paragraph here with rich detail, dialogue, and pacing...</p>
      <hr />
      <h3>Scene II</h3>
      <p>Continue your chapter narrative here...</p>
    `);
  };

  const insertSpecTable = () => {
    insertHtmlSnippet(`
      <table>
        <thead>
          <tr>
            <th>Specification / Feature</th>
            <th>Official Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Model / Edition</strong></td>
            <td>2026 Premium Original Edition</td>
          </tr>
          <tr>
            <td><strong>Material / Build</strong></td>
            <td>High-Grade Durable Finish</td>
          </tr>
          <tr>
            <td><strong>Warranty & Support</strong></td>
            <td>12 Months Official Store Warranty</td>
          </tr>
          <tr>
            <td><strong>What's in the Box</strong></td>
            <td>Main Item, User Manual & Warranty Card</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `);
  };

  const insertKeyFeaturesBox = () => {
    insertHtmlSnippet(`
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #059669;padding:14px 18px;border-radius:10px;margin:12px 0;">
        <h4 style="margin:0 0 8px;color:#065f46;font-weight:800;">✅ Key Highlights & Benefits</h4>
        <ul style="margin:0;padding-left:20px;color:#1f2937;">
          <li><strong>Authentic Quality:</strong> 100% verified original product</li>
          <li><strong>Fast Delivery:</strong> Express nationwide & international shipping</li>
          <li><strong>Easy Returns:</strong> 7-day hassle-free buyer protection</li>
        </ul>
      </div>
      <p><br/></p>
    `);
  };

  const insertCalloutBox = () => {
    insertHtmlSnippet(`
      <blockquote>
        <strong>💡 Pro Tip / Author's Note:</strong> Share a key takeaway, insider tip, or important highlight with your readers right here.
      </blockquote>
      <p><br/></p>
    `);
  };

  const insertWarningBox = () => {
    insertHtmlSnippet(`
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-left:4px solid #e11d48;padding:12px 16px;border-radius:10px;margin:12px 0;color:#881337;">
        <strong>⚠️ Important Note:</strong> Please read these instructions carefully before proceeding.
      </div>
      <p><br/></p>
    `);
  };

  const ToolbarBtn = ({ onClick, title, active = false, disabled = false, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition select-none ${
        active
          ? 'bg-purple-700 text-white shadow-xs'
          : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 border border-gray-200/90'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col transition-all ${
        fullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0' : ''
      }`}
    >
      {/* Top Studio Bar: Label + View Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-400 text-gray-950 flex items-center justify-center text-xs font-black">
            <i className="bi bi-vector-pen" />
          </span>
          <span className="text-xs font-extrabold tracking-wide">
            {label || 'Publishing Studio Rich Editor'}
          </span>
        </div>

        {/* View Modes: Visual | Book Paper | HTML Code | Fullscreen */}
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              viewMode === 'visual' ? 'bg-amber-400 text-gray-950' : 'text-gray-200 hover:text-white'
            }`}
          >
            <i className="bi bi-layout-text-window-reverse" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('paper')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              viewMode === 'paper' ? 'bg-amber-400 text-gray-950' : 'text-gray-200 hover:text-white'
            }`}
            title="Book / Paper Page View"
          >
            <i className="bi bi-journal-richtext" />
            <span>Book Page</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('html')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              viewMode === 'html' ? 'bg-amber-400 text-gray-950' : 'text-gray-200 hover:text-white'
            }`}
            title="Edit Raw HTML Source"
          >
            <i className="bi bi-code-slash" />
            <span>HTML</span>
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              fullscreen ? 'bg-rose-500 text-white' : 'text-gray-200 hover:text-white'
            }`}
            title="Toggle Fullscreen Studio"
          >
            <i className={`bi ${fullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`} />
            <span className="hidden sm:inline">{fullscreen ? 'Exit Fullscreen' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* Quick Insert Smart Templates Strip */}
      <div className="bg-purple-50/70 border-b border-purple-100 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 shrink-0 mr-1">
          <i className="bi bi-stars mr-1" />
          Quick Blocks:
        </span>
        <button
          type="button"
          onClick={insertChapterTemplate}
          className="text-[11px] font-bold bg-white hover:bg-purple-700 hover:text-white text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <i className="bi bi-book-half" />
          <span>+ Book Chapter</span>
        </button>
        <button
          type="button"
          onClick={insertSpecTable}
          className="text-[11px] font-bold bg-white hover:bg-purple-700 hover:text-white text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <i className="bi bi-table" />
          <span>+ Spec Table</span>
        </button>
        <button
          type="button"
          onClick={insertKeyFeaturesBox}
          className="text-[11px] font-bold bg-white hover:bg-purple-700 hover:text-white text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <i className="bi bi-check2-square" />
          <span>+ Key Highlights</span>
        </button>
        <button
          type="button"
          onClick={insertCalloutBox}
          className="text-[11px] font-bold bg-white hover:bg-purple-700 hover:text-white text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <i className="bi bi-chat-quote" />
          <span>+ Pro Callout</span>
        </button>
        <button
          type="button"
          onClick={insertWarningBox}
          className="text-[11px] font-bold bg-white hover:bg-purple-700 hover:text-white text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <i className="bi bi-exclamation-diamond" />
          <span>+ Alert Box</span>
        </button>
      </div>

      {/* Main Formatting Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1.5">
        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => exec('undo')} disabled={viewMode === 'html'} title="Undo (Ctrl+Z)">
          <i className="bi bi-arrow-counterclockwise" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('redo')} disabled={viewMode === 'html'} title="Redo (Ctrl+Y)">
          <i className="bi bi-arrow-clockwise" />
        </ToolbarBtn>

        <span className="h-5 w-px bg-gray-300 mx-0.5" />

        {/* Heading / Block Selector */}
        <select
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-600"
          defaultValue="P"
          onChange={(e) => exec('formatBlock', e.target.value)}
          disabled={viewMode === 'html'}
          title="Paragraph / Heading Style"
        >
          <option value="P">Paragraph</option>
          <option value="H1">Heading 1 (Title)</option>
          <option value="H2">Heading 2 (Section)</option>
          <option value="H3">Heading 3 (Sub-section)</option>
          <option value="H4">Heading 4</option>
          <option value="BLOCKQUOTE">Blockquote</option>
          <option value="PRE">Code Block</option>
        </select>

        {/* Font Family */}
        <select
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-purple-600"
          defaultValue="Inter, sans-serif"
          onChange={(e) => exec('fontName', e.target.value)}
          disabled={viewMode === 'html'}
          title="Font Family"
        >
          <option value="Inter, system-ui, sans-serif">Sans-Serif</option>
          <option value="Georgia, Cambria, serif">Book Serif</option>
          <option value="Times New Roman, Times, serif">Classic Print</option>
          <option value="ui-monospace, Consolas, monospace">Monospace</option>
        </select>

        {/* Font Size */}
        <select
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-purple-600"
          defaultValue="3"
          onChange={(e) => exec('fontSize', e.target.value)}
          disabled={viewMode === 'html'}
          title="Font Size"
        >
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Medium</option>
          <option value="5">Large</option>
          <option value="6">X-Large</option>
          <option value="7">Huge</option>
        </select>

        <span className="h-5 w-px bg-gray-300 mx-0.5" />

        {/* Text Formatting */}
        <ToolbarBtn onClick={() => exec('bold')} disabled={viewMode === 'html'} title="Bold (Ctrl+B)">
          <strong className="font-black">B</strong>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} disabled={viewMode === 'html'} title="Italic (Ctrl+I)">
          <em className="font-serif italic">I</em>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} disabled={viewMode === 'html'} title="Underline (Ctrl+U)">
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('strikeThrough')} disabled={viewMode === 'html'} title="Strikethrough">
          <span className="line-through">S</span>
        </ToolbarBtn>

        {/* Color & Highlight Popover Toggle */}
        <ToolbarBtn
          onClick={() => setActivePopover(activePopover === 'color' ? null : 'color')}
          active={activePopover === 'color'}
          disabled={viewMode === 'html'}
          title="Text & Highlight Colors"
        >
          <i className="bi bi-palette-fill text-purple-600" />
          <span className="hidden md:inline">Color</span>
        </ToolbarBtn>

        <span className="h-5 w-px bg-gray-300 mx-0.5" />

        {/* Alignment */}
        <ToolbarBtn onClick={() => exec('justifyLeft')} disabled={viewMode === 'html'} title="Align Left">
          <i className="bi bi-text-left" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyCenter')} disabled={viewMode === 'html'} title="Align Center">
          <i className="bi bi-text-center" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyRight')} disabled={viewMode === 'html'} title="Align Right">
          <i className="bi bi-text-right" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyFull')} disabled={viewMode === 'html'} title="Justify Book Text">
          <i className="bi bi-justify" />
        </ToolbarBtn>

        <span className="h-5 w-px bg-gray-300 mx-0.5" />

        {/* Lists */}
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} disabled={viewMode === 'html'} title="Bullet List">
          <i className="bi bi-list-ul" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} disabled={viewMode === 'html'} title="Numbered List">
          <i className="bi bi-list-ol" />
        </ToolbarBtn>

        <span className="h-5 w-px bg-gray-300 mx-0.5" />

        {/* Link, Image, Divider, Clear */}
        <ToolbarBtn
          onClick={() => setActivePopover(activePopover === 'link' ? null : 'link')}
          active={activePopover === 'link'}
          disabled={viewMode === 'html'}
          title="Insert Hyperlink"
        >
          <i className="bi bi-link-45deg" />
          <span className="hidden lg:inline">Link</span>
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => setActivePopover(activePopover === 'image' ? null : 'image')}
          active={activePopover === 'image'}
          disabled={viewMode === 'html'}
          title="Insert Image (URL or Upload)"
        >
          <i className="bi bi-image" />
          <span className="hidden lg:inline">Image</span>
        </ToolbarBtn>

        <ToolbarBtn onClick={() => exec('insertHorizontalRule')} disabled={viewMode === 'html'} title="Insert Scene Divider Line">
          <i className="bi bi-hr" />
        </ToolbarBtn>

        <ToolbarBtn onClick={() => exec('removeFormat')} disabled={viewMode === 'html'} title="Clear Formatting">
          <i className="bi bi-eraser" />
        </ToolbarBtn>
      </div>

      {/* Inline Popover Bars (Color Swatches / Link Insertion / Image Upload & URL) */}
      {activePopover === 'color' && (
        <div className="bg-white border-b border-gray-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-600">Text Color:</span>
            {COLOR_SWATCHES.map((s) => (
              <button
                key={s.color}
                type="button"
                onClick={() => exec('foreColor', s.color)}
                title={s.label}
                className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition shadow-2xs"
                style={{ backgroundColor: s.color }}
              />
            ))}
            <input
              type="color"
              defaultValue="#7b1d8e"
              onChange={(e) => exec('foreColor', e.target.value)}
              className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer"
              title="Custom Text Color"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-600">Highlight:</span>
            {HIGHLIGHT_SWATCHES.map((s) => (
              <button
                key={s.color}
                type="button"
                onClick={() => exec('hiliteColor', s.color)}
                title={s.label}
                className="w-6 h-6 rounded-md border border-gray-300 hover:scale-110 transition"
                style={{ backgroundColor: s.color }}
              />
            ))}
            <button
              type="button"
              onClick={() => setActivePopover(null)}
              className="text-gray-400 hover:text-gray-700 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {activePopover === 'link' && (
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold text-indigo-900">
            <i className="bi bi-link-45deg mr-1" />
            Insert Link:
          </span>
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Link label (optional)"
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600 w-40"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600 flex-1 min-w-[180px]"
          />
          <button
            type="button"
            onClick={handleConfirmLink}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
          >
            Insert Link
          </button>
          <button
            type="button"
            onClick={() => setActivePopover(null)}
            className="text-gray-500 hover:text-gray-800 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {activePopover === 'image' && (
        <div className="bg-purple-50/70 border-b border-purple-100 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold text-purple-900">
            <i className="bi bi-image mr-1" />
            Add Image:
          </span>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste Image URL (https://...)"
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-600 flex-1 min-w-[180px]"
          />
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Caption / Alt text (optional)"
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-600 w-44"
          />
          <button
            type="button"
            onClick={handleConfirmImageUrl}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-1.5 rounded-lg transition"
          >
            Insert URL
          </button>
          <span className="text-gray-400 font-bold">or</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            <i className="bi bi-upload" />
            <span>Upload from Device</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLocalImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setActivePopover(null)}
            className="text-gray-500 hover:text-gray-800 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Editable Canvas */}
      {viewMode === 'html' ? (
        <textarea
          value={value || ''}
          onChange={(e) => {
            computeStats(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          placeholder="Write or paste raw HTML source code here..."
          className="w-full flex-1 bg-slate-950 text-emerald-300 font-mono text-xs p-4 focus:outline-none resize-y"
          style={{ minHeight: fullscreen ? '75vh' : minHeight }}
        />
      ) : (
        <div
          className={`flex-1 overflow-y-auto transition-colors ${
            viewMode === 'paper' ? 'bg-stone-100 p-4 sm:p-8' : 'bg-white'
          }`}
          style={{
            minHeight: fullscreen ? '75vh' : minHeight,
            maxHeight: fullscreen ? '82vh' : 560,
          }}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emitChange}
            onBlur={emitChange}
            data-placeholder={placeholder}
            className={`rte-content focus:outline-none text-gray-800 ${
              viewMode === 'paper'
                ? 'max-w-2xl mx-auto bg-white shadow-md border border-stone-200/80 rounded-xl p-6 sm:p-10 min-h-[360px] font-serif text-base leading-relaxed'
                : 'p-4 text-sm sm:text-base leading-relaxed min-h-full'
            }`}
          />
        </div>
      )}

      {/* Studio Status & Reading Time Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
            <i className="bi bi-check-circle-fill" />
            Ready
          </span>
          <span>&bull;</span>
          <span>Tip: Use <strong>Quick Blocks</strong> above to insert formatted chapters, spec tables, or callouts</span>
        </div>

        <div className="flex items-center gap-3 font-semibold text-gray-600">
          <span>
            <strong>{stats.words}</strong> words
          </span>
          <span>
            <strong>{stats.chars}</strong> chars
          </span>
          <span>
            <strong>{stats.paragraphs}</strong> blocks
          </span>
          <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
            ~{stats.readMin} min read
          </span>
        </div>
      </div>
    </div>
  );
}
