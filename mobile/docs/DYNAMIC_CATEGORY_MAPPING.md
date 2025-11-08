# 动态分类映射实现

## 概述

之前代码中硬编码了分类（category）映射，导致当后台添加新分类（如 `Dresses`）时，前端无法自动识别。现在已经改为**动态分类映射**系统，可以从后端API获取分类列表，并根据规则自动映射到Outfit类型。

## 实现方案

### 1. Category Service (`src/services/categoryService.ts`)

从后端API `/api/categories` 动态获取所有分类：

```typescript
// 获取所有分类
const categories = await categoryService.getCategories();

// 检查分类是否存在
const hasDresses = await categoryService.hasCategory('Dresses');

// 刷新分类列表
await categoryService.refreshCategories();
```

**特性：**
- 自动缓存分类列表
- API失败时使用fallback分类
- 支持强制刷新

### 2. Category Mapper (`src/utils/categoryMapper.ts`)

将任意分类名称映射到Outfit类型（tops, bottoms, shoes, accessories, dresses, other）：

```typescript
// 映射分类到Outfit类型
const outfitType = mapCategoryToOutfitType('Dresses'); // 返回 'dresses'

// 筛选items
const tops = filterItemsByOutfitType(items, 'tops');

// 检查分类类型
const isTop = isCategoryOfType('Tops', 'tops'); // true
```

**映射规则：**

| 关键字 | Outfit类型 | 优先级 |
|--------|-----------|--------|
| dress | dresses | 10 (最高) |
| top, shirt, tee, blouse, sweater... | tops | 5 |
| outerwear, coat, jacket... | tops | 4 |
| bottom, pant, trouser, jean... | bottoms | 5 |
| shoe, sneaker, boot... | shoes | 5 |
| accessory, bag, belt... | accessories | 5 |

**特点：**
- 基于关键字匹配（不区分大小写）
- 优先级系统（dresses优先级最高，避免被误判为tops）
- 支持精确匹配常见分类名称
- 自动处理新分类（通过关键字匹配）

### 3. 更新的文件

#### `services/aiMatchingService.ts`
- 移除硬编码的 'tops', 'bottoms', 'shoes', 'accessories'
- 使用 `filterItemsByOutfitType()` 动态筛选

#### `screens/main/BuyStack/MixMatchScreen.tsx`
- 移除 `CATEGORY_KEYWORDS` 硬编码映射
- 移除 `AI_CATEGORY_MAP` 硬编码映射
- 使用 `mapCategoryToOutfitType()` 动态映射
- 使用 `filterItemsByOutfitType()` 动态筛选
- 更新所有 `baseCategory` 比较逻辑（使用 'tops' 而不是 'Tops'）

## 如何使用

### 添加新分类

**后台添加新分类后，前端会自动支持：**

1. **如果分类名称包含关键字**（如 "Dresses" 包含 "dress"）：
   - 自动映射到对应的Outfit类型
   - 无需前端代码修改

2. **如果分类名称不包含关键字**：
   - 会映射到 'other' 类型
   - 可以更新 `categoryMapper.ts` 中的 `CATEGORY_MAPPING_RULES` 添加新规则

### 自定义映射规则

在 `src/utils/categoryMapper.ts` 中添加新规则：

```typescript
const CATEGORY_MAPPING_RULES = [
  // 新分类规则
  { keywords: ['newcategory'], type: 'tops', priority: 5 },
  // ...
];
```

### 获取分类列表

```typescript
import { categoryService } from '../src/services';

// 获取所有分类
const categories = await categoryService.getCategories();
console.log(categories); // [{ name: 'Tops', displayName: 'Tops' }, ...]

// 获取特定Outfit类型的分类
import { getCategoriesByOutfitType } from '../src/utils/categoryMapper';
const topCategories = await getCategoriesByOutfitType('tops');
```

## 支持的Outfit类型

- `tops` - 上装（包括 Tops, Outerwear, Dresses）
- `bottoms` - 下装（Bottoms）
- `shoes` - 鞋类（Footwear, Shoes）
- `accessories` - 配饰（Accessories）
- `dresses` - 连衣裙（Dresses，独立类型）
- `other` - 其他（未匹配的分类）

## 示例：Dresses支持

当后台添加 "Dresses" 分类后：

1. **自动识别**：
   - `mapCategoryToOutfitType('Dresses')` → `'dresses'`
   - 因为 "Dresses" 包含关键字 "dress"

2. **自动筛选**：
   - `filterItemsByOutfitType(items, 'dresses')` → 返回所有Dresses分类的商品

3. **在MixMatch中使用**：
   - 如果baseItem是Dresses，会显示在Tops位置（因为dresses可以归类为tops用于显示）
   - AI建议会正确识别Dresses分类的商品

## 注意事项

1. **优先级**：Dresses的优先级（10）高于Tops（5），确保 "Dresses" 不会被误判为 "Tops"

2. **兼容性**：Dresses在显示时会归类为Tops，但在分类上是独立的类型

3. **Fallback**：如果API失败，会使用fallback分类列表（包含基本分类）

4. **缓存**：分类列表会被缓存，如果需要刷新，调用 `categoryService.refreshCategories()`

## 未来改进

1. **从后端获取映射规则**：可以将映射规则存储在数据库中，从后端API获取
2. **用户自定义规则**：允许用户自定义分类映射
3. **机器学习**：使用ML模型自动分类新商品

