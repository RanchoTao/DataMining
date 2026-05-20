# 标普500市场结构

这是一个基于 React + Vite + Tailwind 的静态前端项目，使用本地 CSV 数据展示标普500资产的市场结构可视化。

## 线上地址

- https://ranchotao.github.io/DataMining/

## 技术栈

- React
- Vite
- TailwindCSS
- PapaParse
- Framer Motion

## 数据说明

- 源数据：`sp500_features.csv`
- 前端读取：`public/sp500_features.csv`
- 读取方式：`fetch(`${import.meta.env.BASE_URL}sp500_features.csv`)`

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 可视化说明

- 圆环态：展示统一市场空间中的初始资产分布。
- 市场结构态：展示收益率-波动率平面中的资产结构。
- 聚类：KMeans 仅用于节点颜色与同类连线。
- 连线：同一聚类内的近邻关系。
