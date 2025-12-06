import { NextRequest, NextResponse } from 'next/server';
import type { PoolUser } from '@/types';

// Mock data for testing the pool visualization
const mockUsers: PoolUser[] = [
  { id: '1', name: 'Alice Chen', bio: 'ML Engineer at Google. Love working on NLP and transformers.', isReady: true, score: 0.95, position: { x: 0, y: 0 } },
  { id: '2', name: 'Bob Smith', bio: 'Data scientist focusing on computer vision and deep learning.', isReady: true, score: 0.88, position: { x: 0, y: 0 } },
  { id: '3', name: 'Carol White', bio: 'AI researcher working on reinforcement learning.', isReady: false, score: 0.82, position: { x: 0, y: 0 } },
  { id: '4', name: 'David Kim', bio: 'Building AI products at a startup.', isReady: true, score: 0.76, position: { x: 0, y: 0 } },
  { id: '5', name: 'Eva Martinez', bio: 'ML ops engineer. Passionate about scalable ML systems.', isReady: true, score: 0.71, position: { x: 0, y: 0 } },
  { id: '6', name: 'Frank Lee', bio: 'PhD in machine learning. Currently at Meta AI.', isReady: false, score: 0.68, position: { x: 0, y: 0 } },
  { id: '7', name: 'Grace Wang', bio: 'NLP specialist. Working on large language models.', isReady: true, score: 0.65, position: { x: 0, y: 0 } },
  { id: '8', name: 'Henry Brown', bio: 'Self-taught ML engineer. Love kaggle competitions.', isReady: true, score: 0.59, position: { x: 0, y: 0 } },
  { id: '9', name: 'Ivy Zhang', bio: 'Research scientist at DeepMind.', isReady: true, score: 0.54, position: { x: 0, y: 0 } },
  { id: '10', name: 'Jack Davis', bio: 'ML engineer specializing in recommendation systems.', isReady: false, score: 0.48, position: { x: 0, y: 0 } },
  { id: '11', name: 'Kate Wilson', bio: 'Working on autonomous vehicles at Waymo.', isReady: true, score: 0.42, position: { x: 0, y: 0 } },
  { id: '12', name: 'Leo Chen', bio: 'Interested in AI safety and alignment.', isReady: true, score: 0.35, position: { x: 0, y: 0 } },
  { id: '13', name: 'Maria Lopez', bio: 'Healthcare AI researcher.', isReady: false, score: 0.28, position: { x: 0, y: 0 } },
  { id: '14', name: 'Nick Taylor', bio: 'Building LLM applications.', isReady: true, score: 0.22, position: { x: 0, y: 0 } },
  { id: '15', name: 'Olivia Park', bio: 'Computer vision engineer at Tesla.', isReady: true, score: 0.15, position: { x: 0, y: 0 } },
  { id: '16', name: 'Peter Adams', bio: 'Beginner in ML, learning every day.', isReady: true, score: 0.08, position: { x: 0, y: 0 } },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock users (in real implementation, this would search via embeddings)
  return NextResponse.json({ users: mockUsers });
}

