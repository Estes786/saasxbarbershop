# 🚀 MANUAL DEPLOYMENT GUIDE - SUPABASE SCHEMA

## 📋 STEP-BY-STEP INSTRUCTIONS

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw
- Navigate to: **SQL Editor** (left sidebar)
- Click: **New Query**

### 2. Copy SQL File Content
- Open file: `DEPLOY_TO_SUPABASE.sql` 
- Copy ALL content (Ctrl+A, Ctrl+C)

### 3. Paste and Execute
- Paste into Supabase SQL Editor
- Click: **RUN** button (or press Ctrl+Enter)
- Wait for execution (~30-60 seconds)

### 4. Verify Tables Created
Go to **Table Editor** and verify these tables exist:
- ✅ `user_profiles` (RBAC - admin/customer roles)
- ✅ `barbershop_transactions` (transaction data)
- ✅ `barbershop_customers` (customer analytics)
- ✅ `customer_visit_history` (visit tracking)
- ✅ `barbershop_bookings` (booking system)

### 5. Enable Google OAuth (CRITICAL)
1. Go to: **Authentication > Providers**
2. Find **Google** provider
3. Toggle **Enable**
4. You'll need:
   - Google Client ID
   - Google Client Secret
5. Get credentials from: https://console.cloud.google.com/apis/credentials

### 6. Verify RLS Policies
Go to **Authentication > Policies** and verify:
- user_profiles policies (admin/customer access)
- barbershop_transactions policies
- barbershop_customers policies

### 7. Test Authentication
- Admin registration: http://localhost:3000/register/admin
- Customer registration: http://localhost:3000/register
- Login: http://localhost:3000/login

## 🔐 ADMIN SECRET KEY

For Admin Registration, use:
```
BOZQ_BARBERSHOP_ADMIN_2025_SECRET
```

## ✅ CHECKLIST

- [ ] SQL schema deployed successfully
- [ ] All 5 tables visible in Table Editor
- [ ] RLS policies active
- [ ] Google OAuth enabled
- [ ] Admin secret key configured in .env.local
- [ ] Frontend build successful
- [ ] Admin registration tested
- [ ] Customer registration tested

## 🆘 TROUBLESHOOTING

### Error: "relation already exists"
- This is OK! It means table was created before
- Skip to next step

### Error: "permission denied"
- Make sure you're using Service Role key
- Check Supabase dashboard permissions

### Google OAuth not working
- Verify Google credentials in Supabase dashboard
- Check redirect URLs match your domain

## 📞 SUPPORT

If deployment fails, check:
1. Supabase Dashboard > Logs
2. Browser Console (F12)
3. Terminal errors during build
