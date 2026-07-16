# Settings Module - Quick Reference

## Module Location
`src/app/modules/settings/`

## Files Overview

| File | Purpose |
|------|---------|
| `settings.route.ts` | Route definitions (GET, PATCH) |
| `settings.controller.ts` | Request handlers |
| `settings.service.ts` | Business logic |
| `settings.model.ts` | MongoDB schema |
| `settings.interface.ts` | TypeScript interface |
| `settings.validation.ts` | Request validation schema |

## Quick API Reference

### Get Settings (Public)
```
GET /api/v1/settings
Response: 200 OK with settings object
```

### Update Settings (Admin Only)
```
PATCH /api/v1/settings
Headers: Authorization: Bearer <token>
Body: { partial settings object }
Response: 200 OK with updated settings
```

## Code Flow

```
Client Request
    ↓
Route Handler (settings.route.ts)
    ├─ GET → checkAuth (none) → getPlatformSettings
    └─ PATCH → checkAuth('SUPER_ADMIN') → validateRequest → updatePlatformSettings
    ↓
Controller (settings.controller.ts)
    └─ Validates request, delegates to service
    ↓
Service (settings.service.ts)
    └─ Business logic, database operations
    ↓
Model (settings.model.ts)
    └─ MongoDB CRUD operations
    ↓
Response to Client
```

## Common Tasks

### Task 1: Add New Setting Field
1. Update `settings.interface.ts` - add field to IPlatformSettings
2. Update `settings.model.ts` - add field to schema
3. Model automatically handles new fields in updates
4. Frontend component automatically includes field

**Example:**
```typescript
// Interface
export interface IPlatformSettings {
  // ... existing fields
  newSetting: string;
}

// Model
const platformSettingsSchema = new Schema<IPlatformSettings>({
  // ... existing fields
  newSetting: {
    type: String,
    default: 'default value',
  },
});
```

### Task 2: Add Validation to a Field
1. Update field constraints in `settings.model.ts` (min, max, enum)
2. Zod schema automatically accepts it

**Example:**
```typescript
// Add validation constraint
percentage: {
  type: Number,
  min: 0,
  max: 100,  // ← Add max constraint
  default: 15,
}
```

### Task 3: Fetch Settings in Another Module
```typescript
import { settingsService } from '../settings/settings.service';

const settings = await settingsService.getPlatformSettings();
const fee = settings.platformFee.percentage;
```

### Task 4: Use calculatePlatformFee
```typescript
import { settingsService } from '../settings/settings.service';

const transactionAmount = 10000;
const platformFee = await settingsService.calculatePlatformFee(transactionAmount);
// Returns: (10000 * 15) / 100 = 1500 (if percentage is 15)
```

## Settings Default Values

```javascript
{
  platformFee: {
    percentage: 15,
    type: 'PERCENTAGE',
    enabled: true
  },
  payout: {
    minimumAmount: 1000,
    processingDays: 7,
    maxPendingPayouts: 5
  },
  payment: {
    currency: 'BDT',
    taxPercentage: 0,
    gateway: 'PAYSTATION'
  },
  general: {
    platformName: 'LocalGuide',
    supportEmail: 'support@localguide.com',
    supportPhone: '+8801700000000',
    maintenanceMode: false,
    allowNewGuideRegistrations: true
  },
  socialLinks: { /* empty strings */ },
  contacts: { /* default values */ },
  seo: { /* default meta tags */ },
  whatsapp: { /* empty strings */ },
  homePageCards: { /* empty images */ }
}
```

## Middleware Chain for PATCH Request

```
Request
  ↓
checkAuth('SUPER_ADMIN')
  ├─ Verify token
  ├─ Check user exists
  ├─ Check user is not blocked/deleted
  └─ Check user role is SUPER_ADMIN
    ↓
validateRequest(updatePlatformSettingsSchema)
  └─ Zod validation (passthrough - accepts any)
    ↓
updatePlatformSettings (Controller)
  ├─ Check body not empty
  └─ Call service to update
    ↓
settingsService.updatePlatformSettings (Service)
  ├─ Find existing settings
  ├─ Deep merge provided fields
  └─ Save to database
    ↓
Response to Client
```

## Error Scenarios

| Status | Message | Cause | Solution |
|--------|---------|-------|----------|
| 400 | Request body cannot be empty | Empty PATCH body | Send at least one field |
| 403 | You are not permitted... | Not SUPER_ADMIN | Use SUPER_ADMIN account |
| 403 | No Token Received | Missing token | Add Authorization header |
| 401 | Invalid token | Bad token format | Re-login for new token |
| 500 | Various | Database error | Check MongoDB connection |

## Performance Characteristics

- **Read**: O(1) - Single document lookup
- **Write**: O(1) - Single document update
- **Memory**: Minimal - Singleton pattern, one document

## Important Notes

1. **Singleton Pattern**: Always one settings document per platform
2. **Partial Updates**: Service uses deep merge, only provided fields update
3. **No Required Fields**: All fields optional to support partial updates
4. **Auto-create**: Settings auto-created on first read if not exist
5. **Default Values**: All fields have sensible defaults

## Testing Guide

### Test GET Endpoint
```bash
curl -X GET http://localhost:5000/api/v1/settings
```

### Test PATCH Endpoint (need valid token)
```bash
curl -X PATCH http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"general":{"supportPhone":"+8801800000000"}}'
```

### Test with Partial Update
```bash
# Only update one nested field
PATCH /api/v1/settings
{
  "payment": {
    "taxPercentage": 10
  }
}
# Result: Only payment.taxPercentage changes, everything else stays same
```

## Integration Points

### Used By:
- **Payment Module**: Gets `platformFee` and `payment` settings
- **Payout Module**: Gets `payout` settings
- **Email Service**: Gets `general.supportEmail` and `contacts.supportEmail`
- **Admin Dashboard**: CRUD operations on all settings

### Uses:
- **MongoDB**: Data persistence
- **JWT**: Authentication for updates
- **Zod**: Request validation

## Debugging Tips

### Enable Console Logging
Add to settings.service.ts:
```typescript
console.log('Fetching settings...');
console.log('Current settings:', settings);
console.log('Update payload:', payload);
```

### Check MongoDB Data
```javascript
// In MongoDB shell
db.platformsettings.findOne()
db.platformsettings.updateOne({}, {$set: {payment: {taxPercentage: 10}}})
```

### Verify Auth Works
```bash
# Get token from login
# Check token payload at jwt.io
# Verify 'role' is 'SUPER_ADMIN'
```

## Related Documentation
- `/backend/README.md` - Full backend documentation
- `/SETTINGS_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `/admin/app/dashboard/settings/page.tsx` - Frontend settings page

---

**Last Updated**: July 16, 2026
**Quick Links**: [README.md](./README.md) | [Implementation Summary](../SETTINGS_IMPLEMENTATION_SUMMARY.md)
