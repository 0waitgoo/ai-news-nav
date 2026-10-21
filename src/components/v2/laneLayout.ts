/**
 * 栏位布局引擎（第三十四轮）：主页卡片排放从瀑布流（CSS grid dense 自动收拢）
 * 改为「按栏锚定」——用户原话：「我们的拖动排放，按照4栏去判定。比如我第一栏可以
 * 一直往下排。第二栏可以留空。第三栏可以排任意个数。按栏决定不再自动往左边收」
 *
 * 模型：
 * - 每张卡有栏锚点 col（起始栏）与全局顺序（cardOrder）。放置是纯函数：
 *   按顺序逐张处理，每张卡落在它锚定栏（宽度 2 的卡锚定相邻两栏）的当前栈顶，
 *   栈顶 = 该卡所跨各栏已被前面卡片占到的最大行。结果只由（锚点 + 顺序 + 各卡宽高）
 *   决定，确定性可复现；栏与栏互不挤占——某栏留空就一直空着，不会把邻栏的卡吸过来。
 * - 宽度 2 的卡同时耦合它所跨的两栏（其纵向位置取决于两栏在它之前的栈高），
 *   这是跨栏卡的固有性质；与它不相交的栏永远不受影响。
 * - 未锚定的卡（新增卡 / 迁移缺失）回落到「当前最矮的栏」末尾：即在它被处理时，
 *   选落点行最小的起始栏（同高取最左），与计数游标一致，落点必在该栏已有卡片之下。
 */

export interface LaneItemSpec {
  key: string;
  /** 宽度（栏数，1 或 2；超过总栏数时夹取） */
  span: 1 | 2;
  /** 高度（行单位） */
  height: number;
  /** 栏锚点（起始栏）；undefined = 未锚定，放置时回落到当前最矮的栏 */
  anchor?: number;
}

export interface LanePlacement {
  col: number;
  row: number;
}

export interface LaneResult {
  /** 每张卡的左上角（栏, 行），行单位与高度同制 */
  pos: Map<string, LanePlacement>;
  /** 每张卡最终生效的锚点（回落/夹取后），供调用方与已存值比对后落盘 */
  resolvedCols: Map<string, number>;
  /** 全部栏的最大栈高（行单位） */
  totalRows: number;
}

/** 按栏锚定放置：items 按给定顺序处理，锚点决定起始栏，栏内自上而下堆叠 */
export function placeInLanes(items: LaneItemSpec[], cols: number): LaneResult {
  const cursors = new Array<number>(cols).fill(0);
  const pos = new Map<string, LanePlacement>();
  const resolvedCols = new Map<string, number>();
  const topAt = (col: number, span: number): number => {
    let m = 0;
    for (let c = col; c < col + span; c++) m = Math.max(m, cursors[c]);
    return m;
  };
  for (const item of items) {
    const span = Math.max(1, Math.min(item.span, cols));
    let col: number;
    if (item.anchor !== undefined && Number.isFinite(item.anchor)) {
      col = Math.max(0, Math.min(cols - span, Math.floor(item.anchor)));
    } else {
      // 回落到当前最矮的栏：落点行最小者胜，同高取最左
      col = 0;
      let best = Infinity;
      for (let c = 0; c <= cols - span; c++) {
        const t = topAt(c, span);
        if (t < best) {
          best = t;
          col = c;
        }
      }
    }
    const row = topAt(col, span);
    pos.set(item.key, { col, row });
    resolvedCols.set(item.key, col);
    for (let c = col; c < col + span; c++) cursors[c] = row + item.height;
  }
  return { pos, resolvedCols, totalRows: Math.max(0, ...cursors) };
}

/**
 * 存量迁移专用：复刻旧瀑布流（CSS `grid-auto-flow: dense`）在 cols 栏下的放置结果。
 * dense 流对每张卡都从左上角起按行优先扫描第一个能放下的位置；据此得到每张卡
 * 在旧版面里的 (col, row)，col 即迁移后的栏锚点，保证老用户升级后版面基本一致。
 */
export function simulateDenseFlow(
  items: { key: string; span: 1 | 2; height: number }[],
  cols: number,
): Map<string, LanePlacement> {
  const grid: boolean[][] = [];
  const rowCells = (r: number): boolean[] => {
    while (grid.length <= r) grid.push(new Array<boolean>(cols).fill(false));
    return grid[r];
  };
  const fits = (col: number, row: number, span: number, h: number): boolean => {
    for (let r = row; r < row + h; r++) {
      const cells = rowCells(r);
      for (let c = col; c < col + span; c++) if (cells[c]) return false;
    }
    return true;
  };
  const out = new Map<string, LanePlacement>();
  for (const item of items) {
    const span = Math.max(1, Math.min(item.span, cols));
    let done = false;
    for (let r = 0; !done; r++) {
      for (let c = 0; c <= cols - span; c++) {
        if (!fits(c, r, span, item.height)) continue;
        for (let rr = r; rr < r + item.height; rr++) {
          const cells = rowCells(rr);
          for (let cc = c; cc < c + span; cc++) cells[cc] = true;
        }
        out.set(item.key, { col: c, row: r });
        done = true;
        break;
      }
    }
  }
  return out;
}
