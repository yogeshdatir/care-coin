import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/components/ui/chart';
import { formatINR, formatINRCompact } from '../lib/format';
import type { ChartDatum } from '../types';

// `theme` gives separate light/dark values; shadcn exposes them as --color-<key>
const chartConfig = {
  value: {
    label: 'Current Value',
    theme: { light: '#2a78d6', dark: '#3987e5' },
  },
  invested: {
    label: 'Total Invested',
    theme: { light: '#1baf7a', dark: '#199e70' },
  },
  forecast: {
    label: 'Forecast (median)',
    theme: { light: '#eb6834', dark: '#d95926' },
  },
} satisfies ChartConfig;

export function PortfolioChart({ data }: { data: ChartDatum[] }) {
  const splitLabel = [...data]
    .reverse()
    .find((d) => d.value !== undefined)?.label;
  const endLabel = data[data.length - 1]?.label;
  const hasForecast = data.some((d) => d.band && d.value === undefined);

  return (
    <ChartContainer config={chartConfig} className="w-full h-[400px]">
      <ComposedChart
        accessibilityLayer
        data={data}
        margin={{ left: 8, right: 16 }}
      >
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.3}
            />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={formatINRCompact}
          tickLine={false}
          axisLine={false}
          width={64}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex justify-between items-center gap-4 w-full">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="rounded-full w-2 h-2"
                      style={{ background: `var(--color-${name})` }}
                    />
                    {chartConfig[name as keyof typeof chartConfig]?.label ??
                      name}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatINR(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />

        {/* Forecast zone: tinted background from the split point onward */}
        {hasForecast && splitLabel && endLabel && (
          <ReferenceArea
            x1={splitLabel}
            x2={endLabel}
            fill="var(--color-forecast)"
            fillOpacity={0.06}
          />
        )}

        {/* 10–90% range */}
        <Area
          dataKey="band"
          fill="var(--color-forecast)"
          fillOpacity={0.18}
          stroke="none"
          tooltipType="none"
          legendType="none"
        />

        {/* History */}
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="url(#fillValue)"
          dot={false}
          activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
        />
        <Line
          dataKey="invested"
          type="monotone"
          stroke="var(--color-invested)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
        />

        {/* Forecast */}
        <Line
          dataKey="forecast"
          type="monotone"
          stroke="var(--color-forecast)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
        />

        {hasForecast && splitLabel && (
          <ReferenceLine
            x={splitLabel}
            stroke="var(--color-forecast)"
            strokeDasharray="3 3"
            label={{
              value: 'Forecast →',
              position: 'insideTopRight',
              fontSize: 12,
              fill: 'var(--muted-foreground)',
            }}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
