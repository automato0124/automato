const DEFAULT_ENDPOINT = "articles";
const DEFAULT_DATE_FIELD = "date";

function getMicroCMSConfig() {
  return {
    serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: import.meta.env.MICROCMS_API_KEY,
    endpoint: import.meta.env.MICROCMS_ENDPOINT || DEFAULT_ENDPOINT,
    dateField: import.meta.env.MICROCMS_DATE_FIELD || DEFAULT_DATE_FIELD
  };
}

function sendJson(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
    }
  });
}

export async function GET({ request }) {
  const config = getMicroCMSConfig();

  if (!config.serviceDomain || !config.apiKey) {
    return sendJson(500, { message: "microCMS environment variables are missing." });
  }

  const requestUrl = new URL(request.url);
  const limit = Math.min(Number(requestUrl.searchParams.get("limit") || 5), 5);
  const params = new URLSearchParams({
    limit: String(limit),
    orders: `-${config.dateField},-publishedAt`,
    fields: `id,title,${config.dateField},publishedAt,revisedAt,createdAt`
  });
  const microCMSUrl = `https://${config.serviceDomain}.microcms.io/api/v1/${config.endpoint}?${params}`;
  const microCMSResponse = await fetch(microCMSUrl, {
    headers: {
      "X-MICROCMS-API-KEY": config.apiKey
    }
  });

  return sendJson(microCMSResponse.status, await microCMSResponse.json());
}
