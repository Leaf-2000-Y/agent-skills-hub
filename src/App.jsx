import React, { useState, useMemo } from 'react';
import skillsData from './data/skills.json';
import externalSkills from './data/external_skills.json';
import casesData from './data/cases.json';

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

  const [comparedSkills, setComparedSkills] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleToggleCompare = (skill, e) => {
    e.stopPropagation();
    setComparedSkills(prev => {
      const exists = prev.some(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      }
      if (prev.length >= 3) {
        alert("最多只能同时对比 3 个技能。");
        return prev;
      }
      return [...prev, skill];
    });
  };

  const [skillsList, setSkillsList] = useState(() => {
    const localAdded = JSON.parse(localStorage.getItem('aetherskills_added_skills') || '[]');
    const localDeleted = JSON.parse(localStorage.getItem('aetherskills_deleted_skills') || '[]');
    const combined = [...skillsData, ...localAdded];
    return combined.filter(s => !localDeleted.includes(s.id));
  });

  const [externalSkillsList, setExternalSkillsList] = useState(() => {
    const localAdded = JSON.parse(localStorage.getItem('aetherskills_added_external') || '[]');
    const localDeleted = JSON.parse(localStorage.getItem('aetherskills_deleted_external') || '[]');
    const combined = [...externalSkills, ...localAdded];
    return combined.filter(s => !localDeleted.includes(s.id));
  });

  const [isManageMode, setIsManageMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillForm, setNewSkillForm] = useState({
    id: '',
    name: '',
    name_cn: '',
    description: '',
    description_cn: '',
    category: '',
    tags: '',
    version: '1.0.0',
    publisher: 'User',
    source_platform: 'GitHub',
    source_url: '',
    rating: 5
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

  const totalSkills = skillsList.length;
  const lastUpdated = "2026-06-23";

  // Handle page mode toggle
  const handlePageModeChange = (mode) => {
    setPageMode(mode);
    localStorage.setItem('aetherskills_page_mode', mode);
  };

  // Filter skills for Proprietary Mode
  const filteredSkills = useMemo(() => {
    return skillsList.filter(skill => {
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
  }, [searchQuery, activeTab, sourceFilter, skillsList]);

  // Filter skills for External Mode
  const filteredExternalSkills = useMemo(() => {
    return externalSkillsList.filter(skill => {
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
  }, [searchQuery, extCategoryFilter, extPlatformFilter, extRatingFilter, externalSkillsList]);

  // Compute counts for the source filter based on current search & category context
  const sourceCounts = useMemo(() => {
    const baseList = skillsList.filter(skill => {
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
  }, [searchQuery, activeTab, skillsList]);

  // Featured skills (Proprietary mode)
  const featuredSkills = useMemo(() => {
    return skillsList.filter(skill => FEATURED_IDS.includes(skill.id));
  }, [skillsList]);

  // Rowan 5-Star Featured skills (External mode)
  const extFeaturedSkills = useMemo(() => {
    return externalSkillsList.filter(skill => skill.rating === 5);
  }, [externalSkillsList]);

  const handleAddSkillSubmit = (e) => {
    e.preventDefault();
    if (!newSkillForm.id) return;
    
    const formattedTags = newSkillForm.tags 
      ? newSkillForm.tags.split(',').map(t => t.trim()) 
      : ['Custom'];

    const defaultCategory = pageMode === 'proprietary' 
      ? '开发效率与工具' 
      : '开发协同与系统控制';

    const newSkillObj = {
      id: newSkillForm.id,
      name: newSkillForm.name || newSkillForm.id,
      name_cn: newSkillForm.name_cn || newSkillForm.id,
      description: newSkillForm.description || newSkillForm.description_cn,
      description_cn: newSkillForm.description_cn || newSkillForm.description,
      category: newSkillForm.category || defaultCategory,
      tags: formattedTags,
      version: newSkillForm.version || '1.0.0',
      publisher: newSkillForm.publisher || 'User',
      source_platform: newSkillForm.source_platform || 'GitHub',
      source_url: newSkillForm.source_url || '',
      rating: parseInt(newSkillForm.rating) || 5
    };

    if (pageMode === 'proprietary') {
      const updated = [...skillsList, newSkillObj];
      setSkillsList(updated);
      const localAdded = JSON.parse(localStorage.getItem('aetherskills_added_skills') || '[]');
      localStorage.setItem('aetherskills_added_skills', JSON.stringify([...localAdded, newSkillObj]));
    } else {
      const updated = [...externalSkillsList, newSkillObj];
      setExternalSkillsList(updated);
      const localAdded = JSON.parse(localStorage.getItem('aetherskills_added_external') || '[]');
      localStorage.setItem('aetherskills_added_external', JSON.stringify([...localAdded, newSkillObj]));
    }

    setShowAddModal(false);
    setNewSkillForm({
      id: '',
      name: '',
      name_cn: '',
      description: '',
      description_cn: '',
      category: '',
      tags: '',
      version: '1.0.0',
      publisher: 'User',
      source_platform: 'GitHub',
      source_url: '',
      rating: 5
    });
  };

  const handleDeleteSkill = (skillId, e) => {
    e.stopPropagation();
    if (pageMode === 'proprietary') {
      const updated = skillsList.filter(s => s.id !== skillId);
      setSkillsList(updated);
      const localDeleted = JSON.parse(localStorage.getItem('aetherskills_deleted_skills') || '[]');
      if (!localDeleted.includes(skillId)) {
        localStorage.setItem('aetherskills_deleted_skills', JSON.stringify([...localDeleted, skillId]));
      }
      const localAdded = JSON.parse(localStorage.getItem('aetherskills_added_skills') || '[]');
      localStorage.setItem('aetherskills_added_skills', JSON.stringify(localAdded.filter(s => s.id !== skillId)));
    } else {
      const updated = externalSkillsList.filter(s => s.id !== skillId);
      setExternalSkillsList(updated);
      const localDeleted = JSON.parse(localStorage.getItem('aetherskills_deleted_external') || '[]');
      if (!localDeleted.includes(skillId)) {
        localStorage.setItem('aetherskills_deleted_external', JSON.stringify([...localDeleted, skillId]));
      }
      const localAdded = JSON.parse(localStorage.getItem('aetherskills_added_external') || '[]');
      localStorage.setItem('aetherskills_added_external', JSON.stringify(localAdded.filter(s => s.id !== skillId)));
    }
  };

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
          <button 
            className={`view-btn ${pageMode === 'cases' ? 'active' : ''}`}
            onClick={() => handlePageModeChange('cases')}
          >
            组合案例
          </button>
        </div>

        {/* 动态控制的侧边栏过滤器 */}
        {pageMode === 'cases' ? (
          <div className="sidebar-section">
            <span className="sidebar-section-title">案例库目录</span>
            <div className="sidebar-nav-list">
              <div style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                💡 汇聚 Rowan 与 Antigravity 的高含金量实操案例，揭示多个核心 Skills 协同做功的物理配方。
              </div>
            </div>
          </div>
        ) : pageMode === 'proprietary' ? (
          <div className="sidebar-section">
            <span className="sidebar-section-title">自研品类过滤</span>
            <div className="sidebar-nav-list">
              {tabs.map(tab => {
                const count = skillsList.filter(skill => {
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
                  const count = externalSkillsList.filter(s => {
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
                  const count = externalSkillsList.filter(s => {
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
                  const count = externalSkillsList.filter(s => {
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
          <div className="sidebar-version-badge" style={{ color: 'var(--accent-gold)' }}>BUILD: 2026.06.23</div>
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
                <div className="manage-toggle-container">
                  <span>管理模式</span>
                  <label className="manage-switch">
                    <input 
                      type="checkbox" 
                      checked={isManageMode}
                      onChange={(e) => setIsManageMode(e.target.checked)}
                    />
                    <span className="slider-switch"></span>
                  </label>
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
                {pageMode === 'cases' ? (
                  <>
                    <h1 className="hero-title">
                      <span>Classic Production Cases</span>
                      经典案例与技能组合包
                    </h1>
                    <p className="hero-desc">
                      探索具体业务场景下的 Skills 物理做功组装配方。每一个案例都汇聚了多个垂直技能，形成了已知良好的增量工作流，展现了从语言到界面的全谱系交付能力。
                    </p>
                  </>
                ) : pageMode === 'proprietary' ? (
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
                {pageMode === 'cases' ? (
                  <div className="bento-card" style={{ borderColor: 'rgba(220, 174, 150, 0.2)' }}>
                    <div>
                      <span className="focus-badge" style={{ background: 'rgba(220, 174, 150, 0.1)', color: 'var(--accent-orange)' }}>CASE STUDY</span>
                      <h3 className="bento-title">案例组合统计</h3>
                    </div>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-value">{casesData.length}</span>
                        <span className="stat-label">收录经典案例</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">12</span>
                        <span className="stat-label">关联核心技能</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">100%</span>
                        <span className="stat-label">物理做功闭环</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">超高清</span>
                        <span className="stat-label">成果品质</span>
                      </div>
                    </div>
                  </div>
                ) : pageMode === 'proprietary' ? (
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
                        <div className="card-footer" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="publisher-info">BY {skill.publisher}</span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className={`compare-btn ${comparedSkills.some(s => s.id === skill.id) ? 'active' : ''}`}
                              onClick={(e) => handleToggleCompare(skill, e)}
                            >
                              {comparedSkills.some(s => s.id === skill.id) ? '✓ 已选' : '对比'}
                            </button>
                            <button className="detail-btn" onClick={() => setSelectedSkill(skill)}>
                              展开详情 <span>→</span>
                            </button>
                          </div>
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
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              className={`compare-btn ${comparedSkills.some(s => s.id === skill.id) ? 'active' : ''}`}
                              onClick={(e) => handleToggleCompare(skill, e)}
                              style={{ padding: '3px 8px', fontSize: '0.65rem' }}
                            >
                              {comparedSkills.some(s => s.id === skill.id) ? '✓ 已选' : '对比'}
                            </button>
                            <a 
                              href={skill.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="source-badge"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🌐 源项目
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}

            {/* Categories Tabs, Source Switcher & List */}
            {pageMode === 'cases' ? (
              <section>
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="section-title">
                    {searchQuery ? `案例筛选结果 (${casesData.filter(c => c.name_cn.includes(searchQuery) || c.description_cn.includes(searchQuery)).length})` : '经典案例配方归档'}
                  </h2>
                </div>
                <div className="archive-grid">
                  {casesData
                    .filter(c => {
                      const query = searchQuery.toLowerCase();
                      return c.name_cn.toLowerCase().includes(query) || 
                             c.name_en.toLowerCase().includes(query) ||
                             c.description_cn.toLowerCase().includes(query) ||
                             c.description_en.toLowerCase().includes(query);
                    })
                    .map(c => (
                      <div 
                        key={c.id} 
                        className="archive-card case-card"
                        style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', position: 'relative' }}
                      >
                        <div>
                          <div className="archive-top" style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 className="archive-title" style={{ fontSize: '1.1rem', color: 'var(--accent-gold)' }}>
                              {c.name_cn}
                            </h4>
                            <span className="archive-category" style={{ fontSize: '0.65rem', background: 'rgba(220, 174, 150, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(220, 174, 150, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>CASE</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)', fontFamily: 'monospace', marginBottom: '0.8rem' }}>
                            {c.name_en}
                          </div>
                          <p className="archive-desc" style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                            {c.description_cn}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            {c.description_en}
                          </p>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: '600', display: 'block', marginBottom: '0.6rem' }}>🛠️ 调用的 Skills 组合配方：</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {c.skills_combined.map(skillId => {
                              const skillObj = skillsList.find(s => s.id === skillId) || externalSkillsList.find(s => s.id === skillId);
                              const nameShow = skillObj ? skillObj.name_cn : skillId;
                              return (
                                <button
                                  key={skillId}
                                  className="tag-pill-btn"
                                  style={{ 
                                    cursor: 'pointer', 
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: '#ffffff',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                  }}
                                  onClick={() => {
                                    if (skillObj) {
                                      setSelectedSkill(skillObj);
                                    } else {
                                      alert(`未找到该技能的本地记录：${skillId}`);
                                    }
                                  }}
                                  title="点击查看此 Skill 详细规范"
                                >
                                  {nameShow}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-dark)', fontWeight: '600', marginRight: '0.5rem' }}>🎯 成果交付：</span>
                          <span style={{ color: 'var(--accent-gold-soft)' }}>{c.outcome_preview}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ) : pageMode === 'proprietary' ? (
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
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {isManageMode && (
                        <button 
                          className="card-delete-btn"
                          onClick={(e) => handleDeleteSkill(skill.id, e)}
                          title="删除此技能"
                        >
                          ✕
                        </button>
                      )}
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
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button 
                            className={`compare-btn ${comparedSkills.some(s => s.id === skill.id) ? 'active' : ''}`}
                            onClick={(e) => handleToggleCompare(skill, e)}
                            style={{ padding: '3px 8px', fontSize: '0.65rem' }}
                          >
                            {comparedSkills.some(s => s.id === skill.id) ? '✓ 已选' : '对比'}
                          </button>
                          <button 
                            className="copy-btn" 
                            onClick={(e) => handleCopy(skill, e)}
                          >
                            {copiedId === skill.id ? '已复制 ✔' : '复制命令'}
                          </button>
                        </div>
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
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {isManageMode && (
                        <button 
                          className="card-delete-btn"
                          onClick={(e) => handleDeleteSkill(skill.id, e)}
                          title="删除此技能"
                        >
                          ✕
                        </button>
                      )}
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
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button 
                            className={`compare-btn ${comparedSkills.some(s => s.id === skill.id) ? 'active' : ''}`}
                            onClick={(e) => handleToggleCompare(skill, e)}
                            style={{ padding: '3px 8px', fontSize: '0.65rem' }}
                          >
                            {comparedSkills.some(s => s.id === skill.id) ? '✓ 已选' : '对比'}
                          </button>
                          <button 
                            className="copy-btn" 
                            onClick={(e) => handleCopy(skill, e)}
                          >
                            {copiedId === skill.id ? '已复制 ✔' : '复制命令'}
                          </button>
                        </div>
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

          {/* Add Skill Floating Action Button */}
          {isManageMode && (
            <button 
              className="add-skill-fab"
              onClick={() => {
                setNewSkillForm(prev => ({
                  ...prev,
                  category: pageMode === 'proprietary' ? 'AI 代理与工作流' : 'AI增强与提示工程'
                }));
                setShowAddModal(true);
              }}
              title="添加新技能"
            >
              +
            </button>
          )}

          {/* Add Skill Modal Dialog */}
          {showAddModal && (
            <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                <h3 className="modal-title" style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                  添加新技能 ({pageMode === 'proprietary' ? '自研工坊' : '外部精选'})
                </h3>
                <form onSubmit={handleAddSkillSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>唯一标识符 (ID) *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. custom-skill-id" 
                        required
                        value={newSkillForm.id}
                        onChange={e => setNewSkillForm({...newSkillForm, id: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>版本号</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newSkillForm.version}
                        onChange={e => setNewSkillForm({...newSkillForm, version: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>中文译名</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="中文名称"
                        value={newSkillForm.name_cn}
                        onChange={e => setNewSkillForm({...newSkillForm, name_cn: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>英文原名</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="English Name"
                        value={newSkillForm.name}
                        onChange={e => setNewSkillForm({...newSkillForm, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>分类板块</label>
                      <select 
                        className="form-select"
                        value={newSkillForm.category}
                        onChange={e => setNewSkillForm({...newSkillForm, category: e.target.value})}
                      >
                        {pageMode === 'proprietary' ? (
                          tabs.filter(t => t.id !== 'All').map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))
                        ) : (
                          extCategories.filter(c => c.id !== 'All').map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>标签 (逗号分隔)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Design, Tool"
                        value={newSkillForm.tags}
                        onChange={e => setNewSkillForm({...newSkillForm, tags: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>提供商 / 作者</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newSkillForm.publisher}
                        onChange={e => setNewSkillForm({...newSkillForm, publisher: e.target.value})}
                      />
                    </div>
                    {pageMode === 'external' ? (
                      <div className="form-group">
                        <label>星级评分</label>
                        <select 
                          className="form-select"
                          value={newSkillForm.rating}
                          onChange={e => setNewSkillForm({...newSkillForm, rating: e.target.value})}
                        >
                          <option value="5">★★★★★ 五星级</option>
                          <option value="4">★★★★ 四星级</option>
                          <option value="3">★★★ 三星级</option>
                        </select>
                      </div>
                    ) : null}
                  </div>

                  {pageMode === 'external' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>来源平台</label>
                        <select 
                          className="form-select"
                          value={newSkillForm.source_platform}
                          onChange={e => setNewSkillForm({...newSkillForm, source_platform: e.target.value})}
                        >
                          <option value="GitHub">GitHub</option>
                          <option value="Anthropic">Anthropic</option>
                          <option value="Vercel">Vercel</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>项目源网页 URL</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="https://github.com/..."
                          value={newSkillForm.source_url}
                          onChange={e => setNewSkillForm({...newSkillForm, source_url: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>中文详细介绍</label>
                    <textarea 
                      className="form-textarea" 
                      rows="2"
                      placeholder="介绍技能主要用途..."
                      value={newSkillForm.description_cn}
                      onChange={e => setNewSkillForm({...newSkillForm, description_cn: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>English Description</label>
                    <textarea 
                      className="form-textarea" 
                      rows="2"
                      placeholder="Detailed explanation in English..."
                      value={newSkillForm.description}
                      onChange={e => setNewSkillForm({...newSkillForm, description: e.target.value})}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                      取消
                    </button>
                    <button type="submit" className="btn-primary">
                      添加技能
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Floating Compare Bar */}
          {comparedSkills.length > 0 && (
            <div className="compare-bar-floating">
              <div className="compare-bar-container">
                <div className="compare-bar-info">
                  <span className="compare-count-badge">{comparedSkills.length}</span>
                  <span className="compare-label-text">个已选技能</span>
                </div>
                
                <div className="compared-thumbnails">
                  {comparedSkills.map(skill => (
                    <div key={skill.id} className="compared-thumbnail-item">
                      <span className="thumb-name">{skill.name_cn}</span>
                      <button 
                        className="thumb-remove" 
                        onClick={(e) => handleToggleCompare(skill, e)}
                        title="移出对比"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="compare-bar-actions">
                  <button 
                    className="compare-clear-btn" 
                    onClick={() => setComparedSkills([])}
                  >
                    清空已选
                  </button>
                  <button 
                    className="compare-trigger-btn"
                    disabled={comparedSkills.length < 2}
                    onClick={() => setShowCompareModal(true)}
                  >
                    开始对比
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Modal */}
          {showCompareModal && (
            <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
              <div className="modal-content comparison-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%' }}>
                <button className="modal-close" onClick={() => setShowCompareModal(false)}>×</button>
                <h3 className="modal-title" style={{ fontSize: '1.4rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', color: '#ffffff' }}>
                  📊 AI Agent 技能对比矩阵
                </h3>
                
                <div className="comparison-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '150px', textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}>对比维度</th>
                        {comparedSkills.map(skill => (
                          <th key={skill.id} style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--panel-border)', minWidth: '180px' }}>
                            <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '1rem' }}>{skill.name_cn}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold-soft)', fontFamily: 'monospace' }}>{skill.id}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>英文原名</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem', fontFamily: 'monospace' }}>{skill.name}</td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>分类领域</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>{skill.category || getNewCategory(skill)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>提供商 / 作者</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>{skill.publisher}</td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>版本号</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem', fontFamily: 'monospace' }}>{skill.version}</td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>核心描述</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                            <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>{skill.description_cn}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{skill.description}</div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>标签</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {skill.tags.map(tag => (
                                <span key={tag} className="tag-pill" style={{ fontSize: '0.65rem' }}>#{tag}</span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>装载命令</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="install-command" style={{ margin: 0, padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.68rem', wordBreak: 'break-all', display: 'block', paddingRight: '0.4rem', fontFamily: 'monospace', color: 'var(--accent-gold-soft)' }}>
                                {getInstallCommand(skill)}
                              </span>
                              <button 
                                className="copy-btn" 
                                onClick={(e) => handleCopy(skill, e)}
                                style={{ flexShrink: 0 }}
                              >
                                {copiedId === skill.id ? '✔' : '复制'}
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '0.8rem 1rem', borderBottom: 'none', color: 'var(--text-muted)', fontSize: '0.82rem' }}>操作</td>
                        {comparedSkills.map(skill => (
                          <td key={skill.id} style={{ padding: '0.8rem 1rem', borderBottom: 'none' }}>
                            <button 
                              className="btn-reset" 
                              onClick={(e) => handleToggleCompare(skill, e)}
                              style={{ padding: '4px 10px', fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', background: 'none', cursor: 'pointer', borderRadius: '4px', marginTop: 0 }}
                            >
                              移出对比
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
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
