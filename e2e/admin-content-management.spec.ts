import { test, expect } from './fixtures/auth';
import type { APIRequestContext, Page } from '@playwright/test';

type CreatedItem = {
	id: string;
	title: string;
	status: 'AVAILABLE' | 'RESERVED' | 'DONATED';
};

function contentRowByTitle(page: Page, title: string) {
	return page
		.locator('[data-testid="admin-content-row"]')
		.filter({ hasText: title })
		.first();
}

async function openContentSearch(page: Page, search: string) {
	await page.goto(`/admin/content?search=${encodeURIComponent(search)}`);
	await expect(page.getByTestId('admin-content-search-input')).toBeVisible();
}

async function getFirstCategoryIdFromFilters(page: Page) {
	await page.goto('/admin/content');

	const categoryLink = page.locator('a[href*="categoryId="]').first();
	await expect(categoryLink).toBeVisible();

	const href = await categoryLink.getAttribute('href');
	expect(href).toBeTruthy();

	const parsed = new URL(href as string, 'http://127.0.0.1');
	const categoryId = parsed.searchParams.get('categoryId');
	expect(categoryId).toBeTruthy();

	return categoryId as string;
}

async function createDisposableItem(
	request: APIRequestContext,
	categoryId: string,
	titlePrefix: string,
): Promise<CreatedItem> {
	const title = `${titlePrefix} ${Date.now()}`;
	const response = await request.post('/api/items', {
		data: {
			title,
			description:
				'Disposable moderation item used for Playwright admin content tests.',
			condition: 'GOOD',
			pickupMethods: ['SELF_PICKUP'],
			categoryId,
			latitude: -6.2,
			longitude: 106.8,
			address: 'E2E Test Address',
			images: ['https://example.com/e2e-admin-content.jpg'],
		},
	});

	expect(response.status()).toBe(201);
	const item = (await response.json()) as CreatedItem;
	expect(item.id).toBeTruthy();

	return item;
}

async function deleteItemAsOwner(request: APIRequestContext, itemId: string) {
	try {
		const response = await request.delete(`/api/items/${itemId}`);
		if (response.status() === 404) {
			return;
		}

		expect(response.ok()).toBeTruthy();
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes('Target page, context or browser has been closed')
		) {
			return;
		}

		throw error;
	}
}

async function hideFloatingChatLauncher(page: Page) {
	const launcher = page.getByTestId('floating-chat-open-button');
	if ((await launcher.count()) === 0) {
		return;
	}

	await launcher.first().evaluate((node) => {
		(node as HTMLElement).style.display = 'none';
	});
}

async function openManageSheet(
	page: Page,
	row: ReturnType<typeof contentRowByTitle>,
) {
	await hideFloatingChatLauncher(page);
	const manageButton = row.getByTestId('admin-item-manage-button');
	await expect(manageButton).toBeVisible();

	await expect(async () => {
		await manageButton.click({ force: true });
		await expect(page.getByTestId('admin-item-details-sheet')).toBeVisible({
			timeout: 2000,
		});
	}).toPass({ timeout: 15000 });

	await expect(page.getByTestId('admin-item-edit-button')).toBeVisible({
		timeout: 20000,
	});
}

test.describe('Admin content moderation', () => {
	test('search and status filters work for content rows', async ({
		adminPage,
		userPage,
	}) => {
		const categoryId = await getFirstCategoryIdFromFilters(adminPage);
		const item = await createDisposableItem(
			userPage.request,
			categoryId,
			'E2E Content Filter',
		);

		try {
			await openContentSearch(adminPage, item.title);
			const row = contentRowByTitle(adminPage, item.title);
			await expect(row).toBeVisible();
			await expect(row).toHaveAttribute('data-item-status', 'AVAILABLE');

			await adminPage.goto(
				`/admin/content?search=${encodeURIComponent(item.title)}&status=RESERVED`,
			);
			await expect(
				adminPage.getByTestId('admin-content-empty-state'),
			).toBeVisible();

			await adminPage.goto(
				`/admin/content?search=${encodeURIComponent(item.title)}&status=AVAILABLE`,
			);
			await expect(contentRowByTitle(adminPage, item.title)).toBeVisible();
		} finally {
			await deleteItemAsOwner(userPage.request, item.id);
		}
	});

	test('admin can update status and edit item fields with validation feedback', async ({
		adminPage,
		userPage,
	}) => {
		const categoryId = await getFirstCategoryIdFromFilters(adminPage);
		const item = await createDisposableItem(
			userPage.request,
			categoryId,
			'E2E Content Edit',
		);
		const updatedTitle = `${item.title} Updated`;

		try {
			await openContentSearch(adminPage, item.title);
			const row = contentRowByTitle(adminPage, item.title);
			await expect(row).toBeVisible();
			await openManageSheet(adminPage, row);

			await adminPage.getByTestId('admin-item-status-RESERVED').click();
			await expect
				.poll(async () => {
					const refreshedRow = contentRowByTitle(adminPage, item.title);
					return refreshedRow.getAttribute('data-item-status');
				})
				.toBe('RESERVED');

			await adminPage.getByTestId('admin-item-edit-button').click();
			await expect(
				adminPage.getByTestId('admin-item-edit-title'),
			).toBeVisible();

			await adminPage.getByTestId('admin-item-save-button').click();
			await expect(
				adminPage.getByTestId('admin-item-edit-error'),
			).toBeVisible();

			await adminPage.getByTestId('admin-item-edit-title').fill(updatedTitle);
			await adminPage
				.getByTestId('admin-item-edit-description')
				.fill('Updated description for admin moderation e2e coverage.');
			await adminPage
				.getByTestId('admin-item-edit-reason')
				.fill('E2E edit verification');
			await adminPage.getByTestId('admin-item-save-button').click();

			await expect(adminPage.getByTestId('admin-item-edit-title')).toBeHidden();

			await openContentSearch(adminPage, updatedTitle);
			await expect(contentRowByTitle(adminPage, updatedTitle)).toBeVisible();
		} finally {
			await deleteItemAsOwner(userPage.request, item.id);
		}
	});

	test('admin can delete an item with required reason', async ({
		adminPage,
		userPage,
	}) => {
		const categoryId = await getFirstCategoryIdFromFilters(adminPage);
		const item = await createDisposableItem(
			userPage.request,
			categoryId,
			'E2E Content Delete',
		);
		let deleted = false;

		try {
			await openContentSearch(adminPage, item.title);
			const row = contentRowByTitle(adminPage, item.title);
			await expect(row).toBeVisible();
			await openManageSheet(adminPage, row);

			await adminPage.getByTestId('admin-item-delete-button').click();
			await expect(
				adminPage.getByTestId('admin-item-delete-reason'),
			).toBeVisible();

			await adminPage.getByTestId('admin-item-delete-confirm').click();
			await expect(
				adminPage.getByTestId('admin-item-delete-reason-error'),
			).toBeVisible();

			await adminPage
				.getByTestId('admin-item-delete-reason')
				.fill('E2E delete verification');
			await adminPage.getByTestId('admin-item-delete-confirm').click();

			deleted = true;
			await expect(
				adminPage.getByTestId('admin-item-delete-reason'),
			).toBeHidden();
			await expect(contentRowByTitle(adminPage, item.title)).toHaveCount(0);
		} finally {
			if (!deleted) {
				await deleteItemAsOwner(userPage.request, item.id);
			}
		}
	});
});
