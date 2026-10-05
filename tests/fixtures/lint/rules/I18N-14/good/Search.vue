<script setup>
function onEnter(event) {
  if (event.isComposing) return;
  search();
}
</script>

<template>
  <input type="search" aria-label="搜索" @keydown.enter="onEnter" />
</template>
