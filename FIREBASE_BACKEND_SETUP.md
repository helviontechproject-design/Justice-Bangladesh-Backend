# Backend Firebase Integration Guide

Firebase সম্পূর্ণভাবে আপনার বেকএন্ডে ইন্টিগ্রেট করা হয়েছে। এখানে সব কিছুর বিস্তারিত ব্যাখ্যা এবং ব্যবহার দেওয়া হয়েছে।

## ✅ সম্পূর্ণ করা কাজ

### 1. **Firebase Admin SDK Installation** ✓
- `firebase-admin` প্যাকেজ ইনস্টল করা হয়েছে

### 2. **.env Configuration** ✓
নিম্নলিখিত Firebase variables যোগ করা হয়েছে:
```
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY_ID=<your-firebase-private-key-id>
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
FIREBASE_CLIENT_ID=<your-firebase-client-id>
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### 3. **Firebase Config File** ✓
Location: `src/app/config/firebase.ts`
- Firebase Admin SDK ইনিশিয়ালাইজ করা হয়েছে
- Service Account credential সেটআপ করা হয়েছে

### 4. **Firebase Notification Service** ✓
Location: `src/app/services/firebase-notification.service.ts`

Features:
- একক বা মাল্টি FCM token এ notification পাঠানো
- Topic-based notifications
- Broadcast notifications
- Topic subscription/unsubscription

### 5. **User Model Update** ✓
- `fcmTokens: string[]` field যোগ করা হয়েছে
- একাধিক device এ same user login করতে পারবে

### 6. **FCM Token Endpoint** ✓
Endpoints:
- `POST /api/v1/auth/save-fcm-token` - FCM token সংরক্ষণ করুন
- `POST /api/v1/notification/save-fcm-token` - Alternative endpoint

### 7. **Notification Endpoints** ✓
Location: `src/app/modules/notification/`

---

## 📡 API Endpoints

### Authentication Routes

#### 1. Save FCM Token
```
POST /api/v1/auth/save-fcm-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "fcmToken": "device_fcm_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FCM token saved successfully!",
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "fcmTokens": ["token1", "token2"]
  }
}
```

---

### Notification Routes

#### 1. Send Notification to Specific Users (Admin/Lawyer)
```
POST /api/v1/notification/send-to-users
Authorization: Bearer <admin_or_lawyer_token>
Content-Type: application/json

{
  "userIds": ["user_id_1", "user_id_2"],
  "title": "নোটিফিকেশন শিরোনাম",
  "body": "নোটিফিকেশন বিষয়বস্তু",
  "data": {
    "screen": "CaseDetails",
    "caseId": "case_123"
  }
}
```

#### 2. Send Notification to All Users (Admin Only)
```
POST /api/v1/notification/send-to-all
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "সকল ব্যবহারকারীর জন্য ঘোষণা",
  "body": "গুরুত্বপূর্ণ আপডেট",
  "data": {
    "type": "announcement"
  }
}
```

#### 3. Send to Topic (Admin Only)
```
POST /api/v1/notification/send-to-topic
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "topic": "legal_updates",
  "title": "আইনি আপডেট",
  "body": "নতুন আইন সংক্রান্ত তথ্য",
  "data": {
    "category": "laws"
  }
}
```

#### 4. Get My Notifications
```
GET /api/v1/notification/my-notifications
Authorization: Bearer <token>
```

#### 5. Mark Notification as Read
```
PATCH /api/v1/notification/:id/read
Authorization: Bearer <token>
```

#### 6. Mark All Notifications as Read
```
PATCH /api/v1/notification/read-all
Authorization: Bearer <token>
```

#### 7. Delete Notification
```
DELETE /api/v1/notification/:id
Authorization: Bearer <token>
```

---

## 🛠️ Backend Implementation Examples

### 1. নতুন কেস তৈরি হলে notification পাঠানোর উদাহরণ

```typescript
import FirebaseNotificationService from '../services/firebase-notification.service';
import { UserModel } from '../modules/user/user.model';

// কেস তৈরির পরে
const createCase = async (caseData) => {
  // ... কেস সংরক্ষণ করুন ...
  
  // সংশ্লিষ্ট উকিলদের কাছে notification পাঠান
  const lawyers = await UserModel.find({ role: 'LAWYER' });
  const lawyerIds = lawyers.map(l => l._id.toString());
  
  const notificationService = require('../services/firebase-notification.service').default;
  await notificationService.broadcastNotification({
    title: 'নতুন কেস উপলব্ধ',
    body: `${caseData.title} - নতুন কেস যুক্ত হয়েছে`,
    userFcmTokens: Object.fromEntries(
      lawyers.map(l => [l._id.toString(), l.fcmTokens || []])
    ),
    data: {
      screen: 'CaseDetails',
      caseId: caseData._id.toString()
    }
  });
};
```

### 2. নির্দিষ্ট ব্যবহারকারীকে notification পাঠানোর উদাহরণ

```typescript
import FirebaseNotificationService from '../services/firebase-notification.service';
import { UserModel } from '../modules/user/user.model';

const notifyUser = async (userId, title, body) => {
  const user = await UserModel.findById(userId);
  
  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    console.log('User has no FCM tokens');
    return;
  }
  
  await FirebaseNotificationService.sendNotification({
    title,
    body,
    fcmTokens: user.fcmTokens,
    data: {
      userId: user._id.toString()
    }
  });
};
```

### 3. Topic-based notifications পাঠানোর উদাহরণ

```typescript
import FirebaseNotificationService from '../services/firebase-notification.service';
import { UserModel } from '../modules/user/user.model';

// সব ব্যবহারকারীকে একটি topic এ subscribe করান
const subscribeAllToTopic = async (topic) => {
  const users = await UserModel.find({ isDeleted: false });
  const allTokens: string[] = [];
  
  for (const user of users) {
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      allTokens.push(...user.fcmTokens);
    }
  }
  
  if (allTokens.length > 0) {
    await FirebaseNotificationService.subscribeToTopic(allTokens, topic);
  }
};

// Topic এ notification পাঠান
const sendToTopic = async (topic) => {
  await FirebaseNotificationService.sendNotificationToTopic({
    title: 'গুরুত্বপূর্ণ আপডেট',
    body: 'এই বিষয়ে নতুন আপডেট রয়েছে',
    topic
  });
};
```

---

## 📱 Flutter অ্যাপ থেকে Integration

### 1. Login এর পরে FCM Token পাঠান

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:lawyer_firm/helper/firebase_auth_service.dart';

void saveFcmTokenAfterLogin() async {
  try {
    String? fcmToken = await FirebaseMessaging.instance.getToken();
    
    if (fcmToken != null) {
      // আপনার API endpoints থেকে FCM token সংরক্ষণ করুন
      await saveFcmTokenToBackend(fcmToken);
    }
  } catch (e) {
    print('Error getting FCM token: $e');
  }
}

Future<void> saveFcmTokenToBackend(String token) async {
  // আপনার HTTP client ব্যবহার করুন
  // POST /api/v1/auth/save-fcm-token
  // { "fcmToken": token }
}
```

### 2. Topic এ Subscribe করুন

```dart
void subscribeTopic() async {
  try {
    await FirebaseMessaging.instance.subscribeToTopic('legal_updates');
    print('Successfully subscribed to legal_updates topic');
  } catch (e) {
    print('Error subscribing to topic: $e');
  }
}
```

---

## 🔒 নিরাপত্তা টিপস

1. **FCM Tokens সুরক্ষিত রাখুন**
   - HTTPS ব্যবহার করুন
   - Token refresh করুন নিয়মিত

2. **Firebase Security Rules (Firestore)**
   ```javascript
   match /databases/{database}/documents {
     match /notifications/{document=**} {
       allow read: if request.auth.uid == resource.data.userId;
       allow write: if request.auth.uid == resource.data.senderId;
     }
   }
   ```

3. **Admin operations সুরক্ষিত করুন**
   - শুধুমাত্র SUPER_ADMIN roles কে notification পাঠানোর অনুমতি দিন
   - Request validation করুন

4. **Sensitive data পাঠাবেন না**
   - Notification payload এ password, tokens etc. রাখবেন না
   - Data field এ শুধু IDs এবং reference রাখুন

---

## 🐛 Common Issues এবং সমাধান

### Issue 1: FCM Token undefined
**সমাধান:**
```typescript
if (!user.fcmTokens || user.fcmTokens.length === 0) {
  console.warn('User has no FCM tokens');
  return;
}
```

### Issue 2: Firebase initialization error
**সমাধান:**
```typescript
// .env এ সকল Firebase variables আছে কিনা চেক করুন
console.log('Firebase initialized:', admin.apps.length > 0);
```

### Issue 3: Notification not received
**সমাধান:**
1. Device এ Flutter app foreground এ আছে কিনা
2. FCM token valid এবং updated কিনা
3. Firebase Console এ app সঠিকভাবে configured আছে কিনা

---

## 📚 Useful Resources

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Messaging](https://firebase.flutter.dev/docs/messaging/overview)
- [FlutterFire Documentation](https://firebase.flutter.dev/)

---

**সেটআপ সম্পূর্ণ! Happy coding! 🎉**
