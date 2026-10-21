/**
 * AI 整理 · 拆分引擎（第十八轮，第一版本地规则实现，不联网）
 *
 * 把用户随手写的一段杂事拆成「短期待办」与「长期计划」两类：
 * - 先按换行与句末标点（。；！？）切句，再按逗号（，）细分小句
 * - 含长期类关键词的小句归「长期计划」：整句作计划标题；句中若有顿号（、），
 *   顿号前的部分作标题、其余部分作步骤
 * - 其余小句归「待办」
 * - 句首的衔接词（顺便/还有/还想/想要…）顺手剥掉；「下周/明天/周X」等日期词不解析，原样留在标题里
 *
 * 接口刻意做成纯函数签名 (text) => SplitResult：将来接真 AI 时只换实现，面板与落库逻辑不动。
 */

export interface SplitPlanDraft {
  title: string;
  steps: string[];
}

export interface SplitResult {
  todos: string[];
  plans: SplitPlanDraft[];
}

export type TaskSplitter = (text: string) => SplitResult;

/** 长期类关键词：命中任一即归长期计划（规则版词表，宁可少而准） */
const LONG_TERM_KEYWORDS = [
  '坚持', '每天', '每日', '每周', '每月', '长期', '目标', '学会', '养成', '习惯', '打卡',
  '练', '学', '健身', '运动', '减肥', '读书', '阅读', '背单词', '备考', '攒钱', '存钱', '戒烟', '戒酒',
];

/** 句首衔接词：剥掉后标题更干净（只剥句首、只剥一层） */
const LEADING_FILLERS = ['顺便', '还有', '另外', '以及', '还想', '想要', '打算', '准备', '需要', '记得', '别忘了'];

function cleanClause(raw: string): string {
  let s = raw.trim().replace(/^[，。；、！？·…—\-\s]+|[，。；、！？·…—\-\s]+$/g, '').trim();
  for (const f of LEADING_FILLERS) {
    if (s.startsWith(f)) {
      s = s.slice(f.length).trim();
      break;
    }
  }
  // 「我想/我要」这类主语开头也剥掉，剩下的就是事情本身
  s = s.replace(/^(我想|我要|我准备|我打算)/, '').trim();
  return s;
}

export const splitTasksLocal: TaskSplitter = (text) => {
  const todos: string[] = [];
  const plans: SplitPlanDraft[] = [];
  const seen = new Set<string>();

  // 切句：换行 → 句末标点 → 逗号（顿号留给计划步骤拆分）
  const clauses = text
    .split(/[\n\r]+/)
    .flatMap((line) => line.split(/[。；;！!？?]+/))
    .flatMap((seg) => seg.split(/[，,]+/))
    .map(cleanClause)
    .filter((s) => s.length > 0);

  for (const clause of clauses) {
    const isLongTerm = LONG_TERM_KEYWORDS.some((k) => clause.includes(k));
    if (isLongTerm) {
      // 顿号拆分：第一段作标题，其余作步骤（无顿号则整句作标题、步骤为空）
      const parts = clause.split('、').map((p) => p.trim()).filter(Boolean);
      const title = parts[0] ?? clause;
      if (!title || seen.has(`p:${title}`)) continue;
      seen.add(`p:${title}`);
      plans.push({ title, steps: parts.slice(1) });
    } else {
      if (seen.has(`t:${clause}`)) continue;
      seen.add(`t:${clause}`);
      todos.push(clause);
    }
  }
  return { todos, plans };
};

/** 当前生效的拆分实现（将来接真 AI 时把这一行换成远程实现即可） */
export const splitTasksText: TaskSplitter = splitTasksLocal;
