import { Feedback, FaqQuery, LandingContent, Product, ProductCategory, Report, Review, UserAccount } from "@/types/admin";

// Simple in-memory mock store for API routes. Resets on server restart.
// Good enough for a prototype.

let idCounter = 1000;
const uid = () => String(idCounter++);

const now = () => new Date().toISOString();

const users: UserAccount[] = [
  { id: "1", username: "alice", email: "alice@example.com", status: "active", createdAt: now() },
  { id: "2", username: "bob", email: "bob@example.com", status: "suspended", createdAt: now() },
  { id: "3", username: "charlie", email: "charlie@example.com", status: "active", createdAt: now() },
];

const categories: ProductCategory[] = [
  { id: "10", name: "Tops", description: "Shirts, T-Shirts, Blouses", createdAt: now() },
  { id: "11", name: "Bottoms", description: "Jeans, Skirts", createdAt: now() },
];

const products: Product[] = [
  { id: "200", name: "Classic Tee", description: "100% cotton", categoryId: "10", listed: true, price: 19.99, createdAt: now() },
  { id: "201", name: "Denim Jeans", description: "Slim fit", categoryId: "11", listed: true, price: 49.99, createdAt: now() },
  { id: "202", name: "Silk Blouse", description: "Elegant", categoryId: "10", listed: false, price: 59.99, createdAt: now() },
];

const reviews: Review[] = [
  { id: "300", productId: "200", author: "alice", rating: 5, comment: "Love it!", createdAt: now() },
  { id: "301", productId: "201", author: "bob", rating: 3, comment: "Okay", createdAt: now() },
];

const reports: Report[] = [
  { id: "400", targetType: "product", targetId: "200", reporter: "alice", reason: "Inappropriate content", status: "open", createdAt: now() },
  { id: "401", targetType: "user", targetId: "2", reporter: "charlie", reason: "Harassment in messages", status: "resolved", createdAt: now(), resolvedAt: now(), notes: "Warned user" },
];

const feedbacks: Feedback[] = [
  { id: "500", userEmail: "user1@example.com", message: "Great app!", createdAt: now() },
  { id: "501", userEmail: "user2@example.com", message: "Please add dark mode", createdAt: now() },
];

const faqs: FaqQuery[] = [
  { id: "600", question: "How to list a product?", answer: "Go to Sell tab.", createdAt: now(), answeredAt: now() },
  { id: "601", question: "Refund policy?", createdAt: now() },
];

let landing: LandingContent = {
  heroTitle: "Top Care Fashion",
  heroSubtitle: "A modern marketplace prototype",
  updatedAt: now(),
};

export const adminStore = {
  // Users
  listUsers: () => users,
  getUser: (id: string) => users.find((u) => u.id === id),
  setUserStatus: (id: string, status: UserAccount["status"]) => {
    const u = users.find((x) => x.id === id);
    if (!u) return null;
    u.status = status;
    return u;
  },

  // Categories
  listCategories: () => categories,
  createCategory: (data: Pick<ProductCategory, "name" | "description">) => {
    const c: ProductCategory = { id: uid(), createdAt: now(), ...data };
    categories.push(c);
    return c;
  },
  updateCategory: (id: string, data: Partial<Pick<ProductCategory, "name" | "description">>) => {
    const c = categories.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, data);
    return c;
  },
  deleteCategory: (id: string) => {
    const idx = categories.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    // Also detach from products
    for (const p of products) if (p.categoryId === id) p.categoryId = "";
    categories.splice(idx, 1);
    return true;
  },

  // Products
  listProducts: () => products,
  getProduct: (id: string) => products.find((p) => p.id === id),
  setProductListed: (id: string, listed: boolean) => {
    const p = products.find((x) => x.id === id);
    if (!p) return null;
    p.listed = listed;
    return p;
  },
  deleteProduct: (id: string) => {
    const idx = products.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    return true;
  },
  productReviews: (productId: string) => reviews.filter((r) => r.productId === productId),

  // Reports
  listReports: () => reports,

  // Feedback
  listFeedbacks: () => feedbacks,

  // FAQ
  listFaqs: () => faqs,
  answerFaq: (id: string, answer: string) => {
    const f = faqs.find((x) => x.id === id);
    if (!f) return null;
    f.answer = answer;
    f.answeredAt = now();
    return f;
  },

  // Landing
  getLanding: () => landing,
  updateLanding: (data: Partial<Pick<LandingContent, "heroTitle" | "heroSubtitle">>) => {
    landing = { ...landing, ...data, updatedAt: now() };
    return landing;
  },
};
