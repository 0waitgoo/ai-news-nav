import { useSyncExternalStore } from 'react';
import type { ToolTabId } from '../components/tools/toolDefs';

/**
 * 文件工具工作区的跨组件状态（第八十六轮，独立工具页删除后新增）：
 * 工作区本体长在主页「文件工具」组件里，但有三方需要知道它开没开、开的是哪个工具——
 * ① FileToolsCard 本体：渲染瓷砖面还是工作区面、切哪个工具；
 * ② HomePage：工作区打开时要把该卡（或含它的组件摞）的栏位高度抬到收起态的 2 倍，
 *    并响应顶栏扳手的「定位打开」请求（滚动 + 摞内切成员都由它执行）；
 * ③ 顶栏扳手（App / HomePage 两处顶栏）：发起打开请求。
 * 走一个极小的外部 store（useSyncExternalStore），避免为这一条状态把 props
 * 穿过组件注册表与摞卡。只存内存、不落盘——这是界面状态，不是用户数据。
 */
export interface ToolsWorkspaceState {
  open: boolean;
  tool: ToolTabId;
  /** 打开请求序号：每次外部请求（扳手）+1，HomePage 监听它做定位；
   * 卡内点瓷砖打开不走请求、不触发滚动 */
  requestSeq: number;
}

let state: ToolsWorkspaceState = { open: false, tool: 'images', requestSeq: 0 };
const listeners = new Set<() => void>();

function emit(next: ToolsWorkspaceState) {
  state = next;
  listeners.forEach((fn) => fn());
}

/** 打开工作区（卡内点瓷砖 / 组件内部切换都走这里，不触发定位滚动） */
export function openToolsWorkspace(tool: ToolTabId) {
  if (state.open && state.tool === tool) return;
  emit({ ...state, open: true, tool });
}

/** 在工作区内切换工具 */
export function setToolsWorkspaceTool(tool: ToolTabId) {
  if (state.open && state.tool === tool) return;
  emit({ ...state, open: true, tool });
}

/** 收起工作区回瓷砖面（工具内部状态由 FileToolsCard 保持挂载，不随收起丢失） */
export function closeToolsWorkspace() {
  if (!state.open) return;
  emit({ ...state, open: false });
}

/** 顶栏扳手的打开请求：打开工作区（沿用上次用的工具）并请 HomePage 定位 */
export function requestToolsWorkspace() {
  emit({ ...state, open: true, requestSeq: state.requestSeq + 1 });
}

export function getToolsWorkspace(): ToolsWorkspaceState {
  return state;
}

export function useToolsWorkspace(): ToolsWorkspaceState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => state,
  );
}
