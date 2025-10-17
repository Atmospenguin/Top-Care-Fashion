# 键盘处理优化指南 (Keyboard Handling Optimization Guide)

## 🎯 目标
当用户在应用中输入文本时，输入框会自动上浮，不会被键盘遮挡。

## ✅ 已实施的修改

### 1. FilterModal 组件 (`mobile/components/FilterModal.tsx`)
**修改内容：**
- 添加 `KeyboardAvoidingView` 组件包裹 modal 内容
- 根据平台自动选择合适的行为：
  - iOS: `padding` - 向上移动内容
  - Android: `height` - 调整容器高度
- 在 ScrollView 上添加 `keyboardShouldPersistTaps="handled"` 属性

**影响的功能：**
- SearchResultScreen - 价格范围筛选输入框
- UserProfileScreen - 店铺筛选中的价格范围输入框
- MyTopScreen - 我的商店筛选中的价格范围输入框

### 2. ListingDetailScreen 报告 Modal (`mobile/screens/main/BuyStack/ListingDetailScreen.tsx`)
**修改内容：**
- 包裹报告 modal 内容的 `KeyboardAvoidingView`
- 处理报告详情文本输入框的键盘遮挡

### 3. UserProfileScreen 报告 Modal (`mobile/screens/main/BuyStack/UserProfileScreen.tsx`)
**修改内容：**
- 包裹用户报告 modal 内容的 `KeyboardAvoidingView`
- 处理报告详情文本输入框的键盘遮挡

## 📱 工作原理

### KeyboardAvoidingView
```javascript
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  style={styles.keyboardAvoidingView}
>
  {/* Modal content */}
</KeyboardAvoidingView>
```

- **iOS 行为 (padding)**: 当键盘出现时，向上添加 padding，推动内容不被键盘挡住
- **Android 行为 (height)**: 当键盘出现时，调整容器高度，通过压缩空间来容纳键盘

### keyboardShouldPersistTaps
- 值为 `"handled"` 时，允许 ScrollView 中的 TextInput 获得焦点时，ScrollView 不会自动滚动到顶部

## 🧪 测试方法

1. **FilterModal 测试：**
   - 打开搜索结果或用户店铺
   - 点击筛选按钮 → 打开筛选面板
   - 点击价格范围输入框
   - 验证：输入框不被键盘挡住，自动向上浮动

2. **报告 Modal 测试：**
   - 在商品详情或用户资料页面
   - 点击报告按钮
   - 输入报告详情
   - 验证：文本输入框始终可见，不被键盘挡住

## 📝 样式补充

新增样式：
```javascript
keyboardAvoidingView: {
  flex: 1,
  justifyContent: "flex-end",
}
```

这个样式确保 modal 保持在屏幕底部，同时当键盘出现时能够正确响应。

## ✨ 优点

✅ 用户体验改进 - 输入文本时不需要手动滚动  
✅ 跨平台兼容 - 自动适配 iOS 和 Android  
✅ 无侵入式 - 无需修改现有的业务逻辑  
✅ 性能友好 - 使用 React Native 内置组件，无额外开销  

## 🔍 注意事项

- 确保所有模态框中包含 TextInput 的地方都使用了 `KeyboardAvoidingView`
- ScrollView 中包含 TextInput 时，记得添加 `keyboardShouldPersistTaps="handled"`
- 在自定义输入框组件时遵循相同的模式
