import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './ui.css';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Finmarks/finmarks@main';

interface Entity {
  id: string;
  name: string;
  categories: string[];
  brand_color: string;
  logos: Record<string, string>;
}

interface Category {
  id: string;
  label: string;
  description?: string;
  count?: number;
}

function FinmarksLogo() {
  return (
    <svg className="brandLogoSvg" viewBox="0 0 613 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="84" height="24" rx="12" fill="var(--accent)" />
      <rect y="34" width="58" height="24" rx="12" fill="var(--accent)" />
      <rect y="68" width="30" height="24" rx="12" fill="var(--accent)" />
      {/* F */}
      <path d="M132 89.584V11.184H146.56V89.584H132ZM138.72 57.44V44.224H179.152V57.44H138.72ZM138.72 24.624V11.184H183.968V24.624H138.72Z" fill="var(--ink)" />
      {/* i */}
      <path d="M199.245 89.584V30.56H213.021V89.584H199.245ZM205.965 18.016C203.202 18.016 201.037 17.344 199.469 16C197.975 14.5813 197.229 12.6027 197.229 10.064C197.229 7.67467 198.013 5.73334 199.581 4.24001C201.149 2.74667 203.277 2 205.965 2C208.802 2 210.967 2.70934 212.461 4.12801C214.029 5.472 214.813 7.45067 214.813 10.064C214.813 12.3787 214.029 14.2827 212.461 15.776C210.893 17.2693 208.727 18.016 205.965 18.016Z" fill="var(--ink)" />
      {/* n */}
      <path d="M230.489 89.584V30.56H243.929L244.153 42.656L241.577 44C242.324 41.312 243.78 38.8853 245.945 36.72C248.11 34.48 250.686 32.688 253.673 31.344C256.66 30 259.721 29.328 262.857 29.328C267.337 29.328 271.07 30.224 274.057 32.016C277.118 33.808 279.396 36.496 280.889 40.08C282.457 43.664 283.241 48.144 283.241 53.52V89.584H269.465V54.528C269.465 51.5413 269.054 49.0773 268.233 47.136C267.412 45.12 266.142 43.664 264.425 42.768C262.708 41.7973 260.617 41.3493 258.153 41.424C256.137 41.424 254.27 41.76 252.553 42.432C250.91 43.0293 249.454 43.9253 248.185 45.12C246.99 46.24 246.02 47.5467 245.273 49.04C244.601 50.5333 244.265 52.176 244.265 53.968V89.584H237.433C236.089 89.584 234.82 89.584 233.625 89.584C232.505 89.584 231.46 89.584 230.489 89.584Z" fill="var(--ink)" />
      {/* m */}
      <path d="M298.739 89.584V31.12H307.139L307.363 44.448L305.683 45.008C306.28 42.768 307.251 40.752 308.595 38.96C310.014 37.0934 311.694 35.488 313.635 34.144C315.576 32.8 317.704 31.792 320.019 31.12C322.334 30.3734 324.76 30 327.299 30C330.36 30 333.086 30.5227 335.475 31.568C337.939 32.5387 339.992 34.256 341.635 36.72C343.352 39.1094 344.659 42.2827 345.555 46.24L343.539 45.232L344.323 43.328C345.07 41.6107 346.152 39.968 347.571 38.4C349.064 36.7574 350.744 35.3014 352.611 34.032C354.552 32.7627 356.643 31.792 358.883 31.12C361.198 30.3734 363.55 30 365.939 30C370.046 30 373.518 30.896 376.355 32.688C379.192 34.4054 381.32 37.056 382.739 40.64C384.232 44.224 384.979 48.7787 384.979 54.304V89.584H376.355V54.752C376.355 50.8694 375.87 47.696 374.899 45.232C373.928 42.768 372.472 40.9387 370.531 39.744C368.664 38.4747 366.275 37.84 363.363 37.84C360.824 37.84 358.472 38.288 356.307 39.184C354.216 40.0054 352.387 41.2 350.819 42.768C349.326 44.2614 348.131 45.9787 347.235 47.92C346.414 49.8614 346.003 51.952 346.003 54.192V89.584H337.491V54.64C337.491 50.9067 336.968 47.808 335.923 45.344C334.952 42.88 333.496 41.0134 331.555 39.744C329.614 38.4747 327.224 37.84 324.387 37.84C321.923 37.84 319.646 38.288 317.555 39.184C315.464 40.0054 313.635 41.1627 312.067 42.656C310.574 44.1494 309.379 45.8667 308.483 47.808C307.662 49.7494 307.251 51.84 307.251 54.08V89.584H298.739Z" fill="var(--ink-3)" />
      {/* a */}
      <path d="M423.746 90.704C418.669 90.704 414.077 89.3973 409.97 86.784C405.863 84.096 402.615 80.4747 400.226 75.92C397.837 71.2907 396.642 66.064 396.642 60.24C396.642 54.3413 397.874 49.1147 400.338 44.56C402.802 40.0053 406.087 36.4213 410.194 33.808C414.375 31.1947 419.042 29.888 424.194 29.888C427.255 29.888 430.093 30.336 432.706 31.232C435.319 32.128 437.634 33.3973 439.65 35.04C441.741 36.608 443.458 38.4747 444.802 40.64C446.221 42.7307 447.191 45.008 447.714 47.472L445.25 46.24L445.586 31.12H453.986V89.584H445.474V75.248L447.714 73.792C447.191 76.032 446.183 78.1973 444.69 80.288C443.197 82.304 441.367 84.096 439.202 85.664C437.111 87.232 434.722 88.464 432.034 89.36C429.421 90.256 426.658 90.704 423.746 90.704ZM425.65 82.64C429.533 82.64 433.005 81.7067 436.066 79.84C439.127 77.8987 441.517 75.248 443.234 71.888C445.026 68.4533 445.922 64.5707 445.922 60.24C445.922 55.9093 445.026 52.064 443.234 48.704C441.517 45.344 439.127 42.6933 436.066 40.752C433.005 38.8107 429.533 37.84 425.65 37.84C421.693 37.84 418.183 38.8107 415.122 40.752C412.135 42.6933 409.746 45.344 407.954 48.704C406.237 52.064 405.378 55.9093 405.378 60.24C405.378 64.496 406.237 68.3413 407.954 71.776C409.671 75.136 412.061 77.7867 415.122 79.728C418.183 81.6693 421.693 82.64 425.65 82.64Z" fill="var(--ink-3)" />
      {/* r */}
      <path d="M470.351 89.584V31.12H478.751L478.975 46.688L478.079 44.56C478.9 41.9467 480.207 39.52 481.999 37.28C483.866 35.04 486.068 33.248 488.607 31.904C491.146 30.56 493.946 29.888 497.007 29.888C498.276 29.888 499.471 30 500.591 30.224C501.711 30.3733 502.644 30.5973 503.391 30.896L501.039 40.304C500.068 39.856 499.06 39.5573 498.015 39.408C497.044 39.184 496.111 39.072 495.215 39.072C492.676 39.072 490.399 39.52 488.383 40.416C486.367 41.312 484.65 42.5813 483.231 44.224C481.812 45.792 480.73 47.6213 479.983 49.712C479.236 51.8027 478.863 54.0427 478.863 56.432V89.584H470.351Z" fill="var(--ink-3)" />
      {/* k */}
      <path d="M519.636 70.768L519.3 61.024L549.876 31.12H561.188L519.636 70.768ZM512.132 89.584V6.70401H520.532V89.584H512.132ZM552.228 89.584L527.588 61.024L533.524 55.2L563.204 89.584H552.228Z" fill="var(--ink-3)" />
      {/* s */}
      <path d="M591.003 90.704C586 90.704 581.52 89.7707 577.563 87.904C573.606 86.0373 570.47 83.5733 568.155 80.512L574.091 75.36C576.256 77.9733 578.795 79.952 581.707 81.296C584.694 82.64 588.016 83.312 591.675 83.312C593.542 83.312 595.222 83.1253 596.715 82.752C598.208 82.304 599.515 81.6693 600.635 80.848C601.755 80.0267 602.614 79.056 603.211 77.936C603.808 76.816 604.107 75.584 604.107 74.24C604.107 71.776 603.024 69.7227 600.859 68.08C599.888 67.408 598.507 66.736 596.715 66.064C594.923 65.3173 592.758 64.608 590.219 63.936C586.038 62.7413 582.566 61.5467 579.803 60.352C577.04 59.0827 574.875 57.6267 573.307 55.984C572.187 54.64 571.328 53.184 570.731 51.616C570.208 50.048 569.947 48.3307 569.947 46.464C569.947 44.0747 570.432 41.872 571.403 39.856C572.448 37.84 573.867 36.0853 575.659 34.592C577.526 33.024 579.691 31.8667 582.155 31.12C584.694 30.2987 587.419 29.888 590.331 29.888C593.094 29.888 595.819 30.2613 598.507 31.008C601.195 31.7547 603.696 32.8373 606.011 34.256C608.326 35.6747 610.304 37.3547 611.947 39.296L606.795 44.896C605.376 43.4027 603.808 42.0587 602.091 40.864C600.374 39.6693 598.544 38.736 596.603 38.064C594.736 37.392 592.795 37.056 590.779 37.056C588.987 37.056 587.307 37.28 585.739 37.728C584.246 38.176 582.939 38.8107 581.819 39.632C580.774 40.3787 579.952 41.312 579.355 42.432C578.832 43.552 578.571 44.784 578.571 46.128C578.571 47.248 578.795 48.256 579.243 49.152C579.691 50.048 580.326 50.832 581.147 51.504C582.192 52.3253 583.648 53.1093 585.515 53.856C587.456 54.528 589.846 55.2373 592.683 55.984C595.968 56.88 598.731 57.8133 600.971 58.784C603.286 59.68 605.19 60.7627 606.683 62.032C608.699 63.5253 610.118 65.2427 610.939 67.184C611.835 69.1253 612.283 71.328 612.283 73.792C612.283 77.0773 611.35 79.9893 609.483 82.528C607.691 85.0667 605.19 87.0827 601.979 88.576C598.768 89.9947 595.11 90.704 591.003 90.704Z" fill="var(--ink-3)" />
    </svg>
  );
}

function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeVariant, setActiveVariant] = useState<'icon' | 'full'>('icon');
  const [activePage, setActivePage] = useState<'logos' | 'about'>('logos');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('finmarks-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // Ignore security error in iframe
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('finmarks-theme', theme);
    } catch (e) {
      // Ignore security error
    }
  }, [theme]);

  useEffect(() => {
    Promise.all([
      fetch(`${CDN_BASE}/dist/index.json`).then(res => res.json()),
      fetch(`${CDN_BASE}/dist/categories.json`).then(res => res.json()).catch(() => ({ categories: [] }))
    ])
      .then(([indexData, catData]) => {
        setEntities(indexData.entities || []);
        setCategories(catData.categories || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleInsert = async (entity: Entity, variant: string) => {
    const url = entity.logos[variant];
    if (!url) return;

    try {
      const res = await fetch(url);
      const svg = await res.text();
      parent.postMessage({
        pluginMessage: {
          type: 'insert-svg',
          svg: svg,
          name: `${entity.name} - ${variant}`
        }
      }, '*');
    } catch (err) {
      console.error('Failed to fetch SVG', err);
    }
  };

  const filteredEntities = entities.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (e.categories && e.categories.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const selectedCategoryLabel = selectedCategory === 'all'
    ? 'All'
    : (categories.find(c => c.id === selectedCategory)?.label || selectedCategory);

  return (
    <div className="app">
      <div className="header">
        {/* Brand Row */}
        <div className="brandRow">
          <a href="#" onClick={(e) => { e.preventDefault(); setActivePage('logos'); }} className="brandLogoLink">
            <FinmarksLogo />
          </a>
          <div className="navLinks">
            <a href="https://www.finmarks.org?utm_source=figma_plugin" target="_blank" rel="noreferrer" className="navLink">
              Website
            </a>
            <button
              className={`navLinkBtn ${activePage === 'about' ? 'active' : ''}`}
              onClick={() => setActivePage(activePage === 'about' ? 'logos' : 'about')}
            >
              About
            </button>
            <button className="themeBtn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {activePage === 'logos' && (
          <div className="searchWrap">
            <span className="searchIcon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              className="search"
              placeholder="Search name, id, @handle, IFSC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Filter Row */}
      {activePage === 'logos' && (
        <div className="filterRow">
          <div className="dropdownContainer" ref={dropdownRef}>
            <button
              className={`dropdownTrigger ${dropdownOpen ? 'active' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <span>{selectedCategoryLabel}</span>
              <svg className={`chevronIcon ${dropdownOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="dropdownMenu" role="listbox">
                <button
                  className={`dropdownItem ${selectedCategory === 'all' ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCategory('all');
                    setDropdownOpen(false);
                  }}
                >
                  <span>All Categories</span>
                  <span className="itemCount">{entities.length}</span>
                </button>
                {categories.map(cat => {
                  const count = entities.filter(e => e.categories && e.categories.includes(cat.id)).length;
                  return (
                    <button
                      key={cat.id}
                      className={`dropdownItem ${selectedCategory === cat.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setDropdownOpen(false);
                      }}
                    >
                      <span>{cat.label}</span>
                      <span className="itemCount">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="filterRight">
            <span className="entityCount">
              {filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'}
            </span>
            <div className="variantTabs" role="group" aria-label="Logo variant">
              <button
                type="button"
                className={`variantTab${activeVariant === 'icon' ? ' active' : ''}`}
                onClick={() => setActiveVariant('icon')}
              >
                Icon
              </button>
              <button
                type="button"
                className={`variantTab${activeVariant === 'full' ? ' active' : ''}`}
                onClick={() => setActiveVariant('full')}
              >
                Full
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        {activePage === 'about' ? (
          <div className="aboutPage">
            <button
              type="button"
              className="backBtn"
              onClick={() => setActivePage('logos')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to logos</span>
            </button>
            <div className="aboutHero">
              <h2 className="aboutTitle">What is Finmarks?</h2>
              <p className="aboutDesc">
                Finmarks is an open source dataset of <strong>Indian fintech entities</strong> — banks, UPI apps, wallets, and NBFCs with verified brand metadata and SVG logos. It is designed to help you build fintech products faster with high-quality assets directly inside Figma.
              </p>
            </div>

            <div className="aboutLinks">
              <a href="https://tally.so/r/dWGzWd?utm_source=figma_plugin" target="_blank" rel="noreferrer" className="aboutLinkCard">
                <span className="aboutIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <span className="aboutLinkText">Contribute</span>
              </a>
              <a href="https://github.com/finmarks/finmarks?utm_source=figma_plugin" target="_blank" rel="noreferrer" className="aboutLinkCard">
                <span className="aboutIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </span>
                <span className="aboutLinkText">GitHub</span>
              </a>
            </div>

            <div className="creatorCredit">
              <div className="creditMain">
                <div className="creditBadge">
                  <span className="creditHeart" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </span>
                  <span>Made with love for Fintech</span>
                </div>
                <div className="creditAuthor">
                  <span className="creditBy">Crafted by</span>
                  <span className="creditName">Kaval Patel</span>
                </div>
              </div>

              <div className="creditLinks">
                <a href="https://www.kaval.design/?utm_source=finmarks_figma_plugin" target="_blank" rel="noreferrer" className="creditBtn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>kaval.design</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V8H8" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/kavalpatel18/?utm_source=finmarks_figma_plugin" target="_blank" rel="noreferrer" className="creditBtn linkedinBtn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>LinkedIn</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V8H8" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="loading">Loading logos...</div>
        ) : filteredEntities.length === 0 ? (
          <div className="empty">
            <p>No entities match that query.</p>
            <div className="emptyActions">
              <a
                href="https://tally.so/r/yPAzV8"
                target="_blank"
                rel="noreferrer"
                className="outlineBtn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  <line x1="19" x2="19" y1="12" y2="18" />
                  <line x1="22" x2="16" y1="15" y2="15" />
                </svg>
                <span>Request a logo</span>
              </a>
              <a
                href="https://tally.so/r/dWGzWd"
                target="_blank"
                rel="noreferrer"
                className="primaryBtn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Contribute</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="tiles">
            {filteredEntities.map(entity => {
              const hasIcon = !!entity.logos.icon;
              const hasFull = !!entity.logos.full;
              const hasAny = hasIcon || hasFull;

              // Pick the best preview for the active variant
              const previewVariant = activeVariant === 'icon'
                ? (hasIcon ? 'icon' : hasFull ? 'full' : null)
                : (hasFull ? 'full' : hasIcon ? 'icon' : null);
              const previewUrl = previewVariant ? entity.logos[previewVariant] : null;

              // Variant to insert on click
              const insertVariant = activeVariant === 'icon'
                ? (hasIcon ? 'icon' : hasFull ? 'full' : null)
                : (hasFull ? 'full' : hasIcon ? 'icon' : null);

              // Label shown on Insert button if using fallback
              const insertLabel = insertVariant
                ? (insertVariant !== activeVariant ? insertVariant.charAt(0).toUpperCase() + insertVariant.slice(1) : 'Insert')
                : 'Insert';

              return (
                <div key={entity.id} className="tile">
                  <div
                    className="mark tileMark"
                    style={hasAny
                      ? { background: 'var(--logo-bg)', boxShadow: '0 0 0 1px var(--line) inset' }
                      : { background: `${entity.brand_color}1A`, color: entity.brand_color }
                    }
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="" loading="lazy" />
                    ) : (
                      entity.name.substring(0, 2).toUpperCase()
                    )}
                  </div>

                  <span className="tileName">{entity.name}</span>

                  {hasAny && insertVariant && (
                    <button
                      className="actionBtnFull"
                      onClick={() => handleInsert(entity, insertVariant)}
                    >
                      {insertLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
