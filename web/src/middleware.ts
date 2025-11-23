import { type NextRequest, NextResponse } from "next/server";

// 需要认证的 API 路由列表
const PROTECTED_API_ROUTES = [
  '/api/cart',
  '/api/orders',
  '/api/profile',
  '/api/notifications',
  '/api/messages',
  '/api/conversations',
  '/api/likes',
  '/api/outfits',
  '/api/addresses',
  '/api/payment-methods',
  '/api/user/benefits',
  '/api/reports',
  '/api/listings/create',
  '/api/listings/my',
  '/api/listings/draft',
  '/api/listings/boost',
  '/api/listings/upload-image',
  // 用户相关
  '/api/users',
  // 分类和搜索
  '/api/categories',
  '/api/search',
  // Feed 和内容
  '/api/feed',
  '/api/releases',
];

// 部分需要认证的 API（某些方法需要，某些不需要）
const PARTIALLY_PROTECTED_ROUTES: Record<string, string[]> = {
  '/api/listings': ['GET', 'PATCH', 'DELETE'], // 所有方法都需要认证
};

/**
 * 检查请求是否有有效的认证 token
 */
function hasAuthToken(req: NextRequest): boolean {
  // 1. 检查 Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    // 基本格式检查：JWT token 应该是三段式 (header.payload.signature)
    if (token && token.split('.').length === 3) {
      return true;
    }
  }

  // 2. 检查 Supabase session cookie
  const supabaseAccessToken = req.cookies.get('sb-access-token');
  const supabaseRefreshToken = req.cookies.get('sb-refresh-token');
  if (supabaseAccessToken?.value || supabaseRefreshToken?.value) {
    return true;
  }

  // 3. 检查 legacy session cookie
  const legacySession = req.cookies.get('tc_session');
  if (legacySession?.value) {
    return true;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只处理 API 路由
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 检查是否是受保护的路由
  const isProtectedRoute = PROTECTED_API_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // 检查是否是部分受保护的路由
  const partiallyProtected = Object.entries(PARTIALLY_PROTECTED_ROUTES).find(
    ([route]) => pathname.startsWith(route)
  );

  // 如果是完全受保护的路由
  if (isProtectedRoute) {
    if (!hasAuthToken(req)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  // 如果是部分受保护的路由（某些 HTTP 方法需要认证）
  if (partiallyProtected) {
    const [route, methods] = partiallyProtected;
    const method = req.method;
    
    // 检查当前路径是否匹配（支持动态路由，如 /api/listings/123）
    // 但要排除已经在 PROTECTED_API_ROUTES 中的子路由（如 /api/listings/create）
    const isSubRoute = PROTECTED_API_ROUTES.some(protectedRoute => 
      pathname.startsWith(protectedRoute)
    );
    
    if (pathname.startsWith(route) && !isSubRoute) {
      // 如果请求方法需要认证
      if (methods.includes(method)) {
        if (!hasAuthToken(req)) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|api/db-status).*)",
  ],
};


