import React from 'react';
import { motion } from 'motion/react';
import { siteLogoFallback } from '../../data/groups';

/** A 型小组件卡的统一卡壳：标题行（图标 + 标题 + 右侧操作） + 内容区 */
export function Card({
  title,
  icon,
  right,
  children,
  className = '',
  onClick,
  delay = 0,
}: {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={onClick}
      className={`glass-panel glass-panel-hover rounded-[28px] h-full p-4 sm:p-5 flex flex-col overflow-hidden transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {title !== undefined && (
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h3 className="font-semibold text-base sm:text-lg tracking-tight truncate">{title}</h3>
          </div>
          {right}
        </div>
      )}
      {children}
    </motion.div>
  );
}

/** 卡片标题左侧的圆形图标徽 */
export function CardIconBadge({ children, className = 'bg-indigo-500/20 text-indigo-300' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${className}`}>
      {children}
    </div>
  );
}

/** 站点 logo 图片（带加载失败兜底），与 NavPage 保持一致的白底圆角样式 */
export function SiteLogo({
  logo,
  name,
  size = 36,
  imgSize = 26,
  className = '',
  grayscale = false,
}: {
  logo: string;
  name: string;
  size?: number;
  imgSize?: number;
  className?: string;
  grayscale?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logo}
        alt={name}
        loading="lazy"
        className={`object-contain ${grayscale ? 'grayscale opacity-60' : ''}`}
        style={{ width: imgSize, height: imgSize }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes('dicebear')) target.src = siteLogoFallback(name);
        }}
      />
    </div>
  );
}
