# 🚀 CViz — C Program Structure Visualizer 

<div align="center">

### 🔍 See Your C Code. Understand Its Structure.

**A modern web-based visualizer that transforms C source code into interactive structural representations.**

<br>

[![GitHub](https://img.shields.io/badge/GitHub-UJJWAL22625-181717?style=for-the-badge\&logo=github)](https://github.com/UJJWAL22625/CViz)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css3\&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

<br>

**📚 Compiler Design • 🌳 AST • 🔀 CFG • 📊 DFG • 🧩 CPG**

</div>

---

## ✨ What is CViz?

**CViz** is an interactive **C program structural visualization tool** designed to make complex compiler and program-analysis concepts easier to understand.

Instead of looking at hundreds of lines of C code and trying to understand its internal structure manually, CViz converts your source code into multiple visual representations.

```text
                ┌──────────────────┐
                │    C SOURCE      │
                │      CODE        │
                └────────┬─────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  LEXICAL ANALYSIS   │
              │       TOKENS        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │        PARSER       │
              └──────────┬──────────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          🌳 AST      🔀 CFG      📊 DFG
             │           │           │
             └───────────┼───────────┘
                         ▼
                    🧩 CPG
                         │
                         ▼
              ┌─────────────────────┐
              │   VISUAL ANALYSIS   │
              └─────────────────────┘
```

---

# 🎯 Why CViz?

Understanding program structure only from source code can be difficult.

CViz provides a **visual bridge between source code and program analysis**.

### Instead of this:

```text
if (x > 10)
    x = x + 1;
else
    x = x - 1;
```

### You can see:

```text
                ┌───────────┐
                │   x > 10  │
                └─────┬─────┘
                  YES │ NO
                      │
             ┌────────┴────────┐
             ▼                 ▼
        ┌──────────┐      ┌──────────┐
        │ x = x+1  │      │ x = x-1  │
        └────┬─────┘      └────┬─────┘
             │                 │
             └────────┬────────┘
                      ▼
                   EXIT
```

**Code becomes structure. Structure becomes understanding.**

---

# ⚡ Core Features

<div align="center">

|           🌳 AST          |      🔀 CFG     |      📊 DFG     |         🧩 CPG        |
| :-----------------------: | :-------------: | :-------------: | :-------------------: |
|      Syntax Structure     |   Control Flow  |    Data Flow    |     Combined Graph    |
| Understand code hierarchy | Track execution | Track variables | Analyze relationships |

</div>

---

## 🌳 01 — Abstract Syntax Tree

The **AST** represents the syntactic structure of your C program.

CViz visualizes relationships between:

* 📦 Functions
* 📌 Variables
* 🧮 Expressions
* 🔀 Conditions
* 🔁 Loops
* 📞 Function calls
* ↩️ Return statements

### Example

```text
              Function: main()
                     │
             ┌───────┴───────┐
             ▼               ▼
        Declaration       If Statement
             │               │
             ▼               ▼
          int x            x > 10
```

---

## 🔀 02 — Control Flow Graph

The **Control Flow Graph (CFG)** shows how execution moves through your program.

It helps visualize:

* Conditions
* Branches
* Loops
* Execution paths
* Entry and exit points

```text
        START
          │
          ▼
      Statement
          │
          ▼
      Condition
       /      \
     YES      NO
      │        │
      ▼        ▼
   Block A   Block B
      \        /
       \      /
        ▼    ▼
         EXIT
```

---

## 📊 03 — Data Flow Graph

The **Data Flow Graph (DFG)** focuses on how data moves through your program.

It tracks:

```text
Definition → Assignment → Usage → Condition
```

Example:

```text
     x = 10
        │
        ▼
     y = x + 5
        │
        ▼
     if (y > 10)
        │
        ▼
      printf()
```

This makes variable dependencies easier to identify.

---

## 🧩 04 — Code Property Graph

The **Code Property Graph (CPG)** combines multiple program representations into one graph.

```text
             ┌─────────────┐
             │     CPG     │
             └──────┬──────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      🌳 AST       🔀 CFG      📊 DFG
```

This provides a broader view of:

* Program structure
* Execution relationships
* Variable dependencies
* Code properties

---

# 🧠 How CViz Works

```text
┌───────────────────────┐
│    C SOURCE CODE      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   LEXICAL ANALYZER    │
│                       │
│ Keywords              │
│ Identifiers           │
│ Operators             │
│ Literals              │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│       PARSER          │
│                       │
│ Recursive Descent     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│     AST GENERATION    │
└───────────┬───────────┘
            │
      ┌─────┼─────┐
      ▼     ▼     ▼
     CFG   DFG   CPG
      │     │     │
      └─────┼─────┘
            ▼
┌───────────────────────┐
│ INTERACTIVE DISPLAY   │
└───────────────────────┘
```

---

# 🛠️ Tech Stack

<div align="center">

### Frontend

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square\&logo=html5\&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square\&logo=css3\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square\&logo=javascript\&logoColor=black)

### Visualization

![SVG](https://img.shields.io/badge/SVG-FFB13B?style=flat-square\&logo=svg\&logoColor=black)

### Architecture

**Client-Side Web Application**

</div>

---

# 📁 Project Structure

```text
CViz/
│
├── 📄 index.html
│   └── Main application interface
│
├── 🎨 style.css
│   └── UI styling and responsive design
│
├── ⚙️ app.js
│   └── Parser + Analysis + Visualization
│
└── 📖 README.md
    └── Project documentation
```

---

# 🚀 Getting Started

## 1️⃣ Clone

```bash
git clone https://github.com/UJJWAL22625/CViz.git
```

## 2️⃣ Enter the directory

```bash
cd CViz
```

## 3️⃣ Run

Open:

```text
index.html
```

in your browser.

### 💡 Recommended

Use **VS Code + Live Server** for the best development experience.

---

# 🧪 Example Input

Try entering:

```c
#include <stdio.h>

int main() {

    int a = 10;
    int b = 20;

    if (a < b) {
        printf("a is smaller");
    }

    return 0;
}
```

CViz analyzes the program and generates:

```text
       C PROGRAM
           │
           ▼
     ┌───────────┐
     │   TOKENS  │
     └─────┬─────┘
           │
           ▼
          AST
       ↙   ↓   ↘
     CFG   DFG  CPG
```

---

# 🎓 Educational Applications

CViz can be useful for students studying:

| Subject                 | Application                    |
| ----------------------- | ------------------------------ |
| 🖥️ Compiler Design     | Understand compilation stages  |
| 🔍 Program Analysis     | Analyze program structure      |
| 🌳 Data Structures      | Understand tree/graph concepts |
| 🔐 Cybersecurity        | Explore code relationships     |
| 💻 Programming          | Understand execution flow      |
| 📚 Software Engineering | Study source-code structure    |

---

# 📈 Future Roadmap

### 🔥 Planned Improvements

* [ ] Advanced C grammar support
* [ ] Syntax highlighting
* [ ] Interactive graph navigation
* [ ] Zoom & pan controls
* [ ] Graph export — PNG / SVG / PDF
* [ ] Improved parser error messages
* [ ] More C language constructs
* [ ] Code complexity analysis
* [ ] Dead-code detection
* [ ] Security-oriented code analysis
* [ ] Dark / Light theme
* [ ] Mobile optimization

---

# 🏆 Project Highlights

<div align="center">

### 💻 100% Client-Side

No backend required.

### ⚡ Lightweight

Runs directly in the browser.

### 🧠 Educational

Built for understanding program-analysis concepts.

### 🎨 Visual

Transforms complex source code into graphs.

### 🔓 Open Source

Available on GitHub.

</div>

---

# 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repository

# Create a branch
git checkout -b feature/AmazingFeature

# Commit changes
git commit -m "Add AmazingFeature"

# Push
git push origin feature/AmazingFeature
```

Then open a **Pull Request**.

---

# 📜 License

This project is developed as an academic and educational project.

See the repository for licensing information.

---

# 👨‍💻 Developer

<div align="center">

## UJJWAL KUMAR

**Computer Science Engineering • Cybersecurity**

Building tools that make complex technology easier to understand.

<br>

[![GitHub](https://img.shields.io/badge/GitHub-UJJWAL22625-181717?style=for-the-badge\&logo=github)](https://github.com/UJJWAL22625)

</div>

---

<div align="center">

### ⭐ If CViz helped you understand C program structure, consider giving it a star!

<br>

**CViz**

`Code → Structure → Visualization → Understanding`

</div>
