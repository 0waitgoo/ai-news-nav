import React from 'react';
import NewsWidget from './widgets/NewsWidget';
import NavWidget from './widgets/NavWidget';
import TrendingWidget from './widgets/TrendingWidget';

interface BentoGridProps {
  onBgChange: (url: string) => void;
  onNavigate: (page: string) => void;
}

export default function BentoGrid({ onBgChange, onNavigate }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[200px] sm:auto-rows-[220px] md:auto-rows-[240px]">
      {/* Main News - Spans 2 cols, 2 rows */}
      <div 
        className="sm:col-span-2 row-span-2 cursor-pointer"
        onClick={() => onNavigate('news')}
      >
        <NewsWidget />
      </div>

      {/* AI Navigation - Spans 2 cols, 2 rows */}
      <div 
        className="sm:col-span-2 lg:col-span-2 row-span-2 cursor-pointer"
        onClick={() => onNavigate('nav')}
      >
        <NavWidget />
      </div>

      {/* Trending - Spans 2 cols, 1 row */}
      <div className="sm:col-span-2 row-span-1">
        <TrendingWidget />
      </div>
    </div>
  );
}
