

```html
<script #mesa>
  const segments = [
    {
      default: "Document Tools",
      video: "/videos/extracter.mov?hls",
      localizationKey: "documentTools"
    },
    {
      default: "3D Configurators",
      video: "/videos/linkify.mov?hls",
      localizationKey: "configurators"
    }
  ];
</script>

<segment-control 
  :for="(segment, index) in segments" 
  x-text="$t[localizationKey]" 
  @click="play(segment.video, $data); videoSelected = index" 
  :class="{selected: index == videoSelected}" />
segment.default</segment-control>
```

Gets compiled to:
```html
<div class="segment-control-container">
  <div class="segment-control" x-text="$t['documentTools']" @click="play('/videos/extracter.mov?hls', $data); videoSelected = 0" :class="{selected: videoSelected == 0}">
    Document Tools
  </div>
  <div class="segment-control" x-text="$t['configurators']" @click="play('/videos/linkify.mov?hls', $data); videoSelected = 1" :class="{selected: videoSelected == 1}">
    3D Configurators
  </div>
</div>
```