<script lang="ts">
  import TideToggle from '$lib/TideToggle.svelte';
  export let data: { port: string; tides: { time: string; height: number; kind: 'high' | 'low' }[] };
  let units: 'metres' | 'feet' = 'metres';
  $: factor = units === 'metres' ? 1 : 3.281;
</script>

<svelte:head>
  <title>Tide times for {data.port}</title>
</svelte:head>

<main class="page">
  <h1>Tide times for {data.port}</h1>
  <p class="lede">Predicted heights above chart datum for the next 24 hours, from the harbour authority's tables.</p>
  <TideToggle bind:units />
  <table class="tides">
    <thead>
      <tr><th scope="col">Time</th><th scope="col">Tide</th><th scope="col">Height ({units})</th></tr>
    </thead>
    <tbody>
      {#each data.tides as tide}
        <tr>
          <td>{tide.time}</td>
          <td>{tide.kind === 'high' ? 'High water' : 'Low water'}</td>
          <td class="num">{(tide.height * factor).toFixed(1)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <a class="page__download" href="/tides/{data.port}.ics" download>Add this week's tides to your calendar</a>
</main>

<style>
  .page {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
    font-family: var(--font-body);
  }

  .tides {
    width: 100%;
    border-collapse: collapse;
  }

  .tides th,
  .tides td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    text-align: left;
  }

  .num {
    font-variant-numeric: tabular-nums;
  }
</style>
