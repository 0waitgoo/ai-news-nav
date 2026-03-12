import React from 'react';
import { motion } from 'motion/react';

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
  'a-zu28720': '/icon_APP/a-zu28720.svg',
  '有道龙虾': '/icon_APP/有道龙虾.svg',
  '元气AI': '/icon_APP/元气AI.png',
  'copaw': '/icon_APP/copaw.png',
  'openclaw': '/icon_APP/openclaw.svg',
  'tongyiqianwenTongyi-Qianwen': '/icon_APP/tongyiqianwenTongyi-Qianwen.svg',
  'deepseek': '/icon_APP/deepseek.svg',
  'nano-banana': '/icon_APP/nano-banana.svg',
  'flowith': '/icon_APP/Flowith.svg',
  '腾讯混元': '/icon_APP/腾讯混元.svg',
  'notion': '/icon_APP/notion.jpg',
  '秘塔写作': '/icon_APP/秘塔写作.png',
  '秘塔': '/icon_APP/秘塔写作.png',
};

const getLogo = (name: string): string => {
  for (const [mapKey, path] of Object.entries(iconMap)) {
    if (name.toLowerCase().includes(mapKey.toLowerCase())) {
      return path;
    }
  }
  return `/icon_APP/${name}.svg`;
};

const toolsByCategory = {
  '聊天机器人': [
    { name: 'Kimi', logo: getLogo('KIMI'), description: '月之暗面推出的AI助手', url: 'https://kimi.moonshot.cn', needVpn: false },
    { name: '盒豚查', logo: '/icon_APP/盒豚生活.png', description: 'AI查卷工具人', url: 'https://mp.weixin.qq.com/s/Ak0rWbeGi0LtmbyqngAzlQ', needVpn: false },
    { name: '豆包', logo: getLogo('doubao'), description: '字节跳动AI助手', url: 'https://www.doubao.com', needVpn: false },
    { name: '通义千问', logo: getLogo('tongyi'), description: '阿里巴巴AI大模型', url: 'https://tongyi.aliyun.com', needVpn: false },
    { name: '文心一言', logo: getLogo('baidu'), description: '百度AI对话助手', url: 'https://yiyan.baidu.com', needVpn: false },
    { name: '讯飞星火', logo: getLogo('xunfeichatgpt'), description: '科大讯飞AI大模型', url: 'https://xinghuo.xfyun.cn', needVpn: false },
    { name: '腾讯混元', logo: getLogo('腾讯混元'), description: '腾讯AI大模型', url: 'https://hunyuan.tencent.com', needVpn: false },
    { name: 'DeepSeek', logo: getLogo('deepseek'), description: '深度求索AI助手', url: 'https://deepseek.com', needVpn: false },
    { name: 'MiniMax', logo: getLogo('minimax'), description: 'MiniMax AI助手，海螺AI出品', url: 'https://www.minimaxi.com', needVpn: false },
    { name: 'ChatGPT', logo: getLogo('chatgpticon'), description: 'OpenAI推出的AI对话助手', url: 'https://chat.openai.com', needVpn: true },
    { name: 'Claude', logo: getLogo('claude'), description: 'Anthropic推出的智能助手', url: 'https://claude.ai', needVpn: true },
    { name: 'Gemini', logo: getLogo('gemini'), description: 'Google多模态AI模型', url: 'https://gemini.google.com', needVpn: true },
  ],
  '图像生成': [
    { name: 'Liblib', logo: getLogo('liblib'), description: '国产AI图像生成平台', url: 'https://www.liblib.art', needVpn: false },
    { name: '通义万相', logo: getLogo('tongyi'), description: '阿里AI图像生成', url: 'https://tongyi.aliyun.com/wanxiang', needVpn: false },
    { name: 'Krea', logo: getLogo('krea'), description: 'AI图像创作平台', url: 'https://krea.ai', needVpn: true },
    { name: 'Midjourney', logo: getLogo('Midjourney'), description: '领先的AI图像生成工具', url: 'https://www.midjourney.com', needVpn: true },
    { name: 'DALL-E', logo: getLogo('dalle'), description: 'OpenAI图像创作工具', url: 'https://openai.com/dall-e-3', needVpn: true },
    { name: 'Stable Diffusion', logo: getLogo('a-stablediffusion'), description: '开源图像生成模型', url: 'https://stability.ai', needVpn: true },
    { name: 'Firefly', logo: getLogo('firefly'), description: 'Adobe创意AI工具', url: 'https://www.adobe.com/firefly', needVpn: true },
    { name: 'Nano Banana', logo: getLogo('nano-banana'), description: 'AI图像生成平台', url: 'https://nanobanana.com', needVpn: false },
    { name: 'Flowith', logo: getLogo('flowith'), description: 'AI图像工作流平台', url: 'https://flowith.com', needVpn: false },
  ],
  '视频生成': [
    { name: '可灵', logo: getLogo('keling'), description: '快手AI视频生成', url: 'https://kling.kuaishou.com', needVpn: false },
    { name: '海螺', logo: getLogo('海螺'), description: 'MiniMax视频生成工具', url: 'https://hailuo.ai', needVpn: false },
    { name: '即梦', logo: getLogo('jimengAI-01'), description: '字节跳动AI视频工具', url: 'https://jimeng.jike.com', needVpn: false },
    { name: 'Runway', logo: getLogo('Runwayml'), description: '专业AI视频编辑平台', url: 'https://runwayml.com', needVpn: true },
    { name: 'Sora', logo: getLogo('Sora'), description: 'OpenAI视频生成模型', url: 'https://openai.com/sora', needVpn: true },
    { name: 'Pika', logo: getLogo('pika'), description: '快速AI视频创作', url: 'https://pika.art', needVpn: true },
  ],
  '音频生成': [
    { name: '剪映', logo: getLogo('jianying'), description: '字节跳动AI视频剪辑', url: 'https://www.capcut.cn', needVpn: false },
    { name: 'TME Studio', logo: getLogo('icon-tengxun'), description: '腾讯音乐AI工具', url: 'https://y.qq.com/tme_studio', needVpn: false },
    { name: 'Suno', logo: getLogo('suno'), description: 'AI音乐生成热门工具', url: 'https://suno.ai', needVpn: true },
    { name: 'Udio', logo: getLogo('udio'), description: '专业AI音乐创作平台', url: 'https://udio.com', needVpn: true },
    { name: 'ElevenLabs', logo: getLogo('suno'), description: '逼真AI语音合成', url: 'https://elevenlabs.io', needVpn: true },
  ],
  '编程工具': [
    { name: '通义灵码', logo: getLogo('tongyi'), description: '阿里AI编程助手', url: 'https://tongyi.aliyun.com/lingma', needVpn: false },
    { name: '文心快码', logo: getLogo('baidu'), description: '百度AI编程工具', url: 'https://cloud.baidu.com/product/codeassist', needVpn: false },
    { name: 'Trae', logo: getLogo('trae1'), description: 'AI驱动开发环境', url: 'https://trae.ai', needVpn: false },
    { name: 'VS Code', logo: getLogo('vscode'), description: '微软代码编辑器', url: 'https://code.visualstudio.com', needVpn: false },
    { name: 'GitHub Copilot', logo: getLogo('github'), description: 'GitHub AI编程助手', url: 'https://github.com/features/copilot', needVpn: true },
    { name: 'Cursor', logo: getLogo('cursor'), description: 'AI驱动代码编辑器', url: 'https://cursor.sh', needVpn: true },
    { name: 'Windsurf', logo: getLogo('windsurf'), description: '现代AI代码编辑器', url: 'https://codeium.com/windsurf', needVpn: true },
  ],
  'Agent工具': [
    { name: '有道龙虾', logo: getLogo('有道龙虾'), description: '网易有道AI智能体', url: 'https://www.youdao.com', needVpn: false },
    { name: '元气AI', logo: getLogo('元气AI'), description: '国产AI智能体平台', url: 'https://www.yuanqi.ai', needVpn: false },
    { name: 'OpenClaw', logo: getLogo('openclaw'), description: 'AI智能体平台', url: 'https://openclaw.ai', needVpn: true },
    { name: 'Copaw', logo: getLogo('copaw'), description: 'AI智能体工具', url: 'https://copaw.ai', needVpn: true },
  ],
  'AI写作': [
    { name: '字语未来', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=ziyuweilai&backgroundColor=8b5cf6', description: '用AI创造有价值的文案，让新一代智能办公更简单', url: 'https://www.ziyuweilai.com', needVpn: false },
    { name: 'Notion AI', logo: getLogo('notion'), description: 'AI写作神器！比你想得更多！写得更快', url: 'https://www.notion.so', needVpn: true },
    { name: '火山写作', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=huoshan&backgroundColor=ff4785', description: '字节跳动AI写作工具，高效提升文案创作', url: 'https://writingo.volcengine.com', needVpn: false },
    { name: '秘塔写作猫', logo: getLogo('秘塔写作'), description: '基于GPT的中文写作工具', url: 'https://xiezuocat.com', needVpn: false },
    { name: '毕业宝AI论文降重', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=bi yebao&backgroundColor=14b8a6', description: '论文降重神器！学生都在用的AI论文降重辅助AI工具', url: 'https://www.biyebao.com', needVpn: false },
    { name: 'Copy AI', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=copyai&backgroundColor=8b5cf6', description: 'AI社交媒体文案写作助手', url: 'https://www.copy.ai', needVpn: true },
  ],
};

function NavPage() {
  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          AI网站导航
        </h2>
      </div>
      {Object.entries(toolsByCategory).map(([category, tools], categoryIdx) => (
        <motion.div
          key={category}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: categoryIdx * 0.05 }}
        >
          <div className="glass-panel rounded-[32px] p-6">
            <h3 className="font-semibold text-lg tracking-tight mb-4">{category}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  onClick={() => handleClick(tool.url)}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group cursor-pointer relative"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-white">
                    <img 
                      src={tool.logo} 
                      alt={tool.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${tool.name.toLowerCase()}&backgroundColor=6366f1`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="text-xs sm:text-sm font-medium text-white/80 group-hover:text-white transition-colors block truncate">
                      {tool.name}
                    </span>
                    <p className="text-[10px] sm:text-xs text-white/50 mt-0.5 group-hover:text-white/70 transition-colors line-clamp-1">
                      {tool.description}
                    </p>
                  </div>
                  {tool.needVpn && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded">VPN</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default React.memo(NavPage);
