// V2 编组数据：由 NavPage 现有导航数据（toolsByCategory）迁移而来
// 在原有 name/description/url/logo 基础上扩展：aliases（别名）、pinned（置顶）、frequency（使用频率权重）、dead（失效标记，只标记不删除）

export interface SiteEntry {
  /** 本地存储层分配的稳定 ID（种子/导入时补齐），增删改按 ID 定位 */
  id?: string;
  name: string;
  url: string;
  description: string;
  logo: string;
  needVpn?: boolean;
  /** 搜索别名：命中别名可直达，如 ChatGPT 的「gpt」 */
  aliases?: string[];
  /** 组内置顶，面板中排在最前 */
  pinned?: boolean;
  /** 使用频率权重（越大越靠前），代表系统按频率自动排序的结果 */
  frequency: number;
  /** 失效标记：AI 扫描发现失效时只打标记，不自动删除 */
  dead?: boolean;
}

export interface NavGroup {
  id: string;
  name: string;
  /** B 型 = 列表式（默认跨 2 栏）；C 型 = 堆叠式（默认 1 栏 × 1X） */
  type: 'list' | 'stack';
  /** 编组自身的搜索别名 */
  aliases?: string[];
  sites: SiteEntry[];
}

const iconMap: Record<string, string> = {
  'KIMI': '/icon_APP/KIMI.svg',
  'doubao': '/icon_APP/doubao.svg',
  'tongyi': '/icon_APP/tongyi.svg',
  'baidu': '/icon_APP/baidu.svg',
  'baiduchatgpt': '/icon_APP/baiduchatgpt.svg',
  'xunfeichatgpt': '/icon_APP/xunfeichatgpt.svg',
  'chatgpticon': '/icon_APP/chatgpticon.svg',
  'claude': '/icon_APP/claude.svg',
  'gemini': '/icon_APP/gemini.svg',
  'minimax': '/icon_APP/minimax.png',
  'liblib': '/icon_APP/liblib.svg',
  'a-stablediffusion': '/icon_APP/a-stablediffusion.svg',
  'dalle': '/icon_APP/dalle.svg',
  'firefly': '/icon_APP/firefly.svg',
  'Midjourney': '/icon_APP/Midjourney.svg',
  'keling': '/icon_APP/keling.svg',
  'krea': '/icon_APP/krea.png',
  '海螺': '/icon_APP/海螺.png',
  'jimengAI-01': '/icon_APP/jimengAI-01.svg',
  'Runwayml': '/icon_APP/Runwayml.svg',
  'Sora': '/icon_APP/Sora.svg',
  'pika': '/icon_APP/pika.svg',
  'jianying': '/icon_APP/jianying.svg',
  'icon-tengxun': '/icon_APP/icon-tengxun.svg',
  'suno': '/icon_APP/suno.svg',
  'udio': '/icon_APP/udio.svg',
  'cursor': '/icon_APP/cursor.svg',
  'windsurf': '/icon_APP/windsurf.svg',
  'github': '/icon_APP/github.svg',
  'vscode': '/icon_APP/vscode.svg',
  'trae1': '/icon_APP/trae1.png',
  '有道龙虾': '/icon_APP/有道龙虾.svg',
  '元气AI': '/icon_APP/元气AI.png',
  'copaw': '/icon_APP/copaw.png',
  'openclaw': '/icon_APP/openclaw.svg',
  'deepseek': '/icon_APP/deepseek.svg',
  'nano-banana': '/icon_APP/nano-banana.svg',
  'flowith': '/icon_APP/Flowith.svg',
  '腾讯混元': '/icon_APP/腾讯混元.svg',
  'notion': '/icon_APP/notion.jpg',
  '秘塔写作': '/icon_APP/秘塔写作.png',
  '秘塔': '/icon_APP/秘塔写作.png',
};

export const getSiteLogo = (name: string): string => {
  for (const [mapKey, path] of Object.entries(iconMap)) {
    if (name.toLowerCase().includes(mapKey.toLowerCase())) {
      return path;
    }
  }
  return `/icon_APP/${name}.svg`;
};

/** 名称命中内置图标映射时返回本地图标路径，否则 null（用户新增站点用） */
export function findMappedLogo(name: string): string | null {
  for (const [mapKey, path] of Object.entries(iconMap)) {
    if (name.toLowerCase().includes(mapKey.toLowerCase())) {
      return path;
    }
  }
  return null;
}

const logoFallback = (name: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name.toLowerCase())}&backgroundColor=6366f1`;

export const siteLogoFallback = logoFallback;

export const navGroups: NavGroup[] = [
  {
    id: 'ai-chat',
    name: 'AI 对话',
    type: 'list',
    aliases: ['聊天机器人', '对话', '聊天'],
    sites: [
      { name: 'ChatGPT', logo: getSiteLogo('chatgpticon'), description: 'OpenAI推出的AI对话助手', url: 'https://chat.openai.com', needVpn: true, pinned: true, frequency: 100, aliases: ['gpt', 'openai', '聊天机器人'] },
      { name: 'Claude', logo: getSiteLogo('claude'), description: 'Anthropic推出的智能助手', url: 'https://claude.ai', needVpn: true, pinned: true, frequency: 96, aliases: ['克劳德', 'anthropic'] },
      { name: 'DeepSeek', logo: getSiteLogo('deepseek'), description: '深度求索AI助手', url: 'https://deepseek.com', needVpn: false, frequency: 92, aliases: ['ds', '深度求索'] },
      { name: 'Kimi', logo: getSiteLogo('KIMI'), description: '月之暗面推出的AI助手', url: 'https://kimi.moonshot.cn', needVpn: false, frequency: 88, aliases: ['月之暗面', 'moonshot', '长文本'] },
      { name: '豆包', logo: getSiteLogo('doubao'), description: '字节跳动AI助手', url: 'https://www.doubao.com', needVpn: false, frequency: 84, aliases: ['doubao', '字节跳动'] },
      { name: '通义千问', logo: getSiteLogo('tongyi'), description: '阿里巴巴AI大模型', url: 'https://tongyi.aliyun.com', needVpn: false, frequency: 80, aliases: ['qwen', '千问', '通义', '阿里'] },
      { name: 'Gemini', logo: getSiteLogo('gemini'), description: 'Google多模态AI模型', url: 'https://gemini.google.com', needVpn: true, frequency: 76, aliases: ['google', '谷歌', '双子'] },
      { name: '文心一言', logo: getSiteLogo('baidu'), description: '百度AI对话助手', url: 'https://yiyan.baidu.com', needVpn: false, frequency: 72, aliases: ['ernie', '文心', '百度'] },
      { name: '腾讯混元', logo: getSiteLogo('腾讯混元'), description: '腾讯AI大模型', url: 'https://hunyuan.tencent.com', needVpn: false, frequency: 68, aliases: ['混元', 'hunyuan', '腾讯'] },
      { name: '讯飞星火', logo: getSiteLogo('xunfeichatgpt'), description: '科大讯飞AI大模型', url: 'https://xinghuo.xfyun.cn', needVpn: false, frequency: 64, aliases: ['星火', 'spark', '讯飞'] },
      { name: 'MiniMax', logo: getSiteLogo('minimax'), description: 'MiniMax AI助手，海螺AI出品', url: 'https://www.minimaxi.com', needVpn: false, frequency: 60, aliases: ['minimax'] },
      { name: 'Midjourney', logo: getSiteLogo('Midjourney'), description: '领先的AI图像生成工具', url: 'https://www.midjourney.com', needVpn: true, frequency: 56, aliases: ['mj', '绘画', '绘图'] },
      { name: '盒豚查', logo: '/icon_APP/盒豚生活.png', description: 'AI查卷工具人', url: 'https://mp.weixin.qq.com/s/Ak0rWbeGi0LtmbyqngAzlQ', needVpn: false, frequency: 40, aliases: ['查卷'] },
    ],
  },
  {
    id: 'image',
    name: '图像生成',
    type: 'stack',
    aliases: ['绘画', '图片', '绘图'],
    sites: [
      { name: 'Midjourney', logo: getSiteLogo('Midjourney'), description: '领先的AI图像生成工具', url: 'https://www.midjourney.com', needVpn: true, pinned: true, frequency: 96, aliases: ['mj'] },
      { name: 'Liblib', logo: getSiteLogo('liblib'), description: '国产AI图像生成平台', url: 'https://www.liblib.art', needVpn: false, pinned: true, frequency: 92, aliases: ['liblibai', '哩布'] },
      { name: '通义万相', logo: getSiteLogo('tongyi'), description: '阿里AI图像生成', url: 'https://tongyi.aliyun.com/wanxiang', needVpn: false, frequency: 80, aliases: ['万相'] },
      { name: 'Nano Banana', logo: getSiteLogo('nano-banana'), description: 'AI图像生成平台', url: 'https://nanobanana.com', needVpn: false, frequency: 76, aliases: ['香蕉'] },
      { name: 'Flowith', logo: getSiteLogo('flowith'), description: 'AI图像工作流平台', url: 'https://flowith.com', needVpn: false, frequency: 72 },
      { name: 'Krea', logo: getSiteLogo('krea'), description: 'AI图像创作平台', url: 'https://krea.ai', needVpn: true, frequency: 68 },
      { name: 'DALL-E', logo: getSiteLogo('dalle'), description: 'OpenAI图像创作工具', url: 'https://openai.com/dall-e-3', needVpn: true, frequency: 64, aliases: ['dalle'] },
      { name: 'Stable Diffusion', logo: getSiteLogo('a-stablediffusion'), description: '开源图像生成模型', url: 'https://stability.ai', needVpn: true, frequency: 60, aliases: ['sd'] },
      { name: 'Firefly', logo: getSiteLogo('firefly'), description: 'Adobe创意AI工具', url: 'https://www.adobe.com/firefly', needVpn: true, frequency: 56, aliases: ['adobe'] },
    ],
  },
  {
    id: 'video',
    name: '视频生成',
    type: 'stack',
    aliases: ['视频', '影视'],
    sites: [
      { name: '可灵', logo: getSiteLogo('keling'), description: '快手AI视频生成', url: 'https://kling.kuaishou.com', needVpn: false, pinned: true, frequency: 96, aliases: ['kling', '快手'] },
      { name: '即梦', logo: getSiteLogo('jimengAI-01'), description: '字节跳动AI视频工具', url: 'https://jimeng.jike.com', needVpn: false, pinned: true, frequency: 92, aliases: ['jimeng'] },
      { name: '海螺', logo: getSiteLogo('海螺'), description: 'MiniMax视频生成工具', url: 'https://hailuo.ai', needVpn: false, frequency: 84, aliases: ['hailuo'] },
      { name: 'Runway', logo: getSiteLogo('Runwayml'), description: '专业AI视频编辑平台', url: 'https://runwayml.com', needVpn: true, frequency: 76 },
      { name: 'Sora', logo: getSiteLogo('Sora'), description: 'OpenAI视频生成模型', url: 'https://openai.com/sora', needVpn: true, frequency: 72 },
      { name: 'Pika', logo: getSiteLogo('pika'), description: '快速AI视频创作', url: 'https://pika.art', needVpn: true, frequency: 64 },
    ],
  },
  {
    id: 'code',
    name: '编程工具',
    type: 'stack',
    aliases: ['编程', '代码', '开发'],
    sites: [
      { name: 'Cursor', logo: getSiteLogo('cursor'), description: 'AI驱动代码编辑器', url: 'https://cursor.sh', needVpn: true, pinned: true, frequency: 96, aliases: ['ai编辑器'] },
      { name: 'VS Code', logo: getSiteLogo('vscode'), description: '微软代码编辑器', url: 'https://code.visualstudio.com', needVpn: false, pinned: true, frequency: 92, aliases: ['vscode', '编辑器'] },
      { name: 'Trae', logo: getSiteLogo('trae1'), description: 'AI驱动开发环境', url: 'https://trae.ai', needVpn: false, pinned: true, frequency: 88 },
      { name: 'GitHub Copilot', logo: getSiteLogo('github'), description: 'GitHub AI编程助手', url: 'https://github.com/features/copilot', needVpn: true, frequency: 80, aliases: ['copilot'] },
      { name: '通义灵码', logo: getSiteLogo('tongyi'), description: '阿里AI编程助手', url: 'https://tongyi.aliyun.com/lingma', needVpn: false, frequency: 76, aliases: ['lingma'] },
      { name: 'Windsurf', logo: getSiteLogo('windsurf'), description: '现代AI代码编辑器', url: 'https://codeium.com/windsurf', needVpn: true, frequency: 72 },
      { name: '文心快码', logo: getSiteLogo('baidu'), description: '百度AI编程工具', url: 'https://cloud.baidu.com/product/codeassist', needVpn: false, frequency: 64 },
    ],
  },
  {
    id: 'audio',
    name: '音频生成',
    type: 'stack',
    aliases: ['音频', '音乐', '语音'],
    sites: [
      { name: '剪映', logo: getSiteLogo('jianying'), description: '字节跳动AI视频剪辑', url: 'https://www.capcut.cn', needVpn: false, pinned: true, frequency: 96, aliases: ['capcut', '剪辑'] },
      { name: 'Suno', logo: getSiteLogo('suno'), description: 'AI音乐生成热门工具', url: 'https://suno.ai', needVpn: true, frequency: 88, aliases: ['音乐生成'] },
      { name: 'TME Studio', logo: getSiteLogo('icon-tengxun'), description: '腾讯音乐AI工具', url: 'https://y.qq.com/tme_studio', needVpn: false, frequency: 72 },
      { name: 'Udio', logo: getSiteLogo('udio'), description: '专业AI音乐创作平台', url: 'https://udio.com', needVpn: true, frequency: 68 },
      { name: 'ElevenLabs', logo: getSiteLogo('suno'), description: '逼真AI语音合成', url: 'https://elevenlabs.io', needVpn: true, frequency: 64, aliases: ['语音合成'] },
    ],
  },
  {
    id: 'agent',
    name: 'Agent工具',
    type: 'stack',
    aliases: ['智能体', 'agent'],
    sites: [
      { name: '有道龙虾', logo: getSiteLogo('有道龙虾'), description: '网易有道AI智能体', url: 'https://www.youdao.com', needVpn: false, pinned: true, frequency: 92, aliases: ['龙虾'] },
      { name: '元气AI', logo: getSiteLogo('元气AI'), description: '国产AI智能体平台', url: 'https://www.yuanqi.ai', needVpn: false, frequency: 80 },
      { name: 'OpenClaw', logo: getSiteLogo('openclaw'), description: 'AI智能体平台', url: 'https://openclaw.ai', needVpn: true, frequency: 76 },
      // 示例：AI 扫描标记的失效链接（只标记不删除，D 面板建议条会汇总提示）
      { name: 'Copaw', logo: getSiteLogo('copaw'), description: 'AI智能体工具', url: 'https://copaw.ai', needVpn: true, frequency: 60, dead: true },
    ],
  },
  {
    id: 'writing',
    name: 'AI写作',
    type: 'stack',
    aliases: ['写作', '文案'],
    sites: [
      { name: 'Notion AI', logo: getSiteLogo('notion'), description: 'AI写作神器！比你想得更多！写得更快', url: 'https://www.notion.so', needVpn: true, pinned: true, frequency: 92, aliases: ['notion'] },
      { name: '秘塔写作猫', logo: getSiteLogo('秘塔写作'), description: '基于GPT的中文写作工具', url: 'https://xiezuocat.com', needVpn: false, pinned: true, frequency: 88, aliases: ['写作猫'] },
      { name: '火山写作', logo: logoFallback('火山写作'), description: '字节跳动AI写作工具，高效提升文案创作', url: 'https://writingo.volcengine.com', needVpn: false, frequency: 76 },
      { name: '字语未来', logo: logoFallback('字语未来'), description: '用AI创造有价值的文案，让新一代智能办公更简单', url: 'https://www.ziyuweilai.com', needVpn: false, frequency: 68 },
      { name: 'Copy AI', logo: logoFallback('Copy AI'), description: 'AI社交媒体文案写作助手', url: 'https://www.copy.ai', needVpn: true, frequency: 64, aliases: ['copyai'] },
      { name: '毕业宝AI论文降重', logo: logoFallback('毕业宝'), description: '论文降重神器！学生都在用的AI论文降重辅助AI工具', url: 'https://www.biyebao.com', needVpn: false, frequency: 56, aliases: ['论文降重'] },
    ],
  },
];

/** 组内排序：置顶在前，其余按频率从高到低 */
export function sortSites(sites: SiteEntry[]): SiteEntry[] {
  return [...sites].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return b.frequency - a.frequency;
  });
}

export function pinnedCount(group: NavGroup): number {
  return group.sites.filter((s) => s.pinned).length;
}

export function deadCount(group: NavGroup): number {
  return group.sites.filter((s) => s.dead).length;
}

/** 编组图标：取组内频率最高站点的 logo */
export function groupIcon(group: NavGroup): string {
  const sorted = sortSites(group.sites);
  return sorted[0]?.logo ?? '';
}
