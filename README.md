# 🚀 **Mesa – Build-Time HTML Components**  
**@octamap/mesa**  

---

Mesa is a **build-time HTML component engine** that allows you to write reusable, declarative HTML components with scoped CSS and dynamic attributes — **without requiring runtime JavaScript to render them**.  

Whether you're building a **static website**, a **micro-frontend architecture**, or simply love the elegance of HTML-first development, **Mesa empowers you to focus on your markup** while ensuring your pages remain **lightweight, SEO-friendly, and blazing fast**.  

---

## 🛠️ **What is Mesa?**

Mesa allows you to:  
1. **Write reusable HTML components**.  
2. **Use them in other HTML files**.  
3. **Automatically handle props, dynamic attributes, and scoped styles at build time**.  

Let’s dive right in!

---

## 📄 **1. Create a Component**

Define a reusable component in its own file:  

### 📂 **my-custom-button.html**
```html
<button class="close-button">
    <svg>...</svg>
</button>

<style>
.close-button {
    background: red;
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
}
</style>
```

- The `<button>` contains your markup.  
- The `<style>` block includes the scoped CSS.  

---

## 📄 **2. Use the Component in Another File**

In your main HTML file, simply use the `<my-custom-button>` tag:  

### 📂 **index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="component-styles.css">
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body>
    <h1>Welcome to Mesa</h1>
    <my-custom-button @click="exampleEvent"></my-custom-button>
</body>
</html>
```

---

## 🪄 **3. Mesa Works Its Magic at Build Time**

Mesa compiles the above into:

### 📂 **index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="component-styles.css">
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body>
    <h1>Welcome to Mesa</h1>
    <button class="close-button" @click="exampleEvent">
        <svg>...</svg>
    </button>
</body>
</html>
```

### 📂 **component-styles.css**
```css
.close-button {
    background: red;
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
}
```

✅ **Props and attributes are passed automatically.**  
✅ **Styles are extracted and scoped correctly.**  
✅ **No runtime rendering — everything happens at build time.**  

---

# ⚙️ **Features**

### 📦 **1. Static Components, Dynamic Props**
Pass attributes and dynamic bindings directly on the root element:

**index.html**
```html
<my-custom-button @click="handleClick"></my-custom-button>
```

**Build Output:**
```html
<button class="close-button" @click="handleClick">
    <svg>...</svg>
</button>
```

✅ Events (`@click`) and bindings (`x-model`) are preserved and passed correctly.  

---

### 📦 **2. Default Attribute Mapping**
If your component has an element marked as `#default`, props are mapped automatically:

**my-input.html**
```html
<div>
    <input #default class="input-field" />
</div>
```

**index.html**
```html
<my-input placeholder="Enter your email" x-model="email"></my-input>
```

**Build Output:**
```html
<div>
    <input class="input-field" placeholder="Enter your email" x-model="email" />
</div>
```

✅ Clean, predictable prop mapping.  
  
**Details**
- The root element of the component is automatically the `#default` if no other element within the component has a `#default` attribute

---

### 📦 **3. Named Slots with Target Mapping**
Map specific child elements to targets in your components:

**my-card.html**
```html
<div class="card">
    <h1 #title></h1>
    <p #content></p>
</div>
```

**index.html**
```html
<my-card>
    <title>This is the Title</title>
    <content>This is the Content</content>
</my-card>
```

**Build Output:**
```html
<div class="card">
    <h1>This is the Title</h1>
    <p>This is the Content</p>
</div>
```

✅ Clear and intuitive named slot-like behavior.  

---

### 📦 **4. Scoped Styles**
Each component’s styles are:
- **Scoped to their usage** (avoiding global CSS pollution).  
- **Automatically extracted into `component-styles.css`.**  

✅ Styles only load when they’re needed.  

---

### 📦 **5. Nested Components**
Mesa supports **nested components** seamlessly:

**nested-component.html**
```html
<div class="nested">
    <inner-component></inner-component>
</div>
```

**index.html**
```html
<nested-component></nested-component>
```

Mesa recursively processes inner components during the build phase.

✅ Fully recursive parsing and transformation.  

---

# 📚 **Getting Started**

### 1️⃣ **Install Mesa**
```bash
npm install @octamap/mesa --save-dev
```

### 2️⃣ **Configure Vite**
Update your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { Mesa } from '@octamap/mesa';

export default defineConfig({
  plugins: [
    Mesa({
        'my-custom-button': './src/components/my-custom-button.html',
        'my-card': './src/components/my-card.html'
    })
  ]
});
```

### 3️⃣ **Run Your Project**
```bash
npm run dev
```

✅ Enjoy live-reloading and build-time transformations.  

### 4️⃣ **Build for Production**
```bash
npm run build
```

✅ Your components are compiled, styles extracted, and everything is optimized.  

---

# 🚦 **Advanced Usage**

### 🔄 **Dynamic Attribute Mapping**
Use `#target` for custom mapping:

```html
<custom-input x-model="email"></custom-input>
```

### 📑 **Scoped CSS in Components**
Component-specific styles are automatically included in `component-styles.css`.  

### 🧩 **Integration with Alpine.js or HTMX**
Mesa plays nicely with lightweight JS libraries for dynamic interactions.

---

## 📦 **Defining Components Outside of `vite.config.ts`**

In larger projects or when working with shared component libraries, managing all your component mappings directly inside `vite.config.ts` can become cumbersome. **Mesa** allows you to define components in an external JavaScript or TypeScript file using the `components` function.  

This approach ensures better **separation of concerns**, easier **reusability**, and improved **readability**.

---

### 🛠️ **Step 1: Create a Components Configuration File**

Create a file to define your components, for example:  

### 📄 **components.ts**
```typescript
import { components } from "@octamap/mesa";

// Use import.meta.url to resolve absolute paths to component files
const OctamapHtmlComponents = components(import.meta.url, {
    "icon-field": "./src/icon-field.html",
    "close-button": "./src/close-button.html",
    "back-button": "./src/back-button.html",
    "head-defaults": "./src/head-defaults.html",
});

export { OctamapHtmlComponents };
```

### ✅ **Why `import.meta.url` is Necessary?**  
The `import.meta.url` ensures that **Mesa can resolve absolute paths** to your HTML component files. Without it, the plugin might struggle to correctly locate your component files, especially when working across different environments or build pipelines.

---

### 🛠️ **Step 2: Use the Configuration in `vite.config.ts`**

Import your component configuration into `vite.config.ts`:

### 📄 **vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import { Mesa } from '@octamap/mesa';
import { OctamapHtmlComponents } from './components';

export default defineConfig({
  plugins: [
    Mesa(OctamapHtmlComponents)
  ]
});
```

---

### 🧠 **How it Works**
1. The `components` function maps component names (`icon-field`, `close-button`) to their respective HTML files (`icon-field.html`, `close-button.html`).  
2. `import.meta.url` ensures **absolute paths** are resolved correctly at runtime.  
3. `vite.config.ts` references these mappings via `OctamapHtmlComponents`.  

This approach keeps your `vite.config.ts` **clean and focused** while centralizing component definitions in a separate file.

---

### 📚 **Advantages of This Approach**
✅ **Improved Maintainability:** Component mappings are easier to update and manage in one dedicated file.  
✅ **Reusability:** The configuration can be reused across different projects or environments.  
✅ **Scalability:** Large projects with hundreds of components are easier to organize.  
✅ **Clear Separation:** `vite.config.ts` remains focused on build configuration.

---

### 📦 **Example Folder Structure**

```
/src
  /components
    icon-field.html
    close-button.html
    back-button.html
    head-defaults.html
  /scripts
    components.ts     <-- Define component mappings here
vite.config.ts        <-- Reference the mappings
```

---

### 🚀 **Next Steps**
- ✅ Add new components to your `components.ts`.  
- ✅ Import and use them in your `vite.config.ts`.  
- ✅ Build and enjoy **clean, efficient, and reusable component configurations**.

This setup is perfect for **large-scale applications** or **shared component libraries**.  

---

# 📖 **Documentation & Examples**

- **Full Documentation:** [Coming Soon]  
- **Starter Templates:** [Coming Soon]  
- **Live Demo Projects:** [Coming Soon]  

---

# 🧠 **Why Mesa?**

✅ **Static-first:** Everything is rendered at build time.  
✅ **SEO-friendly:** Full markup available to crawlers.  
✅ **No runtime overhead:** Zero JavaScript parsing for rendering components.  
✅ **Scalable:** Perfect for micro-frontends and component-based architectures.  
✅ **Framework-agnostic:** Use with Alpine.js, HTMX, or vanilla JS.  

---

# ❤️ **Join the Community**
- GitHub: https://github.com/octamap/mesa


**Let’s redefine the way we build HTML components.** 🚀