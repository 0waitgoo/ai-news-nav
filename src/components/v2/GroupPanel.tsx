import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Pin, Plus, Sparkles, Pencil, Trash2, Check } from 'lucide-react';
import { GROUP_TAB_COLORS, deadCount, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';
import type { LocalStore } from '../../store/localStore';
import { SiteLogo } from './Card';
import { SiteForm } from './GroupExpanded';

/**
 * C 型 · 编组展开弹窗（第三轮恢复）
 * 点击堆叠卡弹出居中弹窗：组内站点为 ICON 瓷砖（图标 + 名字，置顶优先 + 频率排序），
 * 带「+ 添加网站」瓷砖、瓷砖悬停可编辑/删除；头部可改组名、切换形态、删组；
 * 底部失效提示条：失效链接只标记不删除。面板为实色背景，不用半透明/毛玻璃。
 * （B 型列表卡不走这里——它在主页原地向下拉开。）
 */
export default function GroupPanel({
  group,
  store,
  onClose,
  onBecomeList,
}: {
  group: NavGroup | null;
  store: LocalStore;
  onClose: () => void;
  /** 在弹窗里把形态切成 list 时回调：父级关弹窗并在主页原地展开该组 */
  onBecomeList: (group: NavGroup) => void;
}) {
  useEffect(() => {
    if (!group) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [group, onClose]);

  return (
    <AnimatePresence>
      {group && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative rounded-[28px] bg-[#17171d] border border-white/10 w-full max-w-2xl max-h-[84vh] flex flex-col overflow-hidden shadow-2xl shadow-black/70"
          >
            <React.Fragment key={group.id}>
              <PanelBody group={group} store={store} onClose={onClose} onBecomeList={onBecomeList} />
            </React.Fragment>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PanelBody({
  group,
  store,
  onClose,
  onBecomeList,
}: {
  group: NavGroup;
  store: LocalStore;
  onClose: () => void;
  onBecomeList: (group: NavGroup) => void;
}) {
  const [barDismissed, setBarDismissed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteEntry | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sorted = useMemo(() => sortSites(group.sites), [group]);
  const dead = deadCount(group);
  const showForm = adding || editingSite !== null;

  const switchDisplay = (display: 'list' | 'stack') => {
    if (display === group.display) return;
    store.setGroupDisplay(group.id, display);
    if (display === 'list') onBecomeList(group);
  };

  return (
    <>
      {/* 头部（第十二轮）：组名 + 计数 + 组操作全部与组名同一行，右侧依次 改组名 / 形态切换 / 删组 / 关闭；
          已删除「自定义标题」输入行与「按使用频率排序」提示行（subtitle 仅保留在数据模型兼容老数据） */}
      <div className="px-5 sm:px-6 pt-5 pb-4 shrink-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {renaming ? (
            <span className="flex items-center gap-2 min-w-0">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && groupName.trim()) {
                    store.renameGroup(group.id, groupName.trim());
                    setRenaming(false);
                  }
                }}
                className="w-44 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-indigo-400/60"
              />
              <button
                onClick={() => {
                  if (groupName.trim()) store.renameGroup(group.id, groupName.trim());
                  setRenaming(false);
                }}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-500/80 text-white shrink-0"
              >
                <Check size={12} /> 保存
              </button>
              <button onClick={() => setRenaming(false)} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/10 text-white/70 shrink-0">
                取消
              </button>
            </span>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate">{group.name}</h3>
                <span className="text-xs text-white/40 shrink-0">{group.sites.length} 个站点</span>
              </div>
              <button
                onClick={() => {
                  setGroupName(group.name);
                  setRenaming(true);
                }}
                className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white/85 transition-colors shrink-0"
              >
                <Pencil size={11} /> 改组名
              </button>
              <span className="flex items-center rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                <button
                  onClick={() => switchDisplay('list')}
                  title="详细列表卡：在主页原地展开成行式列表"
                  className={`text-[11px] px-2.5 py-1 transition-colors ${
                    group.display === 'list' ? 'bg-indigo-500/70 text-white font-medium' : 'text-white/50 hover:text-white/85'
                  }`}
                >
                  详细列表
                </button>
                <button
                  onClick={() => switchDisplay('stack')}
                  title="文件夹式卡：紧凑堆叠卡，点开弹窗看图标"
                  className={`text-[11px] px-2.5 py-1 transition-colors ${
                    group.display === 'stack' ? 'bg-indigo-500/70 text-white font-medium' : 'text-white/50 hover:text-white/85'
                  }`}
                >
                  文件夹式
                </button>
              </span>
              {confirmDelete ? (
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-red-300">删除整个编组？</span>
                  <button
                    onClick={() => {
                      store.deleteGroup(group.id);
                      onClose();
                    }}
                    className="px-2 py-1 rounded-md bg-red-500/80 text-white font-medium"
                  >
                    确认删除
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md bg-white/10 text-white/70">
                    算了
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 text-[11px] text-white/50 hover:text-red-300 transition-colors shrink-0"
                >
                  <Trash2 size={11} /> 删组
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0 ml-auto"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {/* 小角颜色：卡面文件夹小角的填充色，点选即时生效并落盘；「默认」= 同色灰。当前色带描边 + 勾标记 */}
        {!renaming && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[11px] text-white/50 shrink-0 mr-0.5">小角颜色</span>
            <button
              type="button"
              title="默认（同色灰）"
              data-tab-color=""
              onClick={() => store.setGroupTabColor(group.id, '')}
              className={`w-5 h-5 rounded-full bg-[#26262e] border flex items-center justify-center transition-transform hover:scale-110 ${
                (group.tabColor ?? '') === '' ? 'border-white ring-2 ring-white/70 ring-offset-2 ring-offset-[#17171d]' : 'border-white/25'
              }`}
            >
              {(group.tabColor ?? '') === '' && <Check size={11} className="text-white/80" />}
            </button>
            {GROUP_TAB_COLORS.map((c) => {
              const active = (group.tabColor ?? '') === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  data-tab-color={c.value}
                  onClick={() => store.setGroupTabColor(group.id, c.value)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                    active ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-[#17171d]' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {active && <Check size={11} className="text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 内容区：表单（添加/编辑） + 瓷砖网格 */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 min-h-0">
        {showForm && (
          <div className="mb-3">
            <SiteForm
              initial={editingSite ?? undefined}
              onSubmit={(draft) => {
                if (editingSite?.id) store.updateSite(group.id, editingSite.id, draft);
                else store.addSite(group.id, draft);
                setAdding(false);
                setEditingSite(null);
              }}
              onCancel={() => {
                setAdding(false);
                setEditingSite(null);
              }}
            />
          </div>
        )}

        {sorted.length === 0 && !showForm ? (
          <div className="py-10 text-center text-sm text-white/40">
            这个编组还没有网站，点下方「+ 添加网站」加上第一个吧
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {sorted.map((site) => (
              <div
                key={site.id ?? site.name}
                className="group/tile relative flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.05] hover:bg-white/10 border border-white/5 transition-colors"
              >
                {site.pinned && <Pin size={10} className="absolute top-1.5 left-1.5 text-amber-400 fill-amber-400 z-10" />}
                <span className="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover/tile:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingSite(site);
                      setAdding(false);
                    }}
                    title="编辑网站"
                    className="p-1 rounded-md bg-[#26262e] border border-white/10 text-white/60 hover:text-white"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => site.id && store.deleteSite(group.id, site.id)}
                    title="删除网站"
                    className="p-1 rounded-md bg-[#26262e] border border-white/10 text-white/60 hover:text-red-300"
                  >
                    <Trash2 size={11} />
                  </button>
                </span>
                <button onClick={() => window.open(site.url, '_blank')} title={site.description} className="flex flex-col items-center gap-1.5 w-full">
                  <SiteLogo logo={site.logo} name={site.name} size={40} imgSize={28} grayscale={site.dead} />
                  <span className={`text-[11px] font-medium w-full text-center truncate ${site.dead ? 'text-white/45' : 'text-white/85'}`}>
                    {site.name}
                  </span>
                  {site.dead && <span className="text-[8px] font-medium text-red-300 bg-red-500/15 px-1 py-px rounded">失效</span>}
                </button>
              </div>
            ))}

            {/* + 添加网站 */}
            <button
              onClick={() => {
                setAdding(true);
                setEditingSite(null);
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-dashed border-white/20 text-white/55 hover:text-white hover:border-indigo-400/50 hover:bg-indigo-500/10 transition-colors min-h-[86px]"
            >
              <Plus size={20} />
              <span className="text-[11px] font-medium">添加网站</span>
            </button>
          </div>
        )}
      </div>

      {/* 底部失效提示条：只标记、不删除（无失效时不显示） */}
      {dead > 0 && !barDismissed && (
        <div className="shrink-0 mx-5 sm:mx-6 mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-indigo-400/30 bg-indigo-500/10 px-4 py-3">
          <Sparkles size={16} className="text-indigo-300 shrink-0" />
          <p className="flex-1 text-xs sm:text-[13px] text-white/80 leading-relaxed">
            <span className="font-semibold text-indigo-200">AI 整理建议：</span>
            发现 {dead} 个失效链接 · 已标记（仅标记，不会自动删除）
          </p>
          <button
            onClick={() => setBarDismissed(true)}
            className="text-[11px] font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
          >
            知道了
          </button>
        </div>
      )}
    </>
  );
}
