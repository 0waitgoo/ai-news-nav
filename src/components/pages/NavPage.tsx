import React from 'react';
import { motion } from 'motion/react';
import { siteLogoFallback } from '../../data/groups';

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
  'minimax': '/icon_APP/minimax.svg',
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
  // 第九十三轮补齐品牌图标（官网/simple-icons 取回落盘）
  'chatgot': '/icon_APP/chatgot.png',
  'remove.bg': '/icon_APP/removebg.png',
  'bigjpg': '/icon_APP/bigjpg.png',
  'fotor': '/icon_APP/fotor.png',
  'picsart': '/icon_APP/picsart.svg',
  '美图秀秀': '/icon_APP/meitu.svg',
  'kapwing': '/icon_APP/kapwing.png',
  '来画': '/icon_APP/laihua.png',
  'elevenlabs': '/icon_APP/elevenlabs.svg',
  'lalal.ai': '/icon_APP/lalal.png',
  'replit': '/icon_APP/replit.svg',
  'stackblitz': '/icon_APP/stackblitz.svg',
  '火山写作': '/icon_APP/huoshan.png',
  'copy ai': '/icon_APP/copyai.png',
  'grammarly': '/icon_APP/grammarly.svg',
  'quillbot': '/icon_APP/quillbot.png',
  'deepl': '/icon_APP/deepl.svg',
  '百度翻译': '/icon_APP/baidufanyi.png',
  '有道翻译': '/icon_APP/youdaofanyi.png',
  '腾讯翻译君': '/icon_APP/tencentfanyi.png',
  'canva': '/icon_APP/canva.jpg',
  '稿定设计': '/icon_APP/gaoding.png',
  '即时设计': '/icon_APP/jsdesign.png',
  'figma': '/icon_APP/figma.svg',
  '创客贴': '/icon_APP/chuangkit.png',
  'beautiful.ai': '/icon_APP/beautifulai.png',
  'prezi': '/icon_APP/prezi.svg',
  'processon': '/icon_APP/processon.png',
  'wps': '/icon_APP/wps.png',
  '百度ai': '/icon_APP/baiduai.png',
  '腾讯ai': '/icon_APP/tencentai.png',
  '讯飞开放平台': '/icon_APP/xfyun.png',
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
    { name: 'Chatgot', logo: getLogo('Chatgot'), description: '多模型AI聊天聚合平台', url: 'https://start.chatgot.io', needVpn: true },
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
    { name: 'Remove.bg', logo: getLogo('Remove.bg'), description: 'AI一键抠图工具', url: 'https://www.remove.bg', needVpn: true },
    { name: 'Bigjpg', logo: getLogo('Bigjpg'), description: 'AI图片无损放大工具', url: 'https://bigjpg.com', needVpn: false },
    { name: 'Fotor', logo: getLogo('Fotor'), description: '国产AI图片编辑平台', url: 'https://www.fotor.com/cn/', needVpn: false },
    { name: 'PicsArt', logo: getLogo('PicsArt'), description: 'AI修图与创意编辑平台', url: 'https://picsart.com', needVpn: true },
    { name: '美图秀秀', logo: getLogo('美图秀秀'), description: '美图AI修图工具', url: 'https://xiuxiu.web.meitu.com', needVpn: false },
  ],
  '视频生成': [
    { name: '可灵', logo: getLogo('keling'), description: '快手AI视频生成', url: 'https://kling.kuaishou.com', needVpn: false },
    { name: '海螺', logo: getLogo('海螺'), description: 'MiniMax视频生成工具', url: 'https://hailuo.ai', needVpn: false },
    { name: '即梦', logo: getLogo('jimengAI-01'), description: '字节跳动AI视频工具', url: 'https://jimeng.jike.com', needVpn: false },
    { name: 'Runway', logo: getLogo('Runwayml'), description: '专业AI视频编辑平台', url: 'https://runwayml.com', needVpn: true },
    { name: 'Sora', logo: getLogo('Sora'), description: 'OpenAI视频生成模型', url: 'https://openai.com/sora', needVpn: true },
    { name: 'Pika', logo: getLogo('pika'), description: '快速AI视频创作', url: 'https://pika.art', needVpn: true },
    { name: 'Kapwing', logo: getLogo('Kapwing'), description: '在线AI视频编辑平台', url: 'https://www.kapwing.com', needVpn: true },
    { name: '来画', logo: getLogo('来画'), description: 'AI数字人视频创作平台', url: 'https://www.laihua.com', needVpn: false },
  ],
  '音频生成': [
    { name: '剪映', logo: getLogo('jianying'), description: '字节跳动AI视频剪辑', url: 'https://www.capcut.cn', needVpn: false },
    { name: 'TME Studio', logo: getLogo('icon-tengxun'), description: '腾讯音乐AI工具', url: 'https://y.qq.com/tme_studio', needVpn: false },
    { name: 'Suno', logo: getLogo('suno'), description: 'AI音乐生成热门工具', url: 'https://suno.ai', needVpn: true },
    { name: 'Udio', logo: getLogo('udio'), description: '专业AI音乐创作平台', url: 'https://udio.com', needVpn: true },
    { name: 'ElevenLabs', logo: getLogo('ElevenLabs'), description: '逼真AI语音合成', url: 'https://elevenlabs.io', needVpn: true },
    { name: 'LALAL.AI', logo: getLogo('LALAL.AI'), description: 'AI人声伴奏分离工具', url: 'https://www.lalal.ai', needVpn: true },
  ],
  '编程工具': [
    { name: '通义灵码', logo: getLogo('tongyi'), description: '阿里AI编程助手', url: 'https://tongyi.aliyun.com/lingma', needVpn: false },
    { name: '文心快码', logo: getLogo('baidu'), description: '百度AI编程工具', url: 'https://cloud.baidu.com/product/codeassist', needVpn: false },
    { name: 'Trae', logo: getLogo('trae1'), description: 'AI驱动开发环境', url: 'https://trae.ai', needVpn: false },
    { name: 'VS Code', logo: getLogo('vscode'), description: '微软代码编辑器', url: 'https://code.visualstudio.com', needVpn: false },
    { name: 'GitHub Copilot', logo: getLogo('github'), description: 'GitHub AI编程助手', url: 'https://github.com/features/copilot', needVpn: true },
    { name: 'Cursor', logo: getLogo('cursor'), description: 'AI驱动代码编辑器', url: 'https://cursor.sh', needVpn: true },
    { name: 'Windsurf', logo: getLogo('windsurf'), description: '现代AI代码编辑器', url: 'https://codeium.com/windsurf', needVpn: true },
    { name: 'Replit', logo: getLogo('Replit'), description: '在线AI编程平台', url: 'https://replit.com', needVpn: true },
    { name: 'StackBlitz', logo: getLogo('StackBlitz'), description: '浏览器在线开发环境', url: 'https://stackblitz.com', needVpn: true },
  ],
  'Agent工具': [
    { name: '有道龙虾', logo: getLogo('有道龙虾'), description: '网易有道AI智能体', url: 'https://www.youdao.com', needVpn: false },
    { name: '元气AI', logo: getLogo('元气AI'), description: '国产AI智能体平台', url: 'https://www.yuanqi.ai', needVpn: false },
    { name: 'OpenClaw', logo: getLogo('openclaw'), description: 'AI智能体平台', url: 'https://openclaw.ai', needVpn: true },
    { name: 'Copaw', logo: getLogo('copaw'), description: 'AI智能体工具', url: 'https://copaw.ai', needVpn: true },
  ],
  'AI写作': [
    { name: '字语未来', logo: siteLogoFallback('字语未来'), description: '用AI创造有价值的文案，让新一代智能办公更简单', url: 'https://www.ziyuweilai.com', needVpn: false },
    { name: 'Notion AI', logo: getLogo('notion'), description: 'AI写作神器！比你想得更多！写得更快', url: 'https://www.notion.so', needVpn: true },
    { name: '火山写作', logo: getLogo('火山写作'), description: '字节跳动AI写作工具，高效提升文案创作', url: 'https://writingo.volcengine.com', needVpn: false },
    { name: '秘塔写作猫', logo: getLogo('秘塔写作'), description: '基于GPT的中文写作工具', url: 'https://xiezuocat.com', needVpn: false },
    { name: '毕业宝AI论文降重', logo: siteLogoFallback('毕业宝AI论文降重'), description: '论文降重神器！学生都在用的AI论文降重辅助AI工具', url: 'https://www.biyebao.com', needVpn: false },
    { name: 'Copy AI', logo: getLogo('Copy AI'), description: 'AI社交媒体文案写作助手', url: 'https://www.copy.ai', needVpn: true },
    { name: 'Grammarly', logo: getLogo('Grammarly'), description: 'AI英文写作助手', url: 'https://www.grammarly.com', needVpn: true },
    { name: 'QuillBot', logo: getLogo('QuillBot'), description: 'AI英文改写润色工具', url: 'https://quillbot.com', needVpn: true },
  ],
  'AI翻译': [
    { name: 'DeepL', logo: getLogo('DeepL'), description: 'AI翻译工具，译文自然流畅', url: 'https://www.deepl.com', needVpn: true },
    { name: '百度翻译', logo: getLogo('百度翻译'), description: '百度旗下AI翻译平台', url: 'https://fanyi.baidu.com', needVpn: false },
    { name: '有道翻译', logo: getLogo('有道翻译'), description: '网易有道AI翻译工具', url: 'https://fanyi.youdao.com', needVpn: false },
    { name: '腾讯翻译君', logo: getLogo('腾讯翻译君'), description: '腾讯AI翻译工具', url: 'https://fanyi.qq.com', needVpn: false },
  ],
  'AI设计': [
    { name: 'Canva可画', logo: getLogo('Canva可画'), description: '在线设计平台，海量模板素材', url: 'https://www.canva.cn', needVpn: false },
    { name: '稿定设计', logo: getLogo('稿定设计'), description: '在线平面设计平台', url: 'https://www.gaoding.com', needVpn: false },
    { name: '即时设计', logo: getLogo('即时设计'), description: '国产在线协作设计工具', url: 'https://js.design', needVpn: false },
    { name: 'Figma', logo: getLogo('Figma'), description: '在线协作UI设计工具', url: 'https://www.figma.com', needVpn: true },
    { name: '创客贴', logo: getLogo('创客贴'), description: '在线平面设计工具，模板丰富', url: 'https://www.chuangkit.com', needVpn: false },
  ],
  'AI办公': [
    { name: 'Beautiful.ai', logo: getLogo('Beautiful.ai'), description: 'AI驱动的PPT制作平台', url: 'https://www.beautiful.ai', needVpn: true },
    { name: 'Prezi', logo: getLogo('Prezi'), description: '非线性动态演示文稿工具', url: 'https://prezi.com', needVpn: true },
    { name: 'ProcessOn', logo: getLogo('ProcessOn'), description: '在线流程图与思维导图工具', url: 'https://www.processon.com', needVpn: false },
    { name: 'WPS云文档', logo: getLogo('WPS云文档'), description: '金山在线协作文档平台', url: 'https://www.wps.cn', needVpn: false },
  ],
  'AI开放平台': [
    { name: '百度AI', logo: getLogo('百度AI'), description: '百度AI开放平台', url: 'https://ai.baidu.com', needVpn: false },
    { name: '腾讯AI', logo: getLogo('腾讯AI'), description: '腾讯AI开放平台', url: 'https://ai.qq.com', needVpn: false },
    { name: '讯飞开放平台', logo: getLogo('讯飞开放平台'), description: '科大讯飞AI技术开放平台', url: 'https://www.xfyun.cn', needVpn: false },
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
                  <div className="site-icon-frame w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-white">
                    <img 
                      src={tool.logo} 
                      alt={tool.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // 无真实图标 → 站名首字字标（第八十四轮），不再用 DiceBear 随机图
                        if (!target.src.startsWith('data:')) target.src = siteLogoFallback(tool.name);
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
