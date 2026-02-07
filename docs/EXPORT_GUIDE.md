# 文档导出说明（USAGE_GUIDE.md → PDF / DOCX）

本说明面向运营/非技术人员，指导如何将 `docs/USAGE_GUIDE.md` 导出为 PDF 或 Word（DOCX）。

---

## 方式 A：使用 Pandoc（推荐，生成 PDF/DOCX）

### 1) 准备
- 在电脑上安装 Pandoc。
- 确保已获取 `docs/USAGE_GUIDE.md` 文件。

### 2) 生成 PDF
在终端中执行：
```
pandoc docs/USAGE_GUIDE.md -o docs/USAGE_GUIDE.pdf
```

### 3) 生成 Word（DOCX）
在终端中执行：
```
pandoc docs/USAGE_GUIDE.md -o docs/USAGE_GUIDE.docx
```

---

## 方式 B：使用 Word / WPS 直接打开

1. 打开 Word 或 WPS。
2. 选择「打开文件」，找到 `docs/USAGE_GUIDE.md`。
3. 打开后检查排版。
4. 使用「另存为」导出为：
   - PDF（适合发给运营/管理）
   - DOCX（适合二次编辑）

---

## 常见问题
- **无法打开 .md 文件？**
  - 可先将 `.md` 文件拖入 Word/WPS，或在“打开文件”时选择“所有文件”。
- **导出 PDF 时格式错乱？**
  - 建议使用 Pandoc 导出；或在 Word/WPS 中微调后再导出。
