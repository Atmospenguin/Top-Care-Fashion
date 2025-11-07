# 🏁 Rename "Report" to "Flag" - Complete Summary

## 背景
老师建议将 "Report" 改为 "Flag"，因为 "Report" 听起来不太好。

## 修改内容

### **1. 移动端文件重命名**

#### **Screen**
- ❌ 删除: `mobile/screens/main/MyTopStack/ReportScreen.tsx`
- ✅ 创建: `mobile/screens/main/MyTopStack/FlagScreen.tsx`

#### **Service**
- ❌ 删除: `mobile/src/services/reportsService.ts`
- ✅ 创建: `mobile/src/services/flagsService.ts`

### **2. 类型和接口重命名**

**从 `reportsService.ts` 到 `flagsService.ts`:**
- `ReportTargetType` → `FlagTargetType`
- `SubmitReportParams` → `SubmitFlagParams`
- `SubmitReportResponse` → `SubmitFlagResponse`
- `UserReportSummary` → `UserFlagSummary`
- `ReportsService` → `FlagsService`
- `reportsService` → `flagsService`
- `getMyReports()` → `getMyFlags()`
- `submitReport()` → `submitFlag()`
- `normalizeReport()` → `normalizeFlag()`

### **3. 变量和状态重命名**

#### **ListingDetailScreen.tsx**
- `reportModalVisible` → `flagModalVisible`
- `reportDetails` → `flagDetails`
- `isSubmittingReport` → `isSubmittingFlag`
- `handleReport` → `handleFlag`
- `handleSubmitReport` → `handleSubmitFlag`
- `handleCancelReport` → `handleCancelFlag`
- `reportedUsername` → `flaggedUsername`
- `reportedListingId` → `flaggedListingId`

#### **UserProfileScreen.tsx**
- `reportModalVisible` → `flagModalVisible`
- `reportDetails` → `flagDetails`
- `isSubmittingReport` → `isSubmittingFlag`
- `handleReport` → `handleFlag`
- `handleSubmitReport` → `handleSubmitFlag`
- `handleCancelReport` → `handleCancelFlag`
- `reportButton` (styles) → `flagButton`
- `reportedUsername` → `flaggedUsername`

#### **FlagScreen.tsx**
- `reports` → `flags`
- `fetchReports` → `fetchFlags`
- `reportCard` (styles) → `flagCard`
- `reportTitle` (styles) → `flagTitle`
- `reportId` (styles) → `flagId`

### **4. UI 文本更新**

#### **页面标题**
- "My Reports" → "My Flags"
- "Report Listing" → "Flag Listing"
- "Report User" → "Flag User"

#### **按钮和标签**
- "Report" → "Flag"
- "Submit Report" → "Submit Flag"
- "Report Submitted" → "Flag Submitted"
- "Select Report Category" → "Select Flag Category"
- "Report Details" → "Flag Details"

#### **提示和消息**
- "Please fill in report details" → "Please fill in flag details"
- "Please describe your reason for reporting..." → "Please describe your reason for flagging..."
- "Unable to submit report for this listing" → "Unable to submit flag for this listing"
- "Unable to submit report for this user" → "Unable to submit flag for this user"
- "Failed to submit report" → "Failed to submit flag"
- "Track the reports you've submitted" → "Track the flags you've submitted"
- "Loading your reports…" → "Loading your flags…"
- "Unable to load your reports right now" → "Unable to load your flags right now"
- "No reports yet" → "No flags yet"
- "When you submit a report" → "When you submit a flag"
- "Report submitted" → "Flag submitted"

### **5. 导航配置更新**

**MyTopStack/index.tsx:**
- Import: `ReportScreen` → `FlagScreen`
- ParamList: `Report: undefined` → `Flag: undefined`
- Screen: `<Stack.Screen name="Report" component={ReportScreen} />` → `<Stack.Screen name="Flag" component={FlagScreen} />`

**SettingScreen.tsx:**
- Label: "My Reports" → "My Flags"
- Navigation: `navigation.navigate("Report")` → `navigation.navigate("Flag")`

### **6. 服务导出更新**

**services/index.ts:**
```typescript
// Before
export { reportsService } from './reportsService';
export type {
  ReportTargetType,
  SubmitReportParams,
  SubmitReportResponse,
  UserReportSummary
} from './reportsService';

// After
export { flagsService } from './flagsService';
export type {
  FlagTargetType,
  SubmitFlagParams,
  SubmitFlagResponse,
  UserFlagSummary
} from './flagsService';
```

### **7. 后端 API 更新**

**web/src/app/api/reports/route.ts:**
- 错误消息: "Failed to load reports" → "Failed to load flags"
- 错误消息: "Please include a category or provide report details" → "Please include a category or provide flag details"
- 错误消息: "Failed to submit report" → "Failed to submit flag"

**注意**: 
- 数据库表名 `reports` 保持不变
- API 端点 `/api/reports` 保持不变
- 内部字段名（如 `target_type`, `reporter`, `reason`）保持不变
- 只更新了用户可见的错误消息

### **8. 样式命名更新**

**ListingDetailScreen.tsx & UserProfileScreen.tsx:**
- CSS 注释: `// Report Modal Styles` → `// Flag Modal Styles`
- Style key: `reportButton` → `flagButton`
- Style key: `reportCard` → `flagCard`
- Style key: `reportTitle` → `flagTitle`
- Style key: `reportId` → `flagId`

## 修改的文件列表

### **移动端 (Mobile)**
1. ❌ `mobile/screens/main/MyTopStack/ReportScreen.tsx` (删除)
2. ✅ `mobile/screens/main/MyTopStack/FlagScreen.tsx` (新建)
3. ❌ `mobile/src/services/reportsService.ts` (删除)
4. ✅ `mobile/src/services/flagsService.ts` (新建)
5. ✏️ `mobile/src/services/index.ts` (修改)
6. ✏️ `mobile/screens/main/MyTopStack/index.tsx` (修改)
7. ✏️ `mobile/screens/main/MyTopStack/SettingScreen.tsx` (修改)
8. ✏️ `mobile/screens/main/BuyStack/ListingDetailScreen.tsx` (修改)
9. ✏️ `mobile/screens/main/BuyStack/UserProfileScreen.tsx` (修改)

### **后端 (Web)**
10. ✏️ `web/src/app/api/reports/route.ts` (修改错误消息)

## 测试清单

### **功能测试**
- [ ] 从商品详情页 Flag 商品
- [ ] 从用户资料页 Flag 用户
- [ ] 在 Settings → My Flags 查看已提交的 flags
- [ ] 查看 flag 的状态更新 (In review, Resolved, Dismissed)
- [ ] 刷新 My Flags 列表

### **导航测试**
- [ ] Settings → My Flags 导航正常
- [ ] My Flags 页面返回按钮正常
- [ ] 提交 flag 后关闭 modal 正常

### **UI 测试**
- [ ] 所有文本显示为 "Flag" 而不是 "Report"
- [ ] Modal 标题正确显示
- [ ] 按钮文本正确显示
- [ ] 空状态消息正确显示

## 影响范围

### **用户可见变化**
- ✅ 所有 "Report" 文本变为 "Flag"
- ✅ 功能保持完全一致，只是名称改变

### **不受影响的部分**
- ✅ 数据库结构不变
- ✅ API 端点不变
- ✅ 数据格式不变
- ✅ 现有数据兼容

## 注意事项

1. **数据库保持不变**: 虽然前端改为 "Flag"，但数据库表名仍为 `reports`，以保持向后兼容性
2. **API 端点保持不变**: `/api/reports` 端点名称未改变，只更新了错误消息
3. **类型兼容**: 所有新类型与旧 API 响应格式兼容
4. **渐进式更新**: 前端可以独立更新，不需要同步更新后端数据库

## 完成状态

✅ 所有 8 个任务已完成：
1. ✅ 重命名 ReportScreen.tsx 为 FlagScreen.tsx
2. ✅ 重命名 reportsService.ts 为 flagsService.ts 并更新内部所有 report -> flag
3. ✅ 更新 ListingDetailScreen.tsx 中的 report 相关变量和文本
4. ✅ 更新 UserProfileScreen.tsx 中的 report 相关变量和文本
5. ✅ 更新 SettingScreen.tsx 中的 'My Reports' 为 'My Flags'
6. ✅ 更新 MyTopStack/index.tsx 导航配置
7. ✅ 更新 services/index.ts 导出
8. ✅ 更新后端 API route.ts 注释和错误消息

🎉 所有修改已完成，应用现在使用 "Flag" 而不是 "Report"！

