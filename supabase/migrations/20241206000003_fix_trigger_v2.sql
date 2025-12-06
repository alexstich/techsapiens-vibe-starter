-- ============================================
-- MIGRATION: Fix handle_new_user trigger - bypass RLS
-- ============================================

-- Пересоздаём функцию с обходом RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Логируем ошибку но не блокируем регистрацию
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Даём функции права суперюзера для обхода RLS
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Убедимся что триггер существует
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

