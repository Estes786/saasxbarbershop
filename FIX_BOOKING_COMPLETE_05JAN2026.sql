-- ============================================================
-- BOOKING SYSTEM FIX - 05 JANUARI 2026
-- Fix untuk masalah booking yang tidak bisa dilakukan
-- ============================================================

-- ROOT CAUSE #1: NO SERVICES IN DATABASE
-- Solution: Add sample services untuk semua barbershops

DO $$
DECLARE
  v_barbershop_id UUID;
  v_branch_id UUID;
BEGIN
  -- Loop through all barbershops and add services
  FOR v_barbershop_id, v_branch_id IN 
    SELECT DISTINCT b.id, br.id
    FROM barbershop_profiles b
    LEFT JOIN branches br ON br.barbershop_id = b.id
    LIMIT 10
  LOOP
    -- Insert basic services for this barbershop
    INSERT INTO service_catalog (
      service_name, 
      service_category, 
      base_price, 
      duration_minutes, 
      description, 
      barbershop_id,
      branch_id,
      is_active
    ) VALUES
    ('Potong Rambut Reguler', 'Haircut', 35000, 30, 'Potong rambut standar dengan hasil rapi', v_barbershop_id, v_branch_id, true),
    ('Potong Rambut + Cuci', 'Haircut', 45000, 45, 'Potong rambut lengkap dengan keramas', v_barbershop_id, v_branch_id, true),
    ('Cukur Jenggot', 'Shaving', 20000, 20, 'Cukur jenggot bersih dan rapi', v_barbershop_id, v_branch_id, true),
    ('Styling Rambut', 'Styling', 50000, 40, 'Styling rambut sesuai keinginan', v_barbershop_id, v_branch_id, true),
    ('Creambath', 'Treatment', 60000, 60, 'Perawatan rambut dengan creambath', v_barbershop_id, v_branch_id, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Added services for barbershop % branch %', v_barbershop_id, v_branch_id;
  END LOOP;
  
  -- Also add general services without branch (for NULL branch support)
  FOR v_barbershop_id IN 
    SELECT DISTINCT id FROM barbershop_profiles LIMIT 10
  LOOP
    INSERT INTO service_catalog (
      service_name, 
      service_category, 
      base_price, 
      duration_minutes, 
      description, 
      barbershop_id,
      branch_id,
      is_active
    ) VALUES
    ('Potong Rambut Reguler', 'Haircut', 35000, 30, 'Potong rambut standar dengan hasil rapi', v_barbershop_id, NULL, true),
    ('Potong Rambut + Cuci', 'Haircut', 45000, 45, 'Potong rambut lengkap dengan keramas', v_barbershop_id, NULL, true),
    ('Cukur Jenggot', 'Shaving', 20000, 20, 'Cukur jenggot bersih dan rapi', v_barbershop_id, NULL, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Added general services for barbershop %', v_barbershop_id;
  END LOOP;
END $$;

-- ROOT CAUSE #2: AUTO-CREATE CUSTOMER IN BARBERSHOP_CUSTOMERS
-- Create function to auto-insert customer when they register

CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_name TEXT;
BEGIN
  -- Extract phone and name from user_profiles
  SELECT phone, name INTO v_phone, v_name
  FROM user_profiles
  WHERE user_id = NEW.user_id;
  
  -- Only proceed if phone exists
  IF v_phone IS NOT NULL THEN
    -- Insert into barbershop_customers if not exists
    INSERT INTO barbershop_customers (
      customer_phone,
      customer_name,
      user_id,
      total_visits,
      total_revenue,
      first_visit_date,
      created_at,
      updated_at
    ) VALUES (
      v_phone,
      COALESCE(v_name, 'Customer'),
      NEW.user_id,
      0,
      0,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_phone) DO NOTHING;
    
    RAISE NOTICE 'Auto-created barbershop customer for phone: %', v_phone;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call this function
DROP TRIGGER IF EXISTS trigger_auto_create_barbershop_customer ON user_profiles;
CREATE TRIGGER trigger_auto_create_barbershop_customer
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_barbershop_customer();

-- ROOT CAUSE #3: EXISTING CUSTOMERS NOT IN BARBERSHOP_CUSTOMERS
-- Backfill existing customers

INSERT INTO barbershop_customers (
  customer_phone,
  customer_name,
  user_id,
  total_visits,
  total_revenue,
  first_visit_date,
  created_at,
  updated_at
)
SELECT 
  up.phone,
  COALESCE(up.name, 'Customer'),
  up.user_id,
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM user_profiles up
WHERE up.phone IS NOT NULL
  AND up.phone NOT IN (SELECT customer_phone FROM barbershop_customers)
  AND up.role = 'customer'
ON CONFLICT (customer_phone) DO NOTHING;

-- Verify fixes
DO $$
DECLARE
  v_service_count INTEGER;
  v_customer_count INTEGER;
  v_capster_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_service_count FROM service_catalog WHERE is_active = true;
  SELECT COUNT(*) INTO v_customer_count FROM barbershop_customers;
  SELECT COUNT(*) INTO v_capster_count FROM capsters WHERE status = 'approved';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE FIX VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Active Services: %', v_service_count;
  RAISE NOTICE 'Customers: %', v_customer_count;
  RAISE NOTICE 'Approved Capsters: %', v_capster_count;
  RAISE NOTICE '';
  
  IF v_service_count = 0 THEN
    RAISE WARNING 'NO SERVICES! Booking will fail!';
  ELSE
    RAISE NOTICE '✅ Services OK';
  END IF;
  
  IF v_capster_count = 0 THEN
    RAISE WARNING 'NO APPROVED CAPSTERS! Booking will fail!';
  ELSE
    RAISE NOTICE '✅ Capsters OK';
  END IF;
  
  IF v_customer_count = 0 THEN
    RAISE WARNING 'NO CUSTOMERS! This is unusual';
  ELSE
    RAISE NOTICE '✅ Customers OK';
  END IF;
END $$;
