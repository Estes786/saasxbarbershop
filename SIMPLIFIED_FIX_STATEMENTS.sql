-- 1. Add user_id column

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'barbershop_customers' 
          AND column_name = 'user_id'
        ) THEN
          ALTER TABLE barbershop_customers 
          ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    

-- 2. Fix orphaned records by customer_phone

      UPDATE barbershop_customers bc
      SET user_id = up.id,
          updated_at = NOW()
      FROM user_profiles up
      WHERE bc.customer_phone = up.customer_phone
        AND up.role = 'customer'
        AND bc.user_id IS NULL
        AND bc.customer_phone IS NOT NULL
        AND bc.customer_phone != '';
    

-- 3. Create index on user_id

      CREATE INDEX IF NOT EXISTS idx_barbershop_customers_user_id 
      ON barbershop_customers(user_id)
      WHERE user_id IS NOT NULL;
    

-- 4. Create index on customer_phone

      CREATE INDEX IF NOT EXISTS idx_barbershop_customers_phone 
      ON barbershop_customers(customer_phone);
    

-- 5. Enable RLS
ALTER TABLE barbershop_customers ENABLE ROW LEVEL SECURITY;

-- 6. Drop old policies

      DROP POLICY IF EXISTS "customers_read_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_insert_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_update_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_delete_own" ON barbershop_customers;
      DROP POLICY IF EXISTS "Enable read access for all users" ON barbershop_customers;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_read_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_insert_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_update_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "customers_delete_own_by_user_id" ON barbershop_customers;
      DROP POLICY IF EXISTS "admin_full_access_customers" ON barbershop_customers;
      DROP POLICY IF EXISTS "capster_read_all_customers" ON barbershop_customers;
      DROP POLICY IF EXISTS "capster_update_customers" ON barbershop_customers;
    

-- 7. Create customer_read_own_by_user_id policy

      CREATE POLICY "customer_read_own_by_user_id"
      ON barbershop_customers
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() 
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      );
    

-- 8. Create customer_insert_own_by_user_id policy

      CREATE POLICY "customer_insert_own_by_user_id"
      ON barbershop_customers
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      );
    

-- 9. Create customer_update_own_by_user_id policy

      CREATE POLICY "customer_update_own_by_user_id"
      ON barbershop_customers
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'customer'
        )
      );
    

-- 10. Create capster_read_all_customers policy

      CREATE POLICY "capster_read_all_customers"
      ON barbershop_customers
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'capster'
        )
      );
    

-- 11. Create capster_update_customers policy

      CREATE POLICY "capster_update_customers"
      ON barbershop_customers
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'capster'
        )
      );
    

-- 12. Create admin_full_access_customers policy

      CREATE POLICY "admin_full_access_customers"
      ON barbershop_customers
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    

-- 13. Update trigger function

      CREATE OR REPLACE FUNCTION auto_create_barbershop_customer()
      RETURNS TRIGGER
      SECURITY DEFINER
      SET search_path = public
      LANGUAGE plpgsql
      AS $_$
      BEGIN
        IF NEW.role = 'customer' THEN
          IF NOT EXISTS (
            SELECT 1 FROM barbershop_customers 
            WHERE user_id = NEW.id
          ) THEN
            INSERT INTO barbershop_customers (
              user_id,
              customer_phone,
              customer_name,
              customer_area,
              total_visits,
              total_revenue,
              average_atv,
              customer_segment,
              lifetime_value,
              coupon_count,
              coupon_eligible,
              google_review_given,
              churn_risk_score,
              created_at,
              updated_at
            ) VALUES (
              NEW.id,
              NEW.customer_phone,
              NEW.customer_name,
              'Unknown',
              0, 0, 0, 'New', 0, 0, false, false, 0,
              NOW(), NOW()
            );
          END IF;
        END IF;
        RETURN NEW;
      END;
      $_$;
      
      DROP TRIGGER IF EXISTS trg_auto_create_barbershop_customer ON user_profiles;
      CREATE TRIGGER trg_auto_create_barbershop_customer
        AFTER INSERT ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION auto_create_barbershop_customer();
    
