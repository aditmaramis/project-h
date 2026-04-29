import { test, expect } from './fixtures/auth';
import type { Page } from '@playwright/test';

function userRow(page: Page, email: string) {
	return page
		.locator('[data-testid="admin-user-row"]')
		.filter({ hasText: email })
		.first();
}

async function openUsersPage(page: Page, email: string) {
	await page.goto(`/admin/users?search=${encodeURIComponent(email)}`);
	const row = userRow(page, email);
	await expect(row).toBeVisible();
	return row;
}

async function userIdForEmail(page: Page, email: string) {
	const row = await openUsersPage(page, email);
	const userId = await row.getAttribute('data-user-id');
	expect(userId).toBeTruthy();
	return userId as string;
}

async function adminPatchUser(
	page: Page,
	userId: string,
	body: Record<string, unknown>,
) {
	return page.request.patch(`/api/admin/users/${userId}`, {
		data: body,
	});
}

test.describe('Admin user management', () => {
	test('admin can warn, ban/unban, and toggle role for a user', async ({
		adminPage: page,
		userCredential,
	}) => {
		const userEmail = userCredential.email;
		const userId = await userIdForEmail(page, userEmail);

		const statusBadge = () =>
			userRow(page, userEmail).getByTestId('admin-user-status-badge');
		const roleBadge = () =>
			userRow(page, userEmail).getByTestId('admin-user-role-badge');

		const initialStatus = await statusBadge().getAttribute('data-status');
		if (initialStatus === 'BANNED') {
			const unbanResponse = await adminPatchUser(page, userId, {
				action: 'UNBAN',
			});
			expect(unbanResponse.ok()).toBeTruthy();
			await openUsersPage(page, userEmail);
			await expect(statusBadge()).toHaveAttribute('data-status', 'ACTIVE');
		}

		const warnResponse = await adminPatchUser(page, userId, {
			action: 'WARN',
			reason: `E2E warning ${Date.now()}`,
		});
		expect(warnResponse.ok()).toBeTruthy();

		const banResponse = await adminPatchUser(page, userId, {
			action: 'BAN',
			reason: `E2E ban ${Date.now()}`,
		});
		expect(banResponse.ok()).toBeTruthy();
		await openUsersPage(page, userEmail);
		await expect(statusBadge()).toHaveAttribute('data-status', 'BANNED');

		const unbanResponse = await adminPatchUser(page, userId, {
			action: 'UNBAN',
		});
		expect(unbanResponse.ok()).toBeTruthy();
		await openUsersPage(page, userEmail);
		await expect(statusBadge()).toHaveAttribute('data-status', 'ACTIVE');

		const initialRole = await roleBadge().getAttribute('data-role');
		if (initialRole === 'USER') {
			const promoteResponse = await adminPatchUser(page, userId, {
				action: 'SET_ROLE',
				role: 'ADMIN',
			});
			expect(promoteResponse.ok()).toBeTruthy();
			await openUsersPage(page, userEmail);
			await expect(roleBadge()).toHaveAttribute('data-role', 'ADMIN');

			const demoteResponse = await adminPatchUser(page, userId, {
				action: 'SET_ROLE',
				role: 'USER',
			});
			expect(demoteResponse.ok()).toBeTruthy();
			await openUsersPage(page, userEmail);
			await expect(roleBadge()).toHaveAttribute('data-role', 'USER');
		} else {
			const demoteResponse = await adminPatchUser(page, userId, {
				action: 'SET_ROLE',
				role: 'USER',
			});
			expect(demoteResponse.ok()).toBeTruthy();
			await openUsersPage(page, userEmail);
			await expect(roleBadge()).toHaveAttribute('data-role', 'USER');

			const promoteResponse = await adminPatchUser(page, userId, {
				action: 'SET_ROLE',
				role: 'ADMIN',
			});
			expect(promoteResponse.ok()).toBeTruthy();
			await openUsersPage(page, userEmail);
			await expect(roleBadge()).toHaveAttribute('data-role', 'ADMIN');
		}
	});

	test('admin cannot demote themselves from users page', async ({
		adminPage: page,
		adminCredential,
	}) => {
		const adminEmail = adminCredential.email;
		const adminId = await userIdForEmail(page, adminEmail);

		const demoteResponse = await adminPatchUser(page, adminId, {
			action: 'SET_ROLE',
			role: 'USER',
		});
		expect(demoteResponse.status()).toBe(400);
		await expect(demoteResponse.json()).resolves.toMatchObject({
			error: 'Cannot demote your own account',
		});

		const banResponse = await adminPatchUser(page, adminId, {
			action: 'BAN',
			reason: `E2E self-ban attempt ${Date.now()}`,
		});
		expect(banResponse.status()).toBe(400);
		await expect(banResponse.json()).resolves.toMatchObject({
			error: 'Cannot ban your own account',
		});
	});
});
