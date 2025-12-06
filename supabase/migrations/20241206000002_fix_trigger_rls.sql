-- ============================================
-- MIGRATION: Fix RLS for handle_new_user trigger
-- ============================================

-- Добавить политику для postgres role (владелец SECURITY DEFINER функций)
-- Это позволит триггеру вставлять записи в profiles при регистрации
CREATE POLICY "Trigger can create profiles"
  ON profiles
  FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Также добавим для service_role на всякий случай
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

