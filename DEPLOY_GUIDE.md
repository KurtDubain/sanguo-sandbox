# 从零创建并部署 Vite + React + TS 项目到 Vercel 的完整流程

## 1. 初始化项目

```bash
# 在目标文件夹下创建 Vite 项目
pnpm create vite@5 . --template react-ts

# 安装依赖
pnpm install

# 安装常用库（按需选择）
pnpm add zustand                          # 状态管理
pnpm add -D tailwindcss @tailwindcss/vite # 样式

# 验证能跑
pnpm dev
```

## 2. 配置 Tailwind（如果用）

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css` 顶部加:
```css
@import "tailwindcss";
```

## 3. 开发

```bash
pnpm dev    # 开发服务器
pnpm build  # 构建检查
```

## 4. Git 初始化（用个人账号）

```bash
# 初始化
git init

# 设置个人身份（局部，不影响全局/公司配置）
git config user.name "你的GitHub用户名"
git config user.email "你的个人邮箱"

# .gitignore
cat > .gitignore << 'EOF'
node_modules
dist
.DS_Store
*.local
EOF

# 首次提交
git add .
git commit -m "初始版本"
```

## 5. 推送到 GitHub

```bash
# 1. 浏览器打开 https://github.com/new 用个人账号创建仓库
#    名称随便起，不要勾选 README/.gitignore/License

# 2. 生成 Personal Access Token:
#    https://github.com/settings/tokens/new
#    勾选 repo 权限，生成后复制 token

# 3. 推送
git remote add origin https://你的用户名:你的token@github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main

# 4. 清除 URL 中的 token
git remote set-url origin https://github.com/你的用户名/仓库名.git
```

## 6. 部署到 Vercel

1. 打开 https://vercel.com 用 GitHub 个人账号登录
2. 点 **Add New → Project**
3. 导入刚才的仓库
4. Framework 自动识别 Vite，直接点 **Deploy**
5. 约 30 秒后拿到 `xxx.vercel.app` 链接

## 7. 后续更新

```bash
# 改代码后
git add .
git commit -m "更新说明"

# 推送（需要 token）
git remote set-url origin https://用户名:token@github.com/用户名/仓库名.git
git push
git remote set-url origin https://github.com/用户名/仓库名.git

# Vercel 自动部署，同一个链接自动更新
```

## 注意事项

- 公司电脑上用 `git config`（不带 --global）设置局部身份，不影响公司配置
- Token 用完记得从 URL 清除，安全起见也可以去 GitHub Settings 删除
- Vercel 免费额度足够个人项目使用
- 每次 push 到 main 分支会自动触发部署
