import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('should render footer element', async () => {
		render(Footer);

		const footer = page.getByRole('contentinfo');
		await expect.element(footer).toBeInTheDocument();
	});

	it('should display copyright text with current year', async () => {
		render(Footer);

		const currentYear = new Date().getFullYear();
		const copyrightText = page.getByText(
			`© ${currentYear} Life Cycle Insights. Not affiliated with Life Cycle or Northcube AB.`
		);
		await expect.element(copyrightText).toBeInTheDocument();
	});

	it('should have link to source code', async () => {
		render(Footer);

		const link = page.getByRole('link', { name: 'View Source Code' });
		await expect.element(link).toBeInTheDocument();
		await expect
			.element(link)
			.toHaveAttribute('href', 'https://github.com/danielh-official/lifecycle-web');
		await expect.element(link).toHaveAttribute('target', '_blank');
	});

	it('should display data privacy message', async () => {
		render(Footer);

		const privacyText = page.getByText(
			'All data is stored locally in your browser using IndexedDB.'
		);
		await expect.element(privacyText).toBeInTheDocument();
	});
});
