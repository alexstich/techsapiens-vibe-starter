import { NextRequest, NextResponse } from 'next/server';
import type { PoolUser } from '@/types';
import { createClient } from '@/lib/supabase/server';

// Синонимы для улучшения поиска (рус <-> англ и вариации)
const SYNONYMS: Record<string, string[]> = {
  'фронтенд': ['frontend', 'фронт-энд', 'front-end', 'front end', 'ui'],
  'frontend': ['фронтенд', 'фронт-энд', 'front-end', 'front end', 'ui'],
  'бэкенд': ['backend', 'бэк-энд', 'back-end', 'back end', 'серверная'],
  'backend': ['бэкенд', 'бэк-энд', 'back-end', 'back end', 'серверная'],
  'разработчик': ['developer', 'программист', 'инженер', 'dev', 'coder'],
  'developer': ['разработчик', 'программист', 'инженер', 'dev', 'coder'],
  'react': ['reactjs', 'react.js', 'реакт'],
  'vue': ['vuejs', 'vue.js', 'вью'],
  'angular': ['angularjs', 'angular.js', 'ангуляр'],
  'javascript': ['js', 'джаваскрипт', 'жс'],
  'typescript': ['ts', 'тайпскрипт'],
  'python': ['питон', 'py'],
  'дизайнер': ['designer', 'ui/ux', 'ux/ui', 'ui ux'],
  'designer': ['дизайнер', 'ui/ux', 'ux/ui', 'ui ux'],
  'продукт': ['product', 'продакт', 'pm'],
  'product': ['продукт', 'продакт', 'pm'],
  'менеджер': ['manager', 'lead', 'лид'],
  'manager': ['менеджер', 'lead', 'лид'],
  'тестировщик': ['qa', 'tester', 'качество'],
  'qa': ['тестировщик', 'tester', 'качество'],
  'девопс': ['devops', 'ops', 'infrastructure'],
  'devops': ['девопс', 'ops', 'infrastructure'],
  'мобильный': ['mobile', 'ios', 'android'],
  'mobile': ['мобильный', 'ios', 'android'],
  'data': ['данные', 'аналитик', 'analytics'],
  'ml': ['machine learning', 'ai', 'нейросети', 'машинное обучение'],
  'ai': ['ml', 'machine learning', 'нейросети', 'искусственный интеллект'],
  'стартап': ['startup', 'предприниматель', 'founder'],
  'startup': ['стартап', 'предприниматель', 'founder'],
  'ментор': ['mentor', 'наставник', 'коуч'],
  'mentor': ['ментор', 'наставник', 'коуч'],
  'инвестор': ['investor', 'ангел', 'vc'],
  'investor': ['инвестор', 'ангел', 'vc'],
};

// Расширяем запрос синонимами
function expandQueryWithSynonyms(query: string): string[] {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);
  const expandedTerms = new Set<string>();
  
  // Добавляем исходный запрос
  expandedTerms.add(queryLower);
  
  // Добавляем каждое слово и его синонимы
  for (const word of words) {
    expandedTerms.add(word);
    const synonyms = SYNONYMS[word];
    if (synonyms) {
      for (const syn of synonyms) {
        expandedTerms.add(syn);
      }
    }
  }
  
  return Array.from(expandedTerms);
}

interface ProfileRow {
  id: string;
  name: string;
  bio: string | null;
  skills: string[] | null;
  can_help: string | null;
  needs_help: string | null;
  looking_for: string[] | null;
  is_ready_to_chat: boolean | null;
  avatar_url: string | null;
}

// Поиск по профилям из базы данных
function searchProfiles(profiles: ProfileRow[], query: string): PoolUser[] {
  const searchTerms = expandQueryWithSynonyms(query);
  const originalWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  // Ищем совпадения
  const matched = profiles
    .map((p) => {
      // Считаем релевантность по различным полям
      let relevance = 0;
      const matchedOriginalTerms = new Set<string>();
      
      const searchFields = [
        { text: p.bio, weight: 5, isMain: true },
        { text: (p.skills || []).join(' '), weight: 6, isMain: true },
        { text: p.can_help, weight: 2, isMain: false },
        { text: p.needs_help, weight: 1, isMain: false },
        { text: (p.looking_for || []).join(' '), weight: 1, isMain: false },
        { text: p.name, weight: 2, isMain: false },
      ].filter(f => f.text);
      
      for (const field of searchFields) {
        const fieldLower = field.text!.toLowerCase();
        
        // Сначала проверяем оригинальные слова запроса
        for (const term of originalWords) {
          if (fieldLower.includes(term)) {
            const regex = new RegExp(`\\b${term}\\b`, 'i');
            if (regex.test(field.text!)) {
              // Точное совпадение оригинального слова - максимум очков
              relevance += field.weight * 3;
              matchedOriginalTerms.add(term);
            } else {
              relevance += field.weight * 2;
              matchedOriginalTerms.add(term);
            }
          }
        }
        
        // Потом проверяем синонимы (но с меньшим весом)
        for (const term of searchTerms) {
          if (!originalWords.includes(term) && fieldLower.includes(term)) {
            const regex = new RegExp(`\\b${term}\\b`, 'i');
            if (regex.test(field.text!)) {
              relevance += field.weight * 1.5;
            } else {
              relevance += field.weight * 0.5;
            }
          }
        }
      }
      
      // Бонус за совпадение нескольких оригинальных слов
      if (matchedOriginalTerms.size >= 2) {
        relevance *= 1.5;
      }
      if (matchedOriginalTerms.size >= 3) {
        relevance *= 1.3;
      }
      
      return { profile: p, relevance };
    })
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  // Если не нашли по точному совпадению, возвращаем рандомную выборку
  const results = matched.length > 0 
    ? matched 
    : profiles
        .sort(() => Math.random() - 0.5)
        .slice(0, 50)
        .map((p, i) => ({ profile: p, relevance: 50 - i }));

  // Конвертируем в PoolUser
  const maxRelevance = Math.max(...results.map(r => r.relevance), 1);
  
  return results.slice(0, 100).map((item) => ({
    id: item.profile.id, // UUID из Supabase
    name: item.profile.name,
    bio: item.profile.bio || null,
    isReady: item.profile.is_ready_to_chat ?? true,
    score: item.relevance / maxRelevance, // Нормализуем score 0-1
    position: { x: 0, y: 0 },
    avatarUrl: item.profile.avatar_url || null,
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // Получаем текущего пользователя (опционально, для исключения себя из результатов)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Загружаем все профили из базы данных
    let profilesQuery = supabase
      .from('profiles')
      .select('id, name, bio, skills, can_help, needs_help, looking_for, is_ready_to_chat, avatar_url')
      .limit(500);
    
    // Исключаем текущего пользователя если авторизован
    if (user) {
      profilesQuery = profilesQuery.neq('id', user.id);
    }
    
    const { data: profiles, error } = await profilesQuery;
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }
    
    // Выполняем поиск по профилям
    const users = searchProfiles(profiles as ProfileRow[], query);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
