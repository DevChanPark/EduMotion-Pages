import { EDUCATION_TARGETS, EDUCATION_TOPICS, SCHOOL_LEVELS, getProgramTargets, getProgramSchoolLevels, getProgramDisplayTargets, getProgramKeywords, normalizeProgramTopic, matchesLegacyTopic } from './education-catalog.js';

export { getProgramTargets, getProgramSchoolLevels, getProgramDisplayTargets, getProgramKeywords } from './education-catalog.js';

const FILTER_KEYS = ['target', 'topic', 'category'];
const QUERY_KEYS = [...FILTER_KEYS, 'q', 'schoolLevel'];
const cleanText = (value) => typeof value === 'string' ? value.trim() : '';
const records = (programs) => Array.isArray(programs) ? programs.filter((program) => program && typeof program === 'object') : [];
const schoolQueryLevels = new Map([
  ...['초등', '초등학생', '초등학교'].map((alias) => [alias, ['초등']]),
  ...['중등', '중학생', '중학교'].map((alias) => [alias, ['중등']]),
  ...['고등', '고등학생', '고등학교'].map((alias) => [alias, ['고등']]),
  ...['중고등', '중·고등', '중고등학생', '중·고등학생', '중등·고등'].map((alias) => [alias, ['중등', '고등']]),
]);

function publicPath(pathname) {
  const path = pathname === '/' ? pathname : pathname.replace(/\/$/, '');
  return path === '/' || /^\/(about|solution|partnership|contact)$/.test(path) || /^\/(programs|stories|notices|join|recruitments|pages)(\/[^/]+)?$/.test(path) ? path : '';
}

/** Resolve CMS links while keeping the public site's supported pages on its hash router. */
export function safePublicHref(value, origin, fallback = '#/contact') {
  if (typeof value !== 'string' || !value || /[\s\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) return fallback;
  if (/^#\/(?!\/)/.test(value)) return value;
  if (value.startsWith('#')) return fallback;
  if (!value.startsWith('/') && !/^https?:\/\//i.test(value)) return fallback;
  try {
    const base = new URL(origin);
    if (!['http:', 'https:'].includes(base.protocol)) return fallback;
    const url = new URL(value, base);
    if (url.username || url.password) return fallback;
    const local = url.origin === base.origin;
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return fallback;
    if (local) {
      // Absolute links copied from this same hash-routed site remain usable.
      if (url.pathname === '/' && !url.search && /^#\/(?!\/)/.test(url.hash)) return url.hash;
      const path = publicPath(url.pathname);
      if (path) return `#${path}${url.search}`;
    }
    return url.href;
  } catch {
    return fallback;
  }
}

export const getProgramTopic = normalizeProgramTopic;

/** Approved groups remain discoverable, including groups with no published entries. */
export function getFilterOptions(programs, key, selected = '') {
  const baseline = key === 'target' ? EDUCATION_TARGETS : key === 'topic' ? EDUCATION_TOPICS : key === 'schoolLevel' ? SCHOOL_LEVELS.map((value) => ({ value })) : [];
  const options = new Set([...baseline.map(({ value }) => value), ...records(programs).flatMap((program) => key === 'target' ? getProgramTargets(program) : key === 'schoolLevel' ? getProgramSchoolLevels(program) : [key === 'topic' ? getProgramTopic(program) : cleanText(program.data?.[key])]).filter(Boolean)]);
  const current = cleanText(selected);
  if (current) options.add(current);
  return [...options];
}

/** Combine exact taxonomy filters with a case-insensitive search across program content. */
export function filterPrograms(programs, values = {}) {
  const filters = Object.fromEntries(QUERY_KEYS.map((key) => [key, cleanText(values?.[key])]));
  const query = filters.q.toLocaleLowerCase();
  return records(programs).filter((program) => {
    if (!FILTER_KEYS.every((key) => {
      if (!filters[key] || cleanText(program.data?.[key]) === filters[key]) return true;
      if (key === 'target') {
        const targets = getProgramTargets(program);
        const selectedTargets = getProgramTargets({ data: { target: filters[key] } });
        return selectedTargets.length > 0 && selectedTargets.every((target) => targets.includes(target));
      }
      if (key === 'topic') return getProgramTopic(program) === filters[key] || matchesLegacyTopic(program, filters[key]);
      return false;
    })) return false;
    const schoolLevels = getProgramSchoolLevels(program);
    if (filters.schoolLevel && !schoolLevels.includes(filters.schoolLevel)) return false;
    if (!query) return true;
    // A middle-only program still belongs to the combined middle/high audience,
    // but searching for high school must not match that aggregate label alone.
    const words = query.split(/\s+/);
    const schoolWords = words.filter((word) => schoolQueryLevels.has(word));
    if (!schoolWords.every((word) => schoolQueryLevels.get(word).some((level) => schoolLevels.includes(level)))) return false;
    const textQuery = words.filter((word) => !schoolQueryLevels.has(word)).join(' ');
    if (!textQuery) return true;
    const goals = Array.isArray(program.data?.goals) ? program.data.goals : [];
    const topic = getProgramTopic(program);
    const searchable = [program.title, program.summary, program.body, program.data?.category, program.data?.topic, ...getProgramDisplayTargets(program), topic, ...getProgramKeywords(program), ...goals]
      .map(cleanText).join(' ').toLocaleLowerCase();
    return searchable.includes(textQuery);
  });
}

/** Produce a stable, shareable catalog URL, omitting empty or unsupported filters. */
export function catalogHref(values = {}) {
  const query = new URLSearchParams();
  for (const key of QUERY_KEYS.filter((key) => key !== 'schoolLevel')) {
    const value = cleanText(values?.[key]);
    if (value) query.set(key, value);
  }
  if (values?.view === 'topic' || values?.view === 'target') query.set('view', values.view);
  const schoolLevel = cleanText(values?.schoolLevel);
  if (schoolLevel) query.set('schoolLevel', schoolLevel);
  return `#/programs${query.size ? `?${query}` : ''}`;
}
