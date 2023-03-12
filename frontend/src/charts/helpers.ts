import { hcl } from "d3-color";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { derived, get } from "svelte/store";

import { accounts, currencies_sorted, operating_currency } from "../stores";
import { currentTimeFilterDateFormat } from "../stores/format";

/**
 * Set the time filter to the given value (formatted according to the current interval).
 * @param date - a date.
 * @returns A URL for the given interval.
 */
export function urlForTimeFilter(date: Date): string {
  const url = new URL(window.location.href);
  url.searchParams.set("time", get(currentTimeFilterDateFormat)(date));
  return url.toString();
}

/**
 * Filter ticks to have them not overlap.
 * @param domain - The domain of values to filter.
 * @param count - The number of ticks that should be returned.
 */
export function filterTicks(domain: string[], count: number): string[] {
  if (domain.length <= count) {
    return domain;
  }
  const showIndices = Math.ceil(domain.length / count);
  return domain.filter((d, i) => i % showIndices === 0);
}

/**
 * Generate an array of colors.
 *
 * Uses the HCL color space in an attempt to generate colours that are
 * to be perceived to be of the same brightness.
 * @param count - the number of colors to generate.
 * @param chroma - optional, the chroma channel value.
 * @param luminance - optional, the luminance channel value.
 */
export function hclColorRange(
  count: number,
  chroma = 45,
  luminance = 70
): string[] {
  const offset = 270;
  const delta = 360 / count;
  const colors = [...Array(count).keys()].map((index) => {
    const hue = (index * delta + offset) % 360;
    return hcl(hue, chroma, luminance);
  });
  return colors.map((c) => c.toString());
}



export const colors10 = ["#1f77b4",
"#ff7f0e",
"#2ca02c",
"#d62728",
"#9467bd",
"#8c564b",
"#e377c2",
"#7f7f7f",
"#bcbd22",
"#17becf",];//hclColorRange(10, 70, 70);
export const colors15 = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];
//hclColorRange(15, 30, 80);

/*
 * The color scales for the charts.
 *
 * The scales for treemap and sunburst charts will be initialised with all
 * accounts on page init and currencies with all commodities.
 */
export const scatterplotScale = scaleOrdinal(colors10);

export const treemapScale = derived(accounts, (accounts_val) =>
  scaleOrdinal(colors15).domain(accounts_val)
);

export const sunburstScale = derived(accounts, (accounts_val) =>
  scaleOrdinal(schemeCategory10).domain(accounts_val)
);

export const currenciesScale = derived(
  [operating_currency, currencies_sorted],
  ([operating_currency_val, currencies_sorted_val]) =>
    scaleOrdinal(colors10).domain([
      ...operating_currency_val,
      ...currencies_sorted_val,
    ])
);
