<script lang="ts">
	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';
	import { Card } from 'flowbite-svelte';
	import { normalizeSeconds } from '$lib';

	let {
		series = [],
		labels = []
	}: {
		series: number[];
		labels: string[];
	} = $props();

	const options: ApexOptions = $derived({
		series,
		chart: {
			type: 'donut',
			width: '500px'
		},
		responsive: [
			{
				breakpoint: 768, // Screen width in px
				options: {
					chart: { width: '100%' },
					legend: { position: 'bottom' }
				}
			}
		],
		stroke: {
			colors: ['transparent']
		},
		plotOptions: {
			pie: {
				donut: {
					labels: {
						show: true,
						name: {
							show: true,
							fontFamily: 'Inter, sans-serif',
							offsetY: 20
						},
						value: {
							show: true,
							fontFamily: 'Inter, sans-serif',
							offsetY: -20,
							formatter: function (value: number | string) {
								value = Number(value);

								return normalizeSeconds(value);
							}
						}
					},
					size: '80%'
				}
			}
		},
		grid: {
			padding: {
				top: -2
			}
		},
		labels,
		dataLabels: {
			enabled: false
		},
		legend: {
			position: 'bottom',
			fontFamily: 'Inter, sans-serif'
		},
		yaxis: {
			labels: {
				formatter: function (value) {
					return normalizeSeconds(value as number);
				}
			}
		},
		theme: {
			mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
		}
	});
</script>

<Card class="p-4 md:p-6 dark:bg-gray-800">
	<Chart {options} class="py-6" />
</Card>
