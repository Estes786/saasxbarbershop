-- ============================================
-- FIX: Add missing columns to user_profiles
-- ============================================

-- Add full_name column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column';
    END IF;
END $$;

-- Add user_role column if not exists  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'user_role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN user_role TEXT DEFAULT 'customer';
        RAISE NOTICE 'Added user_role column';
    END IF;
END $$;

-- Populate full_name from customer_name if empty
UPDATE user_profiles 
SET full_name = customer_name 
WHERE full_name IS NULL AND customer_name IS NOT NULL;

-- Populate user_role from role if empty
UPDATE user_profiles 
SET user_role = role 
WHERE user_role IS NULL AND role IS NOT NULL;

-- Set default user_role for empty values
UPDATE user_profiles 
SET user_role = 'customer' 
WHERE user_role IS NULL;

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
