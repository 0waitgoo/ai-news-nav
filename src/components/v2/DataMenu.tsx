import React, { useEffect, useRef, useState } from 'react';
import { Database, Download, Upload, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { LocalStore } from '../../store/localStore';

/**
 * 「数据」入口：放在搜索区旁，不显眼。
 * 本地优先方案的数据自救通道：JSON 导出（下载）/ 导入（校验后恢复）/ 恢复默认。
 */
export default function DataMenu({ store }: { store: LocalStore }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ainav-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: '已导出 JSON 文件' });
  };

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (store.importData(parsed)) {
        setMessage({ ok: true, text: '导入成功，数据已恢复' });
      } else {
        setMessage({ ok: false, text: '导入失败：文件结构不对，请用本应用导出的 JSON' });
      }
    } catch {
      setMessage({ ok: false, text: '导入失败：不是有效的 JSON 文件' });
    }
  };

  const itemCls =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-white/75 hover:bg-white/8 hover:text-white transition-colors';

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setMessage(null);
          setConfirmReset(false);
        }}
        title="数据：导出 / 导入 / 恢复默认"
        className="h-12 sm:h-13 px-2.5 sm:px-3 rounded-2xl bg-[#141419]/60 backdrop-blur-xl border border-white/[0.07] text-white/45 hover:text-white/85 hover:border-white/15 flex items-center gap-1.5 text-xs transition-colors"
      >
        <Database size={15} />
        <span className="hidden sm:inline">数据</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 glass-panel rounded-3xl bg-[#17171d]/95 p-2 shadow-2xl shadow-black/50 z-50"
          >
            <p className="px-3 pt-2 pb-1 text-[10px] text-white/35 leading-relaxed">
              数据保存在本机浏览器里。导出备份、换设备时导入即可恢复。
            </p>
            <button onClick={exportJson} className={itemCls}>
              <Download size={14} className="text-white/45" /> 导出 JSON
            </button>
            <button onClick={() => fileRef.current?.click()} className={itemCls}>
              <Upload size={14} className="text-white/45" /> 导入 JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
                e.target.value = '';
              }}
            />
            {confirmReset ? (
              <div className="px-3 py-2">
                <p className="text-[11px] text-red-300 mb-2">恢复默认会清掉你全部增删改，确定？</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      store.resetData();
                      setConfirmReset(false);
                      setMessage({ ok: true, text: '已恢复默认数据' });
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/80 text-white font-medium"
                  >
                    确认恢复
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/8 text-white/70">
                    算了
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className={itemCls}>
                <RotateCcw size={14} className="text-white/45" /> 恢复默认数据
              </button>
            )}
            {message && (
              <p className={`px-3 py-2 text-[11px] ${message.ok ? 'text-emerald-300' : 'text-red-300'}`}>{message.text}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
