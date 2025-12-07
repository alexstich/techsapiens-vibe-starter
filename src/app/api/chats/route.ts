import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Получаем список уникальных собеседников с последним сообщением
  // Используем подзапрос для нахождения собеседников
  const { data: conversations, error } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      content,
      created_at
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Группируем по собеседникам и берём последнее сообщение
  const chatMap = new Map<string, {
    otherUserId: string;
    lastMessage: string;
    lastMessageAt: string;
    isFromMe: boolean;
  }>();

  for (const msg of conversations || []) {
    const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    
    // Берём только первое (самое новое) сообщение для каждого собеседника
    if (!chatMap.has(otherUserId) && msg.created_at) {
      chatMap.set(otherUserId, {
        otherUserId,
        lastMessage: msg.content,
        lastMessageAt: msg.created_at,
        isFromMe: msg.sender_id === user.id,
      });
    }
  }

  // Получаем профили собеседников
  const otherUserIds = Array.from(chatMap.keys());
  
  if (otherUserIds.length === 0) {
    return NextResponse.json({ chats: [] });
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, bio')
    .in('id', otherUserIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // Объединяем данные
  const chats = Array.from(chatMap.values()).map(chat => {
    const profile = profiles?.find(p => p.id === chat.otherUserId);
    return {
      id: chat.otherUserId,
      name: profile?.name || 'Unknown',
      avatarUrl: profile?.avatar_url || null,
      bio: profile?.bio || null,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      isFromMe: chat.isFromMe,
    };
  });

  // Сортируем по времени последнего сообщения
  chats.sort((a, b) => 
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return NextResponse.json({ chats });
}
