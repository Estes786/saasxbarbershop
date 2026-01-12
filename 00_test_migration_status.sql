
-- Quick test to check if migration is needed
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches')
    THEN '✅ branches table exists'
    ELSE '❌ branches table NOT found - migration needed'
  END as branches_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'capsters' AND column_name = 'branch_id')
    THEN '✅ capsters.branch_id exists'
    ELSE '❌ capsters.branch_id NOT found - migration needed'
  END as capsters_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'branch_id')
    THEN '✅ bookings.branch_id exists'
    ELSE '❌ bookings.branch_id NOT found - migration needed'
  END as bookings_status;
