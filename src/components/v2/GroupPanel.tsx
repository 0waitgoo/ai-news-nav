import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Search, Pin, Plus, Sparkles } from 'lucide-react';
import { deadCount, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';
import { searchInGroup } from '../../utils/search';
import { SiteLogo } from './Card';

const PAGE_SIZE = 23; // 瓷砖首屏数量（不含「+添加」），超出部分用溢出计数瓷砖收起

/**
 * D 型 · 编组展开面板
 * 点击 B/C 卡后原地放大：背景主页虚化保留位置感。
 * 组内为纯图标+名字瓷砖，按频率排序、置顶在前；带组内搜索、「+添加」瓷砖、溢出计数；
 * 底部 AI 整理建议条：失效链接只标记不删除。
 */
export default function GroupPanel({
  group,
  onClose,
}: {
  group: NavGroup | null;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [barDismissed, setBarDismissed] = useState(false);
  const [addHint, setAddHint] = useState(false);

  const sorted = useMemo(() => (group ? sortSites(group.sites) : []), [group]);
  const filtered = useMemo(() => {
    if (!group) return [] as SiteEntry[];
    const hits = searchInGroup(group, keyword);
    const hitSet = new Set(hits.map((s) => s.name));
    return sorted.filter((s) => hitSet.has(s.name));
  }, [group, keyword, sorted]);

  const searching = keyword.trim().length > 0;
  const visible = searching || showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const overflow = filtered.length - visible.length;
  const dead = group ? deadCount(group) : 0;

  const close = () => {
    setKeyword('');
    setShowAll(false);
    setBarDismissed(false);
    setAddHint(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* 背景虚化层：保留主页位置感 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative glass-panel rounded-[28px] bg-[#17171d]/95 w-full max-w-2xl max-h-[84vh] flex flex-col overflow-hidden shadow-2xl shadow-black/60"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-3 shrink-0">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate">{group.name}</h3>
                <span className="text-xs text-white/40 shrink-0">{group.sites.length} 个站点</span>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            {/* 组内搜索 */}
            <div className="px-5 sm:px-6 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-400/40 transition-colors">
                <Search size={15} className="text-white/35 shrink-0" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="在组内搜索…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30 min-w-0"
                />
                {keyword && (
                  <button onClick={() => setKeyword('')} className="text-[11px] text-white/40 hover:text-white shrink-0">
                    清除
                  </button>
                )}
              </div>
              <p className="text-[11px] text-white/35 mt-2.5">按使用频率排序 · 置顶在前</p>
            </div>

            {/* 瓷砖网格：纯图标 + 名字 */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 min-h-0">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-white/40">组内没有匹配「{keyword}」的站点</div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {visible.map((site) => (
                    <button
                      key={site.name}
                      onClick={() => window.open(site.url, '_blank')}
                      className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-colors"
                      title={site.description}
                    >
                      {site.pinned && (
                        <Pin size={10} className="absolute top-1.5 right-1.5 text-amber-400 fill-amber-400" />
                      )}
                      <SiteLogo logo={site.logo} name={site.name} size={40} imgSize={28} grayscale={site.dead} />
                      <span className={`text-[11px] font-medium w-full text-center truncate ${site.dead ? 'text-white/45' : 'text-white/85'}`}>
                        {site.name}
                      </span>
                      {site.dead && (
                        <span className="text-[8px] font-medium text-red-300 bg-red-500/15 px-1 py-px rounded">失效</span>
                      )}
                    </button>
                  ))}

                  {/* 溢出计数 */}
                  {overflow > 0 && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border border-dashed border-white/15 text-white/50 hover:text-white hover:bg-white/5 transition-colors min-h-[86px]"
                    >
                      <span className="text-base font-bold tracking-widest">···</span>
                      <span className="text-[11px]">还有 {overflow} 个</span>
                    </button>
                  )}

                  {/* + 添加 */}
                  <button
                    onClick={() => setAddHint(true)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-indigo-400/40 hover:bg-indigo-500/5 transition-colors min-h-[86px]"
                  >
                    <Plus size={20} />
                    <span className="text-[11px] font-medium">添加</span>
                  </button>
                </div>
              )}
              {addHint && (
                <p className="mt-3 text-center text-[11px] text-indigo-300/80">
                  添加站点将通过「AI 分析导入」完成（自动归组、打标签、补介绍），即将上线
                </p>
              )}
            </div>

            {/* 底部 AI 整理建议条：失效链接只标记、不删除 */}
            {dead > 0 && !barDismissed && (
              <div className="shrink-0 mx-5 sm:mx-6 mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-indigo-400/30 bg-indigo-500/[0.07] px-4 py-3">
                <Sparkles size={16} className="text-indigo-300 shrink-0" />
                <p className="flex-1 text-xs sm:text-[13px] text-white/75 leading-relaxed">
                  <span className="font-semibold text-indigo-200">AI 整理建议：</span>
                  发现 {dead} 个失效链接 · 已标记（仅标记，不会自动删除）
                </p>
                <button
                  onClick={() => setBarDismissed(true)}
                  className="text-[11px] font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  知道了
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
