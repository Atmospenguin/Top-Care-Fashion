# Feed Search Fix Test Script

## Problem
When searching for "Nike" with user ID 1, only 25 items are returned instead of 28. Items 64, 71, and 486 are missing.

## Test Script
Run the test script to verify the fix:

```bash
cd web
node scripts/test-feed-search-fix.js
```

## Expected Results
- **Without user ID**: Should return 28 items (including items 64, 71, 486)
- **With user ID 1**: Should return 28 items (including items 64, 71, 486)
- **Pagination**: Should be able to access all 28 items across pages

## Current Status
❌ **Test FAILED**: Only 25 items returned with user ID 1
- Missing items: 64, 71, 486
- These items have low scores (0.0103, 0.0086, 0.0067) when no user is present
- When user preferences are applied, these items are filtered out

## Root Cause
The issue is that when a user has preferred_styles/brands, items that don't match these preferences get very low final scores. Even though we added a base score of 0.10, the combination of:
1. Low boost_norm (due to low fair_score)
2. Low search_relevance_val
3. No user preference matches
4. Brand decay (if brand_rank is high)

Results in final scores that are too low, causing these items to be sorted to the very end or filtered out entirely.

## Next Steps
1. Ensure all items that match the search query are included, regardless of user preferences
2. Adjust the scoring formula to guarantee a minimum score for all matching items
3. Consider removing or reducing brand decay for items that don't match user preferences
4. Test the fix with the test script

