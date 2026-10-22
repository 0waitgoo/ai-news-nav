import type { ToolTabId } from '../components/pages/tools/toolDefs';

/**
 * 「直达工具页某个 tab」的一次性通道（第六十八轮）：
 * 主页文件工具卡点某个工具图标时先 requestToolTab(id) 再切到工具页，
 * ToolsPage 挂载时 consume 一次作为初始 tab（消费即清，之后正常切页不受影响）。
 * 只存内存不落盘——这是导航意图，不是用户数据，不进本地存储/同步。
 */
let pendingToolTab: ToolTabId | null = null;

export function requestToolTab(id: ToolTabId) {
  pendingToolTab = id;
}

export function consumeToolTab(): ToolTabId | null {
  const tab = pendingToolTab;
  pendingToolTab = null;
  return tab;
}
