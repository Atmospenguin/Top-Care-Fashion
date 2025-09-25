-- This is an empty migration.
-- 评分聚合：按 reviewee 统计
create or replace function recompute_user_rating(p_user_id integer)
returns void language sql as $$
  update users u set
    total_reviews = (select count(*) from reviews r where r.reviewee_id = p_user_id),
    average_rating = (select avg(rating)::numeric(3,2) from reviews r where r.reviewee_id = p_user_id)
  where u.id = p_user_id;
$$;

create or replace function trg_reviews_after_insert()
returns trigger language plpgsql as $$
begin
  perform recompute_user_rating(new.reviewee_id);
  return null;
end$$;

create or replace function trg_reviews_after_delete()
returns trigger language plpgsql as $$
begin
  perform recompute_user_rating(old.reviewee_id);
  return null;
end$$;

create or replace function trg_reviews_after_update()
returns trigger language plpgsql as $$
begin
  if old.reviewee_id is distinct from new.reviewee_id then
    perform recompute_user_rating(old.reviewee_id);
  end if;
  perform recompute_user_rating(new.reviewee_id);
  return null;
end$$;

drop trigger if exists reviews_after_insert on reviews;
create trigger reviews_after_insert
after insert on reviews
for each row execute function trg_reviews_after_insert();

drop trigger if exists reviews_after_update on reviews;
create trigger reviews_after_update
after update on reviews
for each row execute function trg_reviews_after_update();

drop trigger if exists reviews_after_delete on reviews;
create trigger reviews_after_delete
after delete on reviews
for each row execute function trg_reviews_after_delete();

-- 校验评价参与者合法
create or replace function trg_reviews_before_insert()
returns trigger language plpgsql as $$
declare
  b integer; s integer;
begin
  select buyer_id, seller_id into b, s from transactions where id = new.transaction_id;
  if b is null or s is null then
    raise exception 'Invalid transaction for review';
  end if;
  if not (new.reviewer_id = b or new.reviewer_id = s) then
    raise exception 'Reviewer must be buyer or seller of the transaction';
  end if;
  if not (new.reviewee_id = b or new.reviewee_id = s) or new.reviewee_id = new.reviewer_id then
    raise exception 'Reviewee must be the counterparty';
  end if;
  return new;
end$$;

drop trigger if exists reviews_before_insert on reviews;
create trigger reviews_before_insert
before insert on reviews
for each row execute function trg_reviews_before_insert();

-- 新交易 → 自动下架 listed=false
create or replace function trg_tx_after_insert()
returns trigger language plpgsql as $$
begin
  update listings set listed = false where id = new.listing_id;
  return null;
end$$;

drop trigger if exists tx_after_insert on transactions;
create trigger tx_after_insert
after insert on transactions
for each row execute function trg_tx_after_insert();

-- 交易完成 → 标记 sold=true & sold_at=now()
create or replace function trg_tx_after_update()
returns trigger language plpgsql as $$
begin
  if (old.status is distinct from new.status) and new.status = 'COMPLETED' then
    update listings set sold = true, sold_at = now() where id = new.listing_id;
  end if;
  return null;
end$$;

drop trigger if exists tx_after_update on transactions;
create trigger tx_after_update
after update on transactions
for each row execute function trg_tx_after_update();
