import { Combine, FileText, GalleryVertical, ImagePlus, Images, Scissors, type LucideIcon } from 'lucide-react';

/**
 * 文件工具的共享定义（第六十八轮）：工具页 tab 与主页「文件工具」卡共用同一套
 * id / 名称 / 图标，保证两处图标一致、卡面点图标能按 id 直达工具页对应 tab。
 * 工具本体组件仍在 ToolsPage 里按 id 懒加载，这里不引入实现、避免主页包变大。
 */
export interface ToolDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const TOOL_DEFS = [
  { id: 'images', label: 'PDF 转图片', icon: Images },
  { id: 'long', label: 'PDF 转长图', icon: GalleryVertical },
  { id: 'img2pdf', label: '图片转 PDF', icon: ImagePlus },
  { id: 'txt', label: 'PDF 转 TXT', icon: FileText },
  { id: 'merge', label: 'PDF 合并', icon: Combine },
  { id: 'split', label: 'PDF 拆分', icon: Scissors },
] as const satisfies readonly ToolDef[];

export type ToolTabId = (typeof TOOL_DEFS)[number]['id'];
