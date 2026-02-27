# 任务：实现 Smart Eye 装机调试 & ODS 两大功能的完整可交互界面

## 你要做什么

基于项目文件夹中的资料，用 React + Vite 搭建一个可运行的前端项目，实现 Smart Eye 工业视觉检测软件的两大核心功能：**装机调试**和**ODS（现场调试系统）**。

## 先读这些文件

按顺序阅读，建立完整上下文：

1. **HANDOFF.md** — 所有设计决策的完整记录（流程、参数、状态、交互细节）
2. **TASK-FOR-CODE.md** — 页面结构和视觉规范
3. **Smart_Eye_装机调试与ODS交互Demo.jsx** — 已有的 React 原型代码，包含大部分组件和交互逻辑，在此基础上重构
4. **所有 .png 图片** — Figma 设计稿截图，作为 UI 视觉参考（深色主题、绿色主色调、布局比例）

## 项目结构

```
smart-eye/
├── index.html
├── package.json          # React 18 + Vite + lucide-react
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx           # 路由/页面切换
│   ├── styles/
│   │   └── global.css    # 全局样式、CSS变量、滚动条、动画
│   ├── components/       # 通用组件
│   │   ├── TopBar.jsx          # 顶部导航栏
│   │   ├── SliderControl.jsx   # 滑块控件（支持标准值参考线、标红）
│   │   ├── ActionButton.jsx    # 操作按钮（主按钮/幽灵按钮/loading态）
│   │   ├── Modal.jsx           # 弹窗
│   │   ├── Toast.jsx           # 轻提示
│   │   ├── StatusBadge.jsx     # PASS/FAIL标签
│   │   ├── RadioGroup.jsx      # 单选组
│   │   ├── ROIList.jsx         # ROI对管理列表
│   │   ├── CompareTable.jsx    # ODS偏差对比表（标准值vs当前值vs偏差）
│   │   ├── ImageArea.jsx       # 图像预览区（含叠加标注）
│   │   └── WorkpieceSVG.jsx    # 工件SVG示意图
│   ├── pages/
│   │   ├── Workbench.jsx       # 工作台首页（双卡片入口）
│   │   ├── install/            # 装机调试
│   │   │   ├── InstallPage.jsx       # 装机调试主页面（四步容器）
│   │   │   ├── PosePanel.jsx         # 第一步：位置与姿态
│   │   │   ├── ClarityPanel.jsx      # 第二步：清晰度
│   │   │   ├── BrightnessPanel.jsx   # 第三步：亮度
│   │   │   ├── ChromaPanel.jsx       # 第四步：色度
│   │   │   └── SaveModal.jsx         # 保存结果弹窗
│   │   └── ods/                # ODS
│   │       ├── ODSPage.jsx           # ODS主页面（配方选择+四步容器）
│   │       ├── RecipeSelector.jsx    # 标准配方选择界面
│   │       ├── FOVPanel.jsx          # 第一步：成像视野确定
│   │       ├── ODSClarityPanel.jsx   # 第二步：清晰度调整
│   │       ├── ODSBrightnessPanel.jsx# 第三步：亮度
│   │       └── ODSWhiteBalancePanel.jsx # 第四步：白平衡（含灰度一致性+白平衡两个子环节）
│   └── constants/
│       └── index.js            # 状态枚举、步骤定义、模拟数据
```

## 功能范围（严格按 HANDOFF.md 实现）

### 装机调试
- [ ] 工作台首页双卡片，点击进入装机调试
- [ ] 顶部四步Tab导航，带状态图标（灰色待调试/loading执行中/绿勾通过/红叉未通过）
- [ ] 面包屑路径：装机调试 > cam-line-1 / 左工位-引导 / config1
- [ ] 右上角「一键自动调试」按钮 → 确认弹窗 → 依次跑四步 → 结果总览弹窗
- [ ] 每步有独立的自动优化按钮，点击后 loading 态，1-2秒后随机 PASS/FAIL
- [ ] 四步各自的参数面板（所有滑块、单选、数值输入），参照 HANDOFF.md 中的参数表
- [ ] 图像区叠加标注随步骤切换（十字线、虚线框、ROI框）
- [ ] 亮度步骤左上角实时显示 ROI 数值
- [ ] ROI对管理：添加、显隐切换（亮度步骤可编辑，色度步骤只读+跳转链接）
- [ ] 底部三按钮：取图 | 重置 | 下一步（最后一步为「完成」）
- [ ] 保存弹窗：结果总览 + 覆盖原配方/另存为新配方
- [ ] 离开未完成时的确认弹窗

### ODS
- [ ] 进入后先显示当前设备取图 + 右侧标准配方选择列表
- [ ] 选择配方后切换为双图对比布局（左标准带锁标识，右当前设备）
- [ ] 右上角「一键评价」按钮 → 依次跑四步 → 展示偏差结果
- [ ] 每步FAIL时：指标行标红 + 相关参数滑块标红 + 红色提示图标
- [ ] 所有参数滑块带绿色标准值参考线
- [ ] 第四步分两个子环节区块（灰度一致性校验 + 白平衡调整），各自独立PASS/FAIL
- [ ] 底部四按钮：上一点位 | 标记通过 | 保存到样机配方 | 下一点位
- [ ] 点位切换时重置状态、重新取图

## 视觉规范

- 深色主题，参考设计图
- CSS变量统一管理颜色：--primary: #8bc34a; --bg: #1e1e1e; --panel: #252525; --border: #333;
- 图标全部用 lucide-react
- 字体：'PingFang SC', 'Microsoft YaHei', sans-serif
- 滑块样式自定义（绿色滑块、深色轨道）
- 参考 .png 设计图中的布局比例和间距

## 执行步骤

1. 初始化 Vite + React 项目，安装 lucide-react
2. 搭建项目结构和全局样式
3. 实现通用组件
4. 实现装机调试完整流程
5. 实现 ODS 完整流程
6. 验证所有交互状态可正常触发
7. `npm run dev` 确保能跑起来

开始吧。
