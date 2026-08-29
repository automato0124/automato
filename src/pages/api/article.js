const DEFAULT_ENDPOINT = "articles";

function getMicroCMSConfig() {
  return {
    serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: import.meta.env.MICROCMS_API_KEY,
    endpoint: import.meta.env.MICROCMS_ENDPOINT || DEFAULT_ENDPOINT
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
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id");

  if (!config.serviceDomain || !config.apiKey) {
    return sendJson(500, { message: "microCMS environment variables are missing." });
  }

  if (!id) {
    return sendJson(400, { message: "Article id is required." });
  }

  const microCMSUrl = `https://${config.serviceDomain}.microcms.io/api/v1/${config.endpoint}/${encodeURIComponent(id)}`;
  const microCMSResponse = await fetch(microCMSUrl, {
    headers: {
      "X-MICROCMS-API-KEY": config.apiKey
    }
  });

  return sendJson(microCMSResponse.status, await microCMSResponse.json());
}
