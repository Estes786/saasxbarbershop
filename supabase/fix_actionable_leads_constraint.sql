-- ========================================
-- FIX: Add Unique Constraint for Actionable Leads
-- ========================================
-- Purpose: Allow upsert operation in generate-actionable-leads Edge Function
-- Issue: Edge Function tries to upsert with (customer_phone, lead_segment)
--        but no unique constraint exists
-- ========================================

-- Check if constraint already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_customer_lead_segment'
  ) THEN
    -- Add unique constraint
    ALTER TABLE barbershop_actionable_leads
    ADD CONSTRAINT unique_customer_lead_segment 
    UNIQUE (customer_phone, lead_segment);
    
    RAISE NOTICE 'Unique constraint added successfully';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Create index for better performance on this constraint
CREATE INDEX IF NOT EXISTS idx_leads_customer_segment 
ON barbershop_actionable_leads(customer_phone, lead_segment);

-- Verify constraint was created
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'barbershop_actionable_leads'::regclass
AND conname = 'unique_customer_lead_segment';

-- ========================================
-- VERIFICATION
-- ========================================

-- Check all constraints on the table
SELECT 
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'barbershop_actionable_leads'::regclass
ORDER BY conname;
