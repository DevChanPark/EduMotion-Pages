import { getComposition } from './content-model.js';
import { getFilterOptions, getProgramTargets, getProgramTopic } from './public-data.js';
import { getTaxonomyLabel, getProgramDisplayTargets, getProgramKeywords, getTopicCardDescription } from './education-catalog.js';

/** The public views consume the same bounded section catalog as the CMS editor. */
export function createSectionRenderer({ escapeHtml: esc, photo, paragraphs, safeHref, programCard, storyCard, empty }) {
  const text = (value) => typeof value === 'string' ? value : '';
  const rows = (section) => Array.isArray(section.items) ? section.items.filter((item) => item && Object.entries(item).some(([key, value]) => key !== 'id' && typeof value === 'string' && value.trim())) : [];
  const enabled = (kind, stored) => {
    try { return getComposition(kind, stored).sections.filter((section) => section.enabled !== false); }
    catch { return [{ type: 'unavailable', title: '콘텐츠 구성을 표시할 수 없습니다.' }]; }
  };
  const unavailable = () => empty('콘텐츠 구성을 표시할 수 없습니다.', '잠시 후 다시 방문해 주세요.');
  const title = (section, action = true) => `<div class="section-heading"><div>${section.kicker ? `<span class="kicker">${esc(section.kicker)}</span>` : ''}${section.title ? `<h2>${esc(section.title)}</h2>` : ''}${section.description ? `<div class="section-desc cms-body">${paragraphs(section.description)}</div>` : ''}</div>${action ? button(section, 'text') : ''}</div>`;
  const button = (section, style = '', href = '') => section.buttonLabel && text(href || section.buttonHref).trim() ? `<a class="btn ${style}" href="${esc(safeHref(href || section.buttonHref))}">${esc(section.buttonLabel)} <span class="arrow" aria-hidden="true">↗</span></a>` : '';
  const itemCopy = (item) => `${item.label ? `<span class="content-label">${esc(item.label)}</span>` : ''}${item.title ? `<h3>${esc(item.title)}</h3>` : ''}${item.body ? `<div class="cms-body">${paragraphs(item.body)}</div>` : ''}`;
  const cards = (section, kind = '') => `<div class="content-card-grid ${kind}">${rows(section).map((item, index) => `<article class="content-card">${photo(item.imageUrl, item.imageAlt || item.title, 'content-card-image')}${item.label ? `<span class="content-label">${esc(item.label)}</span>` : `<span class="content-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}${item.title ? `<h3>${esc(item.title)}</h3>` : ''}${item.body ? `<div class="cms-body">${paragraphs(item.body)}</div>` : ''}</article>`).join('')}</div>`;
  const steps = (section, dark = false) => `<ol class="composition-steps${dark ? ' on-dark' : ''}">${rows(section).map((item, index) => `<li><span class="step-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div>${item.label ? `<span class="content-label">${esc(item.label)}</span>` : ''}${item.title ? `<h3>${esc(item.title)}</h3>` : ''}${item.body ? `<div class="cms-body">${paragraphs(item.body)}</div>` : ''}</div></li>`).join('')}</ol>`;
  const brandArt = (items = [], className = '') => `<div class="connection-art ${className}" aria-hidden="true"><div class="connection-orbit orbit-one"></div><div class="connection-orbit orbit-two"></div><div class="connection-core"><span></span><span></span><span></span></div>${items.slice(0, 3).map((item, index) => item.title ? `<div class="connection-word word-${index + 1}">${esc(item.title)}</div>` : '').join('')}</div>`;
  const cta = (section, href = '') => `<section class="cta-section composed-cta"><div class="wrap cta-inner"><div>${section.kicker ? `<span class="kicker">${esc(section.kicker)}</span>` : ''}${section.title ? `<h2>${esc(section.title)}</h2>` : ''}${section.description ? `<div class="cms-body">${paragraphs(section.description)}</div>` : ''}</div>${button(section, '', href)}</div></section>`;
  const sectionId = (kind, index) => `${kind}-section-${index}`;

  function home(homeSettings, programs, stories) {
    const targets = getFilterOptions(programs, 'target');
    const topics = getFilterOptions(programs, 'topic');
    const ids = Array.isArray(homeSettings.featuredIds) ? homeSettings.featuredIds : [];
    const featured = ids.map((id) => programs.find((program) => program.id === id)).filter(Boolean);
    return enabled('home', homeSettings.composition).map((section) => {
      if (section.type === 'unavailable') return `<section class="section"><div class="wrap">${unavailable()}</div></section>`;
      if (section.type === 'finder') return targets.length ? `<section class="finder"><div class="wrap"><div class="finder-inner"><div class="finder-heading"><div>${section.kicker ? `<span class="kicker">${esc(section.kicker)}</span>` : ''}${section.title ? `<h2>${esc(section.title)}</h2>` : ''}${section.description ? `<p>${esc(section.description)}</p>` : ''}</div></div><div class="finder-grid">${targets.map((target, index) => `<a class="finder-card" href="#/programs?target=${encodeURIComponent(target)}"><span class="symbol" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span><strong>${esc(getTaxonomyLabel('target', target))}</strong>${section.buttonLabel ? `<small>${esc(section.buttonLabel)}</small>` : ''}</span><span class="far" aria-hidden="true">↗</span></a>`).join('')}</div></div></div></section>` : '';
      if (section.type === 'topics') return topics.length ? `<section class="section"><div class="wrap">${title(section)}<div class="topics">${topics.map((topic, index) => {
        const label = getTaxonomyLabel('topic', topic);
        const item = rows(section).find((row) => [topic, label].includes(text(row.title).trim()));
        const keywords = getTopicCardDescription(topic, item ? text(item.body) : undefined);
        return `<a href="#/programs?topic=${encodeURIComponent(topic)}" class="topic"><span class="shape" aria-hidden="true"></span><span class="index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h3>${esc(label)}</h3>${keywords ? `<p>${esc(keywords)}</p>` : ''}<span class="topic-arrow" aria-hidden="true">↗</span></a>`;
      }).join('')}</div></div></section>` : '';
      if (section.type === 'featured') return `<section class="section sand"><div class="wrap">${title(section)}<div class="program-grid">${featured.length ? featured.map(programCard).join('') : empty('선정된 대표 프로그램이 없습니다.', '전체 프로그램에서 공개된 교육을 확인해 주세요.')}</div></div></section>`;
      if (section.type === 'about') return `<section class="section"><div class="wrap editorial-split"><div class="editorial-copy">${title(section, false)}${rows(section).length ? `<div class="editorial-points">${rows(section).map((item) => `<article>${itemCopy(item)}</article>`).join('')}</div>` : ''}${button(section, 'secondary')}</div><div class="editorial-visual">${photo(section.imageUrl, section.imageAlt || section.title) || brandArt(rows(section))}</div></div></section>`;
      if (section.type === 'process') return `<section class="section process-section"><div class="wrap"><div class="solution-block composed-process">${title(section, false)}${steps(section, true)}${button(section, 'light')}</div></div></section>`;
      if (section.type === 'stories') return homeSettings.showStories === true ? `<section class="section sky"><div class="wrap">${title(section)}<div class="stories">${stories.length ? stories.slice(0, 3).map(storyCard).join('') : empty('공개된 교육 현장 이야기가 없습니다.', '검토가 완료된 소식부터 소개합니다.')}</div></div></section>` : '';
      if (section.type === 'partnership') return homeSettings.showPartnership === true ? `<section class="section"><div class="wrap editorial-split partnership-composition"><div class="editorial-visual">${photo(section.imageUrl, section.imageAlt || section.title) || `<div class="partnership-visual">${rows(section).map((item) => `<div class="partner-square"><span aria-hidden="true">↗</span>${item.title ? `<strong>${esc(item.title)}</strong>` : ''}${item.body ? `<small>${esc(item.body)}</small>` : ''}</div>`).join('')}</div>`}</div><div class="editorial-copy">${title(section, false)}${button(section, 'secondary')}</div></div></section>` : '';
      if (section.type === 'cta') return cta(section);
      return '';
    }).join('');
  }

  function about(entry) {
    return enabled('about', entry.data?.composition).map((section) => {
      if (section.type === 'unavailable') return `<section class="section"><div class="wrap">${unavailable()}</div></section>`;
      if (section.type === 'overview') return `<section class="section about-overview"><div class="wrap editorial-split"><div class="editorial-copy">${title(section, false)}<div class="cms-body about-body">${paragraphs(entry.body)}</div>${button(section, 'secondary')}</div><div class="editorial-visual">${photo(entry.imageUrl, entry.title) || brandArt()}</div></div></section>`;
      if (section.type === 'values') return `<section class="section sand"><div class="wrap">${title(section)}${cards(section, 'value-cards')}</div></section>`;
      if (section.type === 'approach') return `<section class="section"><div class="wrap editorial-split"><div class="editorial-visual approach-visual">${photo(section.imageUrl, section.imageAlt || section.title) || brandArt(rows(section))}</div><div class="editorial-copy">${title(section, false)}<div class="editorial-points numbered-points">${rows(section).map((item, index) => `<article><span class="point-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div>${itemCopy(item)}</div></article>`).join('')}</div>${button(section, 'secondary')}</div></div></section>`;
      if (section.type === 'process') return `<section class="section sky"><div class="wrap">${title(section)}${steps(section)}</div></section>`;
      if (section.type === 'team') return `<section class="section"><div class="wrap">${title(section)}${cards(section, 'team-cards')}</div></section>`;
      if (section.type === 'cta') return cta(section);
      return '';
    }).join('');
  }

  function landing(kind, entry, records = []) {
    const publishedRecords = Array.isArray(records) ? records.filter((record) => record && record.status === 'published') : [];
    const hasRowsOrCopy = (section) => rows(section).length || text(section.description).trim();
    return enabled(kind, entry.data?.composition).map((section) => {
      if (section.type === 'unavailable') return `<section class="section"><div class="wrap">${unavailable()}</div></section>`;
      if (section.type === 'overview') return `<section class="section landing-overview ${esc(kind)}-overview"><div class="wrap editorial-split"><div class="editorial-copy">${title(section, false)}<div class="cms-body about-body">${paragraphs(entry.body)}</div></div><div class="editorial-visual">${photo(entry.imageUrl, entry.title) || brandArt()}</div></div></section>`;
      if (['needs', 'scope', 'fields', 'themes'].includes(section.type)) return hasRowsOrCopy(section) ? `<section class="section ${['needs', 'fields', 'themes'].includes(section.type) ? 'sand' : ''}"><div class="wrap">${title(section, false)}${rows(section).length ? cards(section, `landing-card-grid ${esc(section.type)}-cards`) : ''}</div></section>` : '';
      if (section.type === 'approach') return hasRowsOrCopy(section) ? `<section class="section"><div class="wrap editorial-split landing-approach"><div class="editorial-visual">${brandArt()}</div><div class="editorial-copy">${title(section, false)}<div class="editorial-points numbered-points">${rows(section).map((item, index) => `<article><span class="point-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div>${itemCopy(item)}</div></article>`).join('')}</div></div></div></section>` : '';
      if (section.type === 'process') return hasRowsOrCopy(section) ? `<section class="section landing-process"><div class="wrap"><div class="solution-block composed-process">${title(section, false)}${rows(section).length ? steps(section, true) : ''}</div></div></section>` : '';
      if (['preparation', 'guidance'].includes(section.type)) return hasRowsOrCopy(section) ? `<section class="section sky"><div class="wrap landing-preparation"><div>${title(section, false)}</div>${rows(section).length ? `<ul class="preparation-list">${rows(section).map((item) => `<li><span class="preparation-mark" aria-hidden="true">✓</span><div>${itemCopy(item)}</div></li>`).join('')}</ul>` : ''}</div></section>` : '';
      if (section.type === 'faq') {
        const questions = rows(section).filter((item) => text(item.title).trim());
        return questions.length || text(section.description).trim() ? `<section class="section"><div class="wrap landing-faq">${title(section, false)}${questions.length ? `<div class="faq-list">${questions.map((item) => `<details><summary>${esc(item.title)}<span class="faq-symbol" aria-hidden="true">+</span></summary><div class="cms-body">${paragraphs(item.body)}</div></details>`).join('')}</div>` : ''}</div></section>` : '';
      }
      if (section.type === 'records') return `<section class="section story-records-section"><div class="wrap">${title(section)}<div class="stories">${publishedRecords.length ? publishedRecords.map(storyCard).join('') : empty('공개된 교육 현장 이야기가 없습니다.', '검토가 완료된 소식부터 소개합니다.')}</div></div></section>`;
      if (section.type === 'cta') return cta(section);
      return '';
    }).join('');
  }

  function program(program, programs, backHref) {
    const data = program.data || {};
    const targets = getProgramTargets(program);
    const displayTargets = getProgramDisplayTargets(program);
    const keywords = getProgramKeywords(program);
    const topic = getProgramTopic(program);
    const inquiryUrl = `#/contact?programId=${encodeURIComponent(program.id)}`;
    const composition = enabled('program', data.composition);
    const heroImage = photo(program.imageUrl, program.title);
    const goals = Array.isArray(data.goals) ? data.goals.filter((goal) => typeof goal === 'string' && goal.trim()) : [];
    const blocks = composition.map((section, index) => {
      const attributes = `id="${sectionId('program', index)}" tabindex="-1"`;
      if (section.type === 'unavailable') return `<section class="detail-section" ${attributes}>${unavailable()}</section>`;
      if (section.type === 'overview') return `<section class="detail-section" ${attributes}>${title(section, false)}<div class="cms-body">${paragraphs(program.body)}</div></section>`;
      if (section.type === 'goals') return goals.length ? `<section class="detail-section" ${attributes}>${title(section, false)}<div class="objective-grid">${goals.map((goal, goalIndex) => `<div class="objective"><b aria-hidden="true">${String(goalIndex + 1).padStart(2, '0')}</b><span>${esc(goal)}</span></div>`).join('')}</div></section>` : '';
      if (section.type === 'curriculum') return rows(section).length || text(section.description).trim() ? `<section class="detail-section" ${attributes}>${title(section, false)}${rows(section).length ? `<ol class="curriculum-list">${rows(section).map((item, itemIndex) => `<li><span class="curriculum-index" aria-hidden="true">${String(itemIndex + 1).padStart(2, '0')}</span><div>${itemCopy(item)}</div></li>`).join('')}</ol>` : ''}</section>` : '';
      if (section.type === 'operation') return rows(section).length || text(section.description).trim() ? `<section class="detail-section" ${attributes}>${title(section, false)}${rows(section).length ? `<dl class="operation-list">${rows(section).map((item) => `<div>${item.title ? `<dt>${esc(item.title)}</dt>` : ''}<dd>${item.body ? `<div class="cms-body">${paragraphs(item.body)}</div>` : ''}</dd></div>`).join('')}</dl>` : ''}</section>` : '';
      if (section.type === 'gallery') {
        const images = rows(section).filter((item) => photo(item.imageUrl, item.imageAlt || item.title));
        return images.length ? `<section class="detail-section" ${attributes}>${title(section, false)}<div class="program-gallery">${images.map((item) => `<figure>${photo(item.imageUrl, item.imageAlt || item.title)}${item.title || item.body ? `<figcaption>${item.title ? `<strong>${esc(item.title)}</strong>` : ''}${item.body ? `<p>${esc(item.body)}</p>` : ''}</figcaption>` : ''}</figure>`).join('')}</div></section>` : '';
      }
      if (section.type === 'faq') {
        const questions = rows(section).filter((item) => text(item.title).trim());
        return questions.length || text(section.description).trim() ? `<section class="detail-section" ${attributes}>${title(section, false)}${questions.length ? `<div class="faq-list">${questions.map((item) => `<details><summary>${esc(item.title)}<span class="faq-symbol" aria-hidden="true">+</span></summary><div class="cms-body">${paragraphs(item.body)}</div></details>`).join('')}</div>` : ''}</section>` : '';
      }
      if (section.type === 'related') {
        const related = programs.filter((item) => item.id !== program.id).map((item, order) => ({ item, order, score: Number(Boolean(topic) && getProgramTopic(item) === topic) * 2 + Number(getProgramTargets(item).some((target) => targets.includes(target))) })).sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 3).map(({ item }) => item);
        return related.length ? `<section class="detail-section related-section" ${attributes}>${title(section)}<div class="program-grid">${related.map(programCard).join('')}</div></section>` : '';
      }
      if (section.type === 'cta') return `<section class="detail-section detail-contact" ${attributes}>${title(section, false)}${button(section, '', inquiryUrl)}</section>`;
      return '';
    });
    const navigation = composition.map((section, index) => section.type !== 'unavailable' && blocks[index] && section.title ? `<button type="button" data-scroll-section="${sectionId('program', index)}">${esc(section.title)}</button>` : '').join('');
    return `<main id="mainContent" tabindex="-1"><section class="detail-hero program-detail-hero"><div class="wrap"><div class="breadcrumb"><a href="${esc(backHref)}">교육 프로그램</a> <span aria-hidden="true">/</span> ${esc(program.title)}</div><div class="program-hero-grid"><div><span class="kicker">EDUCATION PROGRAMS</span><h1>${esc(program.title)}</h1>${program.summary ? `<p>${esc(program.summary)}</p>` : ''}<div class="tags">${[...displayTargets, data.category, getTaxonomyLabel('topic', topic)].filter(Boolean).map((value) => `<span class="tag">${esc(value)}</span>`).join('')}</div><a class="btn program-hero-cta" href="${inquiryUrl}">이 교육 문의하기 <span aria-hidden="true">↗</span></a></div><div class="program-hero-visual">${heroImage || brandArt()}</div></div></div></section>${navigation ? `<nav class="program-local-nav" aria-label="프로그램 상세 목차"><div class="wrap">${navigation}</div></nav>` : ''}<section class="section program-content"><div class="wrap detail-layout"><div class="detail-main">${blocks.join('')}<div class="detail-return"><a class="btn secondary" href="${esc(backHref)}"><span aria-hidden="true">←</span> 프로그램 목록으로</a></div></div><aside class="aside-card"><span class="kicker">PROGRAM GUIDE</span><h2>프로그램 한눈에 보기</h2><dl>${[['교육 대상', displayTargets.join(' · ')], ['교육 유형', data.category], ['교육 시간', data.duration], ['주요 주제', getTaxonomyLabel('topic', topic)], ['키워드', keywords.join(' · ')]].filter(([, value]) => value).map(([label, value]) => `<dt>${label}</dt><dd>${esc(value)}</dd>`).join('')}</dl><a class="btn" href="${inquiryUrl}">이 교육 문의하기 <span aria-hidden="true">↗</span></a><a class="aside-return" href="${esc(backHref)}">프로그램 목록으로 <span aria-hidden="true">↗</span></a></aside></div></section></main>`;
  }

  return { home, about, program, landing };
}
