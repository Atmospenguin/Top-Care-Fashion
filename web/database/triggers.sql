DELIMITER $$

CREATE TRIGGER after_product_insert
AFTER INSERT ON products
FOR EACH ROW
BEGIN
  UPDATE site_stats
  SET total_listings = total_listings + 1
  WHERE id = 1;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_transaction_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE site_stats
    SET total_sold = total_sold + NEW.quantity
    WHERE id = 1;
  END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE site_stats
  SET avg_rating = (
    SELECT ROUND(AVG(rating), 1) FROM reviews
  )
  WHERE id = 1;
END$$

DELIMITER ;
