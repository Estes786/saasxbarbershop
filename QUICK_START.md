# ⚡ QUICK START GUIDE

## 🚀 TL;DR - 1 LANGKAH UNTUK FIX AUTHENTICATION

### **STEP 1: Fix RLS Policies** (5 menit)

1. Buka: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
2. Copy isi file: `FIX_RLS_INFINITE_RECURSION.sql`
3. Paste dan click "Run"
4. ✅ **DONE!**

---

## 🧪 TEST SEKARANG

### **URL Aplikasi**:
https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai

### **Test Registration**:
1. Go to: `/register`
2. Fill form (email, nama, HP, password)
3. Submit
4. Should redirect to `/dashboard/customer`

### **Test Login**:
1. Go to: `/login`
2. Enter credentials
3. Submit
4. Should redirect based on role

---

## 📊 STATUS

```
✅ Server:        ONLINE (PM2)
✅ Database:      7 tables ready
✅ Auth Service:  17 users
✅ Build:         No errors
⚠️  RLS:          Execute SQL to fix
```

---

## 🔗 IMPORTANT LINKS

- **App**: https://3000-i7qw68bzf5391hz3vhgtg-c81df28e.sandbox.novita.ai
- **SQL Editor**: https://supabase.com/dashboard/project/qwqmhvwqeynnyxaecqzw/sql/new
- **GitHub**: https://github.com/Estes786/saasxbarbershop

---

## 📝 NEXT STEPS (OPTIONAL)

### **Setup Google OAuth**:
1. Google Console: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add redirect: `https://qwqmhvwqeynnyxaecqzw.supabase.co/auth/v1/callback`
4. Enable in Supabase: Auth → Providers → Google

---

## 🔧 TROUBLESHOOTING

### **Server Not Running**:
```bash
cd /home/user/webapp
fuser -k 3000/tcp 2>/dev/null || true
pm2 restart saasxbarbershop
```

### **Check Logs**:
```bash
pm2 logs saasxbarbershop --nostream
```

### **Test Database**:
```bash
node check_database.js
```

---

## ✅ SUCCESS CRITERIA

Aplikasi working jika:
- [ ] Execute SQL fix
- [ ] Can register new user
- [ ] Can login with email
- [ ] Dashboard accessible
- [ ] Profile auto-created

---

**Read Full Documentation**: `DEPLOYMENT_COMPLETE.md`
