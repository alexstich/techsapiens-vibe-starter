const fs = require('fs');
const path = require('path');

// 5 тематик хобби
const hobbies = {
  sport: ['бег', 'плавание', 'йога', 'теннис', 'серфинг', 'велоспорт', 'футбол', 'баскетбол', 'скалолазание', 'сноуборд'],
  creative: ['музыка', 'фотография', 'рисование', 'видеосъёмка', 'писательство', 'гитара', 'пианино', 'диджеинг', 'графический дизайн'],
  tech: ['3D-печать', 'дроны', 'умный дом', 'робототехника', 'ретро-гейминг', 'Arduino', 'Raspberry Pi', 'VR/AR', 'сборка ПК'],
  travel: ['походы', 'кемпинг', 'путешествия', 'горные лыжи', 'дайвинг', 'парапланеризм', 'автопутешествия', 'яхтинг'],
  intellectual: ['шахматы', 'настольные игры', 'чтение', 'подкасты', 'D&D', 'го', 'головоломки', 'философия', 'история']
};

const firstNames = [
  'Александр', 'Михаил', 'Дмитрий', 'Андрей', 'Сергей', 'Николай', 'Артём', 'Максим', 'Иван', 'Евгений',
  'Виктор', 'Роман', 'Владимир', 'Павел', 'Олег', 'Константин', 'Алексей', 'Денис', 'Кирилл', 'Глеб',
  'Анна', 'Мария', 'Елена', 'Ольга', 'Наталья', 'Екатерина', 'Татьяна', 'Ирина', 'Юлия', 'Светлана',
  'Дарья', 'Полина', 'Виктория', 'Алина', 'Ксения', 'Анастасия', 'Валерия', 'Марина', 'Александра', 'София',
  'Anton', 'Nikita', 'Artem', 'Denis', 'Kirill', 'Max', 'Alex', 'Viktor', 'Oleg', 'Sergey',
  'Anna', 'Maria', 'Olga', 'Kate', 'Julia', 'Elena', 'Daria', 'Victoria', 'Alina', 'Sofia'
];

const lastNames = [
  'Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соловьёв', 'Васильев', 'Зайцев',
  'Павлов', 'Семёнов', 'Голубев', 'Виноградов', 'Богданов', 'Воробьёв', 'Фёдоров', 'Михайлов', 'Беляев', 'Тарасов',
  'Иванова', 'Петрова', 'Сидорова', 'Козлова', 'Новикова', 'Морозова', 'Волкова', 'Соловьёва', 'Васильева', 'Зайцева',
  'Павлова', 'Семёнова', 'Голубева', 'Виноградова', 'Богданова', 'Воробьёва', 'Фёдорова', 'Михайлова', 'Белявина', 'Тарасова',
  'Kowalski', 'Smith', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'
];

const professions = [
  { bio: 'Frontend Developer с опытом 5+ лет. React, Vue, TypeScript', skills: ['React', 'Vue.js', 'TypeScript', 'CSS'] },
  { bio: 'Backend Developer, специализация на высоконагруженных системах', skills: ['Python', 'Go', 'PostgreSQL', 'Redis'] },
  { bio: 'Full Stack разработчик, строю продукты от идеи до продакшена', skills: ['Node.js', 'React', 'MongoDB', 'AWS'] },
  { bio: 'Mobile Developer, создаю приложения для iOS и Android', skills: ['Swift', 'Kotlin', 'Flutter', 'React Native'] },
  { bio: 'DevOps Engineer, автоматизирую всё что движется', skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD'] },
  { bio: 'Data Scientist, превращаю данные в бизнес-инсайты', skills: ['Python', 'ML', 'pandas', 'TensorFlow'] },
  { bio: 'ML Engineer, разрабатываю и деплою модели машинного обучения', skills: ['PyTorch', 'MLOps', 'Python', 'Computer Vision'] },
  { bio: 'Product Manager с техническим бэкграундом', skills: ['Product Strategy', 'Agile', 'Analytics', 'UX'] },
  { bio: 'UX/UI Designer, создаю удобные и красивые интерфейсы', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'] },
  { bio: 'QA Lead, строю процессы тестирования с нуля', skills: ['Test Automation', 'Selenium', 'API Testing', 'Performance'] },
  { bio: 'Tech Lead, веду команду разработки', skills: ['Architecture', 'Team Management', 'Code Review', 'Mentoring'] },
  { bio: 'CTO стартапа, 10+ лет в разработке', skills: ['Strategy', 'Architecture', 'Team Building', 'Product'] },
  { bio: 'Growth Hacker, помогаю стартапам расти x10', skills: ['Growth Marketing', 'Analytics', 'A/B Testing', 'SEO'] },
  { bio: 'AI Researcher, исследую новые подходы в deep learning', skills: ['Deep Learning', 'NLP', 'Research', 'Python'] },
  { bio: 'NLP Engineer, работаю с обработкой естественного языка', skills: ['NLP', 'Transformers', 'Python', 'LLMs'] },
  { bio: 'Computer Vision Engineer, создаю системы распознавания', skills: ['OpenCV', 'YOLO', 'PyTorch', 'Image Processing'] },
  { bio: 'Blockchain Developer, разрабатываю смарт-контракты', skills: ['Solidity', 'Web3', 'Ethereum', 'DeFi'] },
  { bio: 'Cloud Architect, проектирую облачные инфраструктуры', skills: ['AWS', 'GCP', 'Azure', 'Microservices'] },
  { bio: 'Security Engineer, защищаю системы от угроз', skills: ['Security', 'Penetration Testing', 'SIEM', 'Compliance'] },
  { bio: 'Data Engineer, строю data pipelines', skills: ['Spark', 'Airflow', 'SQL', 'Data Modeling'] },
  { bio: 'SRE Engineer, обеспечиваю надёжность сервисов', skills: ['SRE', 'Monitoring', 'Incident Response', 'Automation'] },
  { bio: 'iOS Developer с фокусом на SwiftUI', skills: ['Swift', 'SwiftUI', 'Core Data', 'ARKit'] },
  { bio: 'Android Developer, Kotlin энтузиаст', skills: ['Kotlin', 'Jetpack Compose', 'Android SDK', 'Firebase'] },
  { bio: 'Game Developer, создаю мобильные игры', skills: ['Unity', 'C#', 'Game Design', '2D/3D Graphics'] },
  { bio: 'Embedded Developer, программирую железо', skills: ['C/C++', 'Embedded Systems', 'IoT', 'RTOS'] },
  { bio: 'Solution Architect в enterprise', skills: ['Enterprise Architecture', 'Integration', 'API Design', 'SOA'] },
  { bio: 'Scrum Master, помогаю командам быть эффективными', skills: ['Scrum', 'Facilitation', 'Coaching', 'Agile'] },
  { bio: 'Business Analyst, мост между бизнесом и разработкой', skills: ['Business Analysis', 'Requirements', 'BPMN', 'SQL'] },
  { bio: 'Marketing Manager в tech стартапе', skills: ['Digital Marketing', 'Content', 'SMM', 'Brand Strategy'] },
  { bio: 'Sales Manager в B2B SaaS', skills: ['B2B Sales', 'CRM', 'Negotiations', 'Account Management'] },
  { bio: 'HR Tech, строю IT команды', skills: ['IT Recruitment', 'Employer Branding', 'HR Tech', 'Talent Management'] },
  { bio: 'AI Product Manager, запускаю AI продукты', skills: ['AI/ML Product', 'Strategy', 'Data Analysis', 'Roadmapping'] },
  { bio: 'Technical Writer, пишу документацию которую читают', skills: ['Technical Writing', 'API Documentation', 'UX Writing', 'Knowledge Base'] },
  { bio: 'Platform Engineer, строю внутренние платформы', skills: ['Platform Engineering', 'IDP', 'DevEx', 'Backstage'] },
  { bio: 'Database Administrator, оптимизирую базы данных', skills: ['PostgreSQL', 'MySQL', 'Performance Tuning', 'Backup/Recovery'] },
  { bio: 'QA Automation Engineer, автоматизирую тесты', skills: ['Playwright', 'Cypress', 'Python', 'CI/CD'] },
  { bio: 'FinTech Developer, разрабатываю финансовые продукты', skills: ['FinTech', 'Payment Systems', 'Compliance', 'Security'] },
  { bio: 'EdTech Product Owner, создаю образовательные продукты', skills: ['EdTech', 'Product Management', 'LMS', 'Gamification'] },
  { bio: 'HealthTech Founder, строю будущее медицины', skills: ['HealthTech', 'Product Strategy', 'Fundraising', 'Compliance'] },
  { bio: 'PropTech Developer, цифровизирую недвижимость', skills: ['PropTech', 'Full Stack', 'GIS', 'BIM'] },
  { bio: 'LegalTech специалист, автоматизирую юридические процессы', skills: ['LegalTech', 'NLP', 'Automation', 'Contract Analysis'] },
  { bio: 'AI Engineer, интегрирую LLM в продукты', skills: ['LLMs', 'OpenAI API', 'LangChain', 'RAG'] },
  { bio: 'Prompt Engineer, оптимизирую работу с AI', skills: ['Prompt Engineering', 'LLMs', 'AI Tools', 'Automation'] },
  { bio: 'Voice AI Developer, создаю голосовых ассистентов', skills: ['Voice AI', 'ASR', 'TTS', 'Conversational AI'] },
  { bio: 'Robotics Engineer, программирую роботов', skills: ['ROS', 'Python', 'C++', 'Computer Vision'] },
  { bio: 'AR/VR Developer, создаю иммерсивные опыты', skills: ['Unity', 'ARKit', 'VR', 'Spatial Computing'] },
  { bio: 'Web3 Product Manager, строю децентрализованные продукты', skills: ['Web3', 'Product Management', 'Tokenomics', 'DeFi'] },
  { bio: 'API Developer, проектирую и строю API', skills: ['REST', 'GraphQL', 'API Design', 'Documentation'] },
  { bio: 'Low-code Developer, автоматизирую бизнес-процессы', skills: ['No-code/Low-code', 'Automation', 'Integration', 'Workflow'] },
  { bio: 'Data Privacy Specialist, обеспечиваю GDPR compliance', skills: ['Privacy', 'GDPR', 'Data Protection', 'Compliance'] },
  { bio: 'Performance Engineer, оптимизирую производительность', skills: ['Performance', 'Load Testing', 'Optimization', 'APM'] },
  { bio: 'Accessibility Specialist, делаю продукты доступными', skills: ['Accessibility', 'WCAG', 'UX', 'Inclusive Design'] },
  { bio: 'Content Strategist для tech компаний', skills: ['Content Strategy', 'SEO', 'Analytics', 'Storytelling'] },
  { bio: 'Community Manager, строю IT сообщества', skills: ['Community Building', 'Events', 'Content', 'Engagement'] },
  { bio: 'Tech Evangelist, продвигаю технологии', skills: ['Public Speaking', 'Developer Relations', 'Content', 'Community'] },
  { bio: 'Startup Advisor, помогаю стартапам расти', skills: ['Strategy', 'Fundraising', 'Mentoring', 'GTM'] },
  { bio: 'VC Analyst, инвестирую в tech стартапы', skills: ['Venture Capital', 'Due Diligence', 'Financial Analysis', 'Market Research'] },
  { bio: 'Innovation Manager в корпорации', skills: ['Innovation', 'Strategy', 'Design Thinking', 'Intrapreneurship'] },
  { bio: 'Digital Transformation Consultant', skills: ['Digital Transformation', 'Change Management', 'Strategy', 'Technology'] },
  { bio: 'Customer Success Manager в SaaS', skills: ['Customer Success', 'Onboarding', 'Retention', 'Account Management'] },
  { bio: 'Technical Recruiter в AI стартапе', skills: ['Tech Recruitment', 'Sourcing', 'Interviewing', 'Employer Branding'] },
  { bio: 'Operations Manager в tech стартапе', skills: ['Operations', 'Process Optimization', 'Scaling', 'Management'] },
  { bio: 'Chief of Staff в AI компании', skills: ['Strategy', 'Operations', 'Leadership', 'Cross-functional'] },
  { bio: 'Revenue Operations Manager', skills: ['RevOps', 'Analytics', 'CRM', 'Process'] },
  { bio: 'Product Designer с фокусом на AI продукты', skills: ['Product Design', 'AI/ML UX', 'Figma', 'Research'] },
  { bio: 'Motion Designer для tech продуктов', skills: ['Motion Design', 'After Effects', 'Lottie', 'UI Animation'] },
  { bio: '3D Artist для games и VR', skills: ['3D Modeling', 'Blender', 'Unity', 'Texturing'] },
  { bio: 'Sound Designer для digital продуктов', skills: ['Sound Design', 'Audio Engineering', 'UX Audio', 'Games'] },
  { bio: 'Technical Project Manager', skills: ['Project Management', 'Agile', 'Risk Management', 'Stakeholders'] },
  { bio: 'Release Manager, управляю релизами', skills: ['Release Management', 'CI/CD', 'Coordination', 'Quality'] }
];

const startupStages = ['Идея', 'MVP / прототип', 'Есть первые пользователи', 'Растущий бизнес', ''];
const startupGoals = [
  'Единорога (венчурный подход, рост до $1B)',
  'Небольшой дивидендный бизнес (бутстрэп)',
  'карьеру в корпорации',
  'Вариант 4',
  ''
];

const lookingForOptions = [
  'Кофаундера', 'Человека в команду', 'Инвестора', 'Ментора', 
  'Единомышленников', 'Работу', 'Новую профессию', 'изучаю опыт других'
];

const startupDescriptions = [
  'AI-платформа для автоматизации customer support',
  'SaaS для управления удалёнными командами',
  'Marketplace для фрилансеров в AI сфере',
  'Платформа для онлайн-обучения с AI tutors',
  'Инструмент для автоматической генерации кода',
  'AI-ассистент для разработчиков',
  'Платформа для создания no-code приложений',
  'Сервис для автоматизации маркетинга',
  'AI-powered CRM для малого бизнеса',
  'Платформа для управления подписками',
  'Инструмент для анализа конкурентов с AI',
  'Сервис для автоматизации документооборота',
  'AI-платформа для HR и найма',
  'Инструмент для создания AI-агентов',
  'Платформа для монетизации контента',
  'Сервис для оптимизации рекламных кампаний',
  'AI-инструмент для создания презентаций',
  'Платформа для проведения онлайн-ивентов',
  'Сервис для автоматизации бухгалтерии',
  'AI-платформа для анализа рынков',
  'Инструмент для создания чат-ботов',
  'Платформа для управления знаниями компании',
  'Сервис для автоматизации тестирования',
  'AI-инструмент для написания текстов',
  'Платформа для видео-продакшена с AI'
];

const canHelpOptions = [
  'Могу помочь с техническим менторингом и code review',
  'Делюсь опытом в построении продуктов',
  'Консультирую по выходу на международные рынки',
  'Помогаю с настройкой процессов разработки',
  'Могу проконсультировать по AI/ML интеграциям',
  'Делюсь опытом в fundraising',
  'Помогаю с дизайном и UX',
  'Консультирую по DevOps и инфраструктуре',
  'Могу помочь с анализом рынка',
  'Делюсь опытом в управлении командами',
  'Помогаю с маркетингом и growth',
  'Консультирую по legal и compliance вопросам',
  'Могу помочь с networking',
  'Делюсь опытом в создании стартапов',
  'Помогаю с подготовкой pitch deck'
];

const needsHelpOptions = [
  'Ищу единомышленников для нового проекта',
  'Хочу найти ментора в сфере продукта',
  'Интересует опыт выхода на US рынок',
  'Ищу инвестиции на ранней стадии',
  'Хочу научиться эффективнее использовать AI',
  'Ищу техническую экспертизу',
  'Интересует опыт построения команд',
  'Хочу найти партнёров для стартапа',
  'Ищу feedback на свой продукт',
  'Интересует опыт в конкретной индустрии',
  'Хочу расширить нетворк',
  'Ищу людей для мастермайнд группы',
  'Интересует опыт автоматизации процессов',
  'Хочу найти co-founder',
  'Ищу возможности для коллабораций'
];

const aiUsageOptions = [
  'Использую ChatGPT и Claude для работы с текстами и кодом. Cursor как основная IDE.',
  'AI помогает в написании кода, генерации документации и исследованиях рынка.',
  'Активно использую LLMs для анализа данных, автоматизации рутины и обучения.',
  'Применяю AI для генерации контента, дизайна и автоматизации процессов.',
  'Использую Copilot для кодинга, GPT для текстов, Midjourney для визуалов.',
  'AI интегрирован во все рабочие процессы - от планирования до деплоя.',
  'Использую различные AI инструменты для research, writing и coding.',
  'ChatGPT заменил поиск в Google. Cursor ускоряет разработку в 3 раза.',
  'Применяю AI для customer support automation и анализа feedback.',
  'Использую AI агентов для автоматизации задач и принятия решений.',
  'LLMs помогают в работе с документацией, переводах и коммуникации.',
  'AI использую для брейнсторма идей, планирования и решения задач.',
  'Perplexity для research, GPT для текстов, Copilot для кода.',
  'Интегрирую AI в продукты которые разрабатываю, также использую лично.',
  'AI помогает оставаться продуктивным - от email до сложных технических задач.'
];

const telegramPrefixes = ['user', 'dev', 'tech', 'ai', 'startup', 'founder', 'coder', 'maker', 'build', 'create'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomHobby() {
  const categories = Object.keys(hobbies);
  const category = getRandom(categories);
  return getRandom(hobbies[category]);
}

function generateParticipant(id) {
  const firstName = getRandom(firstNames);
  const lastName = getRandom(lastNames);
  const name = `${firstName} ${lastName}`;
  
  const profession = getRandom(professions);
  const hasStartup = Math.random() > 0.6;
  const startupStage = hasStartup ? getRandom(startupStages.filter(s => s !== '')) : (Math.random() > 0.5 ? getRandom(startupStages) : '');
  
  const hasLinkedin = Math.random() > 0.3;
  const linkedinSlug = name.toLowerCase().replace(/[^a-zа-я]/gi, '').substring(0, 8) + Math.floor(Math.random() * 100);
  
  return {
    id,
    name,
    telegram: `${getRandom(telegramPrefixes)}${Math.floor(Math.random() * 100)}`,
    linkedin: hasLinkedin ? `https://www.linkedin.com/in/${linkedinSlug}` : '',
    bio: profession.bio,
    skills: profession.skills,
    hasStartup,
    startupStage,
    startupDescription: hasStartup || startupStage ? getRandom(startupDescriptions) : '',
    startupName: hasStartup || startupStage ? getRandom(startupGoals) : '',
    lookingFor: getRandomSubset(lookingForOptions, 1, 4),
    canHelp: getRandom(canHelpOptions),
    needsHelp: getRandom(needsHelpOptions),
    aiUsage: getRandom(aiUsageOptions),
    _note: 'Contact information (telegram, linkedin) has been mocked for privacy protection',
    email: '',
    photo: '',
    custom_1: getRandomHobby(),
    custom_2: '',
    custom_3: '',
    custom_4: '',
    custom_5: '',
    custom_6: '',
    custom_7: '',
    custom_array_1: [],
    custom_array_2: [],
    custom_array_3: [],
    custom_array_4: [],
    custom_array_5: [],
    custom_array_6: [],
    custom_array_7: []
  };
}

// Читаем существующий файл
const participantsPath = path.join(__dirname, '..', 'data', 'participants.json');
const existingData = JSON.parse(fs.readFileSync(participantsPath, 'utf8'));

console.log(`Существующих участников: ${existingData.length}`);

// Генерируем 70 новых участников
const newParticipants = [];
for (let i = 0; i < 70; i++) {
  const newId = existingData.length + i + 1;
  newParticipants.push(generateParticipant(newId));
}

// Объединяем
const allParticipants = [...existingData, ...newParticipants];

console.log(`Новых участников: ${newParticipants.length}`);
console.log(`Всего участников: ${allParticipants.length}`);

// Записываем обратно
fs.writeFileSync(participantsPath, JSON.stringify(allParticipants, null, 2), 'utf8');

console.log('Файл успешно обновлён!');

