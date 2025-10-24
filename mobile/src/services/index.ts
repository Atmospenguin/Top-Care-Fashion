// 统一导出所有服务
export { apiClient } from './api';
export { listingsService, ListingsService } from './listingsService';
export { authService, AuthService } from './authService';
export { userService, UserService } from './userService';
export { feedbackService, FeedbackService } from './feedbackService';
export { ordersService, OrdersService } from './ordersService';

// 导出类型
export type { ApiResponse, ApiError } from '../config/api';
export type { ListingsQueryParams } from './listingsService';
export type { User, SignInRequest, SignUpRequest, AuthResponse } from './authService';
export type { UpdateProfileRequest } from './userService';
export type { Feedback, CreateFeedbackRequest } from './feedbackService';
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


