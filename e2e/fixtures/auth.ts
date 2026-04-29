import fs from 'node:fs/promises';
import path from 'node:path';
import {
	test as base,
	expect,
	type Browser,
	type Page,
} from '@playwright/test';
import {
	type E2ECredential,
	loginThroughModal,
	requiredCredential,
} from '../helpers/auth';

type AuthFixtures = {
	adminCredential: E2ECredential;
	userCredential: E2ECredential;
	adminPage: Page;
	userPage: Page;
};

type AuthWorkerFixtures = {
	adminStorageStatePath: string;
	userStorageStatePath: string;
};

const e2eBaseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function ensureStorageState(
	browser: Browser,
	baseURL: string,
	credential: E2ECredential,
	storageStatePath: string,
): Promise<void> {
	if (await fileExists(storageStatePath)) {
		return;
	}

	await fs.mkdir(path.dirname(storageStatePath), { recursive: true });

	const context = await browser.newContext();
	const page = await context.newPage();

	await page.goto(baseURL);
	await loginThroughModal(page, credential);
	await expect
		.poll(async () => {
			const response = await page.request.get(`${baseURL}/api/profile`);
			return response.status();
		})
		.toBe(200);
	await context.storageState({ path: storageStatePath });
	await context.close();
}

export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
	adminCredential: [
		async ({}, use) => {
			await use(requiredCredential('ADMIN'));
		},
		{ scope: 'worker' },
	],
	userCredential: [
		async ({}, use) => {
			await use(requiredCredential('USER'));
		},
		{ scope: 'worker' },
	],
	adminStorageStatePath: [
		async ({ browser, adminCredential }, use, testInfo) => {
			const storageStatePath = path.join(
				testInfo.project.outputDir,
				'.auth',
				`admin-${testInfo.parallelIndex}.json`,
			);

			await ensureStorageState(
				browser,
				e2eBaseURL,
				adminCredential,
				storageStatePath,
			);
			await use(storageStatePath);
		},
		{ scope: 'worker' },
	],
	userStorageStatePath: [
		async ({ browser, userCredential }, use, testInfo) => {
			const storageStatePath = path.join(
				testInfo.project.outputDir,
				'.auth',
				`user-${testInfo.parallelIndex}.json`,
			);

			await ensureStorageState(
				browser,
				e2eBaseURL,
				userCredential,
				storageStatePath,
			);
			await use(storageStatePath);
		},
		{ scope: 'worker' },
	],
	adminPage: async ({ browser, adminStorageStatePath }, runPage) => {
		const context = await browser.newContext({
			storageState: adminStorageStatePath,
		});
		const page = await context.newPage();
		await runPage(page);
		await context.close();
	},
	userPage: async ({ browser, userStorageStatePath }, runPage) => {
		const context = await browser.newContext({
			storageState: userStorageStatePath,
		});
		const page = await context.newPage();
		await runPage(page);
		await context.close();
	},
});

export { expect } from '@playwright/test';
