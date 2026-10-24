import { useSyncExternalStore } from 'react';

/**
 * 中式色卡工作区的跨组件状态（第一百零七轮，与文件工具 toolsWorkspace 同制）：
 * 工作区本体长在主页「中式色卡」组件里，但 HomePage 需要知道它开没开——打开时
 * 把该卡（或含它的组件摞）的栏位高度抬到收起态的 2 倍（与文件工具工作区同一口径）。
 * 只存内存、不落盘——界面状态，不是用户数据。
 */
export interface ColorsWorkspaceState {
  open: boolean;
}

let state: ColorsWorkspaceState = { open: false };
const listeners = new Set<() => void>();

function emit(next: ColorsWorkspaceState) {
  state = next;
  listeners.forEach((fn) => fn());
}

export function openColorsWorkspace() {
  if (state.open) return;
  emit({ open: true });
}

export function closeColorsWorkspace() {
  if (!state.open) return;
  emit({ open: false });
}

export function getColorsWorkspace(): ColorsWorkspaceState {
  return state;
}

export function useColorsWorkspace(): ColorsWorkspaceState {
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
