<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div
	class="w-full bg-gradient-to-b from-blue-50 to-white py-6 text-center dark:from-gray-800 dark:to-gray-900"
>
	100% Open Source. <a
		class="text-blue-600 hover:underline dark:text-blue-400"
		href="https://github.com/danielh-official/lifecycle-web"
		target="_blank"
		rel="noopener noreferrer">View on GitHub.</a
	>
</div>
{@render children()}
<Footer />
