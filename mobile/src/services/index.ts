// 统一导出所有服务
export { apiClient } from './api';
export { listingsService, ListingsService } from './listingsService';
export { authService, AuthService } from './authService';
export { userService, UserService } from './userService';
export { feedbackService } from './feedbackService';
export { ordersService } from './ordersService';
export { likesService } from './likesService';
export { cartService } from './cartService';
export { messagesService } from './messagesService';
export { reviewsService } from './reviewsService';
export { reportsService } from './reportsService';
export { notificationService } from './notificationService';
export { premiumService, PremiumServiceType } from './premiumService';
export { benefitsService, BenefitsServiceType } from './benefitsService';
export { paymentMethodsService } from './paymentMethodsService';
export { NotificationHelper } from './notificationHelper';

// 导出类型
export type { ApiResponse, ApiError } from '../config/api';
export type { ListingsQueryParams, DraftListingRequest } from './listingsService';
export type { User, SignInRequest, SignUpRequest, AuthResponse } from './authService';
export type { UpdateProfileRequest } from './userService';
export type {
  Feedback,
  FeedbackType,
  FeedbackPriority,
  CreateFeedbackRequest
} from './feedbackService';
export type { 
  Order, 
  Review, 
  OrderStatus, 
  OrdersQueryParams, 
  OrdersResponse, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  CreateReviewRequest 
} from './ordersService';
export type { LikedListing, LikeStatus } from './likesService';
export type { 
  CartItem, 
  CartResponse, 
  AddToCartRequest, 
  UpdateCartItemRequest 
} from './cartService';
export type { 
  Conversation, 
  Message, 
  ConversationDetail,
  CreateConversationParams, 
  SendMessageParams 
} from './messagesService';
export type {
  Notification,
  NotificationParams
} from './notificationService';
export type {
  ReportTargetType,
  SubmitReportParams,
  SubmitReportResponse,
  UserReportSummary
} from './reportsService';
export type { UserBenefitsPayload, MixMatchUsageResult } from './benefitsService';
export type {
  PaymentMethod,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest
} from './paymentMethodsService';

