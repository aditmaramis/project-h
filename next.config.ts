import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
	allowedDevOrigins: ['127.0.0.1'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.supabase.co',
				pathname: '/storage/v1/object/public/**',
			},
		],
	},
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
