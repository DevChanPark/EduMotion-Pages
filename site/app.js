import { safePublicHref, getProgramTargets, catalogHref } from './public-data.js';
import { getProgramDisplayTargets } from './education-catalog.js';
import { renderProgramBrowser, mountProgramBrowser } from './program-browser.js';
import { createSectionRenderer } from './page-sections.js';
import { getEntryCompositionKind } from './content-model.js';

const LOGO_SRC = new URL('./assets/logo-reference.png', import.meta.url).href;
const staticPreview = document.documentElement.hasAttribute('data-static-preview');
const NAV = [['에듀모션 소개', '/about'], ['교육 프로그램', '/programs'], ['학교 맞춤 솔루션', '/solution'], ['기업·기관 협력', '/partnership'], ['교육 현장', '/stories'], ['함께하기', '/join']];
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const state = { entries: [], settings: { site: {}, home: {} }, loading: true, error: false, catalogHref: '#/programs', renderedHash: null };
// Inquiry drafts live only in this tab's memory, never in browser storage.
const inquiry = { draft: null, context: null, feedback: null, submissionKey: null, submissionPayload: null, submitting: false };
const text = (value) => typeof value === 'string' ? value : '';
const list = (collection) => state.entries.filter((entry) => entry.collection === collection).sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
const programs = () => list('programs');
const page = (slug) => list('pages').find((item) => item.slug === slug);
const pathFor = (collection) => ({ programs: '/programs', stories: '/stories', notices: '/notices', recruitments: '/join', pages: '/pages' })[collection] || '/pages';
const entryUrl = (entry) => `#${pathFor(entry.collection)}/${encodeURIComponent(entry.slug)}`;
const paragraphs = (value) => text(value).split(/\n\s*\n/).filter((part) => part.trim()).map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');

function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const question = raw.indexOf('?');
  return { path: question < 0 ? raw : raw.slice(0, question), params: new URLSearchParams(question < 0 ? '' : raw.slice(question + 1)) };
}
function safeHref(value, fallback = '#/contact') {
  return safePublicHref(value, location.origin, fallback);
}
function safeImage(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return '';
  if (/^\/api\/media\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function photo(value, alt, className = '') {
  const src = safeImage(value);
  return src ? `<img class="cms-image ${className}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" referrerpolicy="no-referrer">` : '';
}
function activeRoute(path, href) {
  return path === href || path.startsWith(`${href}/`) || (href === '/join' && path.startsWith('/recruitments/'));
}
function header(path) {
  const item = ([label, href]) => `<a class="${activeRoute(path, href) ? 'active' : ''}" href="#${href}"${activeRoute(path, href) ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<a class="skip-link" href="#mainContent">본문 바로가기</a><div class="notice-strip">홈페이지 리뉴얼 검토용 시안 · 프로그램과 소개 내용은 검토 후 교체할 수 있습니다.</div><header class="topbar"><div class="wrap inner"><a class="logo" href="#/" aria-label="${escapeHtml(state.settings.site.name || '에듀모션')} 홈"><img src="${LOGO_SRC}" alt="에듀모션 기존 로고"></a><nav class="nav" aria-label="주 메뉴">${NAV.map(item).join('')}<a class="nav-cta" href="#/contact">교육 문의 ↗</a></nav><button class="hamburger" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobileMenu" id="menuToggle">☰</button></div><nav class="mobile-menu" id="mobileMenu" aria-label="모바일 메뉴">${NAV.map(item).join('')}<a class="nav-cta" href="#/contact">교육 문의하기 ↗</a></nav></header>`;
}
function footer() {
  const site = state.settings.site;
  return `<footer class="footer"><div class="wrap"><div class="footer-grid"><div><div class="brand">${escapeHtml(site.name || 'EDUMOTION')}</div><p>${escapeHtml(site.tagline)}<br>${escapeHtml(site.description)}</p>${site.address ? `<p>${escapeHtml(site.address)}</p>` : ''}${site.contactEmail || site.contactPhone ? `<p>${escapeHtml(site.contactEmail)}${site.contactEmail && site.contactPhone ? ' · ' : ''}${escapeHtml(site.contactPhone)}</p>` : ''}</div><div class="footer-links"><div><b>에듀모션</b><a href="#/about">회사 소개</a><a href="#/solution">학교 맞춤 솔루션</a><a href="#/partnership">기업·기관 협력</a></div><div><b>이용안내</b><a href="#/notices">공지사항</a><a href="#/stories">교육 현장</a><a href="#/contact">교육 문의</a>${staticPreview ? '' : '<a href="/admin">관리자</a>'}</div></div></div><div class="footer-bottom"><span>© ${escapeHtml(site.name || 'EDUMOTION')}</span><span>홈페이지 리뉴얼 미리보기</span></div></div></footer>`;
}
function empty(title, description = '', action = '') {
  return `<div class="empty cms-empty"><h3>${escapeHtml(title)}</h3>${description ? `<p class="subtle">${escapeHtml(description)}</p>` : ''}${action}</div>`;
}
function sectionTitle(kicker, heading, description = '', href = '', label = '더 알아보기') {
  return `<div class="section-heading"><div><span class="kicker">${escapeHtml(kicker)}</span><h2>${escapeHtml(heading)}</h2>${description ? `<p class="section-desc">${escapeHtml(description)}</p>` : ''}</div>${href ? `<a class="btn text" href="${escapeHtml(safeHref(href))}">${escapeHtml(label)} <span class="arrow">↗</span></a>` : ''}</div>`;
}
function pageHero(title, description, kicker = 'EDUMOTION') {
  return `<section class="page-hero"><div class="wrap"><div class="breadcrumb">HOME / ${escapeHtml(title)}</div><span class="kicker">${escapeHtml(kicker)}</span><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ''}</div></section>`;
}
function programArt(program) {
  const image = photo(program.imageUrl, program.title);
  return `<div class="program-visual ${/^v[1-7]$/.test(program.data?.v) ? program.data.v : 'v1'}">${image || '<div class="circle" aria-hidden="true"></div><div class="bubble" aria-hidden="true"></div><div class="bubble b2" aria-hidden="true"></div><div class="corner" aria-hidden="true">↗</div>'}</div>`;
}
function programCard(program) {
  return `<a class="program-card" href="${entryUrl(program)}" aria-label="${escapeHtml(program.title)} 상세 보기">${programArt(program)}<div class="program-body"><div class="tags">${getProgramDisplayTargets(program).map((target) => `<span class="tag">${escapeHtml(target)}</span>`).join('')}${program.data?.category ? `<span class="tag neutral">${escapeHtml(program.data.category)}</span>` : ''}</div><h3>${escapeHtml(program.title)}</h3><p>${escapeHtml(program.summary)}</p><div class="program-bottom"><span>프로그램 살펴보기</span><span aria-hidden="true">↗</span></div></div></a>`;
}
function storyCard(entry) {
  return `<a href="${entryUrl(entry)}" class="story"><div class="story-art">${photo(entry.imageUrl, entry.title) || '<div class="st-circle" aria-hidden="true"></div>'}</div><div class="info">${entry.data?.category ? `<span class="tag">${escapeHtml(entry.data.category)}</span>` : ''}<h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.summary)} &nbsp; ↗</p></div></a>`;
}
function heroArt(home) {
  const image = photo(home.imageUrl, state.settings.site.tagline);
  return image ? `<div class="hero-art hero-photo">${image}</div>` : `<div class="hero-art" role="img" aria-label="서로 연결되는 배움을 표현한 추상 그래픽"><div class="blob a"></div><div class="blob b"></div><div class="blob c"></div><div class="ring"></div><div class="ring r2"></div><div class="art-main"><div class="art-heading"><b></b>${escapeHtml(home.eyebrow)}</div><strong>${escapeHtml(state.settings.site.tagline).replace(/,\s*/g, ',<br>')}</strong><div class="art-nodes" aria-hidden="true"><span></span><i>→</i><span></span><i>→</i><span></span></div></div></div>`;
}

const sectionViews = createSectionRenderer({ escapeHtml, photo, paragraphs, safeHref, programCard, storyCard, empty });
function home() {
  const home = state.settings.home;
  const headline = text(home.title).split('\n').map((line, index) => index === 1 ? `<span>${escapeHtml(line)}</span>` : escapeHtml(line)).join('<br>');
  return `<main id="mainContent" tabindex="-1"><section class="hero"><div class="wrap hero-grid"><div class="hero-text"><span class="kicker">${escapeHtml(home.eyebrow)}</span><h1>${headline || escapeHtml(state.settings.site.name)}</h1><p>${escapeHtml(home.description)}</p><div class="hero-btns">${home.ctaLabel ? `<a class="btn" href="${escapeHtml(safeHref(home.ctaHref, '#/programs'))}">${escapeHtml(home.ctaLabel)} <span class="arrow">↗</span></a>` : ''}${home.secondaryLabel ? `<a class="btn secondary" href="${escapeHtml(safeHref(home.secondaryHref, '#/contact'))}">${escapeHtml(home.secondaryLabel)} <span class="arrow">↗</span></a>` : ''}</div><div class="hero-meta"><span class="line"></span><span>${escapeHtml(state.settings.site.tagline)}</span></div></div>${heroArt(home)}</div></section>${sectionViews.home(home, programs(), list('stories'))}</main>`;
}
function about() {
  const entry = page('about');
  if (!entry) return missing('공개된 회사 소개를 찾을 수 없습니다.', '#/');
  return contentDetail(entry, '#/', '홈으로');
}
function storiesLanding() { return page('stories') ? contentDetail(page('stories'), '#/', '홈으로') : collectionPage('stories'); }

function catalog() {
  const values = Object.fromEntries(route().params);
  return `<main id="mainContent" class="catalog-page" tabindex="-1">${pageHero('교육 프로그램', '나를 이해하는 배움에서, 서로를 존중하고 함께 성장하는 경험으로.', 'EDUCATION PROGRAMS')}<section class="section catalog-section"><div class="wrap">${renderProgramBrowser({ programs: programs(), values, homeSettings: state.settings.home, escapeHtml })}</div></section></main>`;
}
function attachFilters() {
  mountProgramBrowser({
    programs: programs(), values: Object.fromEntries(route().params), homeSettings: state.settings.home,
    escapeHtml, programCard, empty,
    onChange(values, historyMode) {
      state.catalogHref = catalogHref(values);
      if (historyMode) history[historyMode](null, '', state.catalogHref);
      state.renderedHash = location.hash || '#/';
    },
  });
}
function programDetail(slug) {
  const program = programs().find((entry) => entry.slug === slug);
  return program ? sectionViews.program(program, programs(), state.catalogHref) : missing('프로그램을 찾을 수 없습니다.', '#/programs');
}

const collectionLabels = { pages: ['안내', 'EDUMOTION', '공개된 안내 페이지가 없습니다.'], stories: ['교육 현장', 'FIELD STORIES', '공개된 교육 현장 이야기가 없습니다.'], notices: ['공지사항', 'NOTICE', '등록된 공지사항이 없습니다.'], recruitments: ['함께하기', 'JOIN EDUMOTION', '현재 공개된 모집 안내가 없습니다.'] };
function collectionPage(collection) {
  const [title, kicker, noItems] = collectionLabels[collection];
  const entries = list(collection);
  return `<main id="mainContent" tabindex="-1">${pageHero(title, '', kicker)}<section class="section"><div class="wrap">${entries.length ? collection === 'stories' ? `<div class="stories">${entries.map(storyCard).join('')}</div>` : `<div class="cms-entry-list">${entries.map((entry) => `<a class="cms-entry-row" href="${entryUrl(entry)}"><div>${entry.data?.category ? `<span class="tag neutral">${escapeHtml(entry.data.category)}</span>` : ''}<h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.summary)}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</div>` : empty(noItems, collection === 'recruitments' ? '모집이 시작되면 이곳에 안내합니다.' : '검토가 완료된 콘텐츠부터 안내합니다.')}</div></section></main>`;
}
function contentDetail(entry, backHref, backLabel) {
  if (!entry) return missing('공개된 내용을 찾을 수 없습니다.', backHref);
  if (entry.collection === 'pages') {
    let kind;
    try { kind = getEntryCompositionKind(entry); }
    catch { return `<main id="mainContent" tabindex="-1">${pageHero(entry.title, entry.summary)}<section class="section"><div class="wrap">${empty('콘텐츠 구성을 표시할 수 없습니다.', '잠시 후 다시 방문해 주세요.')}</div></section></main>`; }
    if (kind) {
      const kicker = { about: 'ABOUT EDUMOTION', solution: 'SCHOOL SOLUTION', partnership: 'PARTNERSHIP', stories: 'FIELD STORIES' }[kind] || 'EDUMOTION';
      const sections = kind === 'about' ? sectionViews.about(entry) : sectionViews.landing(kind, entry, list('stories'));
      return `<main id="mainContent" tabindex="-1">${pageHero(entry.title, entry.summary, kicker)}${sections}<div class="wrap cms-detail-actions composed-page-return"><a class="btn secondary" href="${escapeHtml(safeHref(backHref))}">${escapeHtml(backLabel)} ↗</a></div></main>`;
    }
  }
  if (entry.collection === 'stories') {
    const entries = list('stories');
    const index = entries.findIndex((item) => item.id === entry.id);
    const adjacent = [['이전 이야기', entries[index - 1]], ['다음 이야기', entries[index + 1]]].filter(([, item]) => item);
    return `<main id="mainContent" tabindex="-1"><section class="page-hero story-detail-hero"><div class="wrap"><div class="breadcrumb"><a href="#/stories">교육 현장</a> <span aria-hidden="true">/</span> ${escapeHtml(entry.title)}</div><span class="kicker">FIELD STORY</span>${entry.data?.category ? `<div class="story-detail-category"><span class="tag">${escapeHtml(entry.data.category)}</span></div>` : ''}<h1>${escapeHtml(entry.title)}</h1>${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : ''}</div></section><section class="section"><div class="wrap cms-reading">${photo(entry.imageUrl, entry.title, 'detail-photo')}<article class="cms-body story-reading" aria-label="${escapeHtml(entry.title)} 본문">${paragraphs(entry.body) || empty('본문을 준비하고 있습니다.')}</article>${adjacent.length ? `<nav class="story-reading-nav" aria-label="다른 교육 현장 이야기">${adjacent.map(([label, item]) => `<a href="${entryUrl(item)}"><span>${label}</span><strong>${escapeHtml(item.title)}</strong><span aria-hidden="true">↗</span></a>`).join('')}</nav>` : ''}<div class="cms-detail-actions"><a class="btn secondary" href="#/stories">교육 현장 목록으로 ↗</a></div></div></section></main>`;
  }
  return `<main id="mainContent" tabindex="-1">${pageHero(entry.title, entry.summary)}<section class="section"><div class="wrap cms-reading">${photo(entry.imageUrl, entry.title, 'detail-photo')}<div class="cms-body">${paragraphs(entry.body) || empty('본문을 준비하고 있습니다.')}</div><div class="cms-detail-actions"><a class="btn secondary" href="${backHref}">${escapeHtml(backLabel)} ↗</a>${entry.collection === 'pages' ? `<a class="btn" href="#/contact${entry.slug === 'solution' ? `?type=${encodeURIComponent('학교 맞춤 솔루션')}` : entry.slug === 'partnership' ? `?type=${encodeURIComponent('기업·기관 협력')}` : ''}">문의하기 ↗</a>` : ''}</div></div></section></main>`;
}
function missing(message = '페이지를 찾을 수 없습니다.', href = '#/') {
  return `<main id="mainContent" tabindex="-1">${pageHero(message, '공개 여부와 주소를 확인해 주세요.')}<section class="section"><div class="wrap"><a class="btn" href="${href}">돌아가기 ↗</a></div></section></main>`;
}
const INQUIRY_TYPES = ['교육 프로그램', '학교 맞춤 솔루션', '기업·기관 협력', '기타'];
function contactEnabled() { return !staticPreview && state.settings.site.inquiryEnabled === true && text(state.settings.site.privacyText).trim().length > 0 && text(state.settings.site.contactEmail).trim().length > 0; }
function contact() {
  const { params } = route();
  const selectedId = params.get('programId') || '';
  const selectedProgram = programs().find((program) => program.id === selectedId || program.slug === params.get('program'));
  const enabled = contactEnabled();
  const field = (id, label, max, placeholder = '', required = false) => `<div class="field"><label for="${id}">${label}${required ? ' *' : ''}</label><input id="${id}" name="${id}" maxlength="${max}"${required ? ' required' : ''} placeholder="${placeholder}"></div>`;
  return `<main id="mainContent" tabindex="-1">${pageHero('교육 문의', enabled ? '교육 목적과 상황을 알려주세요. 접수된 문의는 담당자가 확인합니다.' : '현재 문의 접수가 비활성화되어 있습니다. 아래는 입력 흐름을 확인하는 미리보기입니다.', 'CONTACT EDUMOTION')}
  <section class="section"><div class="wrap contact-grid"><div class="form-shell"><h2>교육 상담 요청</h2><p>기관의 교육 계획에 필요한 정보만 입력해 주세요.</p>
  ${enabled ? '' : '<div class="prototype-banner">미리보기입니다. 입력한 정보는 저장·전송되지 않습니다. 실제 개인정보를 입력하지 마세요.</div>'}
  ${selectedId && !selectedProgram ? '<div class="prototype-banner">선택했던 프로그램이 현재 공개되어 있지 않습니다. 다른 프로그램을 선택하거나 일반 문의로 진행해 주세요.</div>' : ''}
  <form id="contactForm"><div class="form-fields">
  <div class="field"><label for="type">문의 유형 *</label><select id="type" name="type" required>${INQUIRY_TYPES.map((type) => `<option${params.get('type') === type ? ' selected' : ''}>${type}</option>`).join('')}</select></div>
  <div class="field"><label for="programId">관심 프로그램</label><select id="programId" name="programId"><option value="">프로그램 선택 안 함</option>${programs().map((program) => `<option value="${escapeHtml(program.id)}"${selectedProgram?.id === program.id ? ' selected' : ''}>${escapeHtml(program.title)}</option>`).join('')}</select></div>
  ${field('organization', '학교·기관명', 120, '예: ○○학교', true)}${field('person', '담당자명', 80, '성함 또는 담당자 표기명', true)}${field('contact', '연락처', 160, '회신받을 이메일 또는 전화번호', true)}${field('target', '교육 대상', 120, '예: 중학교 1학년')}${field('scale', '예상 인원', 80, '예: 3개 학급, 약 80명')}${field('schedule', '희망 일정', 120, '예: 11월 중 협의')}
  <div class="field wide"><label for="message">문의 내용 *</label><textarea id="message" name="message" maxlength="4000" required placeholder="교육 목적과 요청 사항을 적어 주세요."></textarea></div></div>
  <div class="form-note">학생 이름·연락처·건강 상태 등 학생을 식별할 수 있는 정보와 민감한 내용은 입력하지 마세요.</div>
  <div class="cms-honeypot" aria-hidden="true"><label for="website">이 항목은 비워 두세요</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
  ${enabled ? `<div class="cms-privacy"><h3>개인정보 수집·이용 안내</h3><div class="cms-body">${paragraphs(state.settings.site.privacyText)}</div><label class="cms-consent"><input type="checkbox" id="consent" name="consent" required><span>안내를 확인했으며 개인정보 수집·이용에 동의합니다. *</span></label></div>` : ''}
  <div class="contact-actions"><button class="btn" id="submitInquiry" type="submit">${enabled ? '문의 접수하기' : '미리보기 흐름 확인'} ↗</button><button class="btn secondary" id="clearInquiry" type="button">입력 비우기</button></div>
  <p class="contact-memory-note">작성 내용은 이 탭에서 페이지를 오갈 때 유지됩니다. 새로고침하거나 탭을 닫으면 지워집니다.</p>
  <p id="contactStatus" class="form-note" role="status" aria-live="polite" hidden></p></form></div>
  <aside class="contact-aside"><span class="soft-label">CONTACT GUIDE</span><h3 class="cms-spaced">문의 전 확인해 주세요</h3><p>교육 대상과 희망하는 주제, 일정이 있으면 함께 적어 주세요.</p><ul><li>프로그램별 세부 내용과 운영 가능 여부는 상담 시 확인합니다.</li><li>개인 학생의 상세 정보는 입력하지 않습니다.</li><li>${enabled ? '접수 완료 후 접수번호를 확인할 수 있습니다.' : '현재 입력 내용은 저장·전송되지 않습니다.'}</li></ul>${state.settings.site.contactEmail ? `<p class="cms-spaced">이메일: ${escapeHtml(state.settings.site.contactEmail)}</p>` : ''}${state.settings.site.contactPhone ? `<p>전화: ${escapeHtml(state.settings.site.contactPhone)}</p>` : ''}</aside></div></section></main>`;
}
const INQUIRY_FIELDS = ['type', 'programId', 'organization', 'person', 'contact', 'target', 'scale', 'schedule', 'message', 'website'];
function captureInquiry() {
  const form = $('#contactForm');
  if (!form) return;
  inquiry.draft = Object.fromEntries(INQUIRY_FIELDS.map((name) => [name, form.elements.namedItem(name)?.value || '']));
  inquiry.draft.consent = Boolean($('#consent')?.checked);
}
function updateInquiryUi() {
  const form = $('#contactForm');
  if (!form) return;
  form.setAttribute('aria-busy', String(inquiry.submitting));
  form.querySelectorAll('input, select, textarea, button').forEach((control) => { control.disabled = inquiry.submitting; });
  $('#submitInquiry').textContent = inquiry.submitting ? '접수 중…' : `${contactEnabled() ? '문의 접수하기' : '미리보기 흐름 확인'} ↗`;
  const status = $('#contactStatus');
  status.hidden = !inquiry.feedback;
  status.classList.toggle('cms-error', inquiry.feedback?.error === true);
  status.textContent = inquiry.feedback?.message || '';
}
function announceInquiry(message, error = false) {
  inquiry.feedback = { message, error };
  updateInquiryUi();
}
function attachContact() {
  const form = $('#contactForm');
  const { params } = route();
  if (inquiry.draft) {
    for (const name of INQUIRY_FIELDS) {
      const control = form.elements.namedItem(name);
      const value = text(inquiry.draft[name]);
      if (control.tagName !== 'SELECT' || [...control.options].some((option) => option.value === value)) control.value = value;
    }
    if ($('#consent')) $('#consent').checked = inquiry.draft.consent === true;
  }
  const context = JSON.stringify([params.get('programId'), params.get('program'), params.get('type')]);
  if (context !== inquiry.context && !inquiry.submitting) {
    if (params.has('programId') || params.has('program')) {
      const program = programs().find((entry) => entry.id === params.get('programId') || entry.slug === params.get('program'));
      form.elements.namedItem('programId').value = program?.id || '';
    }
    if (INQUIRY_TYPES.includes(params.get('type'))) form.elements.namedItem('type').value = params.get('type');
    inquiry.context = context;
  }
  const remember = () => { captureInquiry(); inquiry.feedback = null; updateInquiryUi(); };
  form.addEventListener('input', remember);
  form.addEventListener('change', remember);
  $('#clearInquiry').onclick = () => {
    if (inquiry.submitting) return;
    form.reset();
    inquiry.draft = null;
    inquiry.feedback = null;
    inquiry.submissionKey = null;
    inquiry.submissionPayload = null;
    updateInquiryUi();
  };
  captureInquiry();
  updateInquiryUi();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (inquiry.submitting) return;
    captureInquiry();
    if (!contactEnabled()) { announceInquiry('입력 흐름을 확인했습니다. 미리보기이므로 문의가 접수되거나 저장되지 않았습니다.'); return; }
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    const payload = { type: fields.type, programId: fields.programId || null, organization: fields.organization?.trim(), person: fields.person?.trim(), contact: fields.contact?.trim(), target: fields.target?.trim() || '', scale: fields.scale?.trim() || '', schedule: fields.schedule?.trim() || '', message: fields.message?.trim(), consent: $('#consent').checked, website: fields.website || '' };
    const invalid = ['organization', 'person', 'contact', 'message'].find((key) => !payload[key]);
    if (invalid) { announceInquiry('필수 항목을 공백 없이 입력해 주세요.', true); document.getElementById(invalid).focus(); return; }
    if (payload.programId && !programs().some((program) => program.id === payload.programId)) { announceInquiry('현재 공개된 프로그램을 다시 선택해 주세요.', true); return; }
    const serialized = JSON.stringify(payload);
    if (serialized !== inquiry.submissionPayload) { inquiry.submissionPayload = serialized; inquiry.submissionKey = crypto.randomUUID(); }
    inquiry.submitting = true;
    announceInquiry('문의를 접수하고 있습니다.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': inquiry.submissionKey }, body: serialized, signal: controller.signal, credentials: 'same-origin' });
      let result;
      try { result = await response.json(); } catch { throw new Error('invalid_response'); }
      if (!response.ok) {
        if (response.status === 400 || response.status === 422) { inquiry.submissionPayload = null; announceInquiry(text(result.error?.message) || text(result.error) || text(result.message) || '입력 내용을 확인해 주세요. 필수 항목과 개인정보 동의가 필요합니다.', true); }
        else if (response.status === 429) announceInquiry('요청이 많아 잠시 접수할 수 없습니다. 잠시 후 다시 시도해 주세요.', true);
        else if (response.status === 403 || response.status === 503) announceInquiry('현재 문의 접수를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.', true);
        else announceInquiry('접수 결과를 확인하지 못했습니다. 입력 내용을 유지했으니 잠시 후 다시 시도해 주세요.', true);
        return;
      }
      if (!result.id || !result.receivedAt) throw new Error('invalid_response');
      announceInquiry(`문의가 접수되었습니다. 접수번호: ${String(result.id)}`);
      $('#contactForm')?.reset();
      inquiry.draft = null;
      inquiry.submissionKey = null;
      inquiry.submissionPayload = null;
    } catch {
      announceInquiry('접수 결과를 확인하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요. 같은 내용으로 재시도하면 중복 접수를 방지합니다.', true);
    } finally {
      clearTimeout(timeout);
      inquiry.submitting = false;
      updateInquiryUi();
    }
  });
}
function attachShell() {
  const toggle = $('#menuToggle');
  const menu = $('#mobileMenu');
  $('.skip-link').onclick = (event) => { event.preventDefault(); $('#mainContent').focus(); };
  const setOpen = (open, focus = false) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    toggle.textContent = open ? '✕' : '☰';
    if (focus) (open ? menu.querySelector('a') : toggle).focus();
  };
  toggle.onclick = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true', true);
  menu.onclick = (event) => {
    if (event.target.closest('a')) setOpen(false, true);
  };
  menu.onkeydown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
    if (event.key === 'Tab') {
      const links = [...menu.querySelectorAll('a')];
      if (event.shiftKey && event.target === links[0]) { event.preventDefault(); toggle.focus(); }
      else if (!event.shiftKey && event.target === links.at(-1)) { event.preventDefault(); toggle.focus(); }
    }
  };
  toggle.onkeydown = (event) => {
    if (event.key === 'Escape') setOpen(false, true);
    if (event.key === 'Tab' && toggle.getAttribute('aria-expanded') === 'true') { event.preventDefault(); const links = [...menu.querySelectorAll('a')]; (event.shiftKey ? links.at(-1) : links[0]).focus(); }
  };
  $('#backtop').onclick = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  document.querySelectorAll('[data-scroll-section]').forEach((button) => {
    button.onclick = () => {
      const section = document.getElementById(button.dataset.scrollSection);
      if (!section) return;
      section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      section.focus({ preventScroll: true });
      document.querySelectorAll('[data-scroll-section]').forEach((item) => item.removeAttribute('aria-current'));
      button.setAttribute('aria-current', 'location');
    };
  });
}
function render({ scroll = true, focus = false } = {}) {
  captureInquiry();
  const { path } = route();
  let body;
  if (state.loading) body = `<main id="mainContent" tabindex="-1" aria-busy="true"><section class="section"><div class="wrap">${empty('페이지를 불러오고 있습니다.', '공개된 콘텐츠를 확인하고 있습니다.')}</div></section></main>`;
  else if (state.error) body = `<main id="mainContent" tabindex="-1"><section class="section"><div class="wrap">${empty('콘텐츠를 불러오지 못했습니다.', '연결 상태를 확인한 뒤 다시 시도해 주세요.', '<button class="btn cms-spaced" type="button" id="retrySite">다시 불러오기</button>')}</div></section></main>`;
  else if (path === '/') body = home();
  else if (path === '/programs') body = catalog();
  else if (path.startsWith('/programs/')) body = programDetail(decodeSegment(path.slice(10)));
  else if (path === '/contact') body = contact();
  else if (path === '/stories') body = storiesLanding();
  else if (path === '/notices') body = collectionPage('notices');
  else if (path === '/pages') body = collectionPage('pages');
  else if (path === '/join' || path === '/recruitments') body = collectionPage('recruitments');
  else if (path === '/about' || path === '/pages/about') body = about();
  else if (['/solution', '/partnership'].includes(path)) body = contentDetail(page(path.slice(1)), '#/', '홈으로');
  else {
    const match = path.match(/^\/(stories|notices|join|recruitments|pages)\/([^/]+)$/);
    if (match) {
      const collection = ['join', 'recruitments'].includes(match[1]) ? 'recruitments' : match[1];
      body = contentDetail(list(collection).find((entry) => entry.slug === decodeSegment(match[2])), `#${pathFor(collection)}`, `${collectionLabels[collection]?.[0] || '전체'} 목록`);
    } else body = missing();
  }
  $('#root').innerHTML = header(path) + body + footer() + '<button class="backtop" id="backtop" type="button" aria-label="맨 위로">↑</button>';
  if (path.startsWith('/programs/')) {
    const back = document.querySelector('.detail-hero .breadcrumb a');
    if (back) back.setAttribute('href', state.catalogHref);
  }
  attachShell();
  if ($('#retrySite')) $('#retrySite').onclick = loadSite;
  if (!state.loading && !state.error && path === '/programs') attachFilters();
  if (!state.loading && !state.error && path === '/contact') attachContact();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  document.title = `${document.querySelector('main h1')?.textContent || '홈'} | ${text(state.settings.site.name) || '에듀모션'}`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', text(state.settings.site.description));
  state.renderedHash = location.hash || '#/';
  if (focus) $('#mainContent').focus({ preventScroll: true });
}
function decodeSegment(value) { try { return decodeURIComponent(value); } catch { return ''; } }
async function loadSite() {
  state.loading = true;
  state.error = false;
  render({ scroll: false });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(staticPreview ? './site.json' : '/api/site', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
    if (!response.ok) throw new Error('site_unavailable');
    const payload = await response.json();
    if (!Array.isArray(payload.entries) || !payload.settings?.site || !payload.settings?.home) throw new Error('invalid_site');
    // The public API also enforces this. Keep draft entries out of client rendering.
    state.entries = payload.entries.filter((entry) => entry && entry.status === 'published' && typeof entry.id === 'string' && typeof entry.slug === 'string');
    state.settings = payload.settings;
  } catch {
    state.entries = [];
    state.settings = { site: {}, home: {} };
    state.error = true;
  } finally { clearTimeout(timeout); state.loading = false; render({ scroll: false }); }
}
function navigate() {
  if (state.renderedHash === (location.hash || '#/')) return;
  render({ focus: true });
}
window.addEventListener('hashchange', navigate);
window.addEventListener('popstate', navigate);
window.addEventListener('beforeunload', (event) => {
  const hasDraft = ['organization', 'person', 'contact', 'target', 'scale', 'schedule', 'message'].some((name) => text(inquiry.draft?.[name]).trim());
  if (inquiry.submitting || hasDraft) { event.preventDefault(); event.returnValue = ''; }
});
loadSite();
