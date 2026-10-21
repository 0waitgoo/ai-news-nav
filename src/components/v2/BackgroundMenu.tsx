import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, ImagePlus, Trash2, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BACKGROUND_PRESETS, type LocalStore } from '../../store/localStore';
import { deleteBgImage, saveBgImage } from '../../store/bgImageDb';

/**
 * 「背景」入口：顶栏最左侧，与「数据」按钮同款视觉。
 * 背景来源只有两种：内置预设（纯 CSS）与用户本地图片。
 * 本地图片只存本机浏览器的 IndexedDB，绝不上传；选预设即时生效，当前项打勾。
 */
export default function BackgroundMenu({ store }: { store: LocalStore }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const background = store.data.background;
  const usingLocal = background.kind === 'local';

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const pickLocalImage = async (file: File) => {
    const saved = await saveBgImage(file);
    if (saved) {
      store.setBackground({ kind: 'local', presetId: background.presetId, localStamp: Date.now() });
      setMessage({ ok: true, text: '已设为背景，图片只保存在这台设备上' });
    } else {
      setMessage({ ok: false, text: '保存失败：浏览器本地存储不可用' });
    }
  };

  const removeLocalImage = async () => {
    await deleteBgImage();
    store.setBackground({ kind: 'preset', presetId: background.presetId });
    setMessage({ ok: true, text: '已移除本地图片，回到预设背景' });
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setMessage(null);
        }}
        title="背景：预设 / 本地图片"
        className="h-12 sm:h-13 px-2.5 sm:px-3 rounded-2xl bg-[#141419]/60 backdrop-blur-xl border border-white/[0.07] text-white/45 hover:text-white/85 hover:border-white/15 flex items-center gap-1.5 text-xs transition-colors"
      >
        <ImageIcon size={15} />
        <span className="hidden sm:inline">背景</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-64 glass-panel rounded-3xl bg-[#17171d]/95 p-3 shadow-2xl shadow-black/50 z-50"
          >
            <p className="px-1 pb-2 text-[10px] tracking-wider text-white/40 uppercase">默认背景</p>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_PRESETS.map((preset) => {
                const active = !usingLocal && background.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      store.setBackground({ kind: 'preset', presetId: preset.id });
                      setMessage(null);
                    }}
                    className={`group relative h-14 rounded-2xl overflow-hidden border text-left transition-all ${
                      active ? 'border-indigo-400/80 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: preset.css }}
                  >
                    <span className="absolute left-2 bottom-1.5 text-[11px] font-medium text-white/90 drop-shadow">
                      {preset.name}
                    </span>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 w-[18px] h-[18px] rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {usingLocal && <p className="px-1 pt-2 text-[11px] text-white/40">正在使用本地图片；点选预设将切回预设背景。</p>}

            <div className="my-3 border-t border-white/[0.07]" />

            <p className="px-1 pb-1.5 text-[10px] tracking-wider text-white/40 uppercase">本地图片</p>
            <p className="px-1 pb-2.5 text-[11px] text-white/40 leading-relaxed">
              图片只保存在你这台设备的浏览器里，不会上传到任何服务器。
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-white/75 hover:bg-white/8 hover:text-white transition-colors"
            >
              <ImagePlus size={14} className="text-white/45" /> {usingLocal ? '更换本地图片' : '选择本地图片'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void pickLocalImage(file);
                e.target.value = '';
              }}
            />
            {usingLocal && (
              <button
                onClick={() => void removeLocalImage()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-red-300/85 hover:bg-red-500/10 hover:text-red-200 transition-colors"
              >
                <Trash2 size={14} /> 移除本地图片
              </button>
            )}
            {message && (
              <p className={`px-1 pt-2 text-[11px] ${message.ok ? 'text-emerald-300' : 'text-red-300'}`}>{message.text}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
