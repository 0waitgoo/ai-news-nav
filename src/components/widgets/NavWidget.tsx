import React from 'react';
import { motion } from 'motion/react';

const iconMap: Record<string, string> = {
  'KIMI': '/icon_APP/KIMI.svg',
  'doubao': '/icon_APP/doubao.svg',
  'tongyi': '/icon_APP/tongyi.svg',
  'baidu': '/icon_APP/baidu.svg',
  'chatgpticon': '/icon_APP/chatgpticon.svg',
  'claude': '/icon_APP/claude.svg',
  'gemini': '/icon_APP/gemini.svg',
  'liblib': '/icon_APP/liblib.svg',
  'Midjourney': '/icon_APP/Midjourney.svg',
  'keling': '/icon_APP/keling.svg',
  'jianying': '/icon_APP/jianying.svg',
  'suno': '/icon_APP/suno.svg',
  'cursor': '/icon_APP/cursor.svg',
  'windsurf': '/icon_APP/windsurf.svg',
  'github': '/icon_APP/github.svg',
  'vscode': '/icon_APP/vscode.svg',
  'trae1': '/icon_APP/trae1.png',
  '有道龙虾': '/icon_APP/有道龙虾.svg',
  '元气AI': '/icon_APP/元气AI.png',
  'copaw': '/icon_APP/copaw.png',
  'openclaw': '/icon_APP/openclaw.svg',
  '腾讯混元': '/icon_APP/腾讯混元.svg',
  'hunyuan': '/icon_APP/腾讯混元.svg',
  'tengxun': '/icon_APP/腾讯混元.svg',
  'deepseek': '/icon_APP/deepseek.svg',
  'nano-banana': '/icon_APP/nano-banana.svg',
  'nanobanana': '/icon_APP/nano-banana.svg',
  'flowith': '/icon_APP/Flowith.svg',
};

const getLogo = (name: string): string => {
  for (const [mapKey, path] of Object.entries(iconMap)) {
    if (name.toLowerCase().includes(mapKey.toLowerCase())) {
      return path;
    }
  }
  return `/icon_APP/${name}.svg`;
};

const tools = [
  { name: 'Kimi', logo: getLogo('KIMI'), description: '月之暗面推出的AI助手', url: 'https://kimi.moonshot.cn', needVpn: false },
  { name: '盒豚查', logo: '/icon_APP/盒豚生活.png', description: 'AI查卷工具人', url: 'https://mp.weixin.qq.com/s/Ak0rWbeGi0LtmbyqngAzlQ', needVpn: false },
  { name: '豆包', logo: getLogo('doubao'), description: '字节跳动AI助手', url: 'https://www.doubao.com', needVpn: false },
  { name: '通义千问', logo: getLogo('tongyi'), description: '阿里巴巴AI大模型', url: 'https://tongyi.aliyun.com', needVpn: false },
  { name: '文心一言', logo: getLogo('baidu'), description: '百度AI对话助手', url: 'https://yiyan.baidu.com', needVpn: false },
  { name: '腾讯混元', logo: getLogo('腾讯混元'), description: '腾讯AI大模型', url: 'https://hunyuan.tencent.com', needVpn: false },
  { name: 'DeepSeek', logo: getLogo('deepseek'), description: '深度求索AI助手', url: 'https://deepseek.com', needVpn: false },
  { name: 'Liblib', logo: getLogo('liblib'), description: '国产AI图像生成平台', url: 'https://www.liblib.art', needVpn: false },
  { name: 'Nano Banana', logo: getLogo('nano-banana'), description: 'AI图像生成平台', url: 'https://nanobanana.com', needVpn: false },
  { name: 'Flowith', logo: getLogo('flowith'), description: 'AI图像工作流平台', url: 'https://flowith.com', needVpn: false },
  { name: '可灵', logo: getLogo('keling'), description: '快手AI视频生成', url: 'https://kling.kuaishou.com', needVpn: false },
  { name: '剪映', logo: getLogo('jianying'), description: '字节跳动AI视频剪辑', url: 'https://www.capcut.cn', needVpn: false },
  { name: 'Trae', logo: getLogo('trae1'), description: 'AI驱动开发环境', url: 'https://trae.ai', needVpn: false },
  { name: '有道龙虾', logo: getLogo('有道龙虾'), description: '网易有道AI智能体', url: 'https://www.youdao.com', needVpn: false },
  { name: 'ChatGPT', logo: getLogo('chatgpticon'), description: 'OpenAI推出的AI对话助手', url: 'https://chat.openai.com', needVpn: true },
  { name: 'Claude', logo: getLogo('claude'), description: 'Anthropic推出的智能助手', url: 'https://claude.ai', needVpn: true },
  { name: 'Midjourney', logo: getLogo('Midjourney'), description: '领先的AI图像生成工具', url: 'https://www.midjourney.com', needVpn: true },
];

interface NavWidgetProps {
  onNavigate?: (page: string) => void;
}

export default function NavWidget({ onNavigate }: NavWidgetProps) {
  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-[32px] h-full p-4 sm:p-5 flex flex-col overflow-hidden"
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
        <h3 className="font-semibold text-base sm:text-lg tracking-tight">AI导航</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {tools.map((tool, idx) => (
          <div 
            key={idx}
            onClick={() => handleClick(tool.url)}
            className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group cursor-pointer relative"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 bg-white">
              <img 
                src={tool.logo} 
                alt={tool.name}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${tool.name.toLowerCase()}&backgroundColor=6366f1`;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors block truncate">
                {tool.name}
              </span>
              <p className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors line-clamp-1">
                {tool.description}
              </p>
            </div>
            {tool.needVpn && (
              <span className="absolute top-1 right-1 text-[8px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded">VPN</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
