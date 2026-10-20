# Boolean Expression & Truth Table Calculator

纯前端单文件的布尔表达式工具：实时把表达式渲染为逻辑符号形式，生成完整真值表与卡诺图（Karnaugh map），支持中英双语。所有计算在浏览器本地完成，表达式不会上传。

**Live**: <https://sdtgsoi.github.io/boolean_truth_table_calculator_bali/>

## 功能

- 符号化实时预览：`A and B or not C` → `A * B + C̄`（上划线记法）
- 真值表：最多 12 个变量（4096 行）
- 卡诺图：1–6 变量，格雷码排列 + 最小项编号；两种显示模式（变量分组表头 / 变量括号）
- 变量名支持 `A`、`A1`、`enable`、`carry_out` 等；括号改变优先级
- 中英双语切换（`?lang=zh` / `?lang=en`，或右上角下拉）

## 支持的运算符

| 类别 | 写法 |
|------|------|
| NOT | `not`、`!`、`~`、`¬`、后缀 `'`（`A'`） |
| AND | `and`、`&`、`&&`、`*`、`·`、`∧` |
| OR | `or`、`\|`、`\|\|`、`+`、`∨` |
| XOR | `xor`、`^`、`⊕` |
| NAND | `nand`、`↑` |
| NOR | `nor`、`↓` |
| XNOR | `xnor`、`↔`、`≡` |
| 隐式 AND | `A B`、`A(B+C)`、`A'B`（连写的 `AB` 是一个变量名） |

优先级：NOT → AND/NAND → XOR/XNOR → OR/NOR。常量 `0` 为假、`1` 为真。蕴含（`->`）暂不支持，会给出明确报错。

## 本地运行

直接用浏览器打开 `boolean_truth_table_calculator_bali.html` 即可（无需构建、无依赖）。

## 测试

```bash
node tests/run.mjs        # 需要 Chrome/Chromium；CHROME_PATH 可指定路径
```

无头 Chrome 在桌面（1280px）与移动（500px）两个视口运行 49 项断言，共 98 项检查，失败时退出码为 1。

## 文件结构

```
boolean_truth_table_calculator_bali.html   # 计算器本体（单文件应用）
index.html                                 # GitHub Pages 入口（跳转到计算器）
tests/cases.js                             # 测试用例
tests/run.mjs                              # 无头 Chrome 测试运行器
FIXLOG.md                                  # 修复日志（问题 → 根因 → 修复 → 验证）
```
