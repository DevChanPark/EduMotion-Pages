// Shared, framework-independent page composition contract. Keep canonical program
// facts in the entry itself; overview/goals/related sections only control display.
export const COMPOSITION_VERSION = 1;
export const MAX_COMPOSITION_BYTES = 80000;
export const PAGE_COMPOSITION_KINDS = Object.freeze(['about', 'solution', 'partnership', 'stories']);
const legacyKinds = ['home', 'about', 'program'];

export const FIELD_DEFINITIONS = Object.freeze({
  kicker: { label: '상단 문구', type: 'text', maxLength: 120 },
  title: { label: '제목', type: 'textarea', maxLength: 200 },
  description: { label: '설명', type: 'textarea', maxLength: 2000 },
  buttonLabel: { label: '버튼 문구', type: 'text', maxLength: 100 },
  buttonHref: { label: '버튼 링크', type: 'link', maxLength: 2048 },
  imageUrl: { label: '이미지 주소', type: 'image', maxLength: 2048 },
  imageAlt: { label: '이미지 설명', type: 'text', maxLength: 300 },
  body: { label: '내용', type: 'textarea', maxLength: 3000 },
  label: { label: '보조 문구', type: 'text', maxLength: 120 },
  href: { label: '연결 링크', type: 'link', maxLength: 2048 },
});

const heading = ['kicker', 'title', 'description'];
const button = ['buttonLabel', 'buttonHref'];
const image = ['imageUrl', 'imageAlt'];
const definition = (type, label, fields = heading, itemFields = [], maxItems = 0) => ({ type, label, fields: [...fields], itemFields: [...itemFields], maxItems });

export const COMPOSITION_DEFINITIONS = {
  home: [
    definition('finder', '교육 대상 찾기', [...heading, 'buttonLabel']),
    definition('topics', '교육 주제', [...heading, ...button], ['title', 'body'], 12),
    definition('featured', '추천 프로그램', [...heading, ...button]),
    definition('about', '회사 소개 연결', [...heading, ...button, ...image]),
    definition('process', '에듀모션 정체성', heading, ['title', 'body', 'label'], 12),
    definition('stories', '교육 현장', [...heading, ...button]),
    definition('partnership', '협력 안내', [...heading, ...button, ...image], ['title', 'body'], 8),
    definition('cta', '문의 안내', [...heading, ...button]),
  ],
  about: [
    definition('overview', '회사 소개 본문', heading),
    definition('values', '교육의 가치', heading, ['title', 'body', 'label'], 12),
    definition('approach', '교육 방식', [...heading, ...image], ['title', 'body'], 12),
    definition('process', '함께하는 과정', heading, ['title', 'body', 'label'], 12),
    definition('team', '구성원 소개', heading, ['title', 'body', 'label', ...image], 12),
    definition('cta', '문의 안내', [...heading, ...button]),
  ],
  program: [
    definition('overview', '프로그램 소개', heading),
    definition('goals', '교육 목표', heading),
    definition('curriculum', '커리큘럼', heading, ['title', 'body', 'label'], 12),
    definition('operation', '운영 안내', heading, ['title', 'body'], 12),
    definition('gallery', '교육 사진', heading, ['title', 'body', ...image], 20),
    definition('faq', '자주 묻는 질문', heading, ['title', 'body'], 12),
    definition('related', '다른 프로그램', [...heading, ...button]),
    // Program CTA destination is always derived from its stable program ID.
    definition('cta', '프로그램 문의', [...heading, 'buttonLabel']),
  ],
  solution: [
    definition('overview', '학교 맞춤 솔루션 소개', heading),
    definition('needs', '학교의 필요', heading, ['title', 'body', 'label'], 12),
    definition('scope', '함께 살펴볼 범위', heading, ['title', 'body', 'label'], 12),
    definition('process', '논의와 준비 과정', heading, ['title', 'body', 'label'], 12),
    definition('preparation', '문의 전 준비 사항', heading, ['title', 'body', 'label'], 12),
    definition('faq', '자주 묻는 질문', heading, ['title', 'body'], 12),
    definition('cta', '학교 교육 문의', [...heading, ...button]),
  ],
  partnership: [
    definition('overview', '기업·기관 협력 소개', heading),
    definition('fields', '협력 분야', heading, ['title', 'body', 'label'], 12),
    definition('approach', '협력 방향', heading, ['title', 'body', 'label'], 12),
    definition('process', '협력 논의 과정', heading, ['title', 'body', 'label'], 12),
    definition('preparation', '제안 전 준비 사항', heading, ['title', 'body', 'label'], 12),
    definition('faq', '자주 묻는 질문', heading, ['title', 'body'], 12),
    definition('cta', '협력 문의', [...heading, ...button]),
  ],
  stories: [
    definition('overview', '교육 현장 소개', heading),
    definition('themes', '현장에서 나눌 이야기', heading, ['title', 'body', 'label'], 12),
    definition('records', '공개된 교육 기록', [...heading, ...button]),
    definition('guidance', '교육 현장 안내', heading, ['title', 'body', 'label'], 12),
    definition('cta', '교육 문의', [...heading, ...button]),
  ],
};

const defaults = {
  home: {
    finder: { kicker: 'FIND YOUR PROGRAM', title: '누구와 함께하는 교육을 찾으시나요?', description: '대상에 맞는 프로그램을 먼저 살펴보세요.', buttonLabel: '프로그램 살펴보기' },
    topics: { kicker: 'OUR FOCUS', title: '주제별 교육', description: '관계, 소통, 회복을 위한 배움을 주제별로 살펴보세요.', buttonLabel: '전체 프로그램 보기', buttonHref: '#/programs', items: [
      { title: '자기이해와 성장', body: '자기인식, 자존감, 감정조절, 자기관리, 회복탄력성, 진로동기부여, 스트레스관리' },
      { title: '소통과 관계형성', body: '경청, 공감, 의사소통, 관계기술, 사회성, 학교폭력예방, 인성교육, 언어순화' },
      { title: '생명존중과 마음돌봄', body: '생명사랑' },
    ] },
    featured: { kicker: 'FEATURED PROGRAMS', title: '함께 경험하는 배움의 변화', description: '검토용으로 구성한 프로그램입니다. 실제 운영 내용은 담당자 확인 후 안내합니다.', buttonLabel: '전체 프로그램 보기', buttonHref: '#/programs' },
    about: { kicker: 'ABOUT EDUMOTION', title: '사람을 이해하고,\n함께 살아가는 힘을 배웁니다.', description: '에듀모션은 자기이해에서 시작해 타인과의 관계, 생명과 마음을 돌보는 배움까지 사람의 성장에 필요한 교육을 만들어갑니다.\n지식을 전달하는 데 그치지 않고, 직접 경험하고 소통하며 일상에서 실천할 수 있는 교육을 지향합니다.', buttonLabel: '에듀모션 알아보기', buttonHref: '#/about', imageUrl: '', imageAlt: '' },
    process: { kicker: 'OUR IDENTITY', title: '에듀모션이 만드는 교육', description: '관계, 소통, 회복을 중심으로 사람의 성장에 필요한 교육을 만들어갑니다.', items: [
      { title: '사람을 이해하고, 관계의 변화를 만드는 교육.', body: '', label: '우리는 무엇을 하는가?' },
      { title: '기술이 발전할수록, 사람을 이해하는 힘은 더욱 중요해 집니다.', body: '', label: '왜 지금 필요한가?' },
      { title: '아는 것을 넘어, 함께 살아가는 힘을 배우는 경험중심 교육.', body: '', label: '어떻게 교육하는가?' },
    ] },
    stories: { kicker: 'FIELD STORIES', title: '교육 현장의 이야기', description: '검토를 마친 교육 기록부터 차근차근 소개합니다.', buttonLabel: '현장 이야기 더 보기', buttonHref: '#/stories' },
    partnership: { kicker: 'PARTNERSHIP', title: '더 나은 배움의 경험,\n함께 만들어갑니다.', description: '학교와 기업, 지역 기관이 함께할 교육의 가능성을 살펴봅니다. 협력 범위는 상담을 통해 확인해 주세요.', buttonLabel: '협력 안내 보기', buttonHref: '#/partnership', imageUrl: '', imageAlt: '', items: [
      { title: '교육 기획', body: '목적과 대상에 맞는 교육을 함께 고민합니다.' },
      { title: '현장 연결', body: '현장의 필요를 살펴 협력 방향을 논의합니다.' },
    ] },
    cta: { kicker: 'LET’S TALK', title: '우리에게 필요한 교육,\n함께 이야기해 볼까요?', description: '교육 대상과 희망하는 내용을 알려주세요.', buttonLabel: '교육 문의하기', buttonHref: '#/contact' },
  },
  about: {
    overview: { kicker: 'OUR STORY', title: '에듀모션이 생각하는 교육', description: '' },
    values: { kicker: 'OUR VALUES', title: '배움의 중심에 두는 것', description: '관계를 배우는 경험이, 삶의 변화를 만듭니다.', items: [
      { title: '관계', body: '자기이해에서 시작해 타인과의 관계를 배우고, 함께 살아가는 힘을 기릅니다.', label: 'RELATIONSHIP' },
      { title: '소통', body: '직접 경험하고 소통하며 서로를 이해하는 배움을 만듭니다.', label: 'COMMUNICATION' },
      { title: '회복', body: '생명과 마음을 돌보는 배움을 일상에서 실천합니다.', label: 'RECOVERY' },
    ] },
    approach: { kicker: 'OUR APPROACH', title: '참여하고, 나누고, 돌아보는 교육', description: '아래 내용은 교육 방식 소개를 위한 임시 구성입니다.', imageUrl: '', imageAlt: '', items: [
      { title: '경험을 통해 참여하기', body: '주제에 맞는 활동을 경험하는 시간을 구성합니다.' },
      { title: '생각을 나누기', body: '서로 다른 관점을 듣고 자신의 언어로 표현합니다.' },
      { title: '함께 돌아보기', body: '활동에서 느낀 점과 일상에서의 연결을 살펴봅니다.' },
    ] },
    process: { kicker: 'WORK TOGETHER', title: '함께 준비하는 교육', description: '구성 확인을 위한 과정 예시이며, 실제 운영 절차는 상담 시 확인해 주세요.', items: [
      { title: '교육 문의', body: '대상과 목적, 궁금한 내용을 전합니다.', label: '01' },
      { title: '방향 논의', body: '현장의 상황에 맞춰 필요한 구성을 살펴봅니다.', label: '02' },
      { title: '일정과 운영 협의', body: '진행 조건을 확인한 뒤 운영 여부를 결정합니다.', label: '03' },
    ] },
    team: { kicker: 'OUR PEOPLE', title: '함께 만드는 교육', description: '구성원 소개를 준비하고 있습니다. 에듀모션과 함께하는 사람들의 이야기를 이곳에서 전할 예정입니다.', items: [] },
    cta: { kicker: 'CONTACT', title: '교육에 대한 고민을 나눠주세요.', description: '현장에 필요한 교육의 방향을 함께 살펴봅니다.', buttonLabel: '교육 문의하기', buttonHref: '#/contact' },
  },
  program: {
    overview: { kicker: 'PROGRAM OVERVIEW', title: '프로그램 소개', description: '' },
    goals: { kicker: 'EDUCATION GOALS', title: '교육 목표', description: '' },
    curriculum: { kicker: 'CURRICULUM', title: '이렇게 함께 배워요.', description: '페이지 구성 확인을 위한 활동 순서 예시입니다. 실제 프로그램의 회차와 내용은 상담 시 확인해 주세요.', items: [
      { title: '주제 만나기', body: '교육의 주제를 살펴보고 참여를 준비합니다.', label: '도입 · 예시' },
      { title: '함께 경험하기', body: '주제와 연결된 활동에 참여하고 생각을 나눕니다.', label: '활동 · 예시' },
      { title: '경험 돌아보기', body: '느낀 점을 정리하고 일상과 연결해 봅니다.', label: '마무리 · 예시' },
    ] },
    operation: { kicker: 'PROGRAM GUIDE', title: '운영 전 확인해 주세요.', description: '아래 항목은 안내용 임시 내용입니다. 실제 운영 조건은 상담 시 확인해 주세요.', items: [
      { title: '일정과 시간', body: '희망 일정과 필요한 교육 시간을 문의해 주세요.' },
      { title: '인원과 장소', body: '참여 규모와 교육 환경에 따라 구성을 협의합니다.' },
      { title: '준비 사항', body: '확정된 운영 조건에 맞춰 필요한 사항을 안내합니다.' },
    ] },
    gallery: { kicker: 'PROGRAM SCENES', title: '교육의 순간을 담을 공간', description: '현재는 사진을 준비 중입니다. 실제 교육의 장면을 이곳에서 전할 예정입니다.', items: [] },
    faq: { kicker: 'FAQ', title: '문의 전 궁금한 점', description: '답변은 페이지 구성 확인을 위한 예시입니다. 실제 운영 기준은 상담 시 확인해 주세요.', items: [
      { title: '대상에 맞춰 교육 내용을 조정할 수 있나요?', body: '대상과 교육 목적을 알려주시면 가능한 구성과 운영 범위를 확인해 안내합니다.' },
      { title: '일정과 비용은 어떻게 확인하나요?', body: '참여 규모, 희망 일정과 장소를 함께 전달해 주세요. 확인 후 협의할 수 있습니다.' },
    ] },
    related: { kicker: 'MORE PROGRAMS', title: '다른 교육도 살펴보세요.', description: '', buttonLabel: '전체 프로그램 보기', buttonHref: '#/programs' },
    cta: { kicker: 'NEXT STEP', title: '현장에 맞는 교육을 문의하세요.', description: '대상과 일정, 교육 목적을 알려주세요. 문의 화면에 선택한 프로그램이 연결됩니다.', buttonLabel: '이 교육 문의하기' },
  },
  solution: {
    overview: { kicker: 'SCHOOL SOLUTION', title: '학교의 상황에서 출발하는 교육', description: '아래 안내는 페이지 구성 확인을 위한 검토용 예시입니다. 실제 제공 범위와 운영 가능 여부는 상담 시 확인해 주세요.' },
    needs: { kicker: 'START WITH YOUR SCHOOL', title: '지금 학교에는 어떤 배움이 필요한가요?', description: '맞춤 교육을 논의할 때 살펴볼 주제의 예시입니다.', items: [
      { title: '관계를 시작하는 시기', body: '새로운 교실과 구성원이 서로를 알아가는 상황을 살펴봅니다.', label: '관계 형성 · 예시' },
      { title: '소통을 돌아보는 시간', body: '의견을 나누고 서로 듣는 과정에서 필요한 배움을 고민합니다.', label: '소통 · 예시' },
      { title: '현장에 맞는 교육 준비', body: '대상과 환경, 교육의 목적에 맞춰 논의할 사항을 정리합니다.', label: '교육 기획 · 예시' },
    ] },
    scope: { kicker: 'POSSIBLE DIRECTIONS', title: '필요한 범위를 함께 살펴봅니다.', description: '논의할 수 있는 구성 예시이며, 실제 제공 서비스나 운영 약속을 확정한 내용은 아닙니다.', items: [
      { title: '대상과 목적 살펴보기', body: '누구를 위한 교육인지, 어떤 경험이 필요한지 정리합니다.', label: '대상과 목적' },
      { title: '활동과 참여 방식 논의', body: '교육 주제와 현장 조건에 맞는 참여 방식을 살펴봅니다.', label: '교육 구성' },
      { title: '운영 조건 확인', body: '일정과 장소, 참여 규모 등 필요한 조건을 확인합니다.', label: '진행 조건' },
    ] },
    process: { kicker: 'WORKING PROCESS', title: '이야기를 듣고, 함께 방향을 정합니다.', description: '검토용 진행 과정 예시입니다. 실제 절차는 상담 내용에 따라 확인합니다.', items: [
      { title: '학교의 상황 나누기', body: '교육이 필요한 배경과 대상을 함께 살펴봅니다.', label: '01' },
      { title: '교육 방향 논의', body: '주제와 구성, 필요한 운영 범위를 논의합니다.', label: '02' },
      { title: '조건 확인과 준비', body: '일정과 장소, 역할 등 진행 조건을 확인합니다.', label: '03' },
      { title: '교육 경험 돌아보기', body: '협의한 범위에 따라 교육 경험을 함께 살펴봅니다.', label: '04' },
    ] },
    preparation: { kicker: 'BEFORE YOU ASK', title: '이런 내용을 알려주시면 도움이 됩니다.', description: '처음 문의할 때 모두 확정되어 있지 않아도 괜찮습니다. 개인 학생의 상세 정보는 적지 않아도 됩니다.', items: [
      { title: '교육 대상', body: '학교급과 학년, 참여 규모 등 필요한 범위를 알려주세요.', label: '대상' },
      { title: '교육의 목적', body: '함께 고민하고 싶은 주제나 기대하는 경험을 나눠주세요.', label: '목적' },
      { title: '희망 일정과 장소', body: '정해진 조건이나 협의가 필요한 부분을 알려주세요.', label: '조건' },
    ] },
    faq: { kicker: 'FAQ', title: '학교 맞춤 교육, 자주 묻는 질문', description: '답변은 검토용 예시입니다. 실제 운영 기준은 상담 시 확인해 주세요.', items: [
      { title: '원하는 교육 구성이 아직 정해지지 않았어도 문의할 수 있나요?', body: '교육 대상과 목적, 현재 고민을 먼저 알려주세요. 논의할 수 있는 방향을 확인합니다.' },
      { title: '프로그램의 대상이나 구성을 조정할 수 있나요?', body: '대상과 현장 조건에 따라 가능한 범위가 달라질 수 있습니다. 희망 내용을 전달해 주세요.' },
    ] },
    cta: { kicker: 'LET’S TALK', title: '학교에 필요한 배움부터 이야기해 주세요.', description: '대상과 교육 목적, 희망하는 조건을 알려주세요.', buttonLabel: '학교 맞춤 교육 문의하기', buttonHref: '#/contact?type=%ED%95%99%EA%B5%90%20%EB%A7%9E%EC%B6%A4%20%EC%86%94%EB%A3%A8%EC%85%98' },
  },
  partnership: {
    overview: { kicker: 'PARTNERSHIP', title: '교육의 가능성을 함께 넓혀갑니다.', description: '기업·기관 협력 페이지의 검토용 안내입니다. 실제 협력 분야와 역할은 제안을 확인한 뒤 협의합니다.' },
    fields: { kicker: 'WAYS TO CONNECT', title: '함께 고민해 볼 협력의 방향', description: '아래 내용은 협력 분야를 소개하기 위한 예시이며 진행 중인 사업이나 확정된 실적을 뜻하지 않습니다.', items: [
      { title: '교육 콘텐츠와 활동', body: '교육의 목적과 대상에 맞는 콘텐츠·활동 구성을 함께 논의합니다.', label: '교육 기획 · 예시' },
      { title: '지역과 공동체의 배움', body: '지역과 현장의 필요를 살펴 교육으로 연결할 가능성을 고민합니다.', label: '현장 연결 · 예시' },
      { title: '함께 준비하는 교육 사업', body: '주체별 역할과 조건을 확인하며 협력 가능한 범위를 살펴봅니다.', label: '협력 운영 · 예시' },
    ] },
    approach: { kicker: 'SHARED DIRECTION', title: '목적과 역할을 맞추는 것부터 시작합니다.', description: '협력 방향을 설명하기 위한 검토용 구성입니다.', items: [
      { title: '함께 이루려는 목적', body: '교육을 통해 기대하는 경험과 참여 대상을 먼저 나눕니다.', label: '목적' },
      { title: '서로의 역할과 조건', body: '각 주체가 준비할 부분과 필요한 자원을 확인합니다.', label: '역할' },
      { title: '현장에 맞는 진행', body: '참여 환경과 운영 조건을 살펴 실행 가능한 범위를 논의합니다.', label: '현장' },
    ] },
    process: { kicker: 'COLLABORATION PROCESS', title: '제안에서 준비까지, 함께 살펴봅니다.', description: '진행 과정의 예시이며, 실제 협력 절차는 제안 내용에 따라 달라질 수 있습니다.', items: [
      { title: '협력 제안 나누기', body: '협력의 목적과 대상, 생각하고 있는 방향을 전합니다.', label: '01' },
      { title: '가능한 범위 논의', body: '필요한 교육과 주체별 역할, 진행 조건을 확인합니다.', label: '02' },
      { title: '구성과 일정 협의', body: '협의한 범위를 바탕으로 구체적인 준비 사항을 정리합니다.', label: '03' },
    ] },
    preparation: { kicker: 'BEFORE YOUR PROPOSAL', title: '제안에 이런 내용을 담아주세요.', description: '아직 정해지지 않은 부분은 논의가 필요한 내용으로 알려주세요.', items: [
      { title: '제안 기관과 목적', body: '기관의 역할과 이번 협력에서 기대하는 바를 알려주세요.', label: '목적' },
      { title: '참여 대상과 규모', body: '함께할 대상과 예상하는 참여 범위를 나눠주세요.', label: '대상' },
      { title: '일정과 진행 조건', body: '희망 일정, 장소와 준비 가능한 조건을 알려주세요.', label: '조건' },
    ] },
    faq: { kicker: 'FAQ', title: '협력을 시작하기 전에', description: '답변은 페이지 구성 확인을 위한 예시입니다. 실제 협력 기준은 상담 시 확인해 주세요.', items: [
      { title: '구체적인 사업안이 없어도 제안할 수 있나요?', body: '협력 목적과 생각하고 있는 방향을 먼저 전달해 주세요. 함께 논의할 수 있는 범위를 확인합니다.' },
      { title: '협력 방식과 역할은 어떻게 정하나요?', body: '교육의 목적, 참여 대상과 조건을 확인한 뒤 주체별 역할과 운영 범위를 협의합니다.' },
    ] },
    cta: { kicker: 'START A CONVERSATION', title: '함께 만들고 싶은 교육이 있나요?', description: '제안의 배경과 기대하는 협력 방향을 알려주세요.', buttonLabel: '기업·기관 협력 문의하기', buttonHref: '#/contact?type=%EA%B8%B0%EC%97%85%C2%B7%EA%B8%B0%EA%B4%80%20%ED%98%91%EB%A0%A5' },
  },
  stories: {
    overview: { kicker: 'FIELD STORIES', title: '교육의 경험을 이야기로 나눕니다.', description: '교육 현장 페이지의 검토용 소개입니다. 확인을 마친 실제 기록부터 공개합니다.' },
    themes: { kicker: 'WHAT WE SHARE', title: '현장에서 나누고 싶은 이야기', description: '기록을 소개할 주제의 예시이며 실제 진행 실적을 뜻하지 않습니다.', items: [
      { title: '배움의 순간', body: '활동을 경험하며 생각을 나누는 과정을 돌아봅니다.', label: '경험 · 예시' },
      { title: '함께 준비한 과정', body: '교육을 준비하며 살펴본 목적과 현장의 필요를 나눕니다.', label: '준비 · 예시' },
      { title: '다음 배움으로의 연결', body: '교육의 경험을 돌아보고 이어갈 이야기를 정리합니다.', label: '성찰 · 예시' },
    ] },
    records: { kicker: 'PUBLISHED RECORDS', title: '공개된 교육 기록', description: '검토를 마친 교육 현장의 이야기를 차근차근 소개합니다.', buttonLabel: '교육 프로그램 살펴보기', buttonHref: '#/programs' },
    guidance: { kicker: 'ABOUT OUR RECORDS', title: '교육 현장 이야기를 읽기 전에', description: '아래 문구는 안내용 임시 구성입니다.', items: [
      { title: '확인한 내용부터 공개합니다.', body: '현장 기록은 내용과 공개 범위를 확인한 뒤 소개합니다.', label: '공개 범위' },
      { title: '현재 운영 안내와 구분해 주세요.', body: '기록 속 일정이나 구성은 현재 운영 조건과 다를 수 있습니다. 최신 내용은 문의를 통해 확인해 주세요.', label: '운영 확인' },
    ] },
    cta: { kicker: 'YOUR NEXT PROGRAM', title: '우리 현장에 필요한 교육을 찾아보세요.', description: '대상과 목적에 맞는 교육을 살펴보고 궁금한 점을 나눠주세요.', buttonLabel: '교육 문의하기', buttonHref: '#/contact' },
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
let serial = 0;
const freshId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${(++serial).toString(36)}`}`;

function catalog(kind) {
  const result = own(COMPOSITION_DEFINITIONS, kind) ? COMPOSITION_DEFINITIONS[kind] : undefined;
  if (!result) throw new Error('지원하지 않는 페이지 구성입니다.');
  return result;
}
function compositionKindTag(value, kind) {
  if (own(value, 'kind')) {
    if (value.kind !== kind) throw new Error('페이지 구성 종류가 현재 페이지와 일치하지 않습니다.');
    return { kind };
  }
  if (!legacyKinds.includes(kind)) throw new Error('페이지 구성 종류를 지정해 주세요.');
  return {};
}

/** A stored page kind survives copies and slug changes. Untagged v1 page data is the legacy about template. */
export function getEntryCompositionKind(entry) {
  if (!record(entry)) return '';
  if (entry.collection === 'programs') return 'program';
  if (entry.collection !== 'pages') return '';
  const data = record(entry.data) ? entry.data : {};
  const stored = data.composition;
  if (stored !== undefined) {
    if (record(stored) && own(stored, 'kind')) {
      if (!PAGE_COMPOSITION_KINDS.includes(stored.kind)) throw new Error('지원하지 않는 안내 페이지 구성 종류입니다.');
      return stored.kind;
    }
    return 'about';
  }
  return PAGE_COMPOSITION_KINDS.includes(entry.slug) ? entry.slug : '';
}

/** A new unsaved draft, deliberately not included in automatic database seeds. */
export function createStoriesLandingEntry() {
  return {
    collection: 'pages', slug: 'stories', title: '교육 현장',
    summary: '배움의 경험과 교육 현장의 이야기를 나눕니다. 현재 소개 내용은 검토용입니다.',
    body: '교육을 준비하고 함께 경험한 과정을 기록으로 나눕니다.\n\n현재 페이지는 구성 확인을 위한 임시 안내입니다. 실제 현장 글은 내용과 공개 범위 확인을 마친 뒤 소개합니다.',
    status: 'draft', sortOrder: 0, imageUrl: '',
    data: { composition: getComposition('stories') },
  };
}
function findDefinition(kind, type) {
  const result = catalog(kind).find((entry) => entry.type === type);
  if (!result) throw new Error('이 페이지에서 사용할 수 없는 섹션입니다.');
  return result;
}
function initialSection(kind, type, fresh = false) {
  const descriptor = findDefinition(kind, type);
  const values = defaults[kind][type];
  const result = { id: fresh ? freshId(type) : `${kind}-${type}`, type, enabled: true };
  for (const field of descriptor.fields) result[field] = values[field] ?? '';
  if (descriptor.maxItems) result.items = (values.items || []).map((item, index) => {
    const resultItem = { id: fresh ? freshId('item') : `${kind}-${type}-item-${index + 1}` };
    for (const field of descriptor.itemFields) resultItem[field] = item[field] ?? '';
    return resultItem;
  });
  return result;
}

/** Add one section from the registered catalog, with independent IDs and values. */
export function createSection(kind, type) { return initialSection(kind, type, true); }

/**
 * Missing legacy compositions receive defaults. Existing sections are never
 * appended, and explicit empty strings, arrays and disabled sections stay empty.
 * Entry body/goals and source collections are deliberately never altered here.
 */
export function getComposition(kind, stored) {
  const descriptors = catalog(kind);
  if (stored === undefined) return { version: COMPOSITION_VERSION, kind, sections: descriptors.map(({ type }) => initialSection(kind, type)) };
  if (!record(stored) || stored.version !== COMPOSITION_VERSION || !Array.isArray(stored.sections)) throw new Error('페이지 구성 형식 또는 버전이 올바르지 않습니다.');
  const tag = compositionKindTag(stored, kind);
  const seen = new Set();
  const sections = [];
  for (const section of stored.sections) {
    if (!record(section)) throw new Error('섹션 형식이 올바르지 않습니다.');
    if (seen.has(section.type)) throw new Error('같은 종류의 섹션은 한 번만 추가할 수 있습니다.');
    seen.add(section.type);
    const descriptor = findDefinition(kind, section.type);
    const result = initialSection(kind, section.type);
    result.id = own(section, 'id') ? section.id : result.id;
    if (own(section, 'enabled')) {
      if (typeof section.enabled !== 'boolean') throw new Error('섹션 표시 설정이 올바르지 않습니다.');
      result.enabled = section.enabled;
    }
    for (const field of descriptor.fields) if (own(section, field)) result[field] = section[field];
    if (descriptor.maxItems && own(section, 'items')) {
      if (!Array.isArray(section.items)) throw new Error('섹션 항목 형식이 올바르지 않습니다.');
      result.items = section.items.map((item, index) => {
        if (!record(item)) throw new Error('섹션 항목 형식이 올바르지 않습니다.');
        const resultItem = { id: own(item, 'id') ? item.id : `${result.id}-item-${index + 1}` };
        for (const field of descriptor.itemFields) resultItem[field] = own(item, field) ? item[field] : '';
        return resultItem;
      });
    } else if (!descriptor.maxItems && own(section, 'items')) {
      result.items = section.items;
    }
    sections.push(result);
  }
  return validateComposition({ version: COMPOSITION_VERSION, ...tag, sections }, kind);
}

function identifier(value, label) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value)) throw new Error(`${label} ID 형식이 올바르지 않습니다.`);
  return value;
}
function validHttps(value) {
  if (!/^https:\/\//i.test(value)) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
function sanitizeField(value, key) {
  const descriptor = FIELD_DEFINITIONS[key];
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > descriptor.maxLength || /\u0000/.test(value)) throw new Error(`${descriptor.label}을(를) ${descriptor.maxLength}자 이내의 글자로 입력해 주세요.`);
  const result = value.trim();
  if (!result) return '';
  if (descriptor.type === 'image' || descriptor.type === 'link') {
    if (/[\s\u0000-\u0020\u007f\\]/.test(result)) throw new Error(`${descriptor.label}에 사용할 수 없는 문자가 있습니다.`);
    if (descriptor.type === 'image') {
      if (!validHttps(result) && !/^\/api\/media\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/.test(result)) throw new Error('이미지는 업로드한 파일 주소 또는 HTTPS 주소를 입력해 주세요.');
    } else if (!validHttps(result) && !/^\/(?!\/)/.test(result) && !/^#\/(?!\/)/.test(result)) throw new Error('링크는 사이트 내부 경로 또는 HTTPS 주소를 입력해 주세요.');
  }
  return result;
}

/** Validate browser or API input and discard unregistered fields. */
export function validateComposition(value, kind) {
  const descriptors = catalog(kind);
  if (!record(value) || value.version !== COMPOSITION_VERSION || !Array.isArray(value.sections)) throw new Error('페이지 구성 형식 또는 버전이 올바르지 않습니다.');
  const tag = compositionKindTag(value, kind);
  try { if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_COMPOSITION_BYTES) throw new Error('페이지 구성 내용이 너무 큽니다.'); } catch (error) { if (error instanceof TypeError) throw new Error('페이지 구성 형식이 올바르지 않습니다.'); throw error; }
  if (value.sections.length > descriptors.length) throw new Error(`이 페이지의 섹션은 ${descriptors.length}개 이내로 구성해 주세요.`);
  const types = new Set(); const ids = new Set();
  const sections = value.sections.map((section) => {
    if (!record(section)) throw new Error('섹션 형식이 올바르지 않습니다.');
    const descriptor = findDefinition(kind, section.type);
    if (types.has(section.type)) throw new Error('같은 종류의 섹션은 한 번만 추가할 수 있습니다.');
    types.add(section.type);
    const id = identifier(section.id, '섹션');
    if (ids.has(id)) throw new Error('중복된 섹션 ID가 있습니다.');
    ids.add(id);
    if (typeof section.enabled !== 'boolean') throw new Error('섹션 표시 설정이 올바르지 않습니다.');
    const result = { id, type: section.type, enabled: section.enabled };
    for (const field of descriptor.fields) result[field] = sanitizeField(section[field], field);
    if (descriptor.maxItems) {
      if (section.items !== undefined && !Array.isArray(section.items)) throw new Error('섹션 항목 형식이 올바르지 않습니다.');
      const items = section.items ?? [];
      if (items.length > descriptor.maxItems) throw new Error(`섹션 항목은 ${descriptor.maxItems}개 이내로 입력해 주세요.`);
      const itemIds = new Set();
      result.items = items.map((item) => {
        if (!record(item)) throw new Error('섹션 항목 형식이 올바르지 않습니다.');
        const itemId = identifier(item.id, '항목');
        if (itemIds.has(itemId)) throw new Error('중복된 항목 ID가 있습니다.');
        itemIds.add(itemId);
        const resultItem = { id: itemId };
        for (const field of descriptor.itemFields) resultItem[field] = sanitizeField(item[field], field);
        return resultItem;
      });
    } else if (section.items !== undefined && (!Array.isArray(section.items) || section.items.length)) throw new Error('이 섹션의 항목은 연결된 콘텐츠에서 관리합니다.');
    return result;
  });
  return clone({ version: COMPOSITION_VERSION, ...tag, sections });
}
