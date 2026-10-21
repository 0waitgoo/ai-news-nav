/**
 * AI 整理 · 拆分引擎（第十八轮，第一版本地规则实现，不联网；第十九轮计划改为次数型）
 *
 * 把用户随手写的一段杂事拆成「短期待办」与「长期计划」两类：
 * - 先按换行与句末标点（。；！？）切句，再按逗号（，）细分小句
 * - 含长期类关键词的小句归「长期计划」（次数型）：句中能解析出「N次/N节/N个…」就用它作目标数与单位，
 *   并把该计数短语从标题里剥掉；解析不出则默认目标 10 次
 * - 其余小句归「待办」
 * - 句首的衔接词（顺便/还有/还想/想要…）顺手剥掉；「下周/明天/周X」等日期词不解析，原样留在标题里
 *
 * 接口刻意做成纯函数签名 (text) => SplitResult：将来接真 AI 时只换实现，面板与落库逻辑不动。
 */

export interface SplitPlanDraft {
  title: string;
  /** 次数型目标：句中解析的数字，解析不到时 10 */
  targetCount: number;
  /** 单位：句中解析的量词，解析不到时「次」 */
  unit: string;
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

/** 次数型计数短语：「20个」「30 次」「8节」——数字 + 常见单位量词 */
const COUNT_PHRASE_RE = /(\d+)\s*(次|节|课|天|页|章|本|遍|个|组|回|公里|分钟|小时)/;

/** 从长期句中解析目标数与单位：命中则顺手把计数短语从标题里剥掉；未命中用默认 10 次 */
function parsePlanTarget(clause: string): SplitPlanDraft {
  const m = clause.match(COUNT_PHRASE_RE);
  if (!m || m.index === undefined) return { title: clause, targetCount: 10, unit: '次' };
  const targetCount = Math.max(1, parseInt(m[1], 10) || 10);
  const title = (clause.slice(0, m.index) + clause.slice(m.index + m[0].length))
    .replace(/[、，,]+/g, ' ')
    .replace(/([一-龥])\s+(?=[一-龥])/g, '$1')
    .trim()
    .replace(/^[、，,·\s]+|[、，,·\s]+$/g, '');
  return { title: title || clause, targetCount, unit: m[2] };
}

export const splitTasksLocal: TaskSplitter = (text) => {
  const todos: string[] = [];
  const plans: SplitPlanDraft[] = [];
  const seen = new Set<string>();

  // 切句：换行 → 句末标点 → 逗号
  const clauses = text
    .split(/[\n\r]+/)
    .flatMap((line) => line.split(/[。；;！!？?]+/))
    .flatMap((seg) => seg.split(/[，,]+/))
    .map(cleanClause)
    .filter((s) => s.length > 0);

  for (const clause of clauses) {
    const isLongTerm = LONG_TERM_KEYWORDS.some((k) => clause.includes(k));
    if (isLongTerm) {
      // 长期计划 = 次数型：解析「N+单位」作目标，整句（剥计数短语后）作标题
      const draft = parsePlanTarget(clause);
      if (!draft.title || seen.has(`p:${draft.title}`)) continue;
      seen.add(`p:${draft.title}`);
      plans.push(draft);
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
