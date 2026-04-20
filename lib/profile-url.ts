export function slugifyProfileName(name: string | null | undefined): string {
	if (!name) {
		return 'user';
	}

	const normalized = name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48);

	return normalized || 'user';
}

export function buildProfileSlug(
	profileId: string,
	profileName: string | null | undefined,
): string {
	const nameSlug = slugifyProfileName(profileName);
	const token = profileId.slice(0, 8).toLowerCase();
	return `${nameSlug}-${token}`;
}

export function buildProfileHref(
	profileId: string,
	profileName: string | null | undefined,
): string {
	return `/profile/${buildProfileSlug(profileId, profileName)}`;
}

export function parseProfileSlug(slug: string): {
	nameSlug: string;
	idToken: string | null;
} {
	const matched = /^(.*)-([0-9a-f]{8})$/i.exec(slug);

	if (!matched) {
		return { nameSlug: slug, idToken: null };
	}

	return {
		nameSlug: matched[1] || 'user',
		idToken: matched[2].toLowerCase(),
	};
}
