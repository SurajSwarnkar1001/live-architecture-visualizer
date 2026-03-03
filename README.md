# 🏗️ Live Architecture Visualizer

**Scan any Node.js / Express / MongoDB workspace and render a LIVE, interactive architecture diagram inside VS Code — updating in real-time as files change.**

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/surajswarnkar20011118.live-architecture-visualizer?color=blue&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=surajswarnkar20011118.live-architecture-visualizer)

---

## ✨ Features

- **🔍 Auto-Scan** — Automatically scans all `.js` and `.ts` files in your workspace using Babel AST parsing
- **📊 Live Graph** — Renders an interactive dependency graph using Cytoscape.js with dagre layout
- **⚡ Real-Time Updates** — File watcher detects changes and rebuilds the graph instantly on save
- **🎨 Node Types** — Color-coded nodes for Routes, Controllers, Services, Models, Middleware, and more
- **🔁 Circular Dependency Detection** — Highlights circular imports in red with DFS-based detection
- **📋 Table View** — Toggle between Graph View and a clean Data Table for large projects
- **🤖 AI Explanations** — Double-click any node to get an AI-powered explanation via GitHub Copilot
- **🖱️ Quick Navigation** — Right-click on a node to open the file instantly in VS Code
- **📤 Export** — Export the architecture diagram as PNG or JSON

---

## 🚀 Getting Started

### Option 1: Right-Click (Easiest)
Right-click anywhere in the **Explorer panel** or inside any **open file** and select:
> **Open Architecture Visualizer**

### Option 2: Command Palette
Press `Ctrl+Shift+P` and search for:
> **Live Arch Viz: Open Architecture Visualizer**

---

## 🎯 How It Works

```
Workspace Files (.js/.ts)
        ↓
  Babel AST Parser
        ↓
  Import Resolver + Pattern Detector
        ↓
  Graph Builder (Nodes + Edges)
        ↓
  Circular Detector + Complexity Scorer
        ↓
  Cytoscape.js Webview (Live Diagram)
```

---

## 🖱️ Interactions

| Action | Result |
|--------|--------|
| **Hover** over a node | Tooltip with file details and complexity score |
| **Click** a node | Highlights that node and its connections |
| **Double-click** a node | AI explanation via GitHub Copilot |
| **Right-click** a node | Opens the file in VS Code editor |
| **Search box** | Fuzzy search to highlight matching nodes |
| **Toggle Table View** | Switches between graph and sortable data table |
| **Export PNG** | Saves the diagram as an image |
| **Export JSON** | Saves the full graph as structured JSON |

---

## ⚙️ Configuration

Go to **Settings** (`Ctrl+,`) and search for `liveArchViz`:

| Setting | Default | Description |
|---------|---------|-------------|
| `liveArchViz.exclude` | `node_modules, dist, build...` | Glob patterns to exclude from scanning |
| `liveArchViz.maxFileSizeKb` | `1000` | Max file size to parse (in KB) |
| `liveArchViz.enableAI` | `true` | Enable AI node explanations via Copilot |

---

## 🎨 Node Color Legend

| Color | Node Type |
|-------|-----------|
| 🟠 Orange | Entry Point |
| 🔵 Blue | Controller |
| 🟢 Green | Service |
| 🟣 Purple | Model (Mongoose) |
| 🩵 Teal | Route |
| 🔴 Red (border) | Circular Dependency |
| ⚫ Dashed (border) | Unused Module |

---

## 📋 Requirements

- VS Code `^1.85.0`
- A Node.js / Express / MongoDB project workspace

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT
