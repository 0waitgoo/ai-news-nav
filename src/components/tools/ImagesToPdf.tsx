import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, FileDown, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadBlob, formatBytes, humanPdfError, isImageFile, stripExt } from '../../utils/pdfTools';
import { DropZone, ErrorBox, PrimaryButton } from './shared';

interface ImgItem {
  id: number;
  file: File;
  url: string;
  w: number;
  h: number;
}

/** pdf-lib 只认 PNG/JPG；webp 等格式先经画布转成 PNG 字节 */
async function embedAny(doc: PDFDocument, item: ImgItem) {
  const type = item.file.type;
  const name = item.file.name.toLowerCase();
  const bytes = new Uint8Array(await item.file.arrayBuffer());
  if (type === 'image/png' || name.endsWith('.png')) return doc.embedPng(bytes);
  if (type === 'image/jpeg' || /\.jpe?g$/.test(name)) return doc.embedJpg(bytes);
  const bitmap = await createImageBitmap(item.file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器无法创建画布');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('图片转换失败'))), 'image/png'),
  );
  return doc.embedPng(new Uint8Array(await blob.arrayBuffer()));
}

export default function ImagesToPdf({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const idRef = useRef(0);

  const onFiles = async (files: File[]) => {
    setError('');
    const added: ImgItem[] = [];
    for (const f of files) {
      if (!isImageFile(f)) {
        setError(`「${f.name}」不是图片，已跳过。`);
        continue;
      }
      try {
        const bitmap = await createImageBitmap(f);
        added.push({ id: ++idRef.current, file: f, url: URL.createObjectURL(f), w: bitmap.width, h: bitmap.height });
        bitmap.close();
      } catch {
        setError(`「${f.name}」读取失败，可能已损坏。`);
      }
    }
    if (added.length) setItems((prev) => [...prev, ...added]);
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

  const remove = (id: number) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const generate = async () => {
    if (items.length === 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      const doc = await PDFDocument.create();
      for (const item of items) {
        const img = await embedAny(doc, item);
        // 页面尺寸贴合图片本身（1px = 1pt）
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const bytes = await doc.save();
      const name = items.length === 1 ? `${stripExt(items[0].file.name)}.pdf` : `图片合集-${items.length}张.pdf`;
      downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), name);
    } catch (e) {
      setError(humanPdfError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DropZone
        compact={compact}
        testId="drop-img2pdf"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        multiple
        onFiles={(files) => void onFiles(files)}
        title="把图片拖到这里，或点击选择（可多选）"
        hint="每张图片生成一页，页面大小与图片一致；顺序就是页序，可上下调整"
      />
      {error && <ErrorBox msg={error} />}

      {items.length > 0 && (
        <>
          <div data-testid="img2pdf-list" className="mt-4 space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <img src={item.url} alt={item.file.name} className="h-11 w-11 shrink-0 rounded-lg object-cover bg-black/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/90">{item.file.name}</p>
                  <p className="text-xs text-white/45">
                    第 {idx + 1} 页 · {item.w}×{item.h} · {formatBytes(item.file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button data-testid={`img2pdf-up-${item.id}`} onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-30" title="上移">
                    <ChevronUp size={15} />
                  </button>
                  <button data-testid={`img2pdf-down-${item.id}`} onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-30" title="下移">
                    <ChevronDown size={15} />
                  </button>
                  <button data-testid={`img2pdf-del-${item.id}`} onClick={() => remove(item.id)} className="rounded-md p-1.5 text-white/55 hover:bg-white/10 hover:text-red-300" title="删除">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <PrimaryButton testId="img2pdf-generate" onClick={generate} disabled={busy}>
              <FileDown size={15} />
              {busy ? '生成中…' : `生成 PDF（${items.length} 页）`}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}
