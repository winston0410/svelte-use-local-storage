# `svelte-use-local-storage`

## Usage

This action is used per element instead of per form. A per form action might be introduced later

```svelte
<script>
import storage from 'svelte-use-local-storage'
</script>

<form on:submit={handleSubmit}>
        <input type="text" name="name" use:storage={"name"} />
        <button type="button">Create</button>
</form>
```
