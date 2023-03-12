<script lang="ts">
  import { onMount } from "svelte";

  import { log_error } from "../log";
  import { notify } from "../notifications";

  export let data: unknown;

  onMount(() => {
    if (!data) {
      notify("Query Table missing data");
    }
    log_error("test");
  });
</script>

<p>Query Table</p>
