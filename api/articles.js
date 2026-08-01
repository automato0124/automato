const DEFAULT_ENDPOINT = "articles";
const DEFAULT_DATE_FIELD = "date";

function getMicroCMSConfig() {
  return {
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: process.env.MICROCMS_API_KEY,
    endpoint: process.env.MICROCMS_ENDPOINT || DEFAULT_ENDPOINT,
    dateField: process.env.MICROCMS_DATE_FIELD || DEFAULT_DATE_FIELD
  };
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  response.end(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  const config = getMicroCMSConfig();

  if (!config.serviceDomain || !config.apiKey) {
    sendJson(response, 500, { message: "microCMS environment variables are missing." });
    return;
  }

  const limit = Math.min(Number(request.query.limit || 5), 5);
  const params = new URLSearchParams({
    limit: String(limit),
    orders: `-${config.dateField},-publishedAt`,
    fields: `id,title,${config.dateField},publishedAt,revisedAt,createdAt`
  });
  const url = `https://${config.serviceDomain}.microcms.io/api/v1/${config.endpoint}?${params}`;
  const microCMSResponse = await fetch(url, {
    headers: {
      "X-MICROCMS-API-KEY": config.apiKey
    }
  });

  const body = await microCMSResponse.json();
  sendJson(response, microCMSResponse.status, body);
};
