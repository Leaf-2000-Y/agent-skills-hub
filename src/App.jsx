import React, { useState, useMemo } from 'react';
import skillsData from './data/skills.json';

// Highlight key framework skills
const FEATURED_IDS = [
  'complex-project-orchestrator',
  'deep-writing-assistant',
  'modern-web-guidance'
];

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // High dimension categories
  const tabs = ['All', 'Bioinformatics & Science', 'Data & Cloud', 'Frontend & Browser', 'Automation & Workflow'];

  // Total count
  const totalSkills = skillsData.length;
  const lastUpdated = "2026-06-16";

  // Filter skills by search query (bilingual) and tab
  const filteredSkills = useMemo(() => {
    return skillsData.filter(skill => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        skill.name.toLowerCase().includes(query) ||
        skill.name_cn.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.description_cn.toLowerCase().includes(query) ||
        skill.id.toLowerCase().includes(query);
      
      const matchesTab = activeTab === 'All' || skill.category === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  // Featured skills
  const featuredSkills = useMemo(() => {
    return skillsData.filter(skill => FEATURED_IDS.includes(skill.id));
  }, []);

  const handleCopy = (id, e) => {
    e.stopPropagation();
    const cmd = `@skill:install ${id}`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
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
                placeholder="搜索技能名称或描述..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <a 
              href="https://github.com/yiyirowan" 
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
            <h1 className="hero-title">
              <span>Antigravity & Codex Weaponry</span>
              物理动作，双语智能装载
            </h1>
            <p className="hero-desc">
              专为 Agent 协同平台构建的技能动作目录。此处汇聚了 75 个精心分类的动作拓展包，通过规范化的中英描述和一键指令，大幅提升 Agent 与操作系统的联接效率。
            </p>
          </div>

          {/* Bento Stats Panel */}
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
                <span className="stat-value">4</span>
                <span className="stat-label">高维分类</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">v1.3</span>
                <span className="stat-label">数据版本</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{lastUpdated}</span>
                <span className="stat-label">数据同步</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Showcase */}
        {searchQuery === '' && activeTab === 'All' && (
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
                      <span className="card-tag">{skill.category.split(' ')[0]}</span>
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
        )}

        {/* Categories Tabs & List */}
        <section>
          <div className="section-header">
            <h2 className="section-title">
              {searchQuery ? `筛选结果 (${filteredSkills.length})` : '技能库归档仓'}
            </h2>
          </div>

          {/* Pill Tabs */}
          <div className="tabs-container">
            {tabs.map(tab => (
              <button 
                key={tab} 
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'All' ? '全部所有' : tab}
              </button>
            ))}
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
                    <span className="archive-category" style={{ fontSize: '0.65rem' }}>{skill.category}</span>
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
                    onClick={(e) => handleCopy(skill.id, e)}
                  >
                    {copiedId === skill.id ? '已复制 ✔' : '复制命令'}
                  </button>
                </div>
              </div>
            ))}
            {filteredSkills.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-dark)' }}>
                未搜索到匹配的中英文技能。
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Details Backdrop Modal */}
      {selectedSkill && (
        <div className="modal-overlay" onClick={() => setSelectedSkill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSkill(null)}>×</button>
            <h3 className="modal-title" style={{ fontSize: '1.6rem' }}>{selectedSkill.name_cn}</h3>
            <div className="modal-id" style={{ fontFamily: 'monospace', color: 'var(--accent-gold-soft)', fontSize: '0.85rem' }}>
              {selectedSkill.name}
            </div>
            
            <div className="modal-meta-row">
              <div className="modal-meta-item">
                <span>分类领域</span>
                {selectedSkill.category}
              </div>
              <div className="modal-meta-item">
                <span>版本</span>
                {selectedSkill.version}
              </div>
              <div className="modal-meta-item">
                <span>提供商</span>
                {selectedSkill.publisher}
              </div>
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
              
              <div className="modal-section-title" style={{ color: '#ffffff', fontWeight: '600' }}>装载命令</div>
              <div className="install-command">
                <span>@skill:install {selectedSkill.id}</span>
                <button 
                  className="copy-btn" 
                  onClick={(e) => handleCopy(selectedSkill.id, e)}
                >
                  {copiedId === selectedSkill.id ? '已复制 ✔' : '复制'}
                </button>
              </div>
              
              <div style={{ marginTop: '1.2rem', fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                * 提示：复制后可直接发送给 Antigravity 环境加载。
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
