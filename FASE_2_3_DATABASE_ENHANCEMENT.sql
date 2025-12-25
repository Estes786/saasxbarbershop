-- =====================================================
-- FASE 2 & 3: DATABASE ENHANCEMENT
-- BOOKING SYSTEM & PREDICTIVE ANALYTICS
-- Date: 2025-12-25
-- =====================================================

-- =====================================================
-- FASE 2: BOOKING SYSTEM ENHANCEMENTS
-- =====================================================

-- 1. Enhance bookings table with additional fields
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS queue_number INTEGER,
ADD COLUMN IF NOT EXISTS estimated_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waiting_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS capster_notes TEXT,
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) DEFAULT 'online' CHECK (booking_source IN ('online', 'walk-in', 'phone')),
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 2. Create index for booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_capster_id ON bookings(capster_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_queue_number ON bookings(queue_number);

-- 3. Create booking_queue view for today's queue
CREATE OR REPLACE VIEW booking_queue_today AS
SELECT 
  b.*,
  c.customer_name,
  cp.capster_name,
  s.service_name,
  s.duration_minutes as service_duration,
  ROW_NUMBER() OVER (PARTITION BY b.capster_id ORDER BY b.booking_date, b.created_at) as queue_position
FROM bookings b
LEFT JOIN barbershop_customers c ON b.customer_phone = c.customer_phone
LEFT JOIN capsters cp ON b.capster_id = cp.id
LEFT JOIN service_catalog s ON b.service_id = s.id
WHERE DATE(b.booking_date) = CURRENT_DATE
  AND b.status IN ('pending', 'confirmed', 'in-progress')
ORDER BY b.booking_date, b.created_at;

-- 4. Create function to auto-assign queue numbers
CREATE OR REPLACE FUNCTION assign_queue_number()
RETURNS TRIGGER AS $$
DECLARE
  max_queue INTEGER;
BEGIN
  -- Get max queue number for today and this capster
  SELECT COALESCE(MAX(queue_number), 0) INTO max_queue
  FROM bookings
  WHERE DATE(booking_date) = DATE(NEW.booking_date)
    AND capster_id = NEW.capster_id;
  
  -- Assign next queue number
  NEW.queue_number = max_queue + 1;
  
  -- Calculate estimated start time based on queue
  NEW.estimated_start_time = NEW.booking_date + (NEW.queue_number - 1) * INTERVAL '30 minutes';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for queue number assignment
DROP TRIGGER IF EXISTS trg_assign_queue_number ON bookings;
CREATE TRIGGER trg_assign_queue_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.queue_number IS NULL)
  EXECUTE FUNCTION assign_queue_number();

-- 5. Create function to calculate waiting time
CREATE OR REPLACE FUNCTION update_waiting_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_start_time IS NOT NULL AND OLD.actual_start_time IS NULL THEN
    NEW.waiting_time_minutes = EXTRACT(EPOCH FROM (NEW.actual_start_time - NEW.created_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waiting time calculation
DROP TRIGGER IF EXISTS trg_update_waiting_time ON bookings;
CREATE TRIGGER trg_update_waiting_time
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_waiting_time();

-- =====================================================
-- FASE 3: PREDICTIVE ANALYTICS ENHANCEMENTS
-- =====================================================

-- 1. Create customer_visit_history table for predictive analytics
CREATE TABLE IF NOT EXISTS customer_visit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone),
  visit_date DATE NOT NULL,
  service_id UUID REFERENCES service_catalog(id),
  capster_id UUID REFERENCES capsters(id),
  visit_interval_days INTEGER,
  is_return_visit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_visit_history_customer ON customer_visit_history(customer_phone);
CREATE INDEX IF NOT EXISTS idx_visit_history_date ON customer_visit_history(visit_date);

-- 2. Create function to calculate visit intervals
CREATE OR REPLACE FUNCTION calculate_visit_interval()
RETURNS TRIGGER AS $$
DECLARE
  last_visit_date DATE;
BEGIN
  -- Get last visit date
  SELECT MAX(visit_date) INTO last_visit_date
  FROM customer_visit_history
  WHERE customer_phone = NEW.customer_phone
    AND id != NEW.id;
  
  IF last_visit_date IS NOT NULL THEN
    NEW.visit_interval_days = NEW.visit_date - last_visit_date;
    NEW.is_return_visit = TRUE;
  ELSE
    NEW.visit_interval_days = NULL;
    NEW.is_return_visit = FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for visit interval calculation
DROP TRIGGER IF EXISTS trg_calculate_visit_interval ON customer_visit_history;
CREATE TRIGGER trg_calculate_visit_interval
  BEFORE INSERT OR UPDATE ON customer_visit_history
  FOR EACH ROW
  EXECUTE FUNCTION calculate_visit_interval();

-- 3. Create customer_predictions table
CREATE TABLE IF NOT EXISTS customer_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL REFERENCES barbershop_customers(customer_phone),
  predicted_next_visit_date DATE,
  confidence_score NUMERIC(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
  average_visit_interval_days INTEGER,
  churn_risk_level VARCHAR(20) CHECK (churn_risk_level IN ('low', 'medium', 'high')),
  churn_risk_score NUMERIC(5,2) CHECK (churn_risk_score BETWEEN 0 AND 100),
  last_visit_date DATE,
  days_since_last_visit INTEGER,
  total_visits INTEGER DEFAULT 0,
  prediction_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_phone, prediction_date)
);

-- Create index for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_customer ON customer_predictions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_predictions_churn_risk ON customer_predictions(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_next_visit ON customer_predictions(predicted_next_visit_date);

-- 4. Create function to calculate customer predictions
CREATE OR REPLACE FUNCTION calculate_customer_prediction(p_customer_phone TEXT)
RETURNS customer_predictions AS $$
DECLARE
  v_result customer_predictions;
  v_avg_interval NUMERIC;
  v_last_visit_date DATE;
  v_total_visits INTEGER;
  v_days_since_last INTEGER;
  v_churn_risk_score NUMERIC;
  v_churn_risk_level VARCHAR(20);
  v_confidence_score NUMERIC;
BEGIN
  -- Get customer visit statistics
  SELECT 
    AVG(visit_interval_days)::INTEGER,
    MAX(visit_date),
    COUNT(*)
  INTO v_avg_interval, v_last_visit_date, v_total_visits
  FROM customer_visit_history
  WHERE customer_phone = p_customer_phone;
  
  -- Calculate days since last visit
  v_days_since_last = CURRENT_DATE - v_last_visit_date;
  
  -- Calculate churn risk score (0-100)
  -- Higher score = higher churn risk
  IF v_avg_interval IS NOT NULL AND v_avg_interval > 0 THEN
    v_churn_risk_score = LEAST(100, (v_days_since_last::NUMERIC / v_avg_interval) * 100);
  ELSE
    v_churn_risk_score = 50; -- Default for new customers
  END IF;
  
  -- Determine churn risk level
  IF v_churn_risk_score < 50 THEN
    v_churn_risk_level = 'low';
  ELSIF v_churn_risk_score < 80 THEN
    v_churn_risk_level = 'medium';
  ELSE
    v_churn_risk_level = 'high';
  END IF;
  
  -- Calculate confidence score based on visit history
  v_confidence_score = LEAST(100, (v_total_visits * 10)); -- More visits = higher confidence
  
  -- Build result
  v_result.id = gen_random_uuid();
  v_result.customer_phone = p_customer_phone;
  v_result.last_visit_date = v_last_visit_date;
  v_result.days_since_last_visit = v_days_since_last;
  v_result.total_visits = v_total_visits;
  v_result.average_visit_interval_days = v_avg_interval;
  v_result.predicted_next_visit_date = v_last_visit_date + v_avg_interval;
  v_result.confidence_score = v_confidence_score;
  v_result.churn_risk_score = v_churn_risk_score;
  v_result.churn_risk_level = v_churn_risk_level;
  v_result.prediction_date = CURRENT_DATE;
  v_result.updated_at = NOW();
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to update all predictions
CREATE OR REPLACE FUNCTION update_all_customer_predictions()
RETURNS INTEGER AS $$
DECLARE
  v_customer RECORD;
  v_prediction customer_predictions;
  v_count INTEGER := 0;
BEGIN
  -- Loop through all customers with visit history
  FOR v_customer IN 
    SELECT DISTINCT customer_phone 
    FROM customer_visit_history
  LOOP
    -- Calculate prediction
    v_prediction = calculate_customer_prediction(v_customer.customer_phone);
    
    -- Insert or update prediction
    INSERT INTO customer_predictions (
      id, customer_phone, predicted_next_visit_date, confidence_score,
      average_visit_interval_days, churn_risk_level, churn_risk_score,
      last_visit_date, days_since_last_visit, total_visits,
      prediction_date, updated_at
    )
    VALUES (
      v_prediction.id, v_prediction.customer_phone, v_prediction.predicted_next_visit_date,
      v_prediction.confidence_score, v_prediction.average_visit_interval_days,
      v_prediction.churn_risk_level, v_prediction.churn_risk_score,
      v_prediction.last_visit_date, v_prediction.days_since_last_visit,
      v_prediction.total_visits, v_prediction.prediction_date, v_prediction.updated_at
    )
    ON CONFLICT (customer_phone, prediction_date)
    DO UPDATE SET
      predicted_next_visit_date = EXCLUDED.predicted_next_visit_date,
      confidence_score = EXCLUDED.confidence_score,
      average_visit_interval_days = EXCLUDED.average_visit_interval_days,
      churn_risk_level = EXCLUDED.churn_risk_level,
      churn_risk_score = EXCLUDED.churn_risk_score,
      last_visit_date = EXCLUDED.last_visit_date,
      days_since_last_visit = EXCLUDED.days_since_last_visit,
      total_visits = EXCLUDED.total_visits,
      updated_at = NOW();
    
    v_count = v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to populate visit history from transactions
CREATE OR REPLACE FUNCTION populate_visit_history_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_visit_history (
    customer_phone,
    visit_date,
    service_id,
    capster_id
  )
  VALUES (
    NEW.customer_phone,
    DATE(NEW.created_at),
    NEW.service_id,
    NEW.capster_id
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for visit history population
DROP TRIGGER IF EXISTS trg_populate_visit_history ON barbershop_transactions;
CREATE TRIGGER trg_populate_visit_history
  AFTER INSERT ON barbershop_transactions
  FOR EACH ROW
  EXECUTE FUNCTION populate_visit_history_from_transaction();

-- 7. Populate historical visit data
INSERT INTO customer_visit_history (customer_phone, visit_date, service_id, capster_id)
SELECT 
  customer_phone,
  DATE(created_at) as visit_date,
  service_id,
  capster_id
FROM barbershop_transactions
ON CONFLICT DO NOTHING;

-- 8. Generate initial predictions
SELECT update_all_customer_predictions();

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE customer_visit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_predictions ENABLE ROW LEVEL SECURITY;

-- RLS for customer_visit_history
CREATE POLICY "customer_visit_history_select_own" ON customer_visit_history
  FOR SELECT
  USING (
    customer_phone IN (
      SELECT customer_phone FROM user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'capster')
    )
  );

-- RLS for customer_predictions
CREATE POLICY "customer_predictions_select_own" ON customer_predictions
  FOR SELECT
  USING (
    customer_phone IN (
      SELECT customer_phone FROM user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'capster')
    )
  );

-- =====================================================
-- SUMMARY & VERIFICATION
-- =====================================================

-- Verification queries
SELECT 'FASE 2 & 3 DATABASE ENHANCEMENT COMPLETE!' as status;

SELECT 'Total visit history records:' as info, COUNT(*) as count FROM customer_visit_history;
SELECT 'Total customer predictions:' as info, COUNT(*) as count FROM customer_predictions;
SELECT 'Total bookings:' as info, COUNT(*) as count FROM bookings;
SELECT 'Bookings with queue numbers:' as info, COUNT(*) as count FROM bookings WHERE queue_number IS NOT NULL;

-- Show churn risk distribution
SELECT 
  churn_risk_level,
  COUNT(*) as customer_count,
  ROUND(AVG(churn_risk_score), 2) as avg_risk_score
FROM customer_predictions
GROUP BY churn_risk_level
ORDER BY 
  CASE churn_risk_level
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END;
