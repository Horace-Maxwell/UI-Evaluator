<script setup lang="ts">
import { ref } from 'vue';
import SeedCard from './SeedCard.vue';

const seeds = ref([
  { id: 'carrot-autumn-king', name: 'Carrot', variety: 'Autumn King 2', sowFrom: 'March', pricePence: 245, inStock: true },
  { id: 'bean-cobra', name: 'Climbing bean', variety: 'Cobra', sowFrom: 'May', pricePence: 295, inStock: false },
]);
const basket = ref<Record<string, number>>({});
const filter = ref('');

function onAdd(id: string, qty: number) {
  basket.value[id] = (basket.value[id] ?? 0) + qty;
}
</script>

<template>
  <section class="seed-list" aria-labelledby="seed-list-title">
    <h2 id="seed-list-title">Seeds to sow this month</h2>
    <label for="seed-filter">Filter by name</label>
    <input id="seed-filter" v-model.trim="filter" type="search" placeholder="carrot, bean…" />
    <ul class="seed-list__items">
      <li v-for="seed in seeds.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))" :key="seed.id">
        <SeedCard :seed="seed" @add="onAdd" />
      </li>
    </ul>
    <p v-if="Object.keys(basket).length" role="status">{{ Object.values(basket).reduce((a, b) => a + b, 0) }} packets in the basket</p>
  </section>
</template>

<style scoped>
.seed-list__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-4);
  padding: 0;
  list-style: none;
}
</style>
