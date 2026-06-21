import React, { useState, useMemo } from 'react';
import skillsData from './data/skills.json';
import externalSkills from './data/external_skills.json';

// Highlight key framework skills
const FEATURED_IDS = [
  'complex-project-orchestrator',
  'deep-writing-assistant',
  'modern-web-guidance'
];

// Modern rule-based categorization matching Rowan's Obsidian & Book schema
const getNewCategory = (skill) => {
  const id = skill.id.toLowerCase();
  const oldCat = skill.category;
  
  if (
    id.includes('agent') || 
    id.includes('entropy') || 
    id.includes('cognitive') || 
    id.includes('scoring') || 
    id.includes('double_brain') || 
    id.includes('tool-return') ||
    id.includes('workflow_skill_creator') ||
    id.includes('llm_batch')
  ) {
    return 'AI 代理与工作流';
  }
  
  if (
    id.includes('wechat') || 
    id.includes('feishu') || 
    id.includes('dedao') || 
    id.includes('xhs') || 
    id.includes('cover') ||
    id.includes('comic') || 
    id.includes('content') || 
    id.includes('superpowers') ||
    id.includes('writing') ||
    id.includes('writer') ||
    id.includes('pdf_epub') ||
    id.includes('narrative') ||
    id.includes('ip') ||
    id.includes('research') ||
    id.includes('knowledge') ||
    id.includes('scraper') ||
    id.includes('synthesis')
  ) {
    return '内容创作与自媒体';
  }
  
  if (
    oldCat === 'Data & Cloud' || 
    id.includes('bigquery') || 
    id.includes('gcp') || 
    id.includes('dbt') || 
    id.includes('dataform') || 
    id.includes('data-') ||
    id.includes('ml-') ||
    id.includes('spanner')
  ) {
    return '数据资产与云基础设施';
  }
  
  if (
    oldCat === 'Bioinformatics & Science' && 
    (id.includes('literature') || id.includes('pymol') || id.includes('science') || id.includes('math') || id.includes('bio'))
  ) {
    return '前沿科学与计算';
  }
  
  return '开发效率与工具';
};

// Generate shareable installation command based on publisher origin
const getInstallCommand = (skill) => {
  const isProprietary = skill.publisher.toLowerCase().includes('antigravity') || skill.publisher.toLowerCase().includes('rowan');
  if (isProprietary) {
    return `npx skills add https://github.com/Leaf-2000-Y/agent-skills-hub --skill ${skill.id}`;
  }

  if (skill.source_url) {
    return `npx skills add ${skill.source_url} --skill ${skill.id}`;
  }
  
  // Community publisher routing
  const pub = skill.publisher.toLowerCase();
  if (pub.includes('jimliu')) {
    return `npx skills add JimLiu/baoyu-skills --skill ${skill.id}`;
  }
  if (pub.includes('ginobefun')) {
    return `npx skills add https://github.com/ginobefun/smart-content-creator-skill --skill ${skill.id}`;
  }
  if (pub.includes('obra')) {
    return `npx skills add https://github.com/obra/superpowers --skill ${skill.id}`;
  }
  if (pub.includes('anthropic') || pub.includes('official')) {
    return `npx skills add https://github.com/anthropics/skills --skill ${skill.id}`;
  }
  if (pub.includes('vercel')) {
    return `npx skills add https://github.com/vercel-labs/agent-skills --skill ${skill.id}`;
  }
  if (pub.includes('giuseppe')) {
    return `npx skills add https://github.com/giuseppe-trisciuoglio/developer-kit --skill ${skill.id}`;
  }
  if (pub.includes('coreyhaines')) {
    return `npx skills add https://github.com/coreyhaines31/marketingskills --skill ${skill.id}`;
  }
  
  // Default to hosting repo
  return `npx skills add https://github.com/Leaf-2000-Y/agent-skills-hub --skill ${skill.id}`;
};

function App() {
  // Page mode state (localStorage persistence)
  const [pageMode, setPageMode] = useState(() => {
    return localStorage.getItem('aetherskills_page_mode') || 'proprietary';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All'); // 'All' | 'Proprietary' | 'Community'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // External page specific filters
  const [extCategoryFilter, setExtCategoryFilter] = useState('All'); // 'All' | 'AI增强与提示工程' | etc.
  const [extPlatformFilter, setExtPlatformFilter] = useState('All'); // 'All' | 'GitHub' | 'Anthropic' | 'Vercel'
  const [extRatingFilter, setExtRatingFilter] = useState('All'); // 'All' | '5' | '4'

  // Modernized High-potency classifications
  const tabs = [
    { id: 'All', label: '全部所有' },
    { id: 'AI 代理与工作流', label: 'AI 代理与工作流' },
    { id: '内容创作与自媒体', label: '内容创作与自媒体' },
    { id: '数据资产与云基础设施', label: '数据资产与云基础设施' },
    { id: '前沿科学与计算', label: '前沿科学与计算' },
    { id: '开发效率与工具', label: '开发效率与工具' }
  ];

  // 5 high-SNR categories for external skills
  const extCategories = [
    { id: 'All', label: '全部分类' },
    { id: 'AI增强与提示工程', label: 'AI增强与提示工程' },
    { id: '文本编写与内容创作', label: '文本编写与内容创作' },
    { id: '知识检索与学术研究', label: '知识检索与学术研究' },
    { id: '开发协同与系统控制', label: '开发协同与系统控制' },
    { id: '多媒体与设计效率', label: '多媒体与设计效率' }
  ];

  const totalSkills = skillsData.length;
  const lastUpdated = "2026-06-21";

  // Handle page mode toggle
  const handlePageModeChange = (mode) => {
    setPageMode(mode);
    localStorage.setItem('aetherskills_page_mode', mode);
  };

  // Filter skills for Proprietary Mode
  const filteredSkills = useMemo(() => {
    return skillsData.filter(skill => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        skill.name.toLowerCase().includes(query) ||
        skill.name_cn.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.description_cn.toLowerCase().includes(query) ||
        skill.id.toLowerCase().includes(query);
      
      const skillCat = getNewCategory(skill);
      const matchesTab = activeTab === 'All' || skillCat === activeTab;

      const isProprietary = skill.publisher.toLowerCase().includes('antigravity') || skill.publisher.toLowerCase().includes('rowan');
      const matchesSource = 
        sourceFilter === 'All' ||
        (sourceFilter === 'Proprietary' && isProprietary) ||
        (sourceFilter === 'Community' && !isProprietary);
      
      return matchesSearch && matchesTab && matchesSource;
    });
  }, [searchQuery, activeTab, sourceFilter]);

  // Filter skills for External Mode
  const filteredExternalSkills = useMemo(() => {
    return externalSkills.filter(skill => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        skill.name.toLowerCase().includes(query) ||
        skill.name_cn.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.description_cn.toLowerCase().includes(query) ||
        skill.id.toLowerCase().includes(query);
      
      const matchesCategory = extCategoryFilter === 'All' || skill.category === extCategoryFilter;
      const matchesPlatform = extPlatformFilter === 'All' || skill.source_platform === extPlatformFilter;
      const matchesRating = extRatingFilter === 'All' || skill.rating.toString() === extRatingFilter;
      
      return matchesSearch && matchesCategory && matchesPlatform && matchesRating;
    });
  }, [searchQuery, extCategoryFilter, extPlatformFilter, extRatingFilter]);

  // Compute counts for the source filter based on current search & category context
  const sourceCounts = useMemo(() => {
    const baseList = skillsData.filter(skill => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        skill.name.toLowerCase().includes(query) ||
        skill.name_cn.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.description_cn.toLowerCase().includes(query) ||
        skill.id.toLowerCase().includes(query);
      
      const skillCat = getNewCategory(skill);
      return matchesSearch && (activeTab === 'All' || skillCat === activeTab);
    });

    const proprietary = baseList.filter(s => s.publisher.toLowerCase().includes('antigravity') || s.publisher.toLowerCase().includes('rowan')).length;
    const all = baseList.length;
    const community = all - proprietary;

    return { all, proprietary, community };
  }, [searchQuery, activeTab]);

  // Featured skills (Proprietary mode)
  const featuredSkills = useMemo(() => {
    return skillsData.filter(skill => FEATURED_IDS.includes(skill.id));
  }, []);

  // Rowan 5-Star Featured skills (External mode)
  const extFeaturedSkills = useMemo(() => {
    return externalSkills.filter(skill => skill.rating === 5);
  }, []);

  const handleCopy = (skill, e) => {
    e.stopPropagation();
    const cmd = getInstallCommand(skill);
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedId(skill.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="app-layout">
      {/* Fixed Left Sidebar */}
      <aside className="sidebar-aside" style={{ overflowY: 'auto' }}>
        <div className="sidebar-brand-wrapper">
          <div className="logo-icon">Æ</div>
          <span className="logo-text">AetherSkills</span>
        </div>

        {/* 一键切换页面模式 */}
        <div className="view-selector">
          <button 
            className={`view-btn ${pageMode === 'proprietary' ? 'active' : ''}`}
            onClick={() => handlePageModeChange('proprietary')}
          >
            自研工坊
          </button>
          <button 
            className={`view-btn ${pageMode === 'external' ? 'active' : ''}`}
            onClick={() => handlePageModeChange('external')}
          >
            外部精选
          </button>
        </div>

        {/* 动态控制的侧边栏过滤器 */}
        {pageMode === 'proprietary' ? (
          <div className="sidebar-section">
            <span className="sidebar-section-title">自研品类过滤</span>
            <div className="sidebar-nav-list">
              {tabs.map(tab => {
                const count = skillsData.filter(skill => {
                  const skillCat = getNewCategory(skill);
                  const matchesTab = tab.id === 'All' || skillCat === tab.id;
                  
                  const isProprietary = skill.publisher.toLowerCase().includes('antigravity') || skill.publisher.toLowerCase().includes('rowan');
                  const matchesSource = 
                    sourceFilter === 'All' ||
                    (sourceFilter === 'Proprietary' && isProprietary) ||
                    (sourceFilter === 'Community' && !isProprietary);
                  
                  return matchesTab && matchesSource;
                }).length;
                
                return (
                  <button
                    key={tab.id}
                    className={`sidebar-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.label}</span>
                    <span className="sidebar-nav-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="sidebar-section">
              <span className="sidebar-section-title">外部分类过滤</span>
              <div className="sidebar-nav-list">
                {extCategories.map(cat => {
                  const count = externalSkills.filter(s => {
                    const query = searchQuery.toLowerCase();
                    const matchesSearch = 
                      s.name.toLowerCase().includes(query) ||
                      s.name_cn.toLowerCase().includes(query) ||
                      s.description.toLowerCase().includes(query) ||
                      s.description_cn.toLowerCase().includes(query) ||
                      s.id.toLowerCase().includes(query);
                    
                    const matchesCat = cat.id === 'All' || s.category === cat.id;
                    const matchesPlat = extPlatformFilter === 'All' || s.source_platform === extPlatformFilter;
                    const matchesRating = extRatingFilter === 'All' || s.rating.toString() === extRatingFilter;
                    
                    return matchesSearch && matchesCat && matchesPlat && matchesRating;
                  }).length;

                  return (
                    <button
                      key={cat.id}
                      className={`sidebar-nav-btn ${extCategoryFilter === cat.id ? 'active' : ''}`}
                      onClick={() => setExtCategoryFilter(cat.id)}
                    >
                      <span>{cat.label}</span>
                      <span className="sidebar-nav-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-section">
              <span className="sidebar-section-title">平台来源</span>
              <div className="sidebar-nav-list">
                {['All', 'GitHub', 'Anthropic', 'Vercel'].map(platform => {
                  const count = externalSkills.filter(s => {
                    const query = searchQuery.toLowerCase();
                    const matchesSearch = 
                      s.name.toLowerCase().includes(query) ||
                      s.name_cn.toLowerCase().includes(query) ||
                      s.description.toLowerCase().includes(query) ||
                      s.description_cn.toLowerCase().includes(query) ||
                      s.id.toLowerCase().includes(query);
                    
                    const matchesCat = extCategoryFilter === 'All' || s.category === extCategoryFilter;
                    const matchesPlat = platform === 'All' || s.source_platform === platform;
                    const matchesRating = extRatingFilter === 'All' || s.rating.toString() === extRatingFilter;
                    return matchesSearch && matchesCat && matchesPlat && matchesRating;
                  }).length;
                  
                  return (
                    <button
                      key={platform}
                      className={`sidebar-nav-btn ${extPlatformFilter === platform ? 'active' : ''}`}
                      onClick={() => setExtPlatformFilter(platform)}
                    >
                      <span>{platform === 'All' ? '全部平台' : platform}</span>
                      <span className="sidebar-nav-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-section">
              <span className="sidebar-section-title">星级评分</span>
              <div className="sidebar-nav-list">
                {[
                  { id: 'All', label: '全部星级' },
                  { id: '5', label: '⭐⭐⭐⭐⭐ 五星级' },
                  { id: '4', label: '⭐⭐⭐⭐ 四星级' }
                ].map(ratingItem => {
                  const count = externalSkills.filter(s => {
                    const query = searchQuery.toLowerCase();
                    const matchesSearch = 
                      s.name.toLowerCase().includes(query) ||
                      s.name_cn.toLowerCase().includes(query) ||
                      s.description.toLowerCase().includes(query) ||
                      s.description_cn.toLowerCase().includes(query) ||
                      s.id.toLowerCase().includes(query);
                    
                    const matchesCat = extCategoryFilter === 'All' || s.category === extCategoryFilter;
                    const matchesPlat = extPlatformFilter === 'All' || s.source_platform === extPlatformFilter;
                    const matchesRating = ratingItem.id === 'All' || s.rating.toString() === ratingItem.id;
                    return matchesSearch && matchesCat && matchesPlat && matchesRating;
                  }).length;

                  return (
                    <button
                      key={ratingItem.id}
                      className={`sidebar-nav-btn ${extRatingFilter === ratingItem.id ? 'active' : ''}`}
                      onClick={() => setExtRatingFilter(ratingItem.id)}
                    >
                      <span>{ratingItem.label}</span>
                      <span className="sidebar-nav-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 侧边栏页脚 */}
        <div className="sidebar-footer">
          <div className="sidebar-version-badge">WORKSPACE: ROWAN_OS</div>
          <div className="sidebar-version-badge">ENG: ANTIGRAVITY</div>
          <div className="sidebar-version-badge" style={{ color: 'var(--accent-gold)' }}>BUILD: 2026.06.21</div>
        </div>
      </aside>

      {/* Main Right Content Section */}
      <div className="main-content-wrapper">
        <div className="ambient-wrapper">
          <div className="glow-top"></div>
          <div className="glow-blue"></div>
          <div className="glow-orange"></div>

          {/* Sticky Pill-shaped Navigation Header */}
          <header className="header">
            <div className="nav-pill">
              <div className="logo-wrapper">
                <div className="logo-icon">Æ</div>
                <span className="logo-text">AetherSkills</span>
              </div>
              
              <div className="nav-actions">
                <div className="search-container">
                  <span className="search-icon">🔍</span>
                  <input 
                    type="text" 
                    placeholder={pageMode === 'proprietary' ? "搜索自研技能..." : "搜索外部精选..."} 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <a 
                  href="https://github.com/Leaf-2000-Y/agent-skills-hub" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="nav-link-git"
                >
                  <span>GitHub</span>
                  <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                </a>
              </div>
            </div>
          </header>

          <div className="container">
            {/* Hero Banner Area */}
            <section className="hero-grid">
              <div className="hero-left">
                {pageMode === 'proprietary' ? (
                  <>
                    <h1 className="hero-title">
                      <span>Antigravity & Codex Weaponry</span>
                      物理动作，双语智能装载
                    </h1>
                    <p className="hero-desc">
                      专为 Agent 协同平台构建的技能动作目录。此处汇聚了 Rowan 与 Antigravity 自研的专属物理做功技能，以及社区精选的高信噪比扩展动作包，支持一键指令跨环境调用部署。
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="hero-title">
                      <span>Curated External Toolkits</span>
                      外部动作精选仓
                    </h1>
                    <p className="hero-desc">
                      由 Rowan 严苛筛选并测试通过的外部第三方优秀技能（Skills / MCP 服务器）。本页面收录来自 GitHub、Anthropic 与 Vercel 社区的高信噪比资产，深度赋能复杂环境做功。
                    </p>
                  </>
                )}
              </div>

              <div className="hero-right-container">
                {/* Bento Stats Panel (Adaptive) */}
                {pageMode === 'proprietary' ? (
                  <div className="bento-card">
                    <div>
                      <span className="focus-badge">SYSTEM METRICS</span>
                      <h3 className="bento-title">核心技能看板</h3>
                    </div>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-value">{totalSkills}</span>
                        <span className="stat-label">已录入技能</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">5</span>
                        <span className="stat-label">高维分类</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">v1.4</span>
                        <span className="stat-label">数据版本</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{lastUpdated}</span>
                        <span className="stat-label">数据同步</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bento-card" style={{ borderColor: 'rgba(246, 194, 93, 0.15)' }}>
                    <div>
                      <span className="focus-badge" style={{ background: 'rgba(246, 194, 93, 0.08)', color: 'var(--accent-gold)' }}>EXTERNAL METRICS</span>
                      <h3 className="bento-title">外部精选看板</h3>
                    </div>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-value">{externalSkills.length}</span>
                        <span className="stat-label">总精选技能</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{externalSkills.filter(s => s.rating === 5).length}</span>
                        <span className="stat-label">五星级神级</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{new Set(externalSkills.map(s => s.category)).size}</span>
                        <span className="stat-label">板块分类</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{lastUpdated}</span>
                        <span className="stat-label">审计更新</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* External Platforms Portal */}
                <div className="bento-card">
                  <div>
                    <span className="focus-badge" style={{ background: 'rgba(92, 173, 255, 0.1)', color: 'var(--accent-blue)', borderColor: 'rgba(92, 173, 255, 0.2)' }}>EXTERNAL PORTALS</span>
                    <h3 className="bento-title" style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>外部生态快速通道</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>一键直达全球第三方 Skills 注册中心与开发者社区。</p>
                  </div>
                  <div className="quick-links-grid">
                    <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                      <span className="link-icon">🌐</span>
                      <div className="link-info">
                        <span className="link-title">skills.sh</span>
                        <span className="link-desc">全球技能市集</span>
                      </div>
                    </a>
                    <a href="https://skillsmp.com" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                      <span className="link-icon">🛒</span>
                      <div className="link-info">
                        <span className="link-title">Skills 汇聚</span>
                        <span className="link-desc">动作包集市</span>
                      </div>
                    </a>
                    <a href="https://forum.trae.cn/?tab=top" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                      <span className="link-icon">💬</span>
                      <div className="link-info">
                        <span className="link-title">Trae 论坛</span>
                        <span className="link-desc">官方排行榜</span>
                      </div>
                    </a>
                    <a href="https://github.com/search?q=awesome-trae-skills" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                      <span className="link-icon">🐙</span>
                      <div className="link-info">
                        <span className="link-title">GitHub</span>
                        <span className="link-desc">开源技能检索</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Showcase / Rowan 5-Star Showcase */}
            {pageMode === 'proprietary' ? (
              // 自研工坊精选技能
              searchQuery === '' && activeTab === 'All' && sourceFilter === 'All' && (
                <section style={{ marginBottom: '5rem' }}>
                  <div className="section-header">
                    <h2 className="section-title">核心精选技能</h2>
                  </div>
                  <div className="featured-grid">
                    {featuredSkills.map((skill, index) => (
                      <div key={skill.id} className="featured-card">
                        <div>
                          <div className="card-top">
                            <span className="card-num">0{index + 1}</span>
                            <span className="card-tag">{getNewCategory(skill)}</span>
                          </div>
                          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                            {skill.name_cn}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold-soft)', fontFamily: 'monospace', marginBottom: '0.8rem' }}>
                            {skill.name}
                          </div>
                          <p className="card-desc" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {skill.description_cn}
                          </p>
                        </div>
                        <div className="card-footer" style={{ marginTop: '1rem' }}>
                          <span className="publisher-info">BY {skill.publisher}</span>
                          <button className="detail-btn" onClick={() => setSelectedSkill(skill)}>
                            展开详情 <span>→</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            ) : (
              // 外部精选 Rowan 五星神级精选区
              searchQuery === '' && extCategoryFilter === 'All' && extPlatformFilter === 'All' && extRatingFilter === 'All' && (
                <section className="rowan-star-section">
                  <div className="section-header" style={{ marginBottom: '1.8rem' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--accent-gold)', textShadow: '0 0 10px rgba(246, 194, 93, 0.5)' }}>✦</span>
                      Rowan 五星神级精选区
                    </h2>
                  </div>
                  <div className="rowan-star-grid">
                    {extFeaturedSkills.map((skill) => (
                      <div 
                        key={skill.id} 
                        className="featured-card rowan-star-card"
                        onClick={() => setSelectedSkill(skill)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="star-glow-effect"></div>
                        <div>
                          <div className="card-top">
                            <div className="rating-stars">★★★★★</div>
                            <span className={`source-badge ${skill.source_platform.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                              {skill.source_platform}
                            </span>
                          </div>
                          <h3 className="card-title" style={{ fontSize: '1.15rem', marginBottom: '0.2rem', color: '#ffffff' }}>
                            {skill.name_cn}
                          </h3>
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold-soft)', fontFamily: 'monospace', marginBottom: '0.8rem' }}>
                            {skill.name}
                          </div>
                          <p className="card-desc" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {skill.description_cn}
                          </p>
                        </div>
                        <div className="card-footer" style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="publisher-info">BY {skill.publisher}</span>
                          <a 
                            href={skill.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="source-badge"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🌐 访问源项目
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}

            {/* Categories Tabs, Source Switcher & List */}
            {pageMode === 'proprietary' ? (
              <section>
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="section-title">
                    {searchQuery ? `自研筛选结果 (${filteredSkills.length})` : '自研技能归档仓'}
                  </h2>
                </div>

                {/* Filter Bar Grid */}
                <div className="filters-wrapper">
                  {/* Pill Tabs */}
                  <div className="tabs-container">
                    {tabs.map(tab => (
                      <button 
                        key={tab.id} 
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(tab.id);
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Source Segmented Control */}
                  <div className="source-filter-group">
                    <button 
                      className={`source-btn ${sourceFilter === 'All' ? 'active' : ''}`}
                      onClick={() => setSourceFilter('All')}
                    >
                      全部来源 ({sourceCounts.all})
                    </button>
                    <button 
                      className={`source-btn ${sourceFilter === 'Proprietary' ? 'active' : ''}`}
                      onClick={() => setSourceFilter('Proprietary')}
                    >
                      自研专属 ({sourceCounts.proprietary})
                    </button>
                    <button 
                      className={`source-btn ${sourceFilter === 'Community' ? 'active' : ''}`}
                      onClick={() => setSourceFilter('Community')}
                    >
                      社区生态 ({sourceCounts.community})
                    </button>
                  </div>
                </div>

                {/* Flowing Archive Grid */}
                <div className="archive-grid">
                  {filteredSkills.map(skill => (
                    <div 
                      key={skill.id} 
                      className="archive-card"
                      onClick={() => setSelectedSkill(skill)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="archive-top">
                          <div>
                            <h4 className="archive-title" style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                              {skill.name_cn}
                            </h4>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                              {skill.name}
                            </div>
                          </div>
                          <span className="archive-category" style={{ fontSize: '0.65rem' }}>{getNewCategory(skill)}</span>
                        </div>
                        <p className="archive-desc" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minHeight: '40px' }}>
                          {skill.description_cn}
                        </p>
                      </div>
                      
                      <div className="archive-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.8rem' }}>
                        <div className="tag-list">
                          {skill.tags.map((tag, idx) => (
                            <span 
                              key={tag} 
                              className={`tag-pill ${idx === 1 ? 'orange' : idx === 2 ? 'gold' : ''}`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <button 
                          className="copy-btn" 
                          onClick={(e) => handleCopy(skill, e)}
                        >
                          {copiedId === skill.id ? '已复制 ✔' : '复制命令'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredSkills.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-dark)' }}>
                      未搜索到匹配的中英文自研技能。
                    </div>
                  )}
                </div>
              </section>
            ) : (
              // 外部精选归档网格仓
              <section>
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="section-title">
                    {searchQuery ? `外部筛选结果 (${filteredExternalSkills.length})` : '生态发现列表仓'}
                  </h2>
                </div>

                <div className="archive-grid">
                  {filteredExternalSkills.map(skill => (
                    <div 
                      key={skill.id} 
                      className="archive-card"
                      onClick={() => setSelectedSkill(skill)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="archive-top">
                          <div>
                            <h4 className="archive-title" style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                              {skill.name_cn}
                            </h4>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                              {skill.name}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className="archive-category" style={{ fontSize: '0.65rem' }}>{skill.category}</span>
                            <div className="rating-stars">
                              {Array.from({ length: skill.rating }).map((_, i) => '★')}
                            </div>
                          </div>
                        </div>
                        <p className="archive-desc" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minHeight: '40px' }}>
                          {skill.description_cn}
                        </p>
                      </div>
                      
                      <div className="archive-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`source-badge ${skill.source_platform.toLowerCase()}`}>
                            {skill.source_platform}
                          </span>
                          <span className="publisher-info" style={{ fontSize: '0.65rem' }}>
                            BY {skill.publisher}
                          </span>
                        </div>
                        <button 
                          className="copy-btn" 
                          onClick={(e) => handleCopy(skill, e)}
                        >
                          {copiedId === skill.id ? '已复制 ✔' : '复制命令'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredExternalSkills.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-dark)' }}>
                      未搜索到匹配的外部技能，请尝试调整过滤器。
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Details Backdrop Modal */}
          {selectedSkill && (
            <div className="modal-overlay" onClick={() => setSelectedSkill(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedSkill(null)}>×</button>
                <h3 className="modal-title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span>{selectedSkill.name_cn}</span>
                  {selectedSkill.rating && (
                    <div className="rating-stars" style={{ fontSize: '1rem' }}>
                      {Array.from({ length: selectedSkill.rating }).map((_, i) => '★')}
                    </div>
                  )}
                </h3>
                <div className="modal-id" style={{ fontFamily: 'monospace', color: 'var(--accent-gold-soft)', fontSize: '0.85rem' }}>
                  {selectedSkill.name}
                </div>
                
                <div className="modal-meta-row">
                  <div className="modal-meta-item">
                    <span>分类领域</span>
                    {selectedSkill.category || getNewCategory(selectedSkill)}
                  </div>
                  <div className="modal-meta-item">
                    <span>版本</span>
                    {selectedSkill.version}
                  </div>
                  <div className="modal-meta-item">
                    <span>提供商</span>
                    {selectedSkill.publisher}
                  </div>
                  {selectedSkill.source_platform && (
                    <div className="modal-meta-item">
                      <span>来源平台</span>
                      <span className={`source-badge ${selectedSkill.source_platform.toLowerCase()}`} style={{ border: 'none', padding: 0, background: 'none' }}>
                        {selectedSkill.source_platform}
                      </span>
                    </div>
                  )}
                </div>

                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div className="modal-section-title" style={{ color: '#ffffff', fontWeight: '600' }}>中文介绍</div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                    {selectedSkill.description_cn}
                  </p>

                  <div className="modal-section-title" style={{ color: '#ffffff', fontWeight: '600' }}>English Description</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    {selectedSkill.description}
                  </p>
                  
                  <div className="modal-section-title" style={{ color: '#ffffff', fontWeight: '600' }}>外部装载命令 (一键调用)</div>
                  <div className="install-command">
                    <span style={{ fontSize: '0.72rem', wordBreak: 'break-all', paddingRight: '0.5rem' }}>{getInstallCommand(selectedSkill)}</span>
                    <button 
                      className="copy-btn" 
                      onClick={(e) => handleCopy(selectedSkill, e)}
                      style={{ flexShrink: 0 }}
                    >
                      {copiedId === selectedSkill.id ? '已复制 ✔' : '复制'}
                    </button>
                  </div>
                  
                  {selectedSkill.source_url && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <a 
                        href={selectedSkill.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="source-badge" 
                        style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px' }}
                      >
                        🌐 访问项目源网页 (Open Link)
                      </a>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '1.2rem', fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                    * 提示：复制后可在您的开发控制台通过 npx 快速加载此动作拓展。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
