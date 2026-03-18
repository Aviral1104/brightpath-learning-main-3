BRIGHTPATH LEARNING – ACCESSIBILITY & PRODUCT ENHANCEMENTS

OBJECTIVE
Enhance the platform to be inclusive, accessible, and supportive for differently-abled and neurodivergent users.

--------------------------------------------------

1. DARK / LIGHT MODE

Purpose:
Improve visual accessibility and reduce eye strain.

Features:
- Toggle between dark and light themes
- System default theme detection
- Persistent user preference
- Smooth transitions
- Accessible contrast ratios

Notes:
- Dark mode for low-light usage
- Light mode for readability
- Follow WCAG contrast standards

--------------------------------------------------

2. ADHD FOCUS TIMER

Purpose:
Help users maintain focus and build structured study habits.

Features:
- Pomodoro sessions (e.g., 25 min focus, 5 min break)
- Start / Pause / Reset controls
- Session history tracking
- Daily/weekly analytics
- Alerts (sound/visual)

Data Handling:
- Store session duration, timestamps, completion status
- Link sessions to user ID

UX Guidelines:
- Minimal distractions
- Clear timer display
- Motivation via streaks or stats

--------------------------------------------------

3. PARENT-STUDENT DATA ISOLATION (RBAC)

Purpose:
Ensure privacy and secure access.

Rules:
- Parent can access ONLY their child’s:
  - Progress
  - Feedback
  - Performance

- Parent CANNOT access:
  - Other students’ data
  - Global data

Implementation Notes:
- Map parent to student ID
- Enforce backend-level restrictions (RLS)
- Validate on frontend + backend

--------------------------------------------------

4. STUDENT COURSE ENROLLMENT

Purpose:
Allow students to control their learning path.

Features:
- Browse available courses
- Enroll in courses
- View enrolled courses
- Optional unenroll

UX Guidelines:
- Simple UI (Enroll / Leave)
- Clear categorization
- Track progress per course

--------------------------------------------------

5. ACCESSIBILITY (ARIA + A11Y)

Purpose:
Support screen readers and assistive technologies.

Features:
- ARIA labels for all interactive elements
- Keyboard navigation
- Focus indicators
- Semantic HTML usage

Standards:
- Follow WCAG 2.1
- Avoid color-only indicators
- Ensure screen reader compatibility

--------------------------------------------------

6. TEXT-TO-SPEECH (TTS)

Purpose:
Assist users with reading or visual difficulties.

Features:
- Convert on-screen text to speech
- Play / Pause / Stop controls
- Adjustable speed (if supported)
- Works across:
  - Courses
  - Assignments
  - Feedback

Integration Notes:
- Use external TTS API (API key + URL)
- Send dynamic text content
- Play returned audio

UX Guidelines:
- Manual trigger (no autoplay)
- Simple controls
- Non-intrusive design

curl --request POST \
	--url https://open-ai-text-to-speech1.p.rapidapi.com/ \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: open-ai-text-to-speech1.p.rapidapi.com' \
	--header 'x-rapidapi-key: 5778bf98b3mshfa4155bec124dbdp162247jsn250be6f18e66' \
	--data '{"model":"tts-1","input":"Today is a wonderful day","instructions":"Speak in a lively and optimistic tone.","voice":"alloy"}'

--------------------------------------------------

SUMMARY

This transforms Brightpath into:
- Accessible (ARIA, TTS, theming)
- Secure (RBAC)
- Personalized (course enrollment)
- ADHD-friendly (focus timer)