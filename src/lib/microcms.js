const DEFAULT_ENDPOINT = "articles";
const DEFAULT_DATE_FIELD = "date";
const TIME_ZONE = "Asia/Tokyo";

/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} [title]
 * @property {string} [body]
 * @property {string} [date]
 * @property {string} [publishedAt]
 * @property {string} [revisedAt]
 * @property {string} [createdAt]
 */

function getConfig() {
  return {
    serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: import.meta.env.MICROCMS_API_KEY,
    endpoint: import.meta.env.MICROCMS_ENDPOINT || DEFAULT_ENDPOINT,
    dateField: import.meta.env.MICROCMS_DATE_FIELD || DEFAULT_DATE_FIELD
  };
}

function hasConfig(config) {
  return Boolean(config.serviceDomain && config.apiKey);
}

async function fetchMicroCMS(path, params) {
  const config = getConfig();
  if (!hasConfig(config)) return null;

  const query = params ? `?${params}` : "";
  const response = await fetch(
    `https://${config.serviceDomain}.microcms.io/api/v1/${config.endpoint}${path}${query}`,
    {
      headers: {
        "X-MICROCMS-API-KEY": config.apiKey
      }
    }
  );

  if (!response.ok) {
    throw new Error(`microCMS request failed: ${response.status}`);
  }

  return response.json();
}

/** @param {Article | null | undefined} article */
export function getArticleDate(article) {
  const config = getConfig();
  return article?.[config.dateField] || article?.publishedAt || article?.revisedAt || article?.createdAt;
}

export function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("ja-JP-u-ca-gregory", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return `${parts.year}.${parts.month}.${parts.day}`;
}

export function formatDateTimeAttribute(value) {
  return formatDate(value).replaceAll(".", "-");
}

export async function getArticles(limit = 5) {
  const config = getConfig();
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 100)),
    orders: `-${config.dateField},-publishedAt`,
    fields: `id,title,body,${config.dateField},publishedAt,revisedAt,createdAt`
  });
  const data = await fetchMicroCMS("", params);

  return Array.isArray(data?.contents) ? /** @type {Article[]} */ (data.contents) : [];
}

/** @param {string} id */
export async function getArticle(id) {
  if (!id) return null;

  return fetchMicroCMS(`/${encodeURIComponent(id)}`);
}
