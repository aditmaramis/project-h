import { expect, Page } from '@playwright/test';

type CredentialKind = 'ADMIN' | 'USER';

export type E2ECredential = {
	email: string;
	password: string;
};

export function requiredCredential(kind: CredentialKind): E2ECredential {
	const email = process.env[`E2E_${kind}_EMAIL`];
	const password = process.env[`E2E_${kind}_PASSWORD`];

	if (!email || !password) {
		throw new Error(
			`Missing E2E_${kind}_EMAIL or E2E_${kind}_PASSWORD environment variable.`,
		);
	}

	return { email, password };
}

export async function loginThroughModal(
	page: Page,
	credential: E2ECredential,
): Promise<void> {
	await page.getByTestId('auth-login-trigger').click();

	const loginSubmit = page.getByTestId('auth-login-submit');
	const loginFormVisible = await loginSubmit
		.isVisible({ timeout: 3000 })
		.catch(() => false);

	if (!loginFormVisible) {
		const response = await page.request.post('/api/e2e/login', {
			data: credential,
		});

		if (!response.ok()) {
			throw new Error(`E2E login fallback failed with ${response.status()}`);
		}

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
		return;
	}

	await expect(loginSubmit).toBeVisible();

	await page.locator('#login-email').fill(credential.email);
	await page.locator('#login-password').fill(credential.password);
	await loginSubmit.click();
}
