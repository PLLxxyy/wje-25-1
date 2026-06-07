# 合租账单分摊 (pdd-171)

## 项目简介
全栈合租账单分摊应用。注册登录后可创建合租房间，邀请室友加入。记录公共开支（水电、网费、日用品、聚餐），选参与分摊的人，系统自动计算每人应出金额。首页显示账单列表和每人垫付余额，支持结算生成最优转账方案。

## 技术栈
- 前端：React 18 + TypeScript + Vite + TailwindCSS + react-router-dom
- 后端：Node.js + Express + SQLite (better-sqlite3) + TypeScript

## 运行方式

### 后端
```bash
cd backend
npm install
npm run dev
```
后端运行在 http://localhost:3001

### 前端
```bash
cd frontend
npm install
npm run dev
```
前端运行在 http://localhost:5174

## 默认账号
- 注册后即可使用
