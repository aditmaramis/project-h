'use client';

import { useTranslations } from 'next-intl';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Pie,
	PieChart,
	Cell,
} from 'recharts';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Props = {
	signupsTimeline: { date: string; count: number }[];
	itemsTimeline: { date: string; count: number }[];
	itemsByStatus: {
		available: number;
		reserved: number;
		donated: number;
	};
};

const signupsChartConfig = {
	count: {
		label: 'Signups',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig;

const itemsChartConfig = {
	count: {
		label: 'Items',
		color: 'var(--chart-2)',
	},
} satisfies ChartConfig;

const statusChartConfig = {
	available: {
		label: 'Available',
		color: 'oklch(0.72 0.19 154)',
	},
	reserved: {
		label: 'Reserved',
		color: 'oklch(0.75 0.18 75)',
	},
	donated: {
		label: 'Donated',
		color: 'oklch(0.7 0.15 230)',
	},
} satisfies ChartConfig;

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function AdminOverviewCharts({
	signupsTimeline,
	itemsTimeline,
	itemsByStatus,
}: Props) {
	const t = useTranslations('Admin');

	const statusData = [
		{
			name: t('available'),
			value: itemsByStatus.available,
			fill: 'oklch(0.72 0.19 154)',
		},
		{
			name: t('reserved'),
			value: itemsByStatus.reserved,
			fill: 'oklch(0.75 0.18 75)',
		},
		{
			name: t('donated'),
			value: itemsByStatus.donated,
			fill: 'oklch(0.7 0.15 230)',
		},
	];

	return (
		<Tabs defaultValue="signups">
			<TabsList>
				<TabsTrigger value="signups">{t('signupsOverTime')}</TabsTrigger>
				<TabsTrigger value="items">{t('itemsOverTime')}</TabsTrigger>
				<TabsTrigger value="status">{t('itemsByStatus')}</TabsTrigger>
			</TabsList>

			{/* Signups area chart */}
			<TabsContent value="signups">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">{t('userGrowth')}</CardTitle>
						<CardDescription>{t('last30Days')}</CardDescription>
					</CardHeader>
					<CardContent>
						{signupsTimeline.length === 0 ? (
							<p className="text-sm text-muted-foreground py-12 text-center">
								{t('noData')}
							</p>
						) : (
							<ChartContainer
								config={signupsChartConfig}
								className="h-[300px] w-full"
							>
								<AreaChart
									data={signupsTimeline}
									margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
								>
									<defs>
										<linearGradient
											id="signupsFill"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--chart-1)"
												stopOpacity={0.3}
											/>
											<stop
												offset="95%"
												stopColor="var(--chart-1)"
												stopOpacity={0.02}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickFormatter={formatDate}
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										allowDecimals={false}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												labelFormatter={(label) => formatDate(String(label))}
											/>
										}
									/>
									<Area
										dataKey="count"
										type="monotone"
										fill="url(#signupsFill)"
										stroke="var(--chart-1)"
										strokeWidth={2}
									/>
								</AreaChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			{/* Items bar chart */}
			<TabsContent value="items">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">{t('contentOverview')}</CardTitle>
						<CardDescription>{t('last30Days')}</CardDescription>
					</CardHeader>
					<CardContent>
						{itemsTimeline.length === 0 ? (
							<p className="text-sm text-muted-foreground py-12 text-center">
								{t('noData')}
							</p>
						) : (
							<ChartContainer
								config={itemsChartConfig}
								className="h-[300px] w-full"
							>
								<BarChart
									data={itemsTimeline}
									margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickFormatter={formatDate}
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										allowDecimals={false}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												labelFormatter={(label) => formatDate(String(label))}
											/>
										}
									/>
									<Bar
										dataKey="count"
										fill="var(--chart-2)"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			{/* Items by status pie chart */}
			<TabsContent value="status">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">{t('itemsByStatus')}</CardTitle>
						<CardDescription>{t('contentOverview')}</CardDescription>
					</CardHeader>
					<CardContent>
						{statusData.every((d) => d.value === 0) ? (
							<p className="text-sm text-muted-foreground py-12 text-center">
								{t('noData')}
							</p>
						) : (
							<ChartContainer
								config={statusChartConfig}
								className="mx-auto h-[300px] w-full max-w-[400px]"
							>
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Pie
										data={statusData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										outerRadius={110}
										innerRadius={60}
										strokeWidth={2}
									>
										{statusData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={entry.fill}
											/>
										))}
									</Pie>
								</PieChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
