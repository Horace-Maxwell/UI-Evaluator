<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';

  export let units: 'metres' | 'feet' = 'metres';
  export let disabled = false;

  const dispatch = createEventDispatcher<{ change: 'metres' | 'feet' }>();
  let open = false;

  function select(next: 'metres' | 'feet') {
    units = next;
    open = false;
    dispatch('change', next);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="toggle" class:toggle--open={open}>
  <button
    type="button"
    class="toggle__button"
    aria-haspopup="listbox"
    aria-expanded={open}
    {disabled}
    on:click={() => (open = !open)}
  >
    Heights in {units}
  </button>
  {#if open}
    <ul class="toggle__menu" role="listbox" aria-label="Height units" transition:fade={{ duration: prefersReducedMotion.current ? 0 : 120 }}>
      {#each ['metres', 'feet'] as option (option)}
        <li role="option" aria-selected={units === option}>
          <button type="button" class="toggle__option" on:click={() => select(option)}>{option}</button>
        </li>
      {/each}
    </ul>
  {:else}
    <span class="visually-hidden">Menu closed</span>
  {/if}
</div>

<style>
  .toggle {
    position: relative;
    display: inline-block;
  }

  .toggle__button,
  .toggle__option {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    transition: border-color 120ms ease-out;
  }

  .toggle__button:hover {
    border-color: var(--line-strong);
  }

  .toggle__menu {
    position: absolute;
    inset-block-start: calc(100% + 4px);
    min-width: 100%;
    margin: 0;
    padding: 4px;
    list-style: none;
    background: var(--surface-raised);
    box-shadow: var(--shadow-popover);
  }

  .toggle--open .toggle__button {
    border-color: var(--accent);
  }
</style>
