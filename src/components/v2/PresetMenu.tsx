import React, { useEffect, useRef, useState } from 'react';
import { Check, LayoutTemplate } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { LocalStore, PresetId } from '../../store/localStore';
import { BUILTIN_PRESET_META, buildBuiltinPreset } from '../../data/presets';

/**
 * 「预设」入口（第一百零六轮，接替原顶栏扳手）：布局/模板图标点开浮层，
 * 五套主页构成一键切换——默认 / 设计师 / 程序员 / 工具 / 我的。
 * 切换只换主页构成（编组、组件、布局），计划数据与外观设置不动，无二次确认：
 * 切走前当前构成会自动存进「我的」兜底（状态机见 store.applyPreset）。
 * 面板形态与 BackgroundMenu 同款：无底色图标触发 + 实色浮层 + 点外关闭。
 */
export default function PresetMenu({ store }: { store: LocalStore }) {
  const [open, setOpen] = useState(false);
  // 面板横向平移（打开时按按钮位置算）：按钮在顶栏左组第三位，手机上从按钮左缘
  // 展开 288px 面板会溢出右缘——把面板往左平移进视口（两侧各留 12px），桌面不动
  const [panelShift, setPanelShift] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePreset = store.data.activePreset;
  const hasMyArchive = !!store.data.myPreset;

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const panelW = Math.min(288, window.innerWidth - 24);
    let shift = 0;
    if (rect.left + panelW > window.innerWidth - 12) shift = window.innerWidth - 12 - rect.left - panelW;
    if (rect.left + shift < 12) shift = 12 - rect.left;
    setPanelShift(shift);
  }, [open ]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const pick = (id: PresetId) => {
    if (id === 'my') {
      if (!hasMyArchive) return; // 暂无存档：无操作（按钮已呈禁用态）
      store.applyPreset('my');
    } else {
      store.applyPreset(id, buildBuiltinPreset(id));
    }
    setOpen(false);
  };

  const rowClass = (current: boolean, disabled = false) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all ${
      current
        ? 'border-indigo-400/80 bg-white/8'
        : disabled
          ? 'border-white/5 opacity-45 cursor-default'
          : 'border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
    }`;

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* 触发按钮：与顶栏其他图标同款——无底色、白色图标，明暗随开合 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="预设：一键切换主页排版"
        aria-label="预设"
        data-testid="topnav-presets"
        className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-center transition-colors duration-300 ${
          open ? 'text-white' : 'text-white/55 hover:text-white'
        }`}
      >
        <LayoutTemplate size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            /* 面板实色不透明（同 BackgroundMenu 口径）：不用毛玻璃，避免透出后面卡片文字；
               marginLeft 为打开时算出的视口平移（手机防溢出，桌面恒 0），不与 motion 的 transform 冲突 */
            className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] rounded-3xl bg-[#17171d] border border-white/15 p-3 shadow-2xl shadow-black/70 z-50"
            style={{ marginLeft: panelShift }}
          >
            <p className="px-1 pb-2 text-[10px] tracking-wider text-white/40 uppercase">主页预设</p>
            <div className="flex flex-col gap-1.5">
              {BUILTIN_PRESET_META.map((meta) => {
                const current = activePreset === meta.id;
                return (
                  <button
                    key={meta.id}
                    data-preset-option={meta.id}
                    data-preset-current={current || undefined}
                    onClick={() => pick(meta.id)}
                    className={rowClass(current)}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-white/90">{meta.name}</span>
                      <span className="block text-[11px] text-white/45 truncate">{meta.desc}</span>
                    </span>
                    {current && (
                      <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
              {/* 「我的」：恢复自己的存档。无存档时呈禁用态注明「暂无存档」；
                  正在自定义态且无独立存档时，当前排版本身就是「我的」、标为当前 */}
              <button
                data-preset-option="my"
                data-preset-current={activePreset === 'my' || undefined}
                onClick={() => pick('my')}
                className={rowClass(activePreset === 'my', !hasMyArchive && activePreset !== 'my')}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium text-white/90">我的</span>
                  <span className="block text-[11px] text-white/45 truncate">
                    {hasMyArchive
                      ? '恢复你保存的排版'
                      : activePreset === 'my'
                        ? '当前排版就是你的存档'
                        : '暂无存档'}
                  </span>
                </span>
                {activePreset === 'my' && (
                  <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </span>
                )}
              </button>
            </div>
            <p className="px-1 pt-2.5 text-[11px] leading-relaxed text-white/35">
              切换只换主页排版，计划和设置不受影响；切走前当前排版会自动存进「我的」。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
