# Portfolio Chart, Forecast and Summary: Calculation Logic

How the app turns a pasted Excel table into a chart, a forecast and summary statistics.
This document explains the **logic**. For the code, see the files listed in [File map](#file-map).

---

## 1. Pipeline overview

```
Pasted text ◄──► saved in browser localStorage (see §13)
   │  parseHoldingSnapshots        (parsePaste.ts)
   ▼
HoldingSnapshot[]        one row per instrument per snapshot date
   │  toPortfolioSeries            (aggregate.ts)
   ▼
PortfolioPoint[]         one point per date: total invested + total value
   │
   ├─► monthlyReturns              (returns.ts)
   │      ▼
   │   number[]                    contribution-adjusted monthly returns
   │      ├─► portfolioStats        (stats.ts)      → summary tiles
   │      └─► forecastPortfolio     (monteCarlo.ts) → P10 / P50 / P90 per future month
   │                                   │
   │                                   ├─► pickMilestones (milestones.ts) → forecast table
   │                                   ▼
   └──────────────────────────► buildChartData (chartData.ts) → chart
```

Everything in `lib/` is a pure function (no React, no side effects), so each step can be tested on its own.

---

## 2. Step 1: Parsing the pasted table

| Rule          | Detail                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Separator     | Excel copies cells as tab-separated text, so rows split on newline and cells on tab                                          |
| Columns       | Found **by header name**, not position: `Snapshot Date`, `Instrument Name`, `Asset Class`, `Total Invested`, `Current Value` |
| Other columns | Ignored (Investor, XIRR, Allocation %, Notes, Monthly Fixed Income, etc.). See the warning on `Monthly Fixed Income` in §9.  |
| Numbers       | Everything except digits, `.` and `-` is stripped, so `₹12,34,567` becomes `1234567`. `(1,000)` becomes `-1000`.             |
| Dates         | `Date.parse` first, then a `dd/mm/yyyy` or `dd-mm-yyyy` fallback. An unreadable date throws an error naming the row.         |

---

## 3. Step 2: Aggregating into one portfolio series

Your sheet has **one row per instrument per snapshot date**. The chart needs one point per date.

```
for each distinct snapshot date:
    invested = sum of Total Invested over all instruments
    value    = sum of Current Value  over all instruments
```

Points are sorted by timestamp.

**Warning:** if `Snapshot Date` is the same on every row (for example, the export date), everything collapses into one point and no forecast is possible. In that case, group by the `Month` column instead.

---

## 4. Step 3: Monthly returns (the core calculation)

Everything downstream depends on this step.

### The problem

`Current Value` goes up for two reasons: your investments grew, **or** you deposited more money. Only the first is a return.

### The fix

New money in a month is the change in `Total Invested`:

```
newMoney_t = invested_t − invested_(t−1)

return_t = (value_t − newMoney_t) / value_(t−1) − 1
```

In words: take this month's value, remove the money you added, and compare it to last month's value.

### Worked example

| Month | Invested | Value   | New money | Return                                        |
| ----- | -------- | ------- | --------- | --------------------------------------------- |
| Jan   | 100,000  | 100,000 | –         | –                                             |
| Feb   | 110,000  | 112,000 | 10,000    | (112,000 − 10,000) / 100,000 − 1 = **+2.00%** |
| Mar   | 110,000  | 108,000 | 0         | 108,000 / 112,000 − 1 = **−3.57%**            |
| Apr   | 120,000  | 123,000 | 10,000    | (123,000 − 10,000) / 108,000 − 1 = **+4.63%** |

Without the adjustment, February would look like +12% because of the deposit.

### Assumptions and limits

- New money is assumed to arrive at the **end** of the month, so it earns nothing that month. The returns are therefore approximate.
- If a month's snapshot is missing, "monthly" returns span more than one month and overstate volatility.
- Months where the previous value is 0 or negative are skipped.

---

## 5. Step 4: Summary statistics

Computed from the monthly returns above. With the 3 returns from the example (n = 3):

| Stat                    | Formula                                              | Example                                         |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| **Gain / Loss**         | `value − invested` (latest snapshot)                 | 123,000 − 120,000 = 3,000                       |
| **Gain %**              | `gain / invested`                                    | 2.5%                                            |
| **Annualized return**   | `(Π(1+r))^(12/n) − 1`                                | (1.02 × 0.9643 × 1.0463)^(12/3) − 1 ≈ **12.2%** |
| **Volatility (annual)** | sample std dev of `r` × √12                          | 4.19% × 3.46 ≈ **14.5%**                        |
| **Max drawdown**        | largest fall from a running peak of the return index | **−3.57%**                                      |

### Notes on each

- **Annualized return** is geometric (compounded), not the average. It is **time-weighted**: deposits are excluded, so it measures how well the investments performed, not how much you added. It is not XIRR (which is money-weighted and depends on when you deposited).
- **Volatility** uses the sample standard deviation (divide by n−1), then scales by √12 to turn monthly into annual. It needs at least 2 returns.
- **Max drawdown** is computed on a **return index** that starts at 1 and multiplies by `(1 + r)` each month. This way a withdrawal is not mistaken for a crash, and a deposit does not hide one.
  - Index: 1.0000 → 1.0200 → 0.9836 → 1.0291
  - Peak: 1.0000 → 1.0200 → 1.0200 → 1.0291
  - Worst fall: 0.9836 / 1.0200 − 1 = −3.57%

All three show `–` when there are fewer than 3 snapshots.

---

## 6. Step 5: The forecast (Monte Carlo bootstrap)

### Idea

Nobody knows the next 24 months. Instead of guessing one path, **simulate 1,000 plausible futures by replaying months from your own history in random order**, then look at the spread of outcomes.

### Algorithm

```
inputs:  series (history), months (horizon), monthlyContribution, simulations = 1000

returns = monthlyReturns(series)
if returns.length < 3 or months < 1  →  no forecast

start = latest value

repeat 1000 times (one "path"):
    v = start
    repeat `months` times:
        r = a random pick from `returns`          ← "bootstrap": sampling with replacement
        v = v × (1 + r) + monthlyContribution
        record v for this month

for each future month m:
    take the 1000 values recorded for month m, sort them
    P10 = value at 10% position
    P50 = value at 50% position
    P90 = value at 90% position
```

### One simulated path, by example

Starting value 123,000, contribution 5,000/month, using the 3 returns from §4 (+2.00%, −3.57%, +4.63%). Suppose the random picks are +4.63%, +2.00%, −3.57%:

| Month | Pick   | Calculation              | Value   |
| ----- | ------ | ------------------------ | ------- |
| 1     | +4.63% | 123,000 × 1.0463 + 5,000 | 133,694 |
| 2     | +2.00% | 133,694 × 1.0200 + 5,000 | 141,368 |
| 3     | −3.57% | 141,368 × 0.9643 + 5,000 | 141,319 |

The real run does this 1,000 times with different picks and then summarizes.

### From 1,000 paths to P10 / P50 / P90

For a given month, the 1,000 simulated values are sorted from smallest to largest:

```
percentile(sorted, p) = sorted[ min(n − 1, floor(p × n)) ]

P10 → index 100  (the 101st smallest of 1,000)
P50 → index 500
P90 → index 900
```

This is a simple nearest-rank percentile, which is accurate enough with 1,000 simulations.

| Label            | Meaning                                   |
| ---------------- | ----------------------------------------- |
| **P10 (Low)**    | 10% of simulated futures ended below this |
| **P50 (Median)** | Half ended below, half above              |
| **P90 (High)**   | 90% of simulated futures ended below this |

They are **not** worst case and best case, and they are not guarantees.

### Reproducibility

The random number generator is a seeded `mulberry32(42)`, so the same data gives the **same chart every time**. In tests the generator is injected so results are deterministic. Change the seed (or pass a different `rng`) to see how much the result depends on luck.

### Contributions

The monthly contribution you enter is added **after** each month's growth (`v × (1 + r) + c`). It is a flat amount every month, with no inflation or step-ups.

---

## 7. Step 6: Building the chart data

`buildChartData` merges history and forecast into one list so a single chart can show both.

| Data point                | `invested` | `value` | `forecast`  | `band`             |
| ------------------------- | ---------- | ------- | ----------- | ------------------ |
| Historical month          | ✓          | ✓       | –           | –                  |
| **Last historical month** | ✓          | ✓       | ✓ (= value) | ✓ ([value, value]) |
| Future month              | –          | –       | P50         | [P10, P90]         |

The last historical month deliberately carries the forecast fields too (the **anchor**). This makes the dashed forecast line start exactly where the solid line ends, so there is no visible gap.

The chart then uses:

- a solid blue line (area gradient) for `value`
- a solid aqua line for `invested`
- a dashed orange line for `forecast`, with a shaded orange band for `[P10, P90]`
- a tinted background and a "Forecast →" marker where the forecast begins

---

## 8. Step 7: Forecast table

`pickMilestones` shows 1-year, 3-year and 5-year points that fit inside the chosen horizon, plus the final month.

| Horizon set to | Rows shown             |
| -------------- | ---------------------- |
| 24 months      | 1 yr, 2 yr             |
| 48 months      | 1 yr, 3 yr, 4 yr       |
| 72 months      | 1 yr, 3 yr, 5 yr, 6 yr |

Each cell shows the forecast value and its **change vs today**:

```
change₹ = forecastValue − currentValue
change% = change₹ / currentValue
```

**Caution:** if a monthly contribution is entered, the change includes those deposits. It is not a pure investment return. The table footnote says this.

---

## 9. Limitations (read before relying on the numbers)

| Limitation                                      | Why it matters                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **The future is assumed to look like the past** | A strong bull run in your history makes the median look optimistic. A crash that is not in your data cannot appear in the simulation. |
| **Little history means a weak forecast**        | With only a few returns, the bootstrap keeps re-picking the same few values. A warning shows below 12 returns.                        |
| **Returns are independent**                     | Real markets have momentum and crashes that cluster. Shuffling months destroys this, which understates the risk of long bad streaks.  |
| **All instruments are treated as one**          | Sectors, asset classes and rebalancing are ignored.                                                                                   |
| **Fees, tax and inflation are ignored**         | Values are nominal, before tax.                                                                                                       |
| **Month-end contribution timing**               | See §4.                                                                                                                               |
| **Missing months**                              | See §4.                                                                                                                               |

This is a way to understand your own historical behavior, not financial advice.

### Why the forecast can look pessimistic short-term and optimistic long-term

The algorithm has no built-in optimism or pessimism. The median path grows at roughly your **historical geometric return**, and the band reflects how much your monthly returns varied. Several mechanics can still make the chart look lopsided:

| #   | Effect                                                                                                                                                                               | Looks like                             | Direction        | Likelihood                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ---------------- | ---------------------------------------------------- |
| 1   | **History is extrapolated.** A good stretch (e.g. 14% annualized) is compounded forward for years.                                                                                   | Long-term numbers too high             | Optimistic       | Most likely with under ~3 years of data              |
| 2   | **Skewed spread in ₹.** Compounding is multiplicative, so the upside grows faster than the downside, which cannot go below 0. P90 − P50 > P50 − P10.                                 | Band tilts upward as the horizon grows | Looks optimistic | Very likely, and normal (a scale effect, not a bias) |
| 3   | **Volatility drag.** The median path sits below an "average return × time" line, because losses hurt more than equal gains help. The gap is about σ²/2 per period.                   | Short-term median feels low            | Pessimistic      | Likely, mild                                         |
| 4   | **Small sample.** With ~12–24 returns, one bad month is re-picked often, so the 1–6 month range is wide and noisy.                                                                   | Wide, low P10 early                    | Pessimistic      | Possible                                             |
| 5   | **No crash clustering.** Months are shuffled independently, so a long run of bad months is rare in the simulation.                                                                   | Long-term downside too narrow          | Optimistic       | Real limitation                                      |
| 6   | **Deposit timing.** New money is assumed to arrive at month end. If you deposit early in the month, that deposit's growth is subtracted from the return, so returns are understated. | Every return slightly low              | Pessimistic      | Possible if deposits are large vs the portfolio      |
| 7   | **Ignored `Monthly Fixed Income` column.** If income is paid out and is not kept in `Current Value`, returns are understated. If it is reinvested, there is no issue.                | Returns low                            | Pessimistic      | Check your data                                      |

**Quick consistency check:** compare the _Annualized return_ tile with the _12-month P50 change %_ (with the monthly contribution set to 0).

| Result                                              | Meaning                                                    |
| --------------------------------------------------- | ---------------------------------------------------------- |
| P50 change ≈ annualized return (within ~1–2 points) | The algorithm is consistent. What you see is your history. |
| P50 change clearly lower                            | Volatility drag or a small sample (#3, #4)                 |
| P50 change clearly higher                           | A bug or a data issue                                      |

### Calibration options (not yet implemented)

| Option                                                                                                            | What it changes                                    | Effort       |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------ |
| **Demean and re-center:** subtract the historical mean return and add an assumed long-run return (e.g. 10–12%/yr) | Removes #1                                         | Small        |
| **Block bootstrap:** resample 3–6 consecutive months at a time                                                    | Captures streaks, fixes #5                         | Medium       |
| **Blend:** e.g. 50% your history + 50% an assumed long-run return                                                 | Softens #1 without ignoring your data              | Small        |
| **Assumed-return toggle in the UI**                                                                               | Compare "my history" vs "assumed 10%" side by side | Small–medium |

Recommended: the blend plus the toggle. It addresses long-term optimism, which is the riskiest side for decisions, and keeps your data visible.

---

## 10. Settings you can change

| Setting                             | Where                                | Default                       |
| ----------------------------------- | ------------------------------------ | ----------------------------- |
| Simulation count                    | `simulations` in `forecastPortfolio` | 1000                          |
| Minimum returns for any forecast    | `MIN_RETURNS`                        | 3                             |
| Returns below which a warning shows | `RECOMMENDED_RETURNS`                | 12                            |
| Random seed                         | `mulberry32(42)`                     | 42                            |
| Table milestones                    | `MILESTONE_MONTHS`                   | 12, 36, 60                    |
| Horizon / contribution              | Controls above the chart             | 24 months / 0                 |
| Storage key for pasted data         | `STORAGE_KEY` in `App.tsx`           | `carecoin:portfolio-paste:v1` |

---

## 11. File map

| File                                             | Responsibility                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `portfolio/types.ts`                             | `HoldingSnapshot`, `PortfolioPoint`, `ForecastPoint`, `ChartDatum`                                         |
| `portfolio/lib/parsePaste.ts`                    | Parsing (§2)                                                                                               |
| `portfolio/lib/aggregate.ts`                     | `toPortfolioSeries` (§3)                                                                                   |
| `portfolio/lib/returns.ts`                       | `monthlyReturns` (§4)                                                                                      |
| `portfolio/lib/stats.ts`                         | `portfolioStats` (§5)                                                                                      |
| `portfolio/lib/forecast/monteCarlo.ts`           | `forecastPortfolio`, seeded RNG (§6)                                                                       |
| `portfolio/lib/chartData.ts`                     | `buildChartData` (§7)                                                                                      |
| `portfolio/lib/milestones.ts`, `change.ts`       | Forecast table rows and change (§8)                                                                        |
| `portfolio/lib/format.ts`, `dates.ts`, `tone.ts` | Indian number formats, month labels, sign colors                                                           |
| `portfolio/hooks/useForecast.ts`                 | Memoized forecast for React                                                                                |
| `portfolio/hooks/useLocalStorage.ts`             | Generic persisted state used for the pasted text (§13)                                                     |
| `portfolio/components/*`                         | `PasteInput`, `PortfolioChart`, `ForecastControls`, `SummaryStats`, `StatTile`, `ForecastCell`, `TermHint` |

## 12. How to test the logic

| Unit                | Good test cases                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `monthlyReturns`    | The §4 example gives +2.00%, −3.57%, +4.63%. A pure deposit gives a 0% return.                                                                                                       |
| `portfolioStats`    | The §5 example gives ≈12.2% annualized, ≈14.5% volatility, −3.57% drawdown. Under 3 points gives nulls.                                                                              |
| `forecastPortfolio` | Same seed gives the same output. P10 ≤ P50 ≤ P90. If every return is +1%, the P50 is deterministic. A higher contribution gives a higher end value. Fewer than 3 returns gives `[]`. |
| `buildChartData`    | The last historical point has `forecast`. Future points have no `value`.                                                                                                             |
| `pickMilestones`    | 24 months gives [12, 24]. 60 months gives [12, 36, 60].                                                                                                                              |
| `useLocalStorage`   | Returns the initial value when empty; reads an existing value; `set` persists; `clear` removes it; survives `getItem` throwing and corrupt JSON                                      |
| `App` (RTL)         | With valid text pre-seeded in `localStorage`, the chart appears on first render; invalid new input keeps the old chart and shows the error; Clear empties the view                   |

---

## 13. Saved data (browser storage)

The pasted table is kept in `localStorage` until the user pastes again or clears it.

| Decision                        | Detail                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **What is stored**              | The **raw pasted text**, not the parsed rows. It is re-parsed on every load, so parser fixes apply to old saved data automatically.  |
| **Key**                         | `carecoin:portfolio-paste:v1`. Bump `v1` if the stored format ever changes.                                                          |
| **Why localStorage**            | Small text, synchronous access, survives refresh. `sessionStorage` is lost when the tab closes. IndexedDB is overkill for one table. |
| **Derived state**               | `snapshots` is computed from the saved text with `useMemo`. There is no second copy to keep in sync.                                 |
| **Save only valid data**        | New input is parsed first. If it fails, the error is shown and the **previous saved data and chart are kept**.                       |
| **Saved text no longer parses** | Treated as empty. The app does not crash.                                                                                            |
| **Clear saved data**            | Removes the key and resets the view.                                                                                                 |
| **Storage blocked or full**     | Reads and writes are wrapped in `try/catch`. The app keeps working in memory for that session.                                       |

Things to know:

- `localStorage` is **unencrypted** and readable by anyone using the same browser profile. On a shared computer, use _Clear saved data_.
- Data is per browser and per origin. Another browser, device, or `localhost` port starts empty.
- The limit is about 5 MB, far above a typical instrument table.
- Horizon and contribution are not persisted. Persisting them is a one-line change with the same hook.
- `useLocalStorage` takes `initial` as a dependency of `clear`. Pass a primitive or a hoisted module constant, never an inline object.

## 14. UI notes related to the forecast table

- Column headers read **Low (P10)**, **Median (P50)** and **High (P90)**. Each has an info icon with a one-line explanation, and the table footnote repeats the meaning for touch screens where tooltips are awkward.
- Tooltips need a `TooltipProvider` once at the app root (`main.tsx`). Components that use tooltips need the same provider in RTL tests (a shared `renderWithProviders` helper).
