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
	await expect(page.getByTestId('auth-login-submit')).toBeVisible();

	await page.locator('#login-email').fill(credential.email);
	await page.locator('#login-password').fill(credential.password);
	await page.getByTestId('auth-login-submit').click();
}
