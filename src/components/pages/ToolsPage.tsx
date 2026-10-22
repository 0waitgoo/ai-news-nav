import React, { Suspense, useState } from 'react';
import { ShieldCheck, Wrench } from 'lucide-react';
import { TOOL_DEFS, type ToolTabId } from './tools/toolDefs';
import { consumeToolTab } from '../../store/toolNav';

const PdfToImages = React.lazy(() => import('./tools/PdfToImages'));
const PdfToLongImage = React.lazy(() => import('./tools/PdfToLongImage'));
const ImagesToPdf = React.lazy(() => import('./tools/ImagesToPdf'));
const PdfToTxt = React.lazy(() => import('./tools/PdfToTxt'));
const PdfMerge = React.lazy(() => import('./tools/PdfMerge'));
const PdfSplit = React.lazy(() => import('./tools/PdfSplit'));

/**
 * 工具页（第六十一轮）：PDF 格式转换一期。
 * 全部工具都在浏览器本地处理文件，不上传服务器、本站不保留任何用户文件。
 * 二期（Word/Excel/PPT 互转）与 Office 转 PDF 不在本期范围，页面不放假入口。
 * 工具 id/名称/图标走共享定义 toolDefs（第六十八轮），与主页文件工具卡同一套；
 * 本页只按 id 挂懒加载实现。初始 tab 优先消费主页卡的直达意图（toolNav）。
 */
const COMPS: Record<ToolTabId, React.LazyExoticComponent<React.ComponentType>> = {
  images: PdfToImages,
  long: PdfToLongImage,
  img2pdf: ImagesToPdf,
  txt: PdfToTxt,
  merge: PdfMerge,
  split: PdfSplit,
};

const TABS = TOOL_DEFS.map((d) => ({ ...d, Comp: COMPS[d.id] }));

type TabId = ToolTabId;

export default function ToolsPage() {
  const [tab, setTab] = useState<TabId>(() => consumeToolTab() ?? 'images');
  const Active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-1 sm:px-2">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
          <Wrench size={19} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-white">文件工具</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
            <ShieldCheck size={13} className="text-emerald-300/80 shrink-0" />
            所有转换都在你自己的浏览器里完成，文件不上传服务器、不会被保留。
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="工具列表">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              data-testid={`tool-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors ${
                active
                  ? 'bg-indigo-500/25 text-white border border-indigo-400/40'
                  : 'bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-[#121218]/90 p-4 sm:p-6 shadow-xl shadow-black/30">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          }
        >
          {/* 切换 tab 时整块重挂载：上一个工具的临时状态/结果图自然释放 */}
          <Active.Comp key={tab} />
        </Suspense>
      </div>
    </div>
  );
}
