import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AppTool } from '../../types';
import { MAX_QUICK_TOOLS } from '../../lib/workbenchPreferences';
import { getAppToolIcon } from '../appTools';

type AppCenterCategory = 'all' | 'recent' | AppTool['category'];

interface AppCenterViewProps {
  roleTitle: string;
  tools: AppTool[];
  pinnedToolIds: string[];
  recentToolIds: string[];
  initialToolId?: string | null;
  onBack: () => void;
  onTogglePinnedTool: (toolId: string) => void;
  onLaunchTool: (tool: AppTool) => void;
  onToolDetailOpen?: () => void;
}

const categoryOrder: AppTool['category'][] = [
  '销售工具',
  '客户管理',
  '数据分析',
  '营销宣传',
  '经营管理',
  '售后服务',
  '交付服务',
];

const categoryLabels: Record<AppCenterCategory, string> = {
  all: '全部应用',
  recent: '最近使用',
  销售工具: '销售工具',
  客户管理: '客户管理',
  数据分析: '数据分析',
  营销宣传: '营销宣传',
  经营管理: '经营管理',
  售后服务: '售后服务',
  交付服务: '交付服务',
};

export const AppCenterView: React.FC<AppCenterViewProps> = ({
  roleTitle,
  tools,
  pinnedToolIds,
  recentToolIds,
  initialToolId,
  onBack,
  onTogglePinnedTool,
  onLaunchTool,
  onToolDetailOpen,
}) => {
  const [activeCategory, setActiveCategory] = useState<AppCenterCategory>(() => (
    recentToolIds.some((toolId) => tools.some((tool) => tool.id === toolId))
      ? 'recent'
      : categoryOrder.find((category) => tools.some((tool) => tool.category === category)) || 'recent'
  ));
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [isManaging, setIsManaging] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const initialDetailRef = useRef<string | null>(null);

  const toolById = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);
  const pinnedTools = pinnedToolIds.flatMap((id) => {
    const tool = toolById.get(id);
    return tool ? [tool] : [];
  });
  const availableCategories = categoryOrder.filter((category) => tools.some((tool) => tool.category === category));
  const recentTools = useMemo(() => recentToolIds.flatMap((id) => {
    const tool = toolById.get(id);
    return tool ? [tool] : [];
  }), [recentToolIds, toolById]);

  useEffect(() => {
    if (!initialToolId || initialDetailRef.current === initialToolId || !toolById.has(initialToolId)) return;
    initialDetailRef.current = initialToolId;
    setSelectedToolId(initialToolId);
    onToolDetailOpen?.();
  }, [initialToolId, onToolDetailOpen, toolById]);

  useEffect(() => {
    const fallbackCategory = recentTools.length ? 'recent' : availableCategories[0] || 'recent';
    const categoryIsAvailable = activeCategory === 'all'
      || activeCategory === 'recent'
      || availableCategories.includes(activeCategory);
    if (!categoryIsAvailable || (activeCategory === 'recent' && !recentTools.length)) {
      setActiveCategory(fallbackCategory);
    }
  }, [activeCategory, availableCategories, recentTools.length]);

  const openToolDetail = (tool: AppTool) => {
    setSelectedToolId(tool.id);
    onToolDetailOpen?.();
  };

  const visibleTools = useMemo(() => {
    const source = activeCategory === 'recent'
      ? recentTools
      : activeCategory === 'all'
        ? tools
        : tools.filter((tool) => tool.category === activeCategory);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return source;
    return source.filter((tool) => `${tool.name} ${tool.quickLabel} ${tool.desc}`.toLocaleLowerCase().includes(normalizedQuery));
  }, [activeCategory, query, recentTools, tools]);

  const selectedTool = selectedToolId ? toolById.get(selectedToolId) : undefined;
  const isAtLimit = pinnedToolIds.length >= MAX_QUICK_TOOLS;

  const returnToList = () => {
    setSelectedToolId(null);
    initialDetailRef.current = null;
  };

  const renderPinnedTools = () => (
    <section className="border-b border-[#eaf0f7] bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-[13px] font-bold text-[#1a2438]">工作必备</h2>
          <span className="text-[10px] text-[#8a9ab8]">{pinnedTools.length} 个</span>
        </div>
        <button
          type="button"
          onClick={() => setIsManaging((managing) => !managing)}
          className="min-h-8 px-1 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer"
          aria-pressed={isManaging}
        >
          {isManaging ? '完成' : '管理'}
        </button>
      </div>

      <div className="mt-2.5 flex min-h-[48px] items-center gap-2 overflow-x-auto">
        {pinnedTools.length ? pinnedTools.map((tool) => {
          const Icon = getAppToolIcon(tool.iconName);
          return (
            <div key={tool.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => isManaging ? onTogglePinnedTool(tool.id) : openToolDetail(tool)}
                aria-label={isManaging ? `从工作必备移除${tool.name}` : `查看${tool.name}`}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors cursor-pointer ${isManaging ? 'border-blue-200 bg-[#f8fbff]' : 'border-[#dce9f7] bg-[#f8fbff] text-[#1a6fd4]'}`}
              >
                <Icon className="h-5 w-5 text-[#1a6fd4]" />
              </button>
              {isManaging && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1a6fd4] text-white shadow-sm"><X className="h-2.5 w-2.5" /></span>}
            </div>
          );
        }) : (
          <p className="text-[11px] text-[#8a9ab8]">从应用目录选择高频工具，最多保留 {MAX_QUICK_TOOLS} 个</p>
        )}
      </div>
      {isManaging && <p className="mt-2 text-[10px] text-[#5a6a88]">点击图标即可移除；移除后不会影响应用本身的数据与权限。</p>}
    </section>
  );

  const renderToolList = () => (
    <>
      <section className="bg-white px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-[#1a2438]">应用目录</h2>
            <p className="mt-0.5 text-[10px] text-[#8a9ab8]">{activeCategory === 'recent' ? '优先呈现你最近打开的业务工具' : `仅展示 ${roleTitle} 当前可用的业务工具`}</p>
          </div>
          <button type="button" onClick={() => setIsCategoryOpen(true)} className="flex h-8 items-center gap-1 rounded-lg px-1 text-[11px] font-semibold text-[#5a6a88] hover:text-[#1a6fd4] cursor-pointer" aria-haspopup="dialog">
            <LayoutGrid className="h-4 w-4" /> 分类
          </button>
        </div>

        <div className="mt-3 -mx-4 flex overflow-x-auto border-b border-[#eaf0f7] px-4" role="tablist" aria-label="应用分类">
          {(['recent', ...availableCategories] as AppCenterCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={`relative mr-5 shrink-0 pb-2.5 text-[12px] transition-colors cursor-pointer ${activeCategory === category ? 'font-bold text-[#1a6fd4]' : 'font-medium text-[#6a7b98]'}`}
            >
              {categoryLabels[category]}
              {activeCategory === category && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#1a6fd4]" />}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 pb-8">
        {visibleTools.length ? <div className="divide-y divide-[#eaf0f7]">{visibleTools.map((tool) => {
          const Icon = getAppToolIcon(tool.iconName);
          const isPinned = pinnedToolIds.includes(tool.id);
          const pinDisabled = !isPinned && isAtLimit;
          return (
            <article key={tool.id} className="flex min-h-[88px] items-center gap-3 py-3">
              <button type="button" onClick={() => openToolDetail(tool)} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#dce9f7] bg-[#f4f9ff] text-[#1a6fd4]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5"><strong className="truncate text-[13px] text-[#1a2438]">{tool.name}</strong><ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#aab8cd]" /></span>
                  <span className="mt-1 block line-clamp-2 text-[10px] leading-relaxed text-[#8a9ab8]">{tool.desc}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => !pinDisabled && onTogglePinnedTool(tool.id)}
                disabled={pinDisabled}
                aria-label={isPinned ? `从工作必备移除${tool.name}` : `添加${tool.name}到工作必备`}
                className={`h-8 shrink-0 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${isPinned ? 'border-transparent bg-transparent text-[#8a9ab8] cursor-pointer hover:text-[#1a6fd4]' : pinDisabled ? 'border-[#eaf0f7] bg-[#f8fbff] text-[#b3bfd0] cursor-not-allowed' : 'border-[#1a6fd4] bg-white text-[#1a6fd4] hover:bg-blue-50 cursor-pointer'}`}
              >
                {isPinned ? '已添加' : pinDisabled ? '已达上限' : '添加'}
              </button>
            </article>
          );
        })}</div> : (
          <div className="flex min-h-52 flex-col items-center justify-center text-center">
            <Search className="h-7 w-7 text-[#aab8cd]" />
            <strong className="mt-3 text-[13px] text-[#3a4a68]">{activeCategory === 'recent' ? '还没有最近使用的应用' : '没有匹配的应用'}</strong>
            <p className="mt-1 max-w-[250px] text-[10px] leading-relaxed text-[#8a9ab8]">{activeCategory === 'recent' ? '打开一个应用后会出现在这里，方便下次快速继续。' : '试试清除搜索词或切换其他应用分类。'}</p>
            {activeCategory !== 'all' && <button type="button" onClick={() => { setActiveCategory(availableCategories[0] || 'all'); setQuery(''); }} className="mt-3 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer">浏览可用应用</button>}
          </div>
        )}
      </section>
    </>
  );

  const renderDetail = (tool: AppTool) => {
    const Icon = getAppToolIcon(tool.iconName);
    const isPinned = pinnedToolIds.includes(tool.id);
    const pinDisabled = !isPinned && isAtLimit;
    return (
      <main className="px-4 pb-8 pt-4">
        <button type="button" onClick={returnToList} className="flex min-h-9 items-center gap-1 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer"><ArrowLeft className="h-4 w-4" />返回应用中心</button>
        <section className="crm-card mt-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#dce9f7] bg-[#f4f9ff] text-[#1a6fd4]"><Icon className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1"><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-[#1a6fd4]">{tool.category}</span><h2 className="mt-2 text-[17px] font-extrabold tracking-tight text-[#1a2438]">{tool.name}</h2><p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">{tool.desc}</p></div>
          </div>
          <div className="mt-4 rounded-xl border border-[#eaf0f7] bg-[#f8fbff] p-3 text-[10px] leading-relaxed text-[#5a6a88]">已为 {roleTitle} 配置该应用所需的业务范围。加入工作必备后，工作台将保留一个快捷入口。</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => !pinDisabled && onTogglePinnedTool(tool.id)} disabled={pinDisabled} className={`h-10 rounded-lg border text-[12px] font-semibold transition-colors ${isPinned ? 'border-[#dce9f7] bg-white text-[#5a6a88] hover:text-[#1a6fd4]' : pinDisabled ? 'border-[#eaf0f7] bg-[#f8fbff] text-[#b3bfd0] cursor-not-allowed' : 'border-[#1a6fd4] bg-white text-[#1a6fd4] hover:bg-blue-50 cursor-pointer'}`}>{isPinned ? '从工作必备移除' : pinDisabled ? `工作必备已满 (${MAX_QUICK_TOOLS})` : '添加到工作必备'}</button>
            <button type="button" onClick={() => onLaunchTool(tool)} className="flex h-10 items-center justify-center gap-1 rounded-lg bg-[#1a6fd4] text-[12px] font-semibold text-white transition-colors hover:bg-[#155caf] cursor-pointer">立即打开<ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </main>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[linear-gradient(175deg,#d9e6f5_0%,#eef4fb_28%,#f8fbff_100%)] select-none">
      <header className="sticky top-0 z-20 border-b border-[#eaf0f7] bg-white/95 px-4 pb-3 pt-safe backdrop-blur-md">
        <div className="flex h-10 items-center justify-between">
          <button type="button" onClick={selectedTool ? returnToList : onBack} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3a4a68] hover:bg-blue-50 hover:text-[#1a6fd4] cursor-pointer" aria-label={selectedTool ? '返回应用中心列表' : '返回工作台'}><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-[17px] font-extrabold tracking-tight text-[#1a2438]">{selectedTool ? '应用详情' : '应用中心'}</h1>
          {selectedTool ? <span className="h-10 w-10" aria-hidden="true" /> : <button type="button" onClick={() => { setIsSearching((open) => !open); if (isSearching) setQuery(''); }} className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer ${isSearching ? 'bg-blue-50 text-[#1a6fd4]' : 'text-[#3a4a68] hover:bg-blue-50 hover:text-[#1a6fd4]'}`} aria-label={isSearching ? '关闭搜索' : '搜索应用'}>{isSearching ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}</button>}
        </div>
        {!selectedTool && isSearching && <label className="relative mt-2 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9ab8]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索应用名称或能力" className="h-10 w-full rounded-xl border border-[#dce9f7] bg-[#f8fbff] pl-9 pr-3 text-[12px] text-[#1a2438] outline-none focus:border-blue-300" /></label>}
      </header>

      {!selectedTool && renderPinnedTools()}
      {selectedTool ? renderDetail(selectedTool) : renderToolList()}

      {isCategoryOpen && <div className="fixed inset-0 z-50 flex bg-[#1a2438]/35" role="dialog" aria-modal="true" aria-label="选择应用分类"><button type="button" className="flex-1 cursor-default" onClick={() => setIsCategoryOpen(false)} aria-label="关闭应用分类" /><section className="h-full w-[86%] max-w-[368px] overflow-y-auto bg-white px-5 pb-safe pt-safe shadow-[-12px_0_30px_rgba(26,36,56,.16)]"><div className="flex items-center justify-between py-4"><h2 className="text-[20px] font-extrabold tracking-tight text-[#1a2438]">应用分类</h2><button type="button" onClick={() => setIsCategoryOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5a6a88] hover:bg-blue-50 hover:text-[#1a6fd4] cursor-pointer" aria-label="关闭"><X className="h-5 w-5" /></button></div><div className="grid grid-cols-2 gap-3 pb-5">{(['all', 'recent', ...availableCategories] as AppCenterCategory[]).map((category) => { const count = category === 'all' ? tools.length : category === 'recent' ? recentToolIds.filter((id) => toolById.has(id)).length : tools.filter((tool) => tool.category === category).length; const isActive = activeCategory === category; return <button key={category} type="button" onClick={() => { setActiveCategory(category); setIsCategoryOpen(false); }} className={`min-h-20 rounded-xl border px-3 text-left transition-colors cursor-pointer ${isActive ? 'border-blue-200 bg-blue-50 text-[#1a6fd4]' : 'border-[#eaf0f7] bg-[#f8fbff] text-[#3a4a68] hover:border-blue-100 hover:bg-blue-50/50'}`}><span className="block text-[13px] font-bold">{categoryLabels[category]}</span><span className="mt-1 block text-[10px] opacity-70">{count} 个应用</span></button>; })}</div><p className="border-t border-[#eaf0f7] pt-4 text-[10px] leading-relaxed text-[#8a9ab8]">分类只显示当前角色可访问的应用，避免展示无权限或无业务场景的空入口。</p></section></div>}
    </div>
  );
};
