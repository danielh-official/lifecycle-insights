<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="mt-12 border-t bg-gray-50 py-8 dark:bg-gray-800 dark:text-gray-300">
	<div class="container mx-auto px-4">
		<div class="flex flex-col items-center justify-center gap-4 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-300">
				© {currentYear} Life Cycle Insights. Not affiliated with Life Cycle or Northcube AB.
			</p>
			<div class="flex gap-4">
				<a
					href="https://github.com/danielh-official/lifecycle-web"
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-blue-600 hover:underline"
				>
					View Source Code
				</a>
			</div>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				All data is stored locally in your browser using IndexedDB.
			</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Favicon by <a
					href="https://fontawesome.com/icons/chart-pie?s=solid"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:underline">Font Awesome</a
				>
			</p>
		</div>
	</div>
</footer>
