# Justice Backend API

Complete backend API for the Justice platform with comprehensive settings management, authentication, and admin controls.

## Project Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── config/           # Configuration files (env, database, passport)
│   │   ├── errorHelpers/      # Custom error classes and handlers
│   │   ├── helpers/           # Utility helpers (validation, error handling)
│   │   ├── interfaces/        # TypeScript interfaces and types
│   │   ├── middlewares/       # Express middlewares (auth, validation, error handling)
│   │   ├── modules/           # Feature modules (users, settings, payments, etc.)
│   │   │   ├── settings/      # Platform settings management
│   │   │   ├── user/          # User management
│   │   │   ├── payment/       # Payment processing
│   │   │   └── ...
│   │   ├── routes/            # Route definitions
│   │   └── utils/             # Utility functions (jwt, catchAsync, etc.)
│   ├── app.ts                 # Express app configuration
│   └── server.ts              # Server entry point
├── dist/                      # Compiled JavaScript
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Settings Module Documentation

### Overview
The settings module manages all platform-wide configurations including payment settings, fees, contact information, social links, and home page customization.

### Endpoints

#### GET /api/v1/settings
Retrieve platform settings (public endpoint).

**Request:**
```bash
GET /api/v1/settings
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Platform settings retrieved successfully",
  "data": {
    "platformFee": {
      "percentage": 15,
      "type": "PERCENTAGE",
      "enabled": true
    },
    "payout": {
      "minimumAmount": 1000,
      "processingDays": 7,
      "maxPendingPayouts": 5
    },
    "payment": {
      "currency": "BDT",
      "taxPercentage": 0,
      "gateway": "PAYSTATION"
    },
    "general": {
      "platformName": "Justice",
      "supportEmail": "support@justice.com",
      "supportPhone": "+8801700000000",
      "maintenanceMode": false,
      "allowNewGuideRegistrations": true
    },
    "socialLinks": {
      "facebook": "https://facebook.com/justice",
      "twitter": "https://twitter.com/justice",
      "instagram": "https://instagram.com/justice",
      "linkedin": "https://linkedin.com/company/justice",
      "youtube": "https://youtube.com/justice"
    },
    "contacts": {
      "address": "Dhaka, Bangladesh",
      "phone": "+8801700000000",
      "email": "contact@justice.com",
      "supportEmail": "support@justice.com",
      "supportPhone": "+8801700000000",
      "businessHours": "Saturday - Thursday: 9:00 AM - 6:00 PM"
    },
    "seo": {
      "metaTitle": "Justice - Your Legal Platform",
      "metaDescription": "Find legal consultation and services on Justice platform",
      "metaKeywords": "legal, consultation, lawyer, justice"
    },
    "whatsapp": {
      "clientNumber": "+8801700000001",
      "lawyerNumber": "+8801700000002"
    },
    "homePageCards": {
      "instantConsultationCard": {
        "image": "https://cloudinary.com/..."
      },
      "popularSpecialistCard": {
        "image": "https://cloudinary.com/..."
      }
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### PATCH /api/v1/settings
Update platform settings (SUPER_ADMIN only).

**Requirements:**
- Authentication: Required (Bearer token)
- Role: SUPER_ADMIN
- Content-Type: application/json

**Request:**
```bash
PATCH /api/v1/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "general": {
    "platformName": "Justice Bangladesh",
    "supportPhone": "+8801800000000"
  },
  "payment": {
    "taxPercentage": 5,
    "gateway": "BOTH"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Platform settings updated successfully",
  "data": { /* Updated settings object */ }
}
```

**Error Responses:**

400 Bad Request (Empty body):
```json
{
  "success": false,
  "message": "Request body cannot be empty"
}
```

403 Forbidden (Insufficient permissions):
```json
{
  "success": false,
  "message": "You are not permitted to view this route!!!"
}
```

### Settings Structure

#### platformFee
Configuration for platform commission on transactions.
```typescript
{
  percentage: number;      // 0-100
  type: 'PERCENTAGE' | 'FIXED';
  enabled: boolean;
}
```

#### payout
Payout rules for service providers.
```typescript
{
  minimumAmount: number;   // Minimum withdrawal amount
  processingDays: number;  // Expected processing time
  maxPendingPayouts: number; // Max concurrent payouts
}
```

#### payment
Payment processing configuration.
```typescript
{
  currency: string;        // Default currency (BDT)
  taxPercentage: number;   // VAT/Tax percentage (0-100)
  gateway: 'PAYSTATION' | 'STRIPE' | 'BOTH';
}
```

#### general
General platform settings.
```typescript
{
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  allowNewGuideRegistrations: boolean;
}
```

#### socialLinks
Social media platform URLs.
```typescript
{
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
}
```

#### contacts
Company contact information.
```typescript
{
  address: string;
  phone: string;
  email: string;
  supportEmail: string;
  supportPhone: string;
  businessHours: string;
}
```

#### seo
SEO metadata for web pages.
```typescript
{
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}
```

#### whatsapp
WhatsApp contact numbers for different user types.
```typescript
{
  clientNumber: string;
  lawyerNumber: string;
}
```

#### homePageCards
Dynamic images for mobile app home page.
```typescript
{
  instantConsultationCard: {
    image: string; // Cloudinary URL
  };
  popularSpecialistCard: {
    image: string; // Cloudinary URL
  };
}
```

## File Descriptions

### settings.route.ts
Routes configuration for settings endpoints.
- GET / → getPlatformSettings (public)
- PATCH / → updatePlatformSettings (SUPER_ADMIN only)

### settings.controller.ts
Request handlers for settings endpoints.
- Validates SUPER_ADMIN role on PATCH requests
- Checks for empty request bodies
- Delegates business logic to service layer

### settings.service.ts
Business logic for settings management.
- `getPlatformSettings()` - Fetches settings, creates defaults if not exist
- `updatePlatformSettings()` - Updates settings with deep merge for nested objects
- `calculatePlatformFee()` - Calculates transaction fees based on settings

### settings.model.ts
Mongoose schema and model for settings.
- Defines all field types and defaults
- No required constraints (allows partial updates)
- Supports min/max validation on numeric fields
- Supports enum validation on type fields

### settings.interface.ts
TypeScript interface for settings structure.
- Defines all field types and nested structures
- Exported for use in controllers and services

### settings.validation.ts
Zod schema for request validation.
- Uses `z.object({}).passthrough()` for flexibility
- Accepts any payload structure
- Allows partial updates to any field combination

## Database

### Collection: platformsettings
Single document collection storing all platform-wide settings.

**Indexes:**
- Automatically indexed on `_id`
- No additional indexes needed (singleton pattern)

### Sample Document:
```json
{
  "_id": "ObjectId(...)",
  "platformFee": {
    "percentage": 15,
    "type": "PERCENTAGE",
    "enabled": true
  },
  "payout": {
    "minimumAmount": 1000,
    "processingDays": 7,
    "maxPendingPayouts": 5
  },
  "payment": {
    "currency": "BDT",
    "taxPercentage": 0,
    "gateway": "PAYSTATION"
  },
  "general": {
    "platformName": "Justice",
    "supportEmail": "support@justice.com",
    "supportPhone": "+8801700000000",
    "maintenanceMode": false,
    "allowNewGuideRegistrations": true
  },
  "socialLinks": {
    "facebook": "",
    "twitter": "",
    "instagram": "",
    "linkedin": "",
    "youtube": ""
  },
  "contacts": {
    "address": "Dhaka, Bangladesh",
    "phone": "+8801700000000",
    "email": "contact@justice.com",
    "supportEmail": "support@justice.com",
    "supportPhone": "+8801700000000",
    "businessHours": "Saturday - Thursday: 9:00 AM - 6:00 PM"
  },
  "seo": {
    "metaTitle": "Justice - Your Legal Platform",
    "metaDescription": "Find legal consultation on Justice",
    "metaKeywords": "legal, consultation, lawyer"
  },
  "whatsapp": {
    "clientNumber": "",
    "lawyerNumber": ""
  },
  "homePageCards": {
    "instantConsultationCard": {
      "image": ""
    },
    "popularSpecialistCard": {
      "image": ""
    }
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## Authentication

### Token-Based Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Role-Based Access Control
Settings updates require SUPER_ADMIN role:
```typescript
// User roles
enum ERole {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Can update settings
  CLIENT = 'CLIENT',             // Can only read
  LAWYER = 'LAWYER'              // Can only read
}
```

## Error Handling

### Custom Errors
All errors are handled through the global error handler middleware:
- **400 Bad Request**: Invalid data or validation errors
- **403 Forbidden**: Insufficient permissions or missing token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "errorSources": [
    {
      "path": "field.name",
      "message": "Specific validation error"
    }
  ]
}
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation Steps
```bash
# Clone repository
git clone <repository>
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Compile TypeScript
npm run build

# Start development server
npm run dev

# Or start production server
npm start
```

### Environment Variables
```
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/justice
JWT_ACCESS_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Scripts

```bash
# Development
npm run dev          # Start with ts-node
npm run build        # Compile TypeScript to JavaScript
npm run build:watch  # Watch mode compilation

# Production
npm start            # Run compiled JavaScript

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## API Examples

### cURL Examples

**Get Settings:**
```bash
curl -X GET https://api.example.com/api/v1/settings
```

**Update Settings (Requires SUPER_ADMIN):**
```bash
curl -X PATCH https://api.example.com/api/v1/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "general": {
      "platformName": "Justice Bangladesh"
    },
    "payment": {
      "taxPercentage": 10
    }
  }'
```

### JavaScript/Fetch Examples

```javascript
// Get settings
const settings = await fetch('/api/v1/settings')
  .then(r => r.json());

// Update settings
const updated = await fetch('/api/v1/settings', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    general: {
      supportPhone: '+8801800000000'
    }
  })
}).then(r => r.json());
```

## Best Practices

### Partial Updates
Always use PATCH for partial updates. The service layer handles deep merging:
```javascript
// Only update specific fields
PATCH /api/v1/settings
{
  "general": { "supportPhone": "+8801800000000" }
}
// Other fields remain unchanged
```

### Data Validation
- Client-side: Validate before sending
- Server-side: Zod schema validates structure
- MongoDB: Type and constraint validation
- Business Logic: Service layer validates business rules

### Performance
- Settings are cached in memory by consuming services
- Only one settings document per platform
- No N+1 queries or inefficiencies

### Security
- All updates require SUPER_ADMIN role
- Token-based authentication
- No sensitive data in error messages
- HTTPS enforced in production

## Troubleshooting

### 400 Bad Request on PATCH
- Ensure request body is not empty
- Check JSON is valid
- Verify all types match schema

### 403 Forbidden
- Check Authorization header contains valid Bearer token
- Verify user has SUPER_ADMIN role
- Token may be expired, re-login to get new token

### 500 Internal Server Error
- Check MongoDB connection
- Review backend logs
- Ensure environment variables are set correctly

## Related Files

### Admin Dashboard
- Frontend: `/admin/app/dashboard/settings/page.tsx`
- Settings page for managing all configurations
- Image upload integration with Cloudinary

### Documentation
- `/SETTINGS_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `/TROUBLESHOOTING_GUIDE.md` - Detailed troubleshooting guide

## Testing

Currently no automated tests. Consider adding:
- Unit tests for service layer
- Integration tests for API endpoints
- E2E tests for user flows

## Future Enhancements

1. **Audit Trail**: Log all settings changes with timestamps and user info
2. **Settings History**: Maintain version history of settings
3. **Bulk Operations**: Import/export settings
4. **Settings Presets**: Save and load common configurations
5. **Real-time Sync**: WebSocket updates for live settings changes
6. **Feature Flags**: Toggle features via settings
7. **A/B Testing**: Settings variants for testing

## License

[License information here]

## Support

For issues or questions:
1. Check troubleshooting guide
2. Review backend logs
3. Check browser console for frontend errors
4. Contact development team

---

**Last Updated**: July 16, 2026
**Version**: 1.0.0
**Status**: Production Ready
