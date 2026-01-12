# 📝 PHASE 2 API DOCUMENTATION: MULTI-LOCATION BRANCH MANAGEMENT

**Project**: BALIK.LAGI System  
**Date**: 01 January 2026  
**Status**: ✅ Phase 2 Backend APIs Complete

---

## 🎯 OVERVIEW

Phase 2 implements RESTful API endpoints for multi-location branch management. These APIs enable:
- ✅ Branch CRUD operations
- ✅ Capster assignment to branches
- ✅ Branch-specific data queries
- ✅ Multi-location booking support

---

## 🛣️ API ENDPOINTS

### 1. **GET /api/admin/branches**
Get all branches, optionally filtered by barbershop

**Query Parameters:**
- `barbershop_id` (optional): Filter branches by barbershop ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "barbershop_id": "uuid",
      "branch_name": "Main Branch",
      "branch_code": "MB01",
      "address": "Jl. Example No. 123",
      "phone": "+62812345678",
      "operating_hours": {
        "monday": { "open": "09:00", "close": "21:00" },
        "tuesday": { "open": "09:00", "close": "21:00" },
        ...
      },
      "is_active": true,
      "is_main_branch": true,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "count": 2
}
```

---

### 2. **POST /api/admin/branches**
Create a new branch

**Request Body:**
```json
{
  "barbershop_id": "uuid (required)",
  "branch_name": "Branch Sudirman (required)",
  "branch_code": "BS01 (optional)",
  "address": "Jl. Sudirman No. 45 (optional)",
  "phone": "+62812345679 (optional)",
  "operating_hours": {
    "monday": { "open": "09:00", "close": "21:00" },
    ...
  },
  "is_active": true,
  "is_main_branch": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* branch object */ },
  "message": "Branch created successfully"
}
```

---

### 3. **GET /api/admin/branches/[id]**
Get single branch by ID (includes assigned capsters)

**URL Parameter:**
- `id`: Branch UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "branch_name": "Main Branch",
    "branch_code": "MB01",
    "address": "Jl. Example No. 123",
    "phone": "+62812345678",
    "operating_hours": { ... },
    "is_active": true,
    "is_main_branch": true,
    "capsters": [
      {
        "id": "uuid",
        "capster_name": "John Doe",
        "phone": "+62812345678",
        "specialization": "classic",
        "rating": 4.5,
        "is_available": true
      }
    ],
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 4. **PUT /api/admin/branches/[id]**
Update branch by ID

**URL Parameter:**
- `id`: Branch UUID

**Request Body:** (all fields optional)
```json
{
  "branch_name": "Updated Branch Name",
  "branch_code": "UB01",
  "address": "New Address",
  "phone": "+62812345680",
  "operating_hours": { ... },
  "is_active": false,
  "is_main_branch": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated branch object */ },
  "message": "Branch updated successfully"
}
```

---

### 5. **DELETE /api/admin/branches/[id]**
Delete branch by ID

**URL Parameter:**
- `id`: Branch UUID

**Safety Check:**
- Cannot delete branch with assigned capsters or bookings
- Must reassign or remove them first

**Response (Success):**
```json
{
  "success": true,
  "message": "Branch deleted successfully"
}
```

**Response (Has Dependencies):**
```json
{
  "success": false,
  "error": "Cannot delete branch with assigned capsters or bookings. Please reassign them first.",
  "details": {
    "capsters": 3,
    "bookings": 5
  }
}
```

---

### 6. **POST /api/admin/branches/[id]/capsters**
Assign capster to branch

**URL Parameter:**
- `id`: Branch UUID

**Request Body:**
```json
{
  "capster_id": "uuid (required)"
}
```

**Validation:**
- Branch must exist
- Capster must exist
- Capster must belong to same barbershop as branch

**Response:**
```json
{
  "success": true,
  "data": { /* capster object with updated branch_id */ },
  "message": "Capster John Doe assigned to branch successfully"
}
```

---

### 7. **DELETE /api/admin/branches/[id]/capsters**
Remove capster from branch

**URL Parameter:**
- `id`: Branch UUID

**Query Parameter:**
- `capster_id`: Capster UUID to remove

**Example:**
```
DELETE /api/admin/branches/abc123/capsters?capster_id=xyz789
```

**Response:**
```json
{
  "success": true,
  "data": { /* capster object with branch_id = null */ },
  "message": "Capster removed from branch successfully"
}
```

---

## 📊 ERROR RESPONSES

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 AUTHENTICATION

All `/api/admin/*` endpoints require admin authentication. Implement authentication middleware in production.

---

## 📁 FILE STRUCTURE

```
app/api/admin/branches/
├── route.ts                      # GET, POST /api/admin/branches
├── [id]/
│   ├── route.ts                  # GET, PUT, DELETE /api/admin/branches/[id]
│   └── capsters/
│       └── route.ts              # POST, DELETE /api/admin/branches/[id]/capsters
```

---

## ✅ PHASE 2 COMPLETION CHECKLIST

- [x] **Branches CRUD**
  - [x] GET all branches
  - [x] POST create branch
  - [x] GET single branch
  - [x] PUT update branch
  - [x] DELETE branch (with safety checks)

- [x] **Capster Assignment**
  - [x] POST assign capster to branch
  - [x] DELETE remove capster from branch
  - [x] Validation: same barbershop check

- [x] **Response Format**
  - [x] Consistent JSON structure
  - [x] Proper HTTP status codes
  - [x] Error handling

---

## 🚀 NEXT STEPS (PHASE 3)

1. **Frontend Branch Management Dashboard**
   - Branch list view
   - Create/edit branch form
   - Delete confirmation modal
   - Capster assignment UI

2. **Customer Branch Selector**
   - Branch dropdown in booking flow
   - Show available capsters per branch
   - Display branch operating hours

3. **Branch Analytics**
   - Revenue per branch
   - Capster utilization per branch
   - Booking statistics per branch

---

## 📝 USAGE EXAMPLES

### Create New Branch
```bash
curl -X POST https://yourapp.com/api/admin/branches \
  -H "Content-Type: application/json" \
  -d '{
    "barbershop_id": "abc-123",
    "branch_name": "Branch Kemang",
    "address": "Jl. Kemang Raya No. 88",
    "phone": "+628123456789",
    "is_main_branch": false
  }'
```

### Assign Capster to Branch
```bash
curl -X POST https://yourapp.com/api/admin/branches/branch-id-123/capsters \
  -H "Content-Type: application/json" \
  -d '{
    "capster_id": "capster-id-456"
  }'
```

### Get Branch with Capsters
```bash
curl https://yourapp.com/api/admin/branches/branch-id-123
```

---

## ✅ STATUS: PHASE 2 COMPLETE

All backend APIs for multi-location support are implemented and ready for frontend integration.

**Total Endpoints**: 7  
**Total Lines of Code**: ~12,000+ characters  
**Testing Status**: Ready for integration testing

🎉 **Phase 2: Backend APIs - COMPLETE!**
