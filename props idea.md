```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
    <defs>
        <clipPath :id="clipPathId">
            <circle cx="25" cy="25" r="25" />
        </clipPath>
    </defs>
    <template x-if="img">
        <image :href="img" x="0" y="0" height="50" width="50" :clip-path="`url(#${clipPathId})`" />
    </template>
    <template x-if="!img">
        <ellipse cx="50%" cy="50%" rx="25" ry="25" :fill="backgroundColor(id)" />
        <text x-if="firstCharacter(name)" x="50%" y="50%" class="character-root-icon" text-anchor="middle"
            dominant-baseline="middle" x-html="firstCharacter(name)">
        </text>
    </template>
</svg>

<props>
    <name>string</name>
    <id>string</id>
    <img>img</img>
</props>

<script>
    
    function firstCharacter(name) {
        return name.charAt(0).toUpperCase()
    }

    function backgroundColor(id) {
        return getColorForId(id)
    }

    function getColorForId(id) {
        const colors = [
            "5566ED",
            "5599ED",
            "9955ED",
            "EDA655",
            "ED8055",
            "ED5578",
            "6C55ED",
            "DC9D78",
            "4B9D78",
            "FA7456",
        ];

        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return `#${colors[index]}`;
    }

    const clipPathId = `clipCircle-${props.id}`;

</script>

<style>
    .character-root-icon {
        fill: var(--om-content-background);
        font-size: 140%;
        transform: translateY(2.8px);
    }
</style>

```

Usage
```html
<head>

</head>

<body x-data="{ name: `test`, id: `someId`, img: `someUrl` }">
    <name-icon .name="name.slice(2, 0)" .id="id" .img="img"/>
</body>
```

Becomes

```html
<head>
    <!-- A package that takes care of updating variables within x-init that start with m_ for the expression stated within it -->
    <script src="https://cdn.jsdelivr.net/npm/@octamap/mesa-alpine-props/dist/index.js"></script>
    <script>

        function firstCharacter(name) {
            return name.charAt(0).toUpperCase()
        }

        function backgroundColor(id) {
            return getColorForId(id)
        }

        function getColorForId(id) {
            const colors = [
                "5566ED",
                "5599ED",
                "9955ED",
                "EDA655",
                "ED8055",
                "ED5578",
                "6C55ED",
                "DC9D78",
                "4B9D78",
                "FA7456",
            ];

            let hash = 0;
            for (let i = 0; i < id.length; i++) {
                hash = id.charCodeAt(i) + ((hash << 5) - hash);
            }

            const index = Math.abs(hash) % colors.length;
            return `#${colors[index]}`;
        }

        const clipPathId = `clipCircle-${props.id}`;

    </script>
</head>

<body x-data="{ name: `test`, id: `someId`, img: `someUrl` }">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" x-data="{ m_name_554g: `name.slice(2, 0)` }">
        <defs>
            <clipPath :id="clipPathId">
                <circle cx="25" cy="25" r="25" />
            </clipPath>
        </defs>
        <template x-if="img">
            <image :href="img" x="0" y="0" height="50" width="50" :clip-path="`url(#${clipPathId})`" />
        </template>
        <template x-if="!img">
            <ellipse cx="50%" cy="50%" rx="25" ry="25" :fill="backgroundColor(id)" />
            <text x-if="firstCharacter(m_name_554g)" x="50%" y="50%" class="character-root-icon" text-anchor="middle"
                dominant-baseline="middle" x-html="firstCharacter(m_name_554g)">
            </text>
        </template>
    </svg>
</body>
```