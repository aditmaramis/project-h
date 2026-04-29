import { test, expect } from './fixtures/auth';
import { loginThroughModal } from './helpers/auth';

function getPathname(url: string): string {
	return new URL(url).pathname;
}

function getSearchParam(url: string, key: string): string | null {
	return new URL(url).searchParams.get(key);
}

test.describe('Auth redirect smoke', () => {
	test('admin login lands on admin dashboard', async ({
		page,
		adminCredential,
	}) => {
		await page.goto('/');
		await loginThroughModal(page, adminCredential);

		await expect
			.poll(() => getPathname(page.url()))
			.toMatch(/^\/(?:id\/)?admin(?:\/)?$/);
	});

	test('regular user login never lands on admin dashboard', async ({
		page,
		userCredential,
	}) => {
		await page.goto('/');
		await loginThroughModal(page, userCredential);

		await expect
			.poll(() => getPathname(page.url()))
			.not.toMatch(/^\/(?:id\/)?admin(?:\/|$)/);
	});

	test('protected route redirectTo roundtrip lands on user dashboard', async ({
		page,
		userCredential,
	}) => {
		await page.goto('/dashboard');

		await expect.poll(() => getPathname(page.url())).toMatch(/^\/(?:id\/)?$/);
		await expect
			.poll(() => getSearchParam(page.url(), 'redirectTo'))
			.toMatch(/^\/(?:id\/)?dashboard(?:\/)?$/);

		await loginThroughModal(page, userCredential);

		await expect
			.poll(() => getPathname(page.url()))
			.toMatch(/^\/(?:id\/)?dashboard(?:\/)?$/);
		await expect
			.poll(() => getSearchParam(page.url(), 'redirectTo'))
			.toBeNull();
	});

	test('admin logout does not append redirectTo query', async ({
		adminPage: page,
	}) => {
		await page.goto('/');
		await expect
			.poll(() => getPathname(page.url()))
			.toMatch(/^\/(?:id\/)?admin(?:\/|$)/);

		await page.getByTestId('header-user-menu-trigger').click();
		await page.getByTestId('auth-logout').click();

		await expect
			.poll(() => getSearchParam(page.url(), 'redirectTo'))
			.toBeNull();
		await expect.poll(() => getPathname(page.url())).toMatch(/^\/(?:id\/)?$/);
	});
});
