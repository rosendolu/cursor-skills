# One-Click Resume Skill

## What It Does

Automatically fills job application forms on crypto exchange career pages, using browser-use MCP for automation and Pandoc MCP for resume parsing.

## Prerequisites

1. **Browser-use MCP** must be installed in Cursor settings:

    ```json
    "mcp": {
      "servers": {
        "user-browser-use": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-browser-use"]
        }
      }
    }
    ```

2. **Pandoc MCP** is attempted first for PDF parsing. It may fail if TeX Live is not installed (the Pandoc MCP's PDF backend). If it fails, the skill automatically falls back to `pymupdf` via `python3`.

3. **Resume PDF** file ready on disk

## Usage

1. Open a chat in Cursor
2. Type: "Apply to crypto exchange dev positions"
3. The skill will guide you through the process

## Workflow Summary

```
User provides resume PDF path
        ↓
AI verifies file exists
        ↓
AI converts PDF to Markdown (Pandoc MCP → /tmp/resume.md)
  → Step 1: CallMcpTool convert-contents (input_format="pdf", output_format="markdown")
  → Step 2: Read /tmp/resume.md
  → Step 3: Extract name, email, phone, GitHub, LinkedIn, skills
  → Fallback (if Pandoc fails): pymupdf via python3
        ↓
User selects exchanges (by name or number)
        ↓
For each exchange:
  → AI navigates to career page
  → User manually logs in
  → AI takes browser_snapshot to inspect form structure
  → AI searches for dev positions (browser_fill + browser_click)
  → AI opens application form
  → AI auto-fills form fields with resume data
  → AI uploads resume PDF
  → AI takes browser_snapshot to show user the filled form
  → User manually reviews and clicks SUBMIT
        ↓
AI generates application report
```

## Supported Exchanges

50 exchanges supported. See SKILL.md for the full list, categorized by:

- Greenhouse-based (standardized forms)
- Lever-based (standardized forms)
- Custom platforms (variable forms)

## Troubleshooting

| Problem                      | Solution                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| PDF conversion failed         | Use pymupdf fallback (python3) instead of Pandoc MCP      |
| Upload button not found       | Try scrolling down; some platforms hide it                  |
| Form fields not filling       | Check if page uses React/Angular; selectors may differ      |
| Captcha appeared              | User must solve manually                                    |
| Page language unexpected      | Adjust selectors for Chinese/Korean platforms              |
| Pandoc MCP not converting PDF | TeX Live not installed — use pymupdf fallback instead      |
