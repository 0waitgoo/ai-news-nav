import React, { useState } from 'react';
import { FileDown, Archive } from 'lucide-react';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import {
  downloadBlob,
  formatBytes,
  humanPdfError,
  isPdfFile,
  loadPdfLib,
  parsePageRanges,
  stripExt,
  yieldFrame,
} from '../../../utils/pdfTools';
import { DropZone, ErrorBox, FileChip, PrimaryButton, ProgressBar } from './shared';

type Mode = 'range' | 'each';

export default function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<Mode>('range');
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError('');
    setDoneMsg('');
    if (!isPdfFile(f)) {
      setError('这不是 PDF 文件，请选择 .pdf 文件。');
      return;
    }
    try {
      const doc = await loadPdfLib(f);
      setFile(f);
      setPageCount(doc.getPageCount());
    } catch (e) {
      setFile(null);
      setPageCount(0);
      setError(humanPdfError(e));
    }
  };

  const runRange = async () => {
    if (!file || busy) return;
    let pages: number[];
    try {
      pages = parsePageRanges(range, pageCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setBusy(true);
    setError('');
    setDoneMsg('');
    setProgress({ done: 0, total: pages.length });
    try {
      const src = await loadPdfLib(file);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, pages.map((p) => p - 1));
      copied.forEach((p) => out.addPage(p));
      setProgress({ done: pages.length, total: pages.length });
      const bytes = await out.save();
      downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), `${stripExt(file.name)}-提取.pdf`);
      setDoneMsg(`已提取 ${pages.length} 页（页码：${pages.join('、')}），文件已开始下载。`);
    } catch (e) {
      setError(humanPdfError(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const runEach = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setDoneMsg('');
    setProgress({ done: 0, total: pageCount });
    try {
      const src = await loadPdfLib(file);
      const zip = new JSZip();
      const base = stripExt(file.name);
      const pad = String(pageCount).length;
      for (let i = 0; i < pageCount; i++) {
        const out = await PDFDocument.create();
        const [p] = await out.copyPages(src, [i]);
        out.addPage(p);
        const bytes = await out.save();
        zip.file(`${base}-第${String(i + 1).padStart(pad, '0')}页.pdf`, bytes);
        setProgress({ done: i + 1, total: pageCount });
        await yieldFrame();
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${base}-逐页拆分.zip`);
      setDoneMsg(`已拆成 ${pageCount} 个单页 PDF 并打包为 ZIP，文件已开始下载。`);
    } catch (e) {
      setError(humanPdfError(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div>
      {!file ? (
        <DropZone testId="drop-split" accept="application/pdf,.pdf" onFiles={(files) => void onFiles(files)} title="把 PDF 拖到这里，或点击选择" hint="提取其中几页，或者把每一页拆成单独的 PDF" />
      ) : (
        <FileChip
          name={file.name}
          meta={`共 ${pageCount} 页 · ${formatBytes(file.size)}`}
          onRemove={() => {
            setFile(null);
            setPageCount(0);
            setError('');
            setDoneMsg('');
          }}
        />
      )}
      {error && <ErrorBox msg={error} />}

      {file && (
        <div className="mt-4">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5 w-fit">
            {(
              [
                { value: 'range', label: '提取页码范围' },
                { value: 'each', label: '每页拆成单页 PDF' },
              ] as { value: Mode; label: string }[]
            ).map((o) => (
              <button
                key={o.value}
                data-testid={`split-mode-${o.value}`}
                onClick={() => setMode(o.value)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${mode === o.value ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {mode === 'range' ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                data-testid="split-range-input"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder={`如 1-3,5（共 ${pageCount} 页）`}
                className="w-64 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50"
              />
              <PrimaryButton testId="split-range-run" onClick={runRange} disabled={busy}>
                <FileDown size={15} />
                {busy ? '提取中…' : '提取并下载 PDF'}
              </PrimaryButton>
            </div>
          ) : (
            <div className="mt-4">
              <PrimaryButton testId="split-each-run" onClick={runEach} disabled={busy}>
                <Archive size={15} />
                {busy ? '拆分中…' : `逐页拆分并打包 ZIP（${pageCount} 个）`}
              </PrimaryButton>
            </div>
          )}

          {busy && progress && <ProgressBar done={progress.done} total={progress.total} label="正在处理" />}
          {doneMsg && (
            <p data-testid="split-done" className="mt-4 text-sm text-emerald-300/90">
              {doneMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
