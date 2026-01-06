# Step-by-Step Verification Guide - kiranprep4EQAO

## Prerequisites Check

### Step 1: Verify Environment Setup

1. **Check `.env.local` file exists** and contains:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Verify dependencies are installed:**

   ```bash
   npm list @supabase/supabase-js openai
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   - Should start on `http://localhost:3000`
   - No errors in console

---

## Database Verification

### Step 2: Verify Supabase Database Setup

1. **Go to Supabase Dashboard** → Your Project → Table Editor

2. **Verify these tables exist:**

   - ✅ `profiles`
   - ✅ `tests`
   - ✅ `questions`
   - ✅ `attempts`
   - ✅ `responses`
   - ✅ `admin_feedback`

3. **Check Row Level Security (RLS):**

   - Go to Authentication → Policies
   - Verify RLS is enabled on all tables

4. **Test the trigger:**
   - Go to Authentication → Users
   - Create a test user (or use existing)
   - Check `profiles` table - should have auto-created profile with role 'CANDIDATE'

---

## User Setup

### Step 3: Create Test Users

1. **Create Admin User:**

   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User" → "Create new user"
   - Enter email: `admin@test.com`
   - Enter password: `Test123456`
   - Click "Create User"
   - Note the User ID

2. **Set Admin Role:**

   - Go to SQL Editor in Supabase
   - Run:
     ```sql
     UPDATE profiles
     SET role = 'ADMIN'
     WHERE email = 'admin@test.com';
     ```
   - Verify: Check `profiles` table, role should be 'ADMIN'

3. **Create Student User:**
   - Go to Authentication → Users
   - Click "Add User" → "Create new user"
   - Enter email: `student@test.com`
   - Enter password: `Test123456`
   - Click "Create User"
   - Profile should auto-create with role 'CANDIDATE'

---

## Authentication Verification

### Step 4: Test Login Flow

1. **Open browser** → `http://localhost:3000`

2. **Should redirect to `/login`** (if not logged in)

3. **Test Invalid Login:**

   - Enter wrong email/password
   - Should show error message: "Invalid email or password"
   - ✅ Error message appears

4. **Test Valid Admin Login:**

   - Email: `admin@test.com`
   - Password: `Test123456`
   - Click "Sign In"
   - ✅ Should redirect to `/admin/dashboard`
   - ✅ Should see "Admin" badge in navbar
   - ✅ Should see admin email in navbar

5. **Test Logout:**

   - Click "Logout" button
   - ✅ Should redirect to `/login`

6. **Test Valid Student Login:**
   - Email: `student@test.com`
   - Password: `Test123456`
   - Click "Sign In"
   - ✅ Should redirect to `/candidate/dashboard`
   - ✅ Should see "Student" badge in navbar

---

## Admin Functionality Verification

### Step 5: Test Generation (Admin)

1. **Login as Admin** (`admin@test.com`)

2. **Navigate to Generate Test:**

   - Click "Generate Test" card on dashboard
   - ✅ Should see form with:
     - Source Question textarea
     - Correct Answer input
     - Explanation textarea (optional)

3. **Test Form Validation:**

   - Try submitting empty form
   - ✅ Should show validation error
   - ✅ Submit button should be disabled

4. **Test with Invalid Input:**

   - Enter question less than 10 characters
   - Leave answer empty
   - ✅ Should show validation error

5. **Generate a Real Test:**

   - **Source Question:** (Paste this example)
     ```
     Solve for x: 2x + 5 = 13
     ```
   - **Correct Answer:** `4`
   - **Explanation:** (Optional) `Subtract 5 from both sides, then divide by 2`
   - Click "Generate Test"
   - ✅ Should show loading spinner
   - ✅ Should show "Generating Test..." message
   - Wait 5-10 seconds (AI generation)
   - ✅ Should show success message
   - ✅ Should redirect to `/admin/tests` after 2 seconds

6. **Verify Test Created:**
   - On tests page, should see new test card
   - ✅ Test ID visible
   - ✅ Source question preview
   - ✅ Created date/time

---

## Test Details Verification

### Step 6: View Generated Test

1. **Click "View Details"** on the test you just created

2. **Verify Test Details Page:**

   - ✅ Source question displayed
   - ✅ Correct answer displayed
   - ✅ Should see "Generated Questions (10/10)"

3. **Verify All 10 Questions:**

   - ✅ Question 1-2: Very Easy (Green badge)
   - ✅ Question 3-4: Easy-Medium (Blue badge)
   - ✅ Question 5-6: Medium (Yellow badge)
   - ✅ Question 7-8: Medium-Hard (Orange badge)
   - ✅ Question 9-10: Hard (Red badge)

4. **Check Each Question:**
   - ✅ Question text is readable
   - ✅ Correct answer displayed
   - ✅ Difficulty level shown
   - ✅ Questions are progressively harder

---

## Student Functionality Verification

### Step 7: Student Dashboard

1. **Login as Student** (`student@test.com`)

2. **Verify Dashboard:**

   - ✅ Should see "Available Tests" section
   - ✅ Should see the test you created
   - ✅ Test card shows:
     - Test ID
     - Created date
     - "Start Test" button

3. **Test History Section:**
   - ✅ Should be empty initially (or show "No attempts found")

---

## Test Taking Verification

### Step 8: Take a Test (Student)

1. **Click "Start Test"** on a test

2. **Verify Test Page:**

   - ✅ Should see "EQAO Practice Test" header
   - ✅ Progress indicator: "0/10"
   - ✅ All 10 questions displayed

3. **Answer Questions:**

   - Answer Question 1: Enter any answer (e.g., `5`)
   - ✅ Progress updates to "1/10"
   - Answer Question 2: Enter any answer (e.g., `10`)
   - ✅ Progress updates to "2/10"
   - Continue answering all 10 questions
   - ✅ Progress should show "10/10" when all answered

4. **Test Submit Validation:**

   - Try submitting with some unanswered questions
   - ✅ Should show confirmation dialog
   - Click "OK" to submit anyway

5. **Submit Test:**
   - Answer all questions (or confirm partial submission)
   - Click "Submit Test"
   - ✅ Should show loading state
   - ✅ Should redirect to results page

---

## Results Verification

### Step 9: View Test Results (Student)

1. **On Results Page, Verify:**

   - ✅ Score displayed prominently (e.g., "3/10")
   - ✅ Score color coding:
     - Green for 8-10
     - Yellow for 5-7
     - Red for 0-4
   - ✅ Encouragement message based on score

2. **Verify Question Review:**

   - For each question:
     - ✅ Question text displayed
     - ✅ Your answer shown (with red/green background)
     - ✅ Correct answer shown
     - ✅ Correct/Incorrect badge
     - ✅ Visual distinction (green border for correct, red for incorrect)

3. **Check Feedback Section:**
   - ✅ Should show "No feedback available yet" message
   - (Feedback will be added by admin)

---

## Admin Review Verification

### Step 10: Review Student Attempt (Admin)

1. **Login as Admin** (`admin@test.com`)

2. **Navigate to Attempts:**

   - Click "Review Attempts" on dashboard
   - ✅ Should see attempts table
   - ✅ Should see the student's attempt with score

3. **View Attempt Details:**

   - Click "Review →" on an attempt
   - ✅ Should see:
     - Attempt ID
     - Score (e.g., "3/10")
     - Test ID
     - Submission date

4. **Verify Question Review:**

   - ✅ All 10 questions displayed
   - ✅ Student answer vs Correct answer comparison
   - ✅ Visual indicators (green/red)

5. **Add Admin Feedback:**
   - Scroll to "Admin Feedback" section
   - Enter feedback: `Great effort! Focus on practicing linear equations.`
   - Click "Submit Feedback"
   - ✅ Should show success
   - ✅ Feedback should appear above form

---

## Feedback Verification

### Step 11: View Feedback (Student)

1. **Login as Student** (`student@test.com`)

2. **View Test History:**

   - Go to dashboard
   - Click "View Results" on completed test
   - OR go to "Test History" section
   - Click "View →" on an attempt

3. **Verify Feedback Display:**
   - ✅ Should see "Admin Feedback" section
   - ✅ Should see the feedback you added
   - ✅ Should see feedback timestamp

---

## API Verification (Optional)

### Step 12: Test API Endpoints

1. **Get Auth Token:**

   - Login as admin in browser
   - Open browser DevTools → Application → Cookies
   - Copy the `sb-<project>-auth-token` value

2. **Test Generate API:**

   ```bash
   curl -X POST http://localhost:3000/api/tests/generate \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-<project>-auth-token=<token>" \
     -d '{
       "source_question": "Test question",
       "source_answer": "42"
     }'
   ```

   - ✅ Should return test ID and questions array

3. **Test Get Tests:**
   ```bash
   curl http://localhost:3000/api/tests \
     -H "Cookie: sb-<project>-auth-token=<token>"
   ```
   - ✅ Should return array of tests

---

## Edge Cases Verification

### Step 13: Test Edge Cases

1. **Empty States:**

   - Login as student with no tests available
   - ✅ Should show "No tests available" message

2. **Network Error Simulation:**

   - Disconnect internet
   - Try to generate test
   - ✅ Should show error message
   - ✅ Should not crash

3. **Invalid Navigation:**

   - Go to `/admin/dashboard` as student
   - ✅ Should redirect to student dashboard
   - Go to `/candidate/dashboard` as admin
   - ✅ Should redirect to admin dashboard

4. **404 Page:**

   - Navigate to `/nonexistent-page`
   - ✅ Should show 404 page with "Go Home" button

5. **Long Inputs:**
   - Try entering very long text in question field
   - ✅ Should show validation error if too long

---

## Final Checklist

### ✅ Complete Verification Checklist

- [ ] Environment variables set correctly
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Admin user created and role set
- [ ] Student user created
- [ ] Login works for both roles
- [ ] Logout works
- [ ] Admin can generate test
- [ ] 10 questions generated correctly
- [ ] Questions have progressive difficulty
- [ ] Student can view available tests
- [ ] Student can start test
- [ ] Student can answer questions
- [ ] Progress indicator works
- [ ] Student can submit test
- [ ] Results page shows correct score
- [ ] Question review shows correct/incorrect
- [ ] Admin can view attempts
- [ ] Admin can add feedback
- [ ] Student can view feedback
- [ ] Error handling works
- [ ] Validation works
- [ ] 404 page works

---

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**

   - Check `.env.local` file exists
   - Restart dev server after adding variables

2. **"User not authenticated"**

   - Clear browser cookies
   - Login again

3. **"Failed to generate test"**

   - Check OpenAI API key is valid
   - Check API quota/credits

4. **"RLS policy violation"**

   - Verify user role in `profiles` table
   - Check RLS policies in Supabase

5. **Questions not generating**
   - Check OpenAI API response in browser console
   - Verify API key has credits

---

## Success Criteria

✅ **Application is fully functional if:**

- All checklist items pass
- No console errors
- All pages load correctly
- Database operations work
- AI generation completes successfully
- Feedback system works end-to-end
