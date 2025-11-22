# Quick Test Guide - AI Behavior Analysis

## 🧪 How to Test the AI Feature

### Step 1: Clear Old Data (Optional)
If you want to start fresh, clear the Firebase `activityLogs` collection.

### Step 2: Login as Patient
```
Email: john@test.com (or any patient)
Password: password123
```

**What happens:**
- ✅ Login event is logged to Firebase
- ✅ Activity count should show 1

### Step 3: Complete a Task
1. Go to Tasks page
2. Click the circle to complete a task
3. Go back to Dashboard

**What happens:**
- ✅ Task completion logged
- ✅ Activity count should increase

### Step 4: Check AI Insights (Patient View)
1. Click "AI Insights" in sidebar
2. You should see:
   - Total Activities: Shows actual count
   - Behavior patterns
   - Personalized insights

### Step 5: Check AI Monitoring (Caregiver View)
1. Logout and login as caregiver
```
Email: sarah@test.com
Password: password123
```

2. Click "AI Monitoring" in sidebar
3. Select the patient
4. You should see:
   - Login count
   - Task completion count
   - Total activities
   - AI-generated alerts (if any)

---

## 🐛 Debugging Tips

### If Activity Count is 0:

**Check Firebase Console:**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Look for `activityLogs` collection
4. Verify entries exist with:
   - `patientId`: matches user ID
   - `activityType`: "login" or "task_completed"
   - `timestamp`: recent date

**Check Browser Console:**
- Open DevTools (F12)
- Look for any errors
- Check Network tab for Firebase requests

### If All Patients Show Same Data:

This means the `patientId` filter isn't working. Check:
1. Activity logs have correct `patientId`
2. Query is using the right patient ID
3. No caching issues (hard refresh: Ctrl+Shift+R)

---

## 📊 Expected Behavior

### Active Patient (Logs in daily, completes tasks):
```
Logins: 7 (last 7 days)
Tasks: 5-10
Games: 0 (not implemented yet)
Total: 12-17 activities

AI Insights:
- "Excellent engagement!"
- "Most active at 9:00 AM"
- Behavior Score: 75-90
```

### Inactive Patient (Hasn't logged in):
```
Logins: 0
Tasks: 0
Games: 0
Total: 0 activities

AI Alerts:
- "No Activity Detected" (Critical)
- "Low Task Completion" (Warning)
```

---

## 🔧 If Still Not Working

### Force Log an Activity Manually:

Open browser console and run:
```javascript
// Get current user ID from localStorage
const userId = JSON.parse(localStorage.getItem('currentUser')).id;

// Manually log activity
fetch('https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default)/documents/activityLogs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: {
      patientId: { stringValue: userId },
      activityType: { stringValue: 'login' },
      timestamp: { timestampValue: new Date().toISOString() },
      metadata: { mapValue: { fields: {} } }
    }
  })
});
```

Or use Firebase Console to manually add a document to `activityLogs`.

---

## ✅ Success Criteria

The AI feature is working correctly when:

1. ✅ Different patients show different activity counts
2. ✅ Activity count increases when patient does actions
3. ✅ AI insights are personalized per patient
4. ✅ Alerts only show for patients with actual issues
5. ✅ Recent Activity timeline shows actual events

---

**Try logging in as different patients and doing different activities to see the AI adapt!**
