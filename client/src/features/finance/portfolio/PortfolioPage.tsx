import { useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ForecastControls } from './components/ForecastControls';
import { PasteInput } from './components/PasteInput';
import { PortfolioChart } from './components/PortfolioChart';
import { useForecast } from './hooks/useForecast';
import { toPortfolioSeries } from './lib/aggregate';
import { buildChartData } from './lib/chartData';
import { MIN_RETURNS, RECOMMENDED_RETURNS } from './lib/forecast/monteCarlo';
import { parseHoldingSnapshots } from './lib/parsePaste';
import { SummaryStats } from './components/SummaryStats';
import { useLocalStorage } from './hooks/useLocalStorage';

const STORAGE_KEY = 'carecoin:portfolio-paste:v1'; // bump v1 if the format ever changes

const PortfolioPage = () => {
  const [pastedText, setPastedText, clearPastedText] = useLocalStorage<string>(
    STORAGE_KEY,
    '',
  );
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(24);
  const [contribution, setContribution] = useState(0);

  // Derived state: no separate `snapshots` state to keep in sync
  const snapshots = useMemo(() => {
    if (!pastedText) return [];
    try {
      return parseHoldingSnapshots(pastedText);
    } catch {
      return []; // saved text no longer parses (e.g. format changed): treat as empty
    }
  }, [pastedText]);

  const series = useMemo(() => toPortfolioSeries(snapshots), [snapshots]);

  const forecast = useForecast(series, months, contribution);
  const chartData = useMemo(
    () => buildChartData(series, forecast),
    [series, forecast],
  );

  const handleSubmit = (text: string) => {
    try {
      parseHoldingSnapshots(text); // validate first, so bad input never overwrites good saved data
      setPastedText(text);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse data');
    }
  };

  const handleClear = () => {
    clearPastedText();
    setError(null);
  };

  return (
    <main className="space-y-6 mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Paste portfolio data</CardTitle>
        </CardHeader>
        <CardContent>
          <PasteInput
            onSubmit={handleSubmit}
            onClear={handleClear}
            hasSavedData={pastedText !== ''}
            error={error}
          />
        </CardContent>
      </Card>

      {series.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Portfolio and forecast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ForecastControls
                months={months}
                monthlyContribution={contribution}
                onMonthsChange={setMonths}
                onContributionChange={setContribution}
              />
              {forecast.length === 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Found {series.length} monthly snapshot(s). Need at least{' '}
                    {MIN_RETURNS + 1} to forecast.
                  </AlertDescription>
                </Alert>
              )}
              {forecast.length > 0 &&
                series.length - 1 < RECOMMENDED_RETURNS && (
                  <Alert>
                    <AlertDescription>
                      Only {series.length} snapshots: the forecast range is
                      unreliable. {RECOMMENDED_RETURNS + 1}+ is recommended.
                    </AlertDescription>
                  </Alert>
                )}
              <PortfolioChart data={chartData} />
            </CardContent>
          </Card>
          <SummaryStats
            series={series}
            forecast={forecast}
            monthlyContribution={contribution}
          />
        </>
      )}
    </main>
  );
};

export default PortfolioPage;
