


### week-switcher.html 

```html
<types>
    <WeekYear src="../types/WeekYear.ts"/>
</types>
<props>
    <currentWeek>WeekYear</currentWeek> 
    <navigationIndex>number</navigationIndex
</props>
<script type="module" src="./weekSwitcherLogic.ts"></script>
<!-- AlpineTS needs to check types declared -->
<div class="week-switcher" x-data="{ example: null as WeekYear }">
    <button class="clickable" :class="{disabled: !canGoBack(currentWeek)}" @click="navigate(-1, $data)">
        <oicon-chevron-left/>
    </button>
    <label x-html="weekDescription(currentWeek)">@thisWeek</label>
    <button class="clickable" @click="navigate(1)">
        <oicon-chevron-right/>
    </button>
</div>
```
#### ../types/WeekYear.ts

```ts
export default interface WeekYear {
    week: number 
    year: number
}
```

#### ./weekSwitcherLogic.ts

```ts 
// Add functionality to alpine-ts so that it resolved props definition 
import {props} from "./week-switcher.html"
import WeekYear from "../types/WeekYear.ts"

export function canGoBack(current: WeekYear) {
    // ...
}

export function navigate(steps: number, data: props) {
    data.navigationIndex += steps
}
```

### meeting-booker.html

```html
<props>
    <system>string</system> 
     <!-- VS Code extension should highlight unsatisfied props ("navigationIndex" from week-switcher) -->
     <!-- So that the developer understands that this will be required by the consumer of meeting-booker.html -->
</props
<div class="meeting-booker-section" x-data="{currentWeek: {week: 0, year: 2025}}">
    <div class="header">
        <h4>Day</h3>
        <week-switcher></week-switcher>
    </div>
</div>
```

### index.html

```html
 <!-- VS code extension will complain that "navigationIndex" isnt specified -->
<body x-data="{ system: `se.octamap.linkify` }">
    <meeting-booker />
</body>
```