"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cleanText, defaultCleanOptions, downloadTextAsFile, findNonPrintable, findNonPrintableWithPositions, summarizeNonPrintable, visualizeWithTokens, type CleanOptions } from "@/lib/nonprintable";

export default function HomePage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [listMode, setListMode] = useState(false);
  const [opts, setOpts] = useState<CleanOptions>(defaultCleanOptions());
  const [jumpLine, setJumpLine] = useState<string>("");
  const [jumpCol, setJumpCol] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const matches = useMemo(() => findNonPrintable(text), [text]);
  const positioned = useMemo(() => findNonPrintableWithPositions(text), [text]);
  const summary = useMemo(() => summarizeNonPrintable(text), [text]);
  const { html: previewHtml, count } = useMemo(() => visualizeWithTokens(text), [text]);

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text/plain");
    if (pasted) {
      setText((prev) => (prev.length ? prev + "\n" + pasted : pasted));
    }
  }, []);

  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const content = await file.text();
    setText(content);
    e.target.value = "";
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const content = await file.text();
    setText(content);
  }, []);

  const onClean = useCallback(() => {
    setText((t) => cleanText(t, opts));
  }, [opts]);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
  }, [text]);

  const onDownload = useCallback(() => {
    const cleaned = cleanText(text, opts);
    downloadTextAsFile(cleaned, fileName ? fileName.replace(/\.\w+$/, "-clean.txt") : "cleaned.txt");
  }, [text, fileName, opts]);

  const onClear = useCallback(() => {
    setText("");
    setFileName(null);
  }, []);

  const toggle = (key: keyof CleanOptions) => setOpts((o) => ({ ...o, [key]: !o[key] }));

  const jumpToIndex = useCallback((index: number, length: number = 1) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = Math.max(0, Math.min(index, text.length));
    const end = Math.max(start, Math.min(start + length, text.length));
    ta.focus();
    ta.setSelectionRange(start, end);
  }, [text.length]);

  const positionToIndex = useCallback((src: string, line: number, column: number): number => {
    if (line < 1 || column < 1) return 0;
    let curLine = 1;
    let curCol = 1;
    for (let i = 0; i < src.length; ) {
      if (curLine === line && curCol === column) return i;
      const cp = src.codePointAt(i)!;
      const ch = String.fromCodePoint(cp);
      if (cp === 0x0d) {
        const next = src.codePointAt(i + ch.length);
        if (next === 0x0a) {
          i += ch.length + String.fromCodePoint(next).length;
          curLine += 1; curCol = 1; continue;
        }
        i += ch.length; curLine += 1; curCol = 1; continue;
      }
      if (cp === 0x0a || cp === 0x2028 || cp === 0x2029) {
        i += ch.length; curLine += 1; curCol = 1; continue;
      }
      i += ch.length; curCol += 1;
    }
    return src.length;
  }, []);

  const onJumpSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const line = parseInt(jumpLine, 10);
    const col = parseInt(jumpCol, 10);
    if (Number.isFinite(line) && Number.isFinite(col)) {
      const idx = positionToIndex(text, line, col);
      jumpToIndex(idx, 1);
    }
  }, [jumpLine, jumpCol, positionToIndex, text, jumpToIndex]);

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="title">Non‑Printable Unicode: Viewer & Cleaner</div>
          <div className="subtitle">Paste or upload text. Preview invisible characters, then remove and export.</div>
        </div>
        <div className="badge" title="Real-time count of detected characters">
          <span className="dot" /> {count} hidden
        </div>
      </div>

      <div className="panel grid" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        <div className="section">
          <h3>Input</h3>
          <textarea
            ref={textareaRef}
            className="textarea"
            placeholder="Paste text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
          />
          <div className="controls">
            <label className="btn" htmlFor="file-input">Upload file</label>
            <input id="file-input" type="file" accept=".txt,.md,.csv,.log,.json,.xml,.yaml,.yml" style={{ display: "none" }} onChange={onUpload} />
            <button className="btn warn" onClick={onClear} disabled={!text}>Clear</button>
            <button className="btn" onClick={onCopy} disabled={!text}>Copy</button>
            <button className="btn primary" onClick={onClean} disabled={!text}>Clean with options</button>
            <button className="btn" onClick={onDownload} disabled={!text}>Download cleaned</button>
            <button className="btn" onClick={() => setListMode((v) => !v)} disabled={!count} title="Toggle viewing mode between inline highlight and separate list">{listMode ? "Show Inline Highlights" : "Show List"}</button>
          </div>

          <div className="legend" style={{ gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Remove categories</div>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.removeCc} onChange={() => toggle("removeCc")} /> Remove Cc (controls)</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.removeCf} onChange={() => toggle("removeCf")} /> Remove Cf (format)</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.removeCs} onChange={() => toggle("removeCs")} /> Remove Cs (surrogate)</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.removeCo} onChange={() => toggle("removeCo")} /> Remove Co (private)</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.removeCn} onChange={() => toggle("removeCn")} /> Remove Cn (unassigned)</label>
            </div>
            <div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Preserve controls</div>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.preserveTab} onChange={() => toggle("preserveTab")} /> Keep TAB</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.preserveLF} onChange={() => toggle("preserveLF")} /> Keep LF</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.preserveCR} onChange={() => toggle("preserveCR")} /> Keep CR</label>
            </div>
            <div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Smart replace</div>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.nbspToSpace} onChange={() => toggle("nbspToSpace")} /> Replace NBSP with space</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.normalizeDashes} onChange={() => toggle("normalizeDashes")} /> Normalize dashes to -</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.normalizeQuotes} onChange={() => toggle("normalizeQuotes")} /> Normalize “smart quotes” to straight quotes</label>
              <label style={{ display: "block" }}><input type="checkbox" checked={opts.removeZWSP} onChange={() => toggle("removeZWSP")} /> Remove ZERO WIDTH SPACE</label>
            </div>
          </div>

          <form className="controls" onSubmit={onJumpSubmit} style={{ marginTop: 8 }}>
            <span className="badge" title="Jump to line:column in the editor">Jump to</span>
            <input aria-label="Line" value={jumpLine} onChange={(e) => setJumpLine(e.target.value)} placeholder="Line" style={{ width: 80, background: "#0d1430", border: "1px solid rgba(255,255,255,.1)", color: "#e6eefc", borderRadius: 6, padding: "6px 8px" }} />
            <input aria-label="Column" value={jumpCol} onChange={(e) => setJumpCol(e.target.value)} placeholder="Column" style={{ width: 90, background: "#0d1430", border: "1px solid rgba(255,255,255,.1)", color: "#e6eefc", borderRadius: 6, padding: "6px 8px" }} />
            <button className="btn">Go</button>
          </form>
        </div>

        <div className="section">
          <h3>Preview</h3>
          {!listMode ? (
            <div className="preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <div className="preview">
              {summary.length === 0 && <div>No hidden characters.</div>}
              {summary.map((entry) => (
                <div key={entry.codePoint} className="fileRow" title={`${entry.name} (${entry.category})`}>
                  <span style={{ minWidth: 160, display: "inline-block" }}>{entry.name}</span>
                  <span style={{ color: "#9fb3ff" }}>{"U+" + entry.codePoint.toString(16).toUpperCase().padStart(4, "0")}</span>
                  <span style={{ marginLeft: 8, color: "#c3cbe0" }}>× {entry.count}</span>
                </div>
              ))}
              <div style={{ height: 8 }} />
              {positioned.slice(0, 500).map((m, idx) => (
                <div key={idx} className="fileRow" title={`${m.name} (${m.category})`}>
                  <span style={{ minWidth: 100, display: "inline-block", color: "#9fb3ff" }}>{m.line}:{m.column}</span>
                  <span style={{ minWidth: 160, display: "inline-block" }}>{m.name}</span>
                  <span style={{ color: "#c3cbe0" }}>{"U+" + m.codePoint.toString(16).toUpperCase().padStart(4, "0")}</span>
                  <button className="btn" style={{ marginLeft: "auto" }} onClick={() => jumpToIndex(m.index, m.char.length)}>Jump</button>
                </div>
              ))}
              {positioned.length > 500 && (
                <div style={{ marginTop: 6, color: "#9fb3ff" }}>Showing first 500 occurrences…</div>
              )}
            </div>
          )}

          {!!matches.length && (
            <div className="legend">
              <div>Found {matches.length} hidden characters.</div>
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        Smart Replace and Custom Cleaning Rules enabled. Jump to position available via list and line:column.
      </div>
    </div>
  );
} 