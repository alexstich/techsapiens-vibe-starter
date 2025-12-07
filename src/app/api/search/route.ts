import { NextRequest, NextResponse } from 'next/server';
import type { PoolUser } from '@/types';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Синонимы для улучшения текстового поиска (рус <-> англ и вариации)
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
  
  expandedTerms.add(queryLower);
  
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

interface SemanticMatch {
  id: string;
  name: string;
  bio: string | null;
  is_ready_to_chat: boolean | null;
  similarity: number;
  avatar_url?: string | null;
  skills?: string[] | null;
}

// Генерация embedding для поискового запроса
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return null;
  }
}

// Текстовый поиск по профилям (fallback и дополнение к RAG)
function textSearchProfiles(profiles: ProfileRow[], query: string): Map<string, number> {
  const searchTerms = expandQueryWithSynonyms(query);
  const originalWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scores = new Map<string, number>();
  
  for (const p of profiles) {
    let relevance = 0;
    const matchedOriginalTerms = new Set<string>();
    
    const searchFields = [
      { text: p.bio, weight: 5 },
      { text: (p.skills || []).join(' '), weight: 6 },
      { text: p.can_help, weight: 2 },
      { text: p.needs_help, weight: 1 },
      { text: (p.looking_for || []).join(' '), weight: 1 },
      { text: p.name, weight: 2 },
    ].filter(f => f.text);
    
    for (const field of searchFields) {
      const fieldLower = field.text!.toLowerCase();
      
      for (const term of originalWords) {
        if (fieldLower.includes(term)) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(field.text!)) {
            relevance += field.weight * 3;
            matchedOriginalTerms.add(term);
          } else {
            relevance += field.weight * 2;
            matchedOriginalTerms.add(term);
          }
        }
      }
      
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
    
    if (matchedOriginalTerms.size >= 2) {
      relevance *= 1.5;
    }
    if (matchedOriginalTerms.size >= 3) {
      relevance *= 1.3;
    }
    
    scores.set(p.id, relevance);
  }
  
  return scores;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();
    
    // Параллельно запускаем семантический поиск и загрузку всех профилей
    const [queryEmbedding, profilesResult] = await Promise.all([
      generateQueryEmbedding(query),
      supabase
        .from('profiles')
        .select('id, name, bio, skills, can_help, needs_help, looking_for, is_ready_to_chat, avatar_url')
        .limit(500)
    ]);
    
    const { data: profiles, error: profilesError } = profilesResult;
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }
    
    // Фильтруем текущего пользователя
    const filteredProfiles = user 
      ? profiles.filter(p => p.id !== user.id)
      : profiles;
    
    // Семантический поиск через RAG (если embedding успешно создан)
    const semanticScores = new Map<string, number>();
    
    if (queryEmbedding) {
      try {
        const { data: semanticResults, error: rpcError } = await supabase
          .rpc('match_profiles', {
            query_embedding: JSON.stringify(queryEmbedding),
            current_user_id: user?.id,
            match_count: 100
          });
        
        if (rpcError) {
          console.error('RAG search error:', rpcError);
        } else if (semanticResults) {
          console.log(`RAG found ${semanticResults.length} semantic matches for "${query}"`);
          for (const match of semanticResults as SemanticMatch[]) {
            // similarity уже от 0 до 1
            semanticScores.set(match.id, match.similarity);
          }
        }
      } catch (error) {
        console.error('RAG RPC error:', error);
      }
    }
    
    // Текстовый поиск (синонимы + точные совпадения)
    const textScores = textSearchProfiles(filteredProfiles as ProfileRow[], query);
    
    // Комбинируем результаты: RAG (70%) + текстовый (30%)
    const RAG_WEIGHT = 0.7;
    const TEXT_WEIGHT = 0.3;
    
    // Нормализуем текстовые скоры
    const maxTextScore = Math.max(...Array.from(textScores.values()), 1);
    
    const combinedResults = filteredProfiles.map((p) => {
      const semanticScore = semanticScores.get(p.id) || 0;
      const textScore = (textScores.get(p.id) || 0) / maxTextScore;
      
      // Если есть семантический скор - комбинируем, иначе только текстовый
      const finalScore = semanticScore > 0 
        ? (semanticScore * RAG_WEIGHT) + (textScore * TEXT_WEIGHT)
        : textScore * 0.5; // Профили без embedding получают пониженный текстовый скор
      
      return {
        profile: p,
        score: finalScore,
        hasSemanticMatch: semanticScore > 0,
        semanticScore,
        textScore
      };
    });
    
    // Сортируем по комбинированному скору
    combinedResults.sort((a, b) => b.score - a.score);
    
    // Логируем топ-5 для отладки
    console.log(`Search "${query}" - Top 5 results:`);
    combinedResults.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.profile.name}: score=${r.score.toFixed(3)} (semantic=${r.semanticScore.toFixed(3)}, text=${r.textScore.toFixed(3)})`);
    });
    
    // Формируем ответ
    const users: PoolUser[] = combinedResults.map((item) => ({
      id: item.profile.id,
      name: item.profile.name,
      bio: item.profile.bio || null,
      isReady: item.profile.is_ready_to_chat ?? true,
      score: item.score,
      position: { x: 0, y: 0 },
      avatarUrl: item.profile.avatar_url || null,
    }));
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
