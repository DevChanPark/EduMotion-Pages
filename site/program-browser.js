import { filterPrograms, getFilterOptions } from './public-data.js';
import { SCHOOL_LEVELS, getTaxonomyLabel, getTopicCardDescription, normalizeEducationTarget } from './education-catalog.js';
import { getComposition } from './content-model.js';

const VIEWS = ['topic', 'target'];
const FILTER_KEYS = ['target', 'topic', 'category', 'schoolLevel', 'q'];
const text = (value) => typeof value === 'string' ? value : '';
const clean = (value) => text(value).trim();
const viewName = (view) => view === 'target' ? '대상별 교육' : '주제별 교육';
const filterName = (key) => ({ target: '교육 대상', topic: '교육 주제', category: '사업 유형', schoolLevel: '학교급', q: '검색어' })[key];
const ADDITIONAL_FILTER_HINT = '대상·주제·사업 유형·학교급';
const AUDIENCE_GUIDANCE = {
  '성인·가족': {
    title: '관계·소통 교육 맞춤 설계 문의',
    body: '자기이해, 감정조절, 스트레스관리, 의사소통을 중심으로 대상의 특성과 필요에 맞는 교육을 함께 고민하고 개발합니다.',
    cta: '맞춤형 교육 문의하기',
    type: '교육 프로그램',
  },
  '기관·조직': {
    title: '교육 프로그램 개발·협력 문의',
    body: '관계와 소통을 중심으로 기관과 조직의 교육 목적에 맞는 프로그램 기획 및 협력 가능성을 함께 검토합니다.',
    cta: '교육·협력 문의하기',
    type: '기업·기관 협력',
  },
};

/** Guidance describes a future collaboration, never a fabricated published program. */
export function getAudienceGuidance(programs, target) {
  const audience = normalizeEducationTarget(target);
  const guidance = Object.hasOwn(AUDIENCE_GUIDANCE, audience) ? AUDIENCE_GUIDANCE[audience] : null;
  return guidance && filterPrograms(programs, { target: audience }).length === 0 ? { ...guidance } : null;
}

/** Old audience links open the audience tab; explicit view always wins. */
export function resolveProgramBrowserValues(values = {}) {
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, key === 'q' ? text(values[key]) : clean(values[key])]));
  const view = VIEWS.includes(values.view) ? values.view : filters.target && !filters.topic ? 'target' : 'topic';
  return { ...filters, view };
}

/** State transitions keep the cross-filter visible and never silently keep it on tab changes. */
export function updateProgramBrowserValues(values, action) {
  const next = resolveProgramBrowserValues(values);
  if (action.type === 'view' && VIEWS.includes(action.value)) {
    if (next.view !== action.value) return { ...next, view: action.value, target: '', topic: '' };
  }
  if (action.type === 'filter' && FILTER_KEYS.includes(action.key)) next[action.key] = action.key === 'q' ? text(action.value) : clean(action.value);
  if (action.type === 'reset') return { target: '', topic: '', category: '', schoolLevel: '', q: '', view: next.view };
  return next;
}

export function catalogTabDestination(view, key) {
  if (key === 'Home') return VIEWS[0];
  if (key === 'End') return VIEWS.at(-1);
  if (key === 'ArrowLeft' || key === 'ArrowRight') return view === 'topic' ? 'target' : 'topic';
  return null;
}

function topicDescriptions(homeSettings = {}) {
  let items = [];
  try {
    const section = getComposition('home', homeSettings.composition).sections.find((row) => row.type === 'topics' && row.enabled !== false);
    items = Array.isArray(section?.items) ? section.items : [];
  } catch { /* An invalid optional home composition must not break the catalog. */ }
  return (value) => {
    const label = getTaxonomyLabel('topic', value);
    const item = items.find((row) => row && [value, label].includes(clean(row.title)));
    return getTopicCardDescription(value, item ? text(item.body) : undefined, ' · ') ?? '등록된 교육 주제를 살펴보세요.';
  };
}

function choiceCount(programs, values, key, value) {
  return filterPrograms(programs, { ...values, [key]: value }).length;
}

/** Static controls are rendered once; changing a filter only redraws the results. */
export function renderProgramBrowser({ programs = [], values = {}, homeSettings = {}, escapeHtml: esc }) {
  const current = resolveProgramBrowserValues(values);
  const description = topicDescriptions(homeSettings);
  const select = (key, label) => `<div class="field" data-catalog-field="${key}"${current.view === key ? ' hidden' : ''}><label for="filter${key[0].toUpperCase() + key.slice(1)}">${label}</label><select id="filter${key[0].toUpperCase() + key.slice(1)}"><option value="">전체 ${key === 'target' ? '대상' : key === 'topic' ? '주제' : '유형'}</option>${getFilterOptions(programs, key, current[key]).map((value) => `<option value="${esc(value)}"${current[key] === value ? ' selected' : ''}>${esc(getTaxonomyLabel(key, value))}</option>`).join('')}</select></div>`;
  const schoolLevels = [...new Set([...SCHOOL_LEVELS, current.schoolLevel].filter(Boolean))];
  const schoolLevelSelect = `<div class="field" data-catalog-field="schoolLevel"><label for="filterSchoolLevel">학교급</label><select id="filterSchoolLevel"><option value="">전체 학교급</option>${schoolLevels.map((value) => `<option value="${esc(value)}"${current.schoolLevel === value ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select></div>`;
  const panels = VIEWS.map((view) => {
    const topic = view === 'topic';
    const suffix = topic ? 'Topic' : 'Target';
    const choices = getFilterOptions(programs, view, current[view]);
    const cards = choices.map((value) => {
      const guidance = topic ? null : getAudienceGuidance(programs, value);
      const count = guidance ? esc(guidance.title) : `공개 프로그램 <span data-catalog-count>${choiceCount(programs, current, view, value)}</span>개`;
      return `<button type="button" class="catalog-choice${guidance ? ' catalog-choice-guidance' : ''}" data-catalog-key="${view}" data-catalog-choice="${esc(value)}" aria-pressed="${current[view] === value}"><span class="catalog-choice-label">${esc(getTaxonomyLabel(view, value))}</span><span class="catalog-choice-description">${esc(topic ? description(value) : guidance?.body || `${getTaxonomyLabel(view, value)} 대상의 교육을 살펴보세요.`)}</span><span class="catalog-choice-count">${count}</span><span class="catalog-choice-arrow" aria-hidden="true">↗</span></button>`;
    }).join('');
    return `<div class="catalog-panel" id="catalogPanel${suffix}" role="tabpanel" aria-labelledby="catalogTab${suffix}" tabindex="0"${current.view === view ? '' : ' hidden'}><div class="catalog-panel-heading"><div><span class="kicker">${topic ? 'LEARNING THEMES' : 'LEARNING TOGETHER'}</span><h2>${topic ? '어떤 배움이 필요한가요?' : '누구와 함께하는 교육을 찾으시나요?'}</h2><p>${topic ? '주제를 선택해 관계, 소통, 회복을 위한 교육을 살펴보세요.' : '교육 대상을 선택해 함께할 프로그램을 살펴보세요.'}</p></div><button class="catalog-all" type="button" data-catalog-key="${view}" data-catalog-choice="" aria-pressed="${!current[view]}">전체 ${topic ? '주제' : '대상'} <span data-catalog-count>${choiceCount(programs, current, view, '')}</span>개</button></div><div class="catalog-choices catalog-choice-${topic ? 'topics' : 'targets'}" data-catalog-grid="${view}">${cards}</div></div>`;
  }).join('');
  const hasCrossFilter = Boolean(current[current.view === 'topic' ? 'target' : 'topic'] || current.category || current.schoolLevel);
  return `<div class="catalog-browser"><div class="catalog-tabs" role="tablist" aria-label="교육 프로그램 보기 방식">${VIEWS.map((view) => `<button class="catalog-tab" type="button" id="catalogTab${view === 'topic' ? 'Topic' : 'Target'}" role="tab" aria-controls="catalogPanel${view === 'topic' ? 'Topic' : 'Target'}" aria-selected="${current.view === view}" tabindex="${current.view === view ? 0 : -1}" data-catalog-view="${view}">${viewName(view)}</button>`).join('')}</div>${panels}<div class="catalog-search-tools"><div class="field catalog-search"><label for="filterSearch">프로그램 검색</label><input id="filterSearch" type="search" maxlength="120" placeholder="프로그램명·키워드로 검색" value="${esc(current.q)}"></div><details class="catalog-more"${hasCrossFilter ? ' open' : ''}><summary>조건 더 좁히기 <span class="subtle" id="catalogMoreSummary">${hasCrossFilter ? '선택한 추가 조건이 있어요' : ADDITIONAL_FILTER_HINT}</span></summary><p class="subtle">추가 조건을 함께 선택하면 모든 조건에 맞는 프로그램만 표시합니다.</p><div class="catalog-secondary-fields">${select('target', '교육 대상')}${select('topic', '교육 주제')}${select('category', '사업 유형')}${schoolLevelSelect}</div></details></div><p class="catalog-active-filters" id="catalogActiveFilters"></p><p class="filter-warning" id="filterWarning" role="status" hidden></p><section class="catalog-section" aria-labelledby="catalogResultsHeading"><div class="catalog-toolbar"><div><h2 id="catalogResultsHeading" tabindex="-1">프로그램 살펴보기</h2><div class="result-count" id="resultCount" aria-live="polite"></div></div><button class="reset" type="button" id="clearFilters">필터 초기화 ↻</button></div><div class="program-grid" id="catalogResults"></div></section><div class="info-panel wide-cta"><h3>어떤 프로그램이 맞을지 고민되시나요?</h3><p>등록된 프로그램 외에 교육 대상과 현장의 상황에 맞는 구성도 문의해 주세요.</p><a href="#/contact" class="btn small cms-spaced">맞춤형 교육 문의하기 ↗</a></div></div>`;
}

/** Bind browser controls without replacing the tabs, cards or search input. */
export function mountProgramBrowser({ programs = [], values = {}, programCard, empty, onChange = () => {}, document: doc = globalThis.document }) {
  const root = doc.querySelector('.catalog-browser');
  if (!root) return null;
  let current = resolveProgramBrowserValues(values);
  const controls = Object.fromEntries(FILTER_KEYS.map((key) => [key, root.querySelector(`#filter${key === 'q' ? 'Search' : key[0].toUpperCase() + key.slice(1)}`)]));
  const tabs = [...root.querySelectorAll('[data-catalog-view]')];
  const choices = [...root.querySelectorAll('[data-catalog-choice]')];
  const fields = [...root.querySelectorAll('[data-catalog-field]')];
  const more = root.querySelector('.catalog-more');

  function draw(historyMode) {
    for (const key of FILTER_KEYS) if (controls[key].value !== current[key]) controls[key].value = current[key];
    for (const tab of tabs) {
      const selected = tab.dataset.catalogView === current.view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      root.querySelector(`#${tab.getAttribute('aria-controls')}`).hidden = !selected;
    }
    for (const field of fields) field.hidden = field.dataset.catalogField === current.view;
    for (const choice of choices) {
      const key = choice.dataset.catalogKey;
      const value = choice.dataset.catalogChoice;
      choice.setAttribute('aria-pressed', String(current[key] === value));
      const counter = choice.querySelector('[data-catalog-count]');
      if (counter) counter.textContent = String(choiceCount(programs, current, key, value));
    }
    const cross = current[current.view === 'topic' ? 'target' : 'topic'];
    root.querySelector('#catalogMoreSummary').textContent = cross || current.category || current.schoolLevel ? '선택한 추가 조건이 있어요' : ADDITIONAL_FILTER_HINT;
    const selected = FILTER_KEYS.filter((key) => clean(current[key])).map((key) => `${filterName(key)}: ${getTaxonomyLabel(key, clean(current[key]))}`);
    root.querySelector('#catalogActiveFilters').textContent = selected.length ? selected.join(' · ') : '분류를 선택하거나 검색어로 교육을 찾아보세요.';
    const missing = !getAudienceGuidance(programs, current.target) && ['target', 'topic', 'category', 'schoolLevel'].some((key) => current[key] && !getFilterOptions(programs, key).includes(current[key]) && !filterPrograms(programs, { [key]: current[key] }).length);
    const warning = root.querySelector('#filterWarning');
    warning.hidden = !missing;
    warning.textContent = missing ? '현재 공개된 프로그램에서 사용하지 않는 조건이 포함되어 있습니다. 필터를 초기화해 다시 찾아보세요.' : '';
    // The parent records the catalog URL before programCard creates detail links.
    onChange({ ...current }, historyMode);
    const results = filterPrograms(programs, current);
    const guidance = getAudienceGuidance(programs, current.target);
    root.querySelector('#catalogResults').innerHTML = guidance
      ? `<article class="catalog-guidance"><span class="kicker">CUSTOM EDUCATION</span><h3>${guidance.title}</h3><p>${guidance.body}</p><a class="btn small" href="#/contact?type=${encodeURIComponent(guidance.type)}">${guidance.cta} ↗</a><button id="emptyReset" class="reset" type="button">다른 교육 살펴보기</button></article>`
      : results.length ? results.map(programCard).join('') : empty(programs.length ? '조건에 맞는 교육이 없어요.' : '공개된 프로그램이 없습니다.', programs.length ? '다른 분류를 선택하거나 맞춤형 교육을 문의해 주세요.' : '프로그램이 공개되면 이곳에 표시됩니다.', '<button id="emptyReset" class="btn small cms-spaced" type="button">모두 보기</button>');
    root.querySelector('#resultCount').innerHTML = guidance ? '대상에 맞는 교육을 함께 준비합니다.' : `검색 결과 <b>${results.length}</b>개`;
    const emptyReset = root.querySelector('#emptyReset');
    if (emptyReset) emptyReset.onclick = () => {
      change({ type: 'reset' }, 'pushState');
      root.querySelector('#catalogResultsHeading').focus();
    };
  }
  function change(action, historyMode) {
    if (action.type === 'view' && action.value === current.view) return;
    current = updateProgramBrowserValues(current, action);
    draw(historyMode);
  }
  for (const [key, control] of Object.entries(controls)) control.addEventListener(key === 'q' ? 'input' : 'change', () => change({ type: 'filter', key, value: control.value }, key === 'q' ? 'replaceState' : 'pushState'));
  for (const choice of choices) choice.addEventListener('click', () => change({ type: 'filter', key: choice.dataset.catalogKey, value: choice.dataset.catalogChoice }, 'pushState'));
  for (const tab of tabs) {
    tab.addEventListener('click', () => change({ type: 'view', value: tab.dataset.catalogView }, 'pushState'));
    tab.addEventListener('keydown', (event) => {
      const destination = catalogTabDestination(tab.dataset.catalogView, event.key);
      if (!destination) return;
      event.preventDefault();
      change({ type: 'view', value: destination }, 'pushState');
      tabs.find((item) => item.dataset.catalogView === destination).focus();
    });
  }
  root.querySelector('#clearFilters').onclick = () => change({ type: 'reset' }, 'pushState');
  // Deep links with a secondary constraint show that constraint immediately.
  if (current[current.view === 'topic' ? 'target' : 'topic'] || current.category || current.schoolLevel) more.open = true;
  draw();
  return { getValues: () => ({ ...current }) };
}
