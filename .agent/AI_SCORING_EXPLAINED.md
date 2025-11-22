# AI Behavior Scoring System - How It Works

## 🧠 How Patient Behavior is Judged by AI

The AI analyzes **6 key behavioral metrics** and generates a comprehensive behavior score (0-100).

---

## 📊 The 6 Metrics That Matter

### 1. **Activity Consistency** (20 points)
**What it measures:** How regularly the patient logs in and engages

**Scoring:**
- Daily login for 7+ days: **20 points**
- 5-6 days/week: **15 points**
- 3-4 days/week: **10 points**
- 1-2 days/week: **5 points**
- No activity: **0 points**

**Patient Actions That Improve Score:**
- ✅ Log in daily
- ✅ Maintain consistent login times
- ✅ Engage with the platform regularly

---

### 2. **Task Completion Rate** (25 points)
**What it measures:** Percentage of assigned tasks completed on time

**Scoring:**
- 90-100% completion: **25 points**
- 75-89% completion: **20 points**
- 60-74% completion: **15 points**
- 40-59% completion: **10 points**
- Below 40%: **5 points**

**Patient Actions That Improve Score:**
- ✅ Complete tasks before due date
- ✅ Mark tasks as done promptly
- ✅ Communicate if task is too difficult

---

### 3. **Cognitive Performance** (20 points)
**What it measures:** Performance in brain games and cognitive exercises

**Scoring:**
- Improving trend (scores increasing): **20 points**
- Stable performance (±5%): **15 points**
- Slight decline (5-15% drop): **10 points**
- Significant decline (>15% drop): **5 points**

**Patient Actions That Improve Score:**
- ✅ Play brain games regularly
- ✅ Challenge yourself with harder levels
- ✅ Practice consistently

---

### 4. **Response Time** (15 points)
**What it measures:** How quickly patient responds to reminders and notifications

**Scoring:**
- Responds within 1 hour: **15 points**
- Responds within 4 hours: **12 points**
- Responds within 24 hours: **8 points**
- Responds after 24 hours: **4 points**

**Patient Actions That Improve Score:**
- ✅ Check notifications regularly
- ✅ Respond to caregiver messages promptly
- ✅ Acknowledge task reminders

---

### 5. **Engagement Quality** (10 points)
**What it measures:** Depth of interaction (time spent, features used)

**Scoring:**
- Uses 5+ features regularly: **10 points**
- Uses 3-4 features: **7 points**
- Uses 1-2 features: **4 points**
- Minimal engagement: **2 points**

**Patient Actions That Improve Score:**
- ✅ Explore different features (games, tasks, social)
- ✅ Spend quality time (not just quick logins)
- ✅ Engage with content meaningfully

---

### 6. **Pattern Stability** (10 points)
**What it measures:** Consistency in behavior patterns (routine)

**Scoring:**
- Highly consistent routine: **10 points**
- Mostly consistent: **7 points**
- Somewhat erratic: **4 points**
- Very unpredictable: **2 points**

**Patient Actions That Improve Score:**
- ✅ Maintain regular schedule
- ✅ Log in at similar times each day
- ✅ Create healthy habits

---

## 🎯 Total Behavior Score

**Formula:**
```
Behavior Score = Activity (20) + Tasks (25) + Cognitive (20) 
                + Response (15) + Engagement (10) + Stability (10)
                = 100 points maximum
```

---

## 📈 Score Interpretation

### 🟢 Excellent (80-100)
- **Status:** Thriving
- **AI Insight:** "Exceptional engagement! Keep up the great work!"
- **Caregiver Alert:** None (all good!)

### 🟡 Good (60-79)
- **Status:** Doing Well
- **AI Insight:** "Good progress. Consider increasing cognitive exercises."
- **Caregiver Alert:** Low priority suggestions

### 🟠 Fair (40-59)
- **Status:** Needs Attention
- **AI Insight:** "Activity declining. Schedule check-in with caregiver."
- **Caregiver Alert:** Medium priority - monitor closely

### 🔴 Poor (0-39)
- **Status:** At Risk
- **AI Insight:** "Significant decline detected. Immediate intervention recommended."
- **Caregiver Alert:** High priority - take action now

---

## 🤖 How AI Generates Personalized Insights

### Step 1: Data Collection
AI tracks every patient action:
```typescript
- Login events
- Task completions
- Game scores
- Response times
- Feature usage
- Time spent
```

### Step 2: Baseline Learning (First 14 Days)
AI learns patient's "normal":
```typescript
- Typical login time: 9:00 AM
- Average tasks/day: 3
- Preferred game: Memory Match
- Average game score: 75
- Active days/week: 6
```

### Step 3: Continuous Monitoring
AI compares current vs baseline:
```typescript
if (currentActivity < baseline * 0.7) {
  generateAlert("Activity dropped 30%");
}
```

### Step 4: Trend Analysis
AI detects patterns:
```typescript
- Last 7 days: 5 logins (down from 7)
- Task completion: 60% (down from 85%)
- Game scores: Declining trend
→ AI Insight: "Engagement decreasing - suggest check-in"
```

### Step 5: Personalized Recommendations
AI generates specific actions:
```typescript
Based on patient's data:
- "You're most active at 9 AM - schedule tasks then"
- "Memory games are your strength - try harder levels"
- "You've missed 3 tasks this week - need help?"
```

---

## 🎯 Real Example

### Patient: John Doe (Age 72, Alzheimer's)

**Week 1 Baseline:**
- Logins: 7/7 days at ~9 AM
- Tasks: 21/21 completed (100%)
- Games: 14 sessions, avg score 78
- Response time: < 2 hours
- **Behavior Score: 92/100** 🟢

**Week 2 Current:**
- Logins: 4/7 days, irregular times
- Tasks: 12/21 completed (57%)
- Games: 6 sessions, avg score 65
- Response time: > 8 hours
- **Behavior Score: 54/100** 🟠

**AI Analysis:**
```
🚨 ANOMALY DETECTED

Metrics Changed:
- Activity: -43% (20 → 11 points)
- Tasks: -68% (25 → 14 points)
- Cognitive: -17% (20 → 15 points)
- Response: -53% (15 → 7 points)

Overall Score: 92 → 54 (-41%)

AI Insight:
"Significant behavioral change detected. John's engagement 
has dropped sharply. This is unusual for him."

Suggested Actions:
1. Call John to check if he's feeling okay
2. Review recent mood entries for signs of depression
3. Simplify task assignments
4. Schedule in-person visit

Confidence: 94%
```

---

## 🔄 Dynamic Scoring in Action

### Scenario 1: Patient Improves
```
Day 1: Score 45 → AI: "Low engagement detected"
Day 7: Score 62 → AI: "Great improvement! +17 points this week"
Day 14: Score 78 → AI: "Excellent progress! You're thriving!"
```

### Scenario 2: Patient Declines
```
Day 1: Score 85 → AI: "Excellent engagement"
Day 7: Score 72 → AI: "Slight decline. Everything okay?"
Day 14: Score 58 → AI: "⚠️ Concerning trend. Caregiver notified."
```

### Scenario 3: Stable Performance
```
Day 1-30: Score 75-80 → AI: "Consistent performance. Well done!"
```

---

## 📱 Patient Actions That Trigger AI Updates

### Immediate Score Impact:
1. **Complete a task** → +1-3 points (task completion metric)
2. **Play a brain game** → +0.5-2 points (cognitive metric)
3. **Log in** → +0.5-1 point (activity metric)
4. **Respond to message** → +0.5-1 point (response metric)

### Weekly Recalculation:
- AI recalculates full score every 24 hours
- Trends updated every 7 days
- Baseline adjusted every 30 days

---

## 🎓 Key Takeaways

1. **Personalized:** Each patient has unique baseline
2. **Dynamic:** Score updates with every action
3. **Predictive:** Detects problems before they escalate
4. **Actionable:** Specific suggestions, not vague advice
5. **Transparent:** Patients see why score changed

---

## 🚀 Implementation

The AI service now:
- ✅ Tracks real patient activities
- ✅ Calculates personalized baselines
- ✅ Generates dynamic scores
- ✅ Provides specific insights
- ✅ Adapts to each patient's patterns

**Every patient gets unique AI analysis based on THEIR behavior!**
