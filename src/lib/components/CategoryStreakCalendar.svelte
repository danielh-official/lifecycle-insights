<script lang="ts">
	import type { Item } from '$lib/db';

	interface Props {
		categoryName: string;
		items: Item[];
	}

	let { categoryName, items }: Props = $props();

	let currentYear = $state(new Date().getFullYear());

	// Calculate which dates have activity for this category
	let activeDates = $derived.by(() => {
		const dateSet: string[] = [];
		items.forEach((item) => {
			if (item.start_date_time_utc) {
				const date = new Date(item.start_date_time_utc.getTime());
				const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
				if (!dateSet.includes(dateString)) {
					dateSet.push(dateString);
				}
			}
		});
		return dateSet;
	});

	// Check if a specific date has activity
	function isActiveDate(year: number, month: number, day: number): boolean {
		const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		return activeDates.includes(dateString);
	}

	// Get number of days in a month
	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	// Get the day of week for the first day of the month (0 = Sunday)
	function getFirstDayOfMonth(year: number, month: number): number {
		return new Date(year, month, 1).getDay();
	}

	// Month names
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	function previousYear() {
		currentYear--;
	}

	function nextYear() {
		currentYear++;
	}
</script>

<div class="streak-calendar">
	<div class="calendar-header">
		<button onclick={previousYear} class="nav-button">← Previous</button>
		<h3 class="year-title">{categoryName} - {currentYear}</h3>
		<button onclick={nextYear} class="nav-button">Next →</button>
	</div>

	<div class="months-grid">
		{#each Array(12)
			.fill(0)
			.map((_, i) => i) as monthIndex (monthIndex)}
			<div class="month-container">
				<div class="month-name">{monthNames[monthIndex]}</div>
				<div class="days-grid">
					<!-- Add empty cells for days before the 1st of the month -->
					{#each Array(getFirstDayOfMonth(currentYear, monthIndex))
						.fill(0)
						.map((_, i) => i) as emptyIndex (emptyIndex)}
						<div class="day-cell empty"></div>
					{/each}

					<!-- Add cells for each day of the month -->
					{#each Array(getDaysInMonth(currentYear, monthIndex))
						.fill(0)
						.map((_, i) => i) as dayIndex (dayIndex)}
						{@const day = dayIndex + 1}
						{@const active = isActiveDate(currentYear, monthIndex, day)}
						<div
							class="day-cell {active ? 'active' : 'inactive'}"
							title="{monthNames[monthIndex]} {day}, {currentYear}"
						>
							<!-- No text content to keep cells small -->
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.streak-calendar {
		margin-bottom: 2rem;
		padding: 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.year-title {
		font-size: 1.25rem;
		font-weight: 600;
		text-align: center;
		flex: 1;
	}

	.nav-button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.nav-button:hover {
		background: #2563eb;
	}

	.months-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.month-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.month-name {
		font-weight: 600;
		text-align: center;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.day-cell {
		aspect-ratio: 1;
		border-radius: 2px;
		min-height: 12px;
		min-width: 12px;
	}

	.day-cell.empty {
		background: transparent;
	}

	.day-cell.active {
		background: #10b981;
	}

	.day-cell.inactive {
		background: #e5e7eb;
	}

	.day-cell:not(.empty):hover {
		opacity: 0.8;
		cursor: pointer;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.months-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 1rem;
		}

		.calendar-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.year-title {
			font-size: 1rem;
		}

		.nav-button {
			width: 100%;
		}
	}
</style>
