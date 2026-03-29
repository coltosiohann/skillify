-- RPC function for weekly leaderboard
-- Returns top users by XP earned in the last 7 days, aggregated in SQL
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INT DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  weekly_xp BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    pr.user_id,
    COALESCE(SUM(l.xp_reward), 0)::BIGINT AS weekly_xp
  FROM progress pr
  JOIN lessons l ON l.id = pr.lesson_id
  WHERE pr.completed_at >= NOW() - INTERVAL '7 days'
  GROUP BY pr.user_id
  ORDER BY weekly_xp DESC
  LIMIT limit_count;
$$;
