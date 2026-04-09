import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FeaturedCarousel } from '@/components/featured-carousel';
import {
	ArrowRight,
	MapPin,
	MessageSquare,
	Package,
	Heart,
	Users,
	Sparkles,
	Camera,
	BookOpen,
	Sofa,
	Shirt,
	Utensils,
	CheckCircle,
} from 'lucide-react';

const steps = [
	{
		number: '01',
		title: 'Post your item',
		description:
			'Photograph what you no longer need and share it with your community. Add a description, condition, and pickup details.',
		icon: Camera,
	},
	{
		number: '02',
		title: 'Connect locally',
		description:
			'Someone nearby sees your post and messages you directly. No middlemen, no algorithms deciding who deserves what.',
		icon: MessageSquare,
	},
	{
		number: '03',
		title: 'Give it away',
		description:
			'Arrange a pickup that works for both of you. Hand it over, and feel the quiet satisfaction of something well-loved finding a new home.',
		icon: Heart,
	},
];

const features = [
	{
		icon: MapPin,
		title: 'Discover nearby',
		description:
			'Browse items within your neighborhood on an interactive map. Giving stays local and pickup is always convenient.',
	},
	{
		icon: MessageSquare,
		title: 'Direct messaging',
		description:
			'Chat one-on-one with givers and receivers. No public comments, no awkward threads — just honest conversation.',
	},
	{
		icon: Package,
		title: 'Every category',
		description:
			'Furniture, clothes, electronics, books, kitchenware — if it can be carried, it belongs here.',
	},
	{
		icon: Sparkles,
		title: 'Always free',
		description:
			"Hibah has no fees, no premium tiers, and no advertising. It's a gift, in every sense of the word.",
	},
];

const categories = [
	{ icon: Sofa, label: 'Furniture' },
	{ icon: Shirt, label: 'Clothing' },
	{ icon: BookOpen, label: 'Books' },
	{ icon: Utensils, label: 'Kitchen' },
	{ icon: Package, label: 'Electronics' },
	{ icon: Heart, label: '& more' },
];

const stats = [
	{ value: '2,400+', label: 'items listed' },
	{ value: '1,100+', label: 'gifts given' },
	{ value: '30+', label: 'cities' },
];

export default function HomePage() {
	return (
		<div className="overflow-x-hidden">
			{/* ── FEATURED CAROUSEL ── */}
			<FeaturedCarousel />

			{/* ── HOW IT WORKS ── */}
			<section className="py-28 bg-background">
				<div className="container mx-auto px-6 lg:px-12">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-4">
						<div>
							<p
								className="text-sm tracking-widest uppercase mb-3"
								style={{ color: 'var(--hibah-terracotta)' }}
							>
								The process
							</p>
							<h2 className="font-display text-4xl lg:text-5xl leading-tight text-hibah-warm-dark">
								Simple as it
								<br />
								ought to be.
							</h2>
						</div>
						<p className="max-w-xs text-muted-foreground text-sm leading-relaxed lg:text-right">
							Three steps stand between an unused item and someone who can truly
							use it.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{steps.map((step, i) => {
							const Icon = step.icon;
							return (
								<div
									key={step.number}
									className={`step-card step-card-${i + 1} relative group`}
								>
									<Card className="h-full border-0 shadow-none rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
										<CardContent className="p-8 flex flex-col gap-5 h-full">
											<div className="flex items-start justify-between">
												<span className="font-display text-6xl font-bold leading-none select-none text-hibah-terracotta-light">
													{step.number}
												</span>
												<div
													className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
													style={{
														background: 'var(--hibah-terracotta-light)',
													}}
												>
													<Icon
														className="h-5 w-5"
														style={{ color: 'var(--hibah-terracotta)' }}
													/>
												</div>
											</div>
											<div>
												<h3 className="font-display text-xl mb-2 text-hibah-warm-dark">
													{step.title}
												</h3>
												<p className="text-sm text-muted-foreground leading-relaxed">
													{step.description}
												</p>
											</div>
										</CardContent>
									</Card>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── FEATURES ── */}
			<section
				className="py-28"
				style={{ background: 'var(--hibah-cream)' }}
			>
				<div className="container mx-auto px-6 lg:px-12">
					<div className="text-center mb-16">
						<p
							className="text-sm tracking-widest uppercase mb-3"
							style={{ color: 'var(--hibah-sage)' }}
						>
							What you get
						</p>
						<h2 className="font-display text-4xl lg:text-5xl text-hibah-warm-dark">
							Built for real people,
							<br />
							not engagement metrics.
						</h2>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
						{features.map((feature, i) => {
							const Icon = feature.icon;
							return (
								<Card
									key={feature.title}
									className={`feature-card feature-card-${i + 1} border shadow-none rounded-2xl group transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
									style={{ borderColor: 'oklch(0.90 0.02 75)' }}
								>
									<CardContent className="p-7 flex flex-col gap-4">
										<div
											className="w-11 h-11 rounded-xl flex items-center justify-center"
											style={{ background: 'var(--hibah-terracotta-light)' }}
										>
											<Icon
												className="h-5 w-5"
												style={{ color: 'var(--hibah-terracotta)' }}
											/>
										</div>
										<div>
											<h3 className="font-display text-base mb-1.5 text-hibah-warm-dark">
												{feature.title}
											</h3>
											<p className="text-sm text-muted-foreground leading-relaxed">
												{feature.description}
											</p>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── CATEGORIES ── */}
			<section className="py-16 bg-background">
				<div className="container mx-auto px-6 lg:px-12">
					<div className="flex flex-wrap items-center justify-between gap-6">
						<p
							className="text-sm tracking-widest uppercase"
							style={{ color: 'var(--hibah-terracotta)' }}
						>
							Categories
						</p>
						<div className="flex flex-wrap gap-3">
							{categories.map(({ icon: Icon, label }) => (
								<div
									key={label}
									className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all duration-200 hover:border-hibah-terracotta cursor-default"
									style={{ borderColor: 'oklch(0.88 0.02 75)' }}
								>
									<Icon
										className="h-4 w-4"
										style={{ color: 'var(--hibah-terracotta)' }}
									/>
									<span style={{ color: 'var(--hibah-warm-dark)' }}>
										{label}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── MISSION / STATS ── */}
			<section
				className="py-28 relative overflow-hidden"
				style={{ background: 'var(--hibah-warm-dark)' }}
			>
				{/* decorative */}
				<div
					className="pointer-events-none absolute inset-0"
					aria-hidden="true"
				>
					<div
						className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
						style={{
							background:
								'radial-gradient(circle, var(--hibah-terracotta), transparent)',
						}}
					/>
					<div
						className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
						style={{
							background:
								'radial-gradient(circle, var(--hibah-sage), transparent)',
						}}
					/>
				</div>

				<div className="container mx-auto px-6 lg:px-12 relative z-10">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div>
							<p
								className="text-sm tracking-widest uppercase mb-6"
								style={{ color: 'var(--hibah-terracotta)' }}
							>
								Our mission
							</p>
							<h2
								className="font-display text-4xl lg:text-5xl leading-tight mb-6"
								style={{ color: 'oklch(0.97 0.01 90)' }}
							>
								Every unused item is a gift waiting to be given.
							</h2>
							<p
								className="text-base leading-relaxed opacity-70"
								style={{ color: 'oklch(0.88 0.01 85)' }}
							>
								We built Hibah because we believe communities thrive when
								neighbors help each other. What's surplus to you could be
								essential to someone down the street. We're just the
								introduction.
							</p>
						</div>

						<div
							className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden"
							style={{ background: 'oklch(1 0 0 / 8%)' }}
						>
							{stats.map(({ value, label }) => (
								<div
									key={label}
									className="flex flex-col items-center justify-center py-10 px-4"
									style={{ background: 'oklch(1 0 0 / 4%)' }}
								>
									<span
										className="font-display text-4xl lg:text-5xl leading-none mb-2"
										style={{ color: 'oklch(0.97 0.01 90)' }}
									>
										{value}
									</span>
									<span
										className="text-xs tracking-wide text-center"
										style={{ color: 'oklch(0.70 0.02 80)' }}
									>
										{label}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── FINAL CTA ── */}
			<section className="py-28 bg-background">
				<div className="container mx-auto px-6 lg:px-12 text-center">
					<div className="max-w-2xl mx-auto">
						<div className="flex items-center justify-center gap-2 mb-6">
							{[CheckCircle, CheckCircle, CheckCircle].map((Icon, i) => (
								<Icon
									key={i}
									className="h-5 w-5"
									style={{ color: 'var(--hibah-sage)' }}
								/>
							))}
						</div>
						<h2 className="font-display text-4xl lg:text-6xl leading-tight mb-6 text-hibah-warm-dark">
							Ready to give
							<br />
							or receive?
						</h2>
						<p className="text-muted-foreground mb-10 text-lg leading-relaxed">
							Join thousands of neighbors sharing what they have. It only takes
							a minute to post your first item or find something you need.
						</p>
						<div className="flex flex-wrap gap-4 justify-center">
							<Link
								href="/dashboard/items/new"
								className="inline-flex items-center justify-center gap-2 rounded-lg px-10 py-4 text-base font-medium whitespace-nowrap transition-all hover:opacity-90"
								style={{
									background: 'var(--hibah-terracotta)',
									color: 'white',
								}}
							>
								Post your first item <ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								href="/items"
								className="inline-flex items-center justify-center gap-2 rounded-lg px-10 py-4 text-base font-medium whitespace-nowrap border border-border bg-background transition-all hover:bg-muted"
							>
								<Users className="h-4 w-4" /> Browse community items
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ── FOOTER ── */}
			<footer
				className="py-8 border-t"
				style={{ borderColor: 'oklch(0.92 0.01 80)' }}
			>
				<div className="container mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} Hibah — Give freely. Receive
						gratefully.
					</p>
					<div className="flex items-center gap-6 text-sm text-muted-foreground">
						<Link
							href="/items"
							className="hover:text-foreground transition-colors"
						>
							Browse
						</Link>
						<Link
							href="/dashboard"
							className="hover:text-foreground transition-colors"
						>
							Dashboard
						</Link>
						<Link
							href="/chat"
							className="hover:text-foreground transition-colors"
						>
							Messages
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
