<script setup lang="ts">
import { computed, ref } from 'vue';

interface Seed {
  id: string;
  name: string;
  variety: string;
  sowFrom: string;
  pricePence: number;
  inStock: boolean;
}

const props = defineProps<{ seed: Seed; compact?: boolean }>();
const emit = defineEmits<{ (e: 'add', id: string, qty: number): void }>();

const qty = ref(1);
const price = computed(() => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(props.seed.pricePence / 100));
const label = computed(() => `${props.seed.name} (${props.seed.variety})`);

function add() {
  if (!props.seed.inStock) return;
  emit('add', props.seed.id, qty.value);
}

function onQtyKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (event.key === 'Enter') add();
}
</script>

<template>
  <article class="seed-card" :class="{ 'seed-card--compact': compact, 'is-out': !seed.inStock }">
    <header class="seed-card__header">
      <h3 class="seed-card__title">{{ seed.name }}</h3>
      <p class="seed-card__variety">{{ seed.variety }}</p>
    </header>
    <p class="seed-card__meta">Sow from {{ seed.sowFrom }} · {{ price }} a packet</p>
    <p v-if="!seed.inStock" class="seed-card__note" role="status">Out of stock until the autumn harvest is packed.</p>
    <div class="seed-card__actions">
      <label :for="`qty-${seed.id}`" class="seed-card__label">Packets</label>
      <input
        :id="`qty-${seed.id}`"
        v-model.number="qty"
        type="number"
        min="1"
        max="12"
        inputmode="numeric"
        class="seed-card__qty"
        @keydown="onQtyKeydown"
      />
      <button type="button" class="seed-card__add" :disabled="!seed.inStock" :aria-label="`Add ${label} to the basket`" @click="add">
        Add to basket
      </button>
    </div>
    <Transition name="fade">
      <p v-show="qty > 6" class="seed-card__hint">Large orders ship in two parcels.</p>
    </Transition>
  </article>
</template>

<style scoped>
.seed-card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.seed-card--compact {
  padding: var(--space-2) var(--space-3);
}

.seed-card__title {
  font: var(--type-title);
  margin: 0;
}

.seed-card__variety,
.seed-card__meta {
  color: var(--color-text-muted);
  margin: 0;
}

.seed-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seed-card__qty {
  width: 4rem;
  padding: 4px 8px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.seed-card__add {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: var(--color-action);
  color: var(--color-on-action);
  transition: background-color 150ms ease-out, color 150ms ease-out;
}

.seed-card__add:hover {
  background: var(--color-action-hover);
}

.seed-card__add:focus {
  outline: none;
}

.seed-card__add:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.seed-card__add:disabled {
  background: var(--color-disabled);
  color: var(--color-on-disabled);
  cursor: not-allowed;
}

.is-out {
  opacity: 0.85;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 100ms linear;
  }

  .fade-enter-from,
  .fade-leave-to {
    transform: none;
  }
}
</style>
