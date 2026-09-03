# ZaykaFood Rating Architecture

Implemented the dual star-only rating system for Restaurant and Delivery Partner.

## Changes
- **Database**:
  - Removed comment, isAnonymous, and isHidden from RestaurantReview.
  - Removed comment from DriverReview and FoodReview.
  - Removed models ReviewImage, ReviewVote, ReviewReport, and ReviewReply.
  - Added @@unique([orderId]) to both RestaurantReview and DriverReview.
- **Backend API**:
  - Rewrote /reviews/restaurant and /reviews/driver strictly for star ratings (1-5).
  - Derived estaurantId and driverId purely from the orderId to prevent frontend spoofing.
  - Implemented /delivery/ratings to return average rating, total ratings, and star distribution for the Rider Dashboard.
- **Frontend**:
  - Simplified OrderReviewPage in pps/customer-web/src/app/orders/[id]/review/page.tsx to display independent interactive star widgets without textareas.
  - Removed the inline review form from the order details page to rely on the dedicated dual-rating review page.
