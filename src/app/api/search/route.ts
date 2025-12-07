import { NextRequest, NextResponse } from 'next/server';
import type { PoolUser } from '@/types';
import fs from 'fs';
import path from 'path';

interface Participant {
  id: number;
  name: string;
  bio: string;
  skills: string[];
  hasStartup: boolean;
  lookingFor: string[];
  canHelp: string;
  needsHelp: string;
  custom_2: string; // avatar path
}

// Загружаем участников из JSON
function loadParticipants(): Participant[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'participants.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading participants:', error);
    return [];
  }
}

// Простой поиск по тексту (потом заменится на embedding search)
function searchParticipants(participants: Participant[], query: string): PoolUser[] {
  const queryLower = query.toLowerCase();
  
  // Ищем совпадения
  const matched = participants
    .map((p) => {
      // Считаем релевантность по различным полям
      let relevance = 0;
      
      const searchFields = [
        p.name,
        p.bio,
        ...(p.skills || []),
        p.canHelp,
        p.needsHelp,
        ...(p.lookingFor || []),
      ].filter(Boolean);
      
      for (const field of searchFields) {
        if (field.toLowerCase().includes(queryLower)) {
          relevance += 1;
        }
      }
      
      // Если имя содержит запрос - выше релевантность
      if (p.name.toLowerCase().includes(queryLower)) {
        relevance += 2;
      }
      
      return { participant: p, relevance };
    })
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  // Если не нашли по точному совпадению, возвращаем рандомную выборку
  const results = matched.length > 0 
    ? matched 
    : participants
        .sort(() => Math.random() - 0.5)
        .slice(0, 50)
        .map((p, i) => ({ participant: p, relevance: 50 - i }));

  // Конвертируем в PoolUser
  const maxRelevance = Math.max(...results.map(r => r.relevance), 1);
  
  return results.slice(0, 100).map((item, index) => ({
    id: String(item.participant.id),
    name: item.participant.name,
    bio: item.participant.bio || null,
    isReady: Math.random() > 0.2, // 80% готовы к чату
    score: item.relevance / maxRelevance, // Нормализуем score 0-1
    position: { x: 0, y: 0 },
    avatarUrl: item.participant.custom_2 || null,
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const participants = loadParticipants();
  const users = searchParticipants(participants, query);

  return NextResponse.json({ users });
}
