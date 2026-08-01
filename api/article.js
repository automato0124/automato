const DEFAULT_ENDPOINT = "articles";

function getMicroCMSConfig() {
  return {
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: process.env.MICROCMS_API_KEY,
    endpoint: process.env.MICROCMS_ENDPOINT || DEFAULT_ENDPOINT
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
  const id = request.query.id;

  if (!config.serviceDomain || !config.apiKey) {
    sendJson(response, 500, { message: "microCMS environment variables are missing." });
    return;
  }

  if (!id) {
    sendJson(response, 400, { message: "Article id is required." });
    return;
  }

  const url = `https://${config.serviceDomain}.microcms.io/api/v1/${config.endpoint}/${encodeURIComponent(id)}`;
  const microCMSResponse = await fetch(url, {
    headers: {
      "X-MICROCMS-API-KEY": config.apiKey
    }
  });

  const body = await microCMSResponse.json();
  sendJson(response, microCMSResponse.status, body);
};
