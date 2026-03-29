-- Add notification preferences column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "dailyReminder": true,
  "weeklyReport": true,
  "newBadge": true,
  "streakAlert": true,
  "courseComplete": true,
  "reminderTime": "09:00"
}'::jsonb;
