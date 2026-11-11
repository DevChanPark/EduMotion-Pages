// Shared names describe the educational catalog; they do not imply a published
// program is available for every audience or every keyword in its topic group.
export const EDUCATION_TARGETS = [
  { value: '초등학생', label: '초등학생' },
  { value: '중고등학생', label: '중고등학생' },
  { value: '교사·교육관계자', label: '교사, 교육관계자' },
  { value: '성인·가족', label: '성인, 가족' },
  { value: '기관·조직', label: '기관, 조직' },
];

// School levels refine the two student audience groups without adding new
// top-level audience categories or creating duplicate program records.
export const SCHOOL_LEVELS = ['초등', '중등', '고등'];

export const EDUCATION_TOPICS = [
  { value: '자기이해와 성장', label: '자기이해와 성장', keywords: ['자기인식', '자존감', '감정조절', '자기관리', '회복탄력성', '진로동기부여', '스트레스관리'] },
  { value: '소통과 관계형성', label: '소통과 관계형성', keywords: ['경청', '공감', '의사소통', '관계기술', '사회성', '학교폭력예방', '인성교육', '언어순화'] },
  { value: '생명존중과 마음돌봄', label: '생명존중과 마음돌봄', keywords: ['생명사랑'] },
];

const previousTopicDescriptions = new Map([
  ['자기이해와 성장', '자기인식, 자존감, 감정조절, 자기관리, 회복탄력성, 진로동기부여'],
  ['생명존중과 마음돌봄', '생명사랑, 스트레스관리'],
]);

/** Refresh old default copy while preserving custom descriptions and deliberate blanks. */
export function getTopicCardDescription(topic, body, separator = ', ') {
  const keywords = EDUCATION_TOPICS.find((entry) => entry.value === topic)?.keywords;
  if (body === undefined) return keywords?.join(separator);
  return keywords && body === previousTopicDescriptions.get(topic) ? keywords.join(', ') : body;
}

const targetAliases = new Map([
  ['초등', '초등학생'], ['중·고등', '중고등학생'], ['중고등', '중고등학생'], ['중·고등학생', '중고등학생'],
  ['교사', '교사·교육관계자'], ['교사·학부모', '교사·교육관계자'],
  ...EDUCATION_TARGETS.map(({ value, label }) => [label, value]),
]);

// These are the previous eight programs' primary topic assignments. An old
// filter spans the same programs even where its members now have different topics.
export const LEGACY_PROGRAM_TOPICS = {
  'class-cohesion': '관계·사회성',
  'social-skills': '관계·사회성',
  'life-respect': '예방·안전',
  language: '감정·소통',
  'school-violence': '예방·안전',
  'career-group': '진로·성장',
  camp: '진로·성장',
  'teacher-training': '관계·사회성',
};

const currentProgramTopics = {
  'class-cohesion': '소통과 관계형성',
  'social-skills': '소통과 관계형성',
  'life-respect': '생명존중과 마음돌봄',
  language: '소통과 관계형성',
  'school-violence': '소통과 관계형성',
  'career-group': '자기이해와 성장',
  camp: '소통과 관계형성',
  'teacher-training': '소통과 관계형성',
};

export function normalizeEducationTarget(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return targetAliases.get(text) || text;
}

/** Commas separate audiences, except for the paired display labels in the catalog. */
export function getProgramTargets(program) {
  let value = typeof program?.data?.target === 'string' ? program.data.target.trim() : '';
  for (const [left, right, canonical] of [['교사', '교육관계자', '교사·교육관계자'], ['성인', '가족', '성인·가족'], ['기관', '조직', '기관·조직']]) {
    value = value.replace(new RegExp(`(^|[,，])\\s*${left}\\s*[,，]\\s*${right}\\s*(?=[,，]|$)`, 'g'), `$1${canonical}`);
  }
  return [...new Set(value.split(/[,，]/).map(normalizeEducationTarget).filter(Boolean))];
}

/** Explicit levels narrow student audiences; old rows retain their previous reach. */
export function getProgramSchoolLevels(program) {
  const targets = getProgramTargets(program);
  const allowed = SCHOOL_LEVELS.filter((level) => targets.includes(level === '초등' ? '초등학생' : '중고등학생'));
  const stored = program?.data?.schoolLevels;
  return Array.isArray(stored) ? allowed.filter((level) => stored.includes(level)) : allowed;
}

/** Cards and details show the actual school levels, followed by other audiences. */
export function getProgramDisplayTargets(program) {
  return [
    ...getProgramSchoolLevels(program),
    ...getProgramTargets(program)
      .filter((target) => target !== '초등학생' && target !== '중고등학생')
      .map((target) => getTaxonomyLabel('target', target)),
  ];
}

/** Search keywords are plain strings; malformed CMS values never become text. */
export function getProgramKeywords(program) {
  const keywords = program?.data?.keywords;
  return Array.isArray(keywords)
    ? [...new Set(keywords.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
    : [];
}

export function normalizeProgramTopic(program) {
  const topic = typeof program?.data?.topic === 'string' ? program.data.topic.trim() : '';
  return topic && LEGACY_PROGRAM_TOPICS[program?.slug] === topic ? currentProgramTopics[program.slug] : topic;
}

export function getTaxonomyLabel(key, value) {
  const text = typeof value === 'string' ? value : '';
  const choices = key === 'target' ? EDUCATION_TARGETS : key === 'topic' ? EDUCATION_TOPICS : [];
  const normalized = key === 'target' ? normalizeEducationTarget(text) : text;
  return choices.find((choice) => choice.value === normalized)?.label || text;
}

export function matchesLegacyTopic(program, selected) {
  // Do not reclassify a program if its CMS editor has since chosen a custom topic.
  return LEGACY_PROGRAM_TOPICS[program?.slug] === selected && normalizeProgramTopic(program) === currentProgramTopics[program.slug];
}
