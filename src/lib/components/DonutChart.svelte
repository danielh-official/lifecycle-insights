<script lang="ts">
	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';
	import { Card } from 'flowbite-svelte';

    function normalizeSeconds(value: number): string {
        if (value < 60) {
            return `${value}s`;
        } else if (value < 3600) {
            const minutes = Math.floor(value / 60);
            const seconds = value % 60;
            return `${minutes}m ${seconds}s`;
        } else if (value < 86400) {
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            return `${hours}h ${minutes}m`;
        } else {
            const days = Math.floor(value / 86400);
            const hours = Math.floor((value % 86400) / 3600);
            return `${days}d ${hours}h`;
        }
    }

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
			height: 320,
			width: '100%',
			type: 'donut'
		},
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
		}
	});
</script>

<Card class="p-4 md:p-6">
	<Chart {options} class="py-6" />
</Card>
