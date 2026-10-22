import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, FileDown, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob, formatBytes, humanPdfError, isPdfFile, loadPdfLib, stripExt, yieldFrame } from '../../../utils/pdfTools';
import { DropZone, ErrorBox, PrimaryButton, ProgressBar } from './shared';

interface MergeItem {
  id: number;
  file: File;
  pages: number | null; // null = 读取中
  failed?: string;
}

export default function PdfMerge() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const idRef = useRef(0);

  const onFiles = async (files: File[]) => {
    setError('');
    const fresh: MergeItem[] = [];
    for (const f of files) {
      if (!isPdfFile(f)) {
        setError(`「${f.name}」不是 PDF，已跳过。`);
        continue;
      }
      fresh.push({ id: ++idRef.current, file: f, pages: null });
    }
    if (!fresh.length) return;
    setItems((prev) => [...prev, ...fresh]);
    for (const item of fresh) {
      try {
        const doc = await loadPdfLib(item.file);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pages: doc.getPageCount() } : i)));
      } catch (e) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pages: 0, failed: humanPdfError(e) } : i)));
      }
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const valid = items.filter((i) => !i.failed && i.pages !== null && (i.pages ?? 0) > 0);
  const totalPages = valid.reduce((a, i) => a + (i.pages ?? 0), 0);

  const merge = async () => {
    if (valid.length < 2 || busy) return;
    setBusy(true);
    setError('');
    setProgress({ done: 0, total: totalPages });
    try {
      const out = await PDFDocument.create();
      let donePages = 0;
      for (const item of valid) {
        const src = await loadPdfLib(item.file);
        const copied = await out.copyPages(src, src.getPageIndices());
        for (const p of copied) {
          out.addPage(p);
          donePages += 1;
        }
        setProgress({ done: donePages, total: totalPages });
        await yieldFrame();
      }
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        `${stripExt(valid[0].file.name)}-合并.pdf`,
      );
    } catch (e) {
      setError(humanPdfError(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <DropZone
        testId="drop-merge"
        accept="application/pdf,.pdf"
        multiple
        onFiles={(files) => void onFiles(files)}
        title="把 PDF 拖到这里，或点击选择（可多选、可多次添加）"
        hint="按列表从上到下的顺序合并成一个 PDF，顺序可上下调整"
      />
      {error && <ErrorBox msg={error} />}

      {items.length > 0 && (
        <>
          <div data-testid="merge-list" className="mt-4 space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/90">{item.file.name}</p>
                  <p className="text-xs text-white/45">
                    {item.failed ? (
                      <span className="text-red-300">{item.failed}</span>
                    ) : item.pages === null ? (
                      '读取页数中…'
                    ) : (
                      `${item.pages} 页 · ${formatBytes(item.file.size)}`
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-30" title="上移">
                    <ChevronUp size={15} />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-30" title="下移">
                    <ChevronDown size={15} />
                  </button>
                  <button onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-red-300" title="删除">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <PrimaryButton testId="merge-run" onClick={merge} disabled={busy || valid.length < 2}>
              <FileDown size={15} />
              {busy ? '合并中…' : '合并并下载'}
            </PrimaryButton>
            <span data-testid="merge-total" className="text-xs text-white/55">
              {valid.length} 个文件 · 合计 {totalPages} 页{valid.length < 2 ? '（至少需要 2 个可用的 PDF）' : ''}
            </span>
          </div>
          {busy && progress && <ProgressBar done={progress.done} total={progress.total} label="正在合并" />}
        </>
      )}
    </div>
  );
}
