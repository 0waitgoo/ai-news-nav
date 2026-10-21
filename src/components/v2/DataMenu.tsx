import React, { useEffect, useRef, useState } from 'react';
import { Database, Download, Upload, RotateCcw, Save, FolderOpen, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { LocalStore } from '../../store/localStore';
import {
  clearPersistedHandle,
  formatSavedTime,
  fsAccessSupported,
  loadFileSaveMeta,
  loadPersistedHandle,
  persistHandle,
  pickDataFile,
  saveFileSaveMeta,
  writeToFile,
  type FileSaveMeta,
  type FsFileHandle,
} from '../../store/fileSave';

/**
 * 「数据」入口：放在搜索区旁，不显眼。
 * 本地优先方案的数据自救通道：JSON 导出（下载）/ 导入（校验后恢复）/ 恢复默认，
 * 以及第十四轮的「保存到本地文件」：设置一次默认保存文件后，可点击保存或开自动保存
 * （数据一变化就自动写回该文件）；句柄存 IndexedDB，内容与导出 JSON 完全同一格式。
 */
export default function DataMenu({ store }: { store: LocalStore }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---- 本地文件保存 ---- */
  const [supported] = useState(fsAccessSupported);
  const [handle, setHandle] = useState<FsFileHandle | null>(null);
  const [meta, setMeta] = useState<FileSaveMeta>(loadFileSaveMeta);
  const [saveStatus, setSaveStatus] = useState<{ kind: 'ok' | 'denied' | 'error' | 'saving'; text: string } | null>(null);

  // 订阅/写入时读最新值的 refs（避免 effect 依赖膨胀与闭包过期）
  const dataRef = useRef(store.data);
  dataRef.current = store.data;
  const handleRef = useRef<FsFileHandle | null>(null);
  handleRef.current = handle;
  const autoSaveRef = useRef(meta.autoSave);
  autoSaveRef.current = meta.autoSave;
  const writingRef = useRef(false);

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

  // 挂载时取回上次设置的保存文件句柄（浏览器重启后句柄还在，但写权限可能需要重新授权，写时处理）
  useEffect(() => {
    let cancelled = false;
    void loadPersistedHandle().then((h) => {
      if (cancelled || !h) return;
      setHandle(h);
      setMeta((m) => (m.fileName === h.name ? m : { ...m, fileName: h.name }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 元信息落盘（开关/文件名/上次保存时间）
  useEffect(() => {
    saveFileSaveMeta(meta);
  }, [meta]);

  const serializeData = () => JSON.stringify(dataRef.current, null, 2);

  const doWrite = async (h: FsFileHandle, request: boolean, auto: boolean): Promise<void> => {
    if (writingRef.current) return;
    writingRef.current = true;
    setSaveStatus({ kind: 'saving', text: auto ? '自动保存中…' : '保存中…' });
    try {
      const res = await writeToFile(h, serializeData(), request);
      if (res === 'ok') {
        const now = Date.now();
        setMeta((m) => ({ ...m, lastSavedAt: now }));
        setSaveStatus({ kind: 'ok', text: `${auto ? '已自动保存' : '已保存'} · ${formatSavedTime(now)}` });
      } else if (res === 'denied') {
        setSaveStatus({
          kind: 'denied',
          text: auto ? '自动保存失败：文件权限已失效' : '保存失败：没有写入权限',
        });
      } else {
        setSaveStatus({ kind: 'error', text: '保存失败，请重试' });
      }
    } finally {
      writingRef.current = false;
    }
  };

  // 自动保存：数据变化后防抖 1 秒写回文件（跳过挂载首帧；权限不在这里申请，失效时置 denied 等用户点按钮重新授权）
  const firstDataRef = useRef(true);
  useEffect(() => {
    if (firstDataRef.current) {
      firstDataRef.current = false;
      return;
    }
    if (!supported || !autoSaveRef.current || !handleRef.current) return;
    const timer = setTimeout(() => {
      const h = handleRef.current;
      if (h && autoSaveRef.current) void doWrite(h, false, true);
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.data, supported]);

  const pickAndSetFile = async (): Promise<FsFileHandle | null> => {
    const h = await pickDataFile();
    if (!h) return null;
    await persistHandle(h);
    setHandle(h);
    setMeta((m) => ({ ...m, fileName: h.name }));
    setSaveStatus(null);
    return h;
  };

  /** 点击保存：没设置文件先走选择器；手势内可申请权限 */
  const manualSave = async () => {
    if (!supported) {
      exportJson();
      return;
    }
    let h = handleRef.current;
    if (!h) h = await pickAndSetFile();
    if (h) void doWrite(h, true, false);
  };

  /** 重新授权：必须在用户手势里调用，授权成功顺手把当前数据写一次 */
  const reauthorize = async () => {
    const h = handleRef.current;
    if (h) void doWrite(h, true, false);
  };

  const clearFile = async () => {
    await clearPersistedHandle();
    setHandle(null);
    setMeta({ autoSave: false, fileName: '', lastSavedAt: null });
    setSaveStatus(null);
  };

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
  const itemDisabledCls =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-white/30 cursor-not-allowed';

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
            /* 面板全不透明实色（第十二轮，与背景面板/搜索下拉同口径）：不用 glass-panel 的半透明毛玻璃，避免透出后面的卡片内容 */
            className="absolute right-0 top-full mt-2 w-64 rounded-3xl bg-[#17171d] border border-white/15 p-2 shadow-2xl shadow-black/70 z-50"
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

            {/* ---- 本地文件保存（第十四轮）：设置一次保存文件，之后点击保存 / 变化自动保存都写回它 ---- */}
            <div className="mt-1 border-t border-white/8 px-3 pt-2.5 pb-1">
              <p className="text-[10px] font-medium text-white/50 tracking-wide">本地文件保存</p>
              {supported ? (
                <>
                  {handle ? (
                    <>
                      <p className="mt-1.5 text-[11px] text-white/70 break-all">
                        保存文件：<span className="text-white/90">{meta.fileName || handle.name}</span>
                      </p>
                      <div className="mt-1 -mx-3">
                        <button onClick={() => void manualSave()} className={itemCls}>
                          <Save size={14} className="text-white/45" /> 保存到文件
                        </button>
                        <div className="flex">
                          <button onClick={() => void pickAndSetFile()} className={`${itemCls} w-auto flex-1`}>
                            <RefreshCw size={14} className="text-white/45" /> 更换
                          </button>
                          <button onClick={() => void clearFile()} className={`${itemCls} w-auto flex-1`}>
                            <X size={14} className="text-white/45" /> 取消设置
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 -mx-3">
                      <button onClick={() => void pickAndSetFile()} className={itemCls}>
                        <FolderOpen size={14} className="text-white/45" /> 设置保存文件
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handle && setMeta((m) => ({ ...m, autoSave: !m.autoSave }))}
                    disabled={!handle}
                    className={`mt-1 w-full flex items-center justify-between py-1.5 text-xs ${handle ? 'text-white/75' : 'text-white/30 cursor-not-allowed'}`}
                  >
                    <span>数据变化自动保存</span>
                    <span
                      className={`relative h-4.5 w-8 rounded-full transition-colors ${meta.autoSave && handle ? 'bg-violet-500' : 'bg-white/15'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${meta.autoSave && handle ? 'left-4' : 'left-0.5'}`}
                      />
                    </span>
                  </button>
                  {saveStatus && (
                    <p
                      className={`pb-1 text-[11px] leading-relaxed ${
                        saveStatus.kind === 'ok'
                          ? 'text-emerald-300'
                          : saveStatus.kind === 'saving'
                            ? 'text-white/50'
                            : 'text-red-300'
                      }`}
                    >
                      {saveStatus.kind === 'denied' || saveStatus.kind === 'error' ? (
                        <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />
                      ) : null}
                      {saveStatus.text}
                      {saveStatus.kind === 'denied' && handle && (
                        <button onClick={() => void reauthorize()} className="ml-1.5 underline underline-offset-2 text-amber-300">
                          重新授权
                        </button>
                      )}
                    </p>
                  )}
                  {!saveStatus && meta.lastSavedAt && handle && (
                    <p className="pb-1 text-[11px] text-white/40">上次保存 · {formatSavedTime(meta.lastSavedAt)}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-1 -mx-3">
                    <button onClick={() => void manualSave()} className={itemCls}>
                      <Save size={14} className="text-white/45" /> 保存到文件
                    </button>
                  </div>
                  <div className={itemDisabledCls}>
                    <span className="flex-1">数据变化自动保存</span>
                    <span className="relative h-4.5 w-8 rounded-full bg-white/10">
                      <span className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white/50" />
                    </span>
                  </div>
                  <p className="pb-1 text-[10px] text-white/35 leading-relaxed">
                    当前浏览器不支持直接写本地文件，「保存到文件」将以下载方式保存；自动保存需 Chrome / Edge。
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
