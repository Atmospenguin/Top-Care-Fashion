-- Create function to update site stats
CREATE OR REPLACE FUNCTION update_site_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update site_stats table with real-time calculations
  UPDATE site_stats
  SET
    total_users = (SELECT COUNT(*) FROM users),
    total_listings = (SELECT COUNT(*) FROM listings WHERE listed = true),
    total_sold = (SELECT COUNT(*) FROM listings WHERE sold = true),
    avg_rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM feedback WHERE rating IS NOT NULL), 4.8),
    updated_at = NOW()
  WHERE id = 1;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for users table
DROP TRIGGER IF EXISTS trigger_update_site_stats_users ON users;
CREATE TRIGGER trigger_update_site_stats_users
AFTER INSERT OR DELETE ON users
FOR EACH STATEMENT
EXECUTE FUNCTION update_site_stats();

-- Create triggers for listings table
DROP TRIGGER IF EXISTS trigger_update_site_stats_listings ON listings;
CREATE TRIGGER trigger_update_site_stats_listings
AFTER INSERT OR UPDATE OF listed, sold OR DELETE ON listings
FOR EACH STATEMENT
EXECUTE FUNCTION update_site_stats();

-- Create triggers for feedback table
DROP TRIGGER IF EXISTS trigger_update_site_stats_feedback ON feedback;
CREATE TRIGGER trigger_update_site_stats_feedback
AFTER INSERT OR UPDATE OF rating OR DELETE ON feedback
FOR EACH STATEMENT
EXECUTE FUNCTION update_site_stats();

-- Initial update to populate current stats
UPDATE site_stats
SET
  total_users = (SELECT COUNT(*) FROM users),
  total_listings = (SELECT COUNT(*) FROM listings WHERE listed = true),
  total_sold = (SELECT COUNT(*) FROM listings WHERE sold = true),
  avg_rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM feedback WHERE rating IS NOT NULL), 4.8),
  updated_at = NOW()
WHERE id = 1;
