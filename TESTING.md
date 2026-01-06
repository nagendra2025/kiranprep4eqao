# Testing Guide - kiranprep4EQAO

## Manual Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Logout functionality
- [ ] Redirect to dashboard after login
- [ ] Role-based redirect (Admin vs Candidate)

### Admin Features
- [ ] Generate test with valid input
- [ ] Generate test with invalid input (validation)
- [ ] View all tests
- [ ] View test details
- [ ] View student attempts
- [ ] Review attempt details
- [ ] Add admin feedback
- [ ] Update admin feedback

### Student Features
- [ ] View available tests
- [ ] Start a test
- [ ] Answer questions
- [ ] Submit test
- [ ] View results/scorecard
- [ ] View test history
- [ ] View admin feedback

### Error Handling
- [ ] Network errors
- [ ] Invalid API responses
- [ ] Missing data
- [ ] Form validation errors
- [ ] 404 page
- [ ] Error boundary

### Edge Cases
- [ ] Empty test list
- [ ] No attempts
- [ ] Partial answers on submit
- [ ] Very long inputs
- [ ] Special characters in answers
- [ ] Concurrent test taking

## API Testing

### Test Generation
```bash
POST /api/tests/generate
{
  "source_question": "Sample question",
  "source_answer": "42",
  "explanation": "Optional"
}
```

### Submit Attempt
```bash
POST /api/attempts/{attemptId}/submit
{
  "answers": {
    "questionId1": "answer1",
    "questionId2": "answer2"
  }
}
```

## Performance Testing
- [ ] Test generation time (< 10 seconds)
- [ ] Page load times
- [ ] Large test lists
- [ ] Multiple concurrent users



