# Windows 安装指南

## 🔧 问题：'pip' 不是内部或外部命令

在 Windows 上，如果直接运行 `pip` 命令失败，可以尝试以下方法：

## 方法 1：使用 `python -m pip`（推荐）

```bash
# 检查 Python 是否安装
python --version

# 使用 python -m pip 安装依赖
python -m pip install -r scripts/requirements.txt

# 或者使用 py 命令（如果安装了 Python Launcher）
py -m pip install -r scripts/requirements.txt
```

## 方法 2：检查 Python 安装

1. **检查 Python 是否已安装**
   ```bash
   python --version
   # 或
   py --version
   ```

2. **如果未安装 Python**
   - 访问 https://www.python.org/downloads/
   - 下载 Python 3.8+ 版本
   - **重要：** 安装时勾选 "Add Python to PATH"

## 方法 3：使用完整路径

如果 Python 已安装但不在 PATH 中，找到 Python 安装目录：

```bash
# 常见安装路径
C:\Python39\python.exe -m pip install -r scripts/requirements.txt
# 或
C:\Users\你的用户名\AppData\Local\Programs\Python\Python39\python.exe -m pip install -r scripts/requirements.txt
```

## 方法 4：手动安装依赖

如果 pip 确实无法使用，可以手动安装每个包：

```bash
python -m pip install requests
python -m pip install beautifulsoup4
python -m pip install lxml
```

## ✅ 验证安装

安装完成后，验证是否成功：

```bash
python -c "import requests; import bs4; print('✅ 依赖安装成功')"
```

## 🚀 运行脚本

安装依赖后，运行脚本：

```bash
# 设置环境变量（PowerShell）
$env:AUTH_TOKEN="your_token_here"
$env:API_BASE_URL="https://top-care-fashion.vercel.app"

# 运行脚本
python scripts/farfetch_batch_upload.py wishlist_urls.txt
```

或者使用 CMD：

```cmd
set AUTH_TOKEN=your_token_here
set API_BASE_URL=https://top-care-fashion.vercel.app
python scripts/farfetch_batch_upload.py wishlist_urls.txt
```

## 🔍 常见问题

### 问题 1：`python` 命令也不存在

**解决：** 使用 `py` 命令（Python Launcher）：
```bash
py -m pip install -r scripts/requirements.txt
py scripts/farfetch_batch_upload.py wishlist_urls.txt
```

### 问题 2：权限错误

**解决：** 使用管理员权限运行，或添加 `--user` 参数：
```bash
python -m pip install --user -r scripts/requirements.txt
```

### 问题 3：网络问题（下载慢或失败）

**解决：** 使用国内镜像源：
```bash
python -m pip install -r scripts/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 📝 完整安装步骤（Windows）

```bash
# 1. 检查 Python
python --version

# 2. 安装依赖（使用镜像源，更快）
python -m pip install -r scripts/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 3. 验证安装
python -c "import requests, bs4; print('✅ 安装成功')"

# 4. 设置环境变量（PowerShell）
$env:AUTH_TOKEN="your_token"
$env:API_BASE_URL="https://top-care-fashion.vercel.app"

# 5. 运行脚本
python scripts/farfetch_batch_upload.py wishlist_urls.txt
```


