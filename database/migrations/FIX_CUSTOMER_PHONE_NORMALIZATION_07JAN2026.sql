-- =========================================
-- \ud83d\udd27 FIX: Phone Number Normalization
-- Date: 07 January 2026
-- Purpose: Normalize all phone numbers in database
-- Status: PRODUCTION READY - SAFE & IDEMPOTENT
-- =========================================

-- \ud83d\udcca PHASE 1: Analyze Current State
DO $$
DECLARE
    v_customers_count INT;
    v_bookings_count INT;
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '\ud83d\udd0d DATABASE ANALYSIS - Phone Numbers';
    RAISE NOTICE '===========================================';
    
    -- Count customers
    SELECT COUNT(*) INTO v_customers_count 
    FROM barbershop_customers;
    
    -- Count bookings
    SELECT COUNT(*) INTO v_bookings_count 
    FROM bookings;
    
    RAISE NOTICE '\u2705 Total Customers: %', v_customers_count;
    RAISE NOTICE '\u2705 Total Bookings: %', v_bookings_count;
    
    -- Show customer3test phone number
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'customer3test@gmail.com'
    ) THEN
        DECLARE
            v_user_id UUID;
            v_phone TEXT;
        BEGIN
            SELECT id INTO v_user_id 
            FROM auth.users 
            WHERE email = 'customer3test@gmail.com';
            
            SELECT customer_phone INTO v_phone 
            FROM barbershop_customers 
            WHERE user_id = v_user_id;
            
            RAISE NOTICE '';
            RAISE NOTICE '\ud83d\udc64 Customer: customer3test@gmail.com';
            RAISE NOTICE '   User ID: %', v_user_id;
            RAISE NOTICE '   Current Phone: %', COALESCE(v_phone, 'NULL');
        END;
    ELSE
        RAISE NOTICE '\u26a0\ufe0f Customer customer3test@gmail.com NOT FOUND in auth.users';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;

-- \ud83d\udd27 PHASE 2: Phone Normalization Function
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT) 
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF phone IS NULL OR phone = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-digit characters
    cleaned := regexp_replace(phone, '[^0-9]', '', 'g');
    
    -- Handle +62 prefix (international format)
    IF cleaned LIKE '62%' THEN
        cleaned := '0' || substring(cleaned from 3);
    END IF;
    
    -- Ensure starts with 0
    IF cleaned !~ '^0' THEN
        cleaned := '0' || cleaned;
    END IF;
    
    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- \ud83d\udd25 PHASE 3: Update barbershop_customers table
UPDATE barbershop_customers
SET customer_phone = normalize_phone(customer_phone)
WHERE customer_phone IS NOT NULL
  AND customer_phone != normalize_phone(customer_phone);

-- \ud83d\udd25 PHASE 4: Update bookings table
UPDATE bookings
SET customer_phone = normalize_phone(customer_phone)
WHERE customer_phone IS NOT NULL
  AND customer_phone != normalize_phone(customer_phone);

-- \ud83d\udcca PHASE 5: Verification
DO $$
DECLARE
    v_customers_normalized INT;
    v_bookings_normalized INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '\u2705 NORMALIZATION COMPLETE';
    RAISE NOTICE '===========================================';
    
    -- Count normalized records
    SELECT COUNT(*) INTO v_customers_normalized
    FROM barbershop_customers
    WHERE customer_phone ~ '^0[0-9]{9,12}$';
    
    SELECT COUNT(*) INTO v_bookings_normalized
    FROM bookings
    WHERE customer_phone ~ '^0[0-9]{9,12}$';
    
    RAISE NOTICE '\u2705 Customers with normalized phone: %', v_customers_normalized;
    RAISE NOTICE '\u2705 Bookings with normalized phone: %', v_bookings_normalized;
    
    -- Show customer3test after normalization
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'customer3test@gmail.com'
    ) THEN
        DECLARE
            v_user_id UUID;
            v_phone TEXT;
            v_booking_count INT;
        BEGIN
            SELECT id INTO v_user_id 
            FROM auth.users 
            WHERE email = 'customer3test@gmail.com';
            
            SELECT customer_phone INTO v_phone 
            FROM barbershop_customers 
            WHERE user_id = v_user_id;
            
            SELECT COUNT(*) INTO v_booking_count
            FROM bookings
            WHERE customer_phone = v_phone;
            
            RAISE NOTICE '';
            RAISE NOTICE '\ud83d\udc64 customer3test@gmail.com - AFTER FIX:';
            RAISE NOTICE '   Normalized Phone: %', COALESCE(v_phone, 'NULL');
            RAISE NOTICE '   Booking Count: %', v_booking_count;
        END;
    END IF;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE '\ud83c\udf89 Phone normalization completed successfully!';
    RAISE NOTICE '===========================================';
END $$;

-- \ud83d\udee1\ufe0f Optional: Create index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone_normalized 
ON barbershop_customers(customer_phone) 
WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_phone_normalized 
ON bookings(customer_phone) 
WHERE customer_phone IS NOT NULL;

-- \u2705 Script completed successfully!
