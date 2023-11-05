import { derived, get as store_get } from "svelte/store";

import { base_url, fava_options } from "./stores";
import { searchParams, urlSyncedParams } from "./stores/url";

/**
 * Get the URL path relative to the base url of the current ledger.
 */
export function getUrlPath(
  url: Pick<URL | Location, "pathname">,
): string | null {
  const $base_url = store_get(base_url);
  return $base_url && url.pathname.startsWith($base_url)
    ? decodeURI(url.pathname.slice($base_url.length))
    : null;
}

/**
 * Get the URL string for one of Fava's reports.
 */
export function urlFor(
  report: string,
  params?: Record<string, string | number | undefined>,
  update = true,
): string {
  const url = `${store_get(base_url)}${report}`;
  const urlParams = new URLSearchParams();
  if (update) {
    const oldParams = store_get(searchParams);
    for (const name of urlSyncedParams) {
      const value = oldParams.get(name);
      if (value) {
        urlParams.set(name, value);
      }
    }
  }
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.set(key, `${value}`);
      }
    });
  }
  const urlParamString = urlParams.toString();
  return urlParamString ? `${url}?${urlParams.toString()}` : url;
}

/** URL for the editor to the source location of an entry. */
export function urlForSource(file_path: string, line: string): string {
  return store_get(fava_options).use_external_editor
    ? `beancount://${file_path}?lineno=${line}`
    : urlFor("editor/", { file_path, line });
}

/** URL for the account report (derived store to keep track of filter changes.). */
export const urlForAccount = derived(
  [searchParams],
  () =>
    (account: string, params?: Record<string, string>): string =>
      urlFor(`account/${account}/`, params),
);



/*
 * Set the inner HTML of an element in a way that will execute the contents of any script tags.
 *
 * Adapted from https://stackoverflow.com/a/47614491
 */
export function setInnerHTML(elm: HTMLElement, html: string) {
  elm.innerHTML = html;

  Array.from(elm.querySelectorAll("script")).forEach((oldScriptEl) => {
    const newScriptEl = document.createElement("script");

    Array.from(oldScriptEl.attributes).forEach((attr) => {
      newScriptEl.setAttribute(attr.name, attr.value);
    });

    const scriptText = document.createTextNode(oldScriptEl.innerHTML);
    newScriptEl.appendChild(scriptText);

    if (oldScriptEl.parentNode !== null) {
      oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
    }
  });
}
