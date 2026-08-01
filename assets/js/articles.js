(function () {
  const config = window.MICROCMS_CONFIG || {};
  const fallbackArticles = [
    {
      id: "2026-01-24",
      title: "Automatoを設立しました。",
      date: "2026-01-24T00:00:00.000+09:00",
      publishedAt: "2026-01-24T00:00:00.000Z",
      body: [
        "<p>2026年1月24日、業務自動化支援サービス Automato（オートメイト）を設立しました。</p>",
        "<p>Excel・スプレッドシート作業、業務管理ツール、RPAの導入を通じて、日々くり返している作業を実用的な仕組みに変えていきます。</p>",
        "<p>小さく始められて、現場で続けられる自動化を目指します。</p>"
      ].join("")
    }
  ];

  const hasMicroCMSConfig = Boolean(
    config.serviceDomain && config.apiKey && config.endpoint
  );

  function formatDate(value) {
    const parts = getDateParts(value);
    if (!parts) return "";
    return `${parts.year}.${parts.month}.${parts.day}`;
  }

  function formatDateTimeAttribute(value) {
    const parts = getDateParts(value);
    if (!parts) return "";
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function getDateParts(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("ja-JP-u-ca-gregory", {
      timeZone: config.timeZone || "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value])
    );
    return {
      year: parts.year,
      month: parts.month,
      day: parts.day
    };
  }

  function getArticleDate(article) {
    return article[config.dateField || "date"] || article.publishedAt || article.revisedAt || article.createdAt;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      };
      return entities[character];
    });
  }

  function createArticleUrl(id) {
    return `./article/?id=${encodeURIComponent(id)}`;
  }

  async function fetchMicroCMS(path, query) {
    const params = new URLSearchParams(query);
    const url = `https://${config.serviceDomain}.microcms.io/api/v1/${path}?${params}`;
    const response = await fetch(url, {
      headers: {
        "X-MICROCMS-API-KEY": config.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`microCMS request failed: ${response.status}`);
    }

    return response.json();
  }

  async function getArticles() {
    if (!hasMicroCMSConfig) return fallbackArticles;

    const data = await fetchMicroCMS(config.endpoint, {
      limit: "5",
      orders: `-${config.dateField || "date"},-publishedAt`,
      fields: `id,title,${config.dateField || "date"},publishedAt,revisedAt,createdAt`
    });

    return Array.isArray(data.contents) ? data.contents : fallbackArticles;
  }

  async function getArticle(id) {
    if (!hasMicroCMSConfig) {
      return fallbackArticles.find((article) => article.id === id) || fallbackArticles[0];
    }

    return fetchMicroCMS(`${config.endpoint}/${encodeURIComponent(id)}`, {});
  }

  function renderArticleList(articles) {
    const list = document.querySelector("[data-article-list]");
    if (!list) return;

    list.innerHTML = articles.slice(0, 5).map((article) => {
      const dateValue = getArticleDate(article);
      const dateText = formatDate(dateValue);
      const dateTime = formatDateTimeAttribute(dateValue);
      return [
        "<li>",
        `<a href="${createArticleUrl(article.id)}">`,
        `<time datetime="${dateTime}">${dateText}</time>`,
        `<span>${escapeHtml(article.title || "Untitled")}</span>`,
        "</a>",
        "</li>"
      ].join("");
    }).join("");
  }

  function renderArticleDetail(article) {
    const detail = document.querySelector("[data-article-detail]");
    if (!detail) return;

    const title = article.title || "Article";
    const dateValue = getArticleDate(article);
    const dateText = formatDate(dateValue);
    const body = article.body || "<p>本文がありません。</p>";

    document.title = `${title} | Automato`;
    document.querySelector("[data-article-page-title]").textContent = document.title;
    document.querySelector("[data-article-title]").textContent = title;
    document.querySelector("[data-article-date]").textContent = dateText;
    document.querySelector("[data-article-date]").setAttribute("datetime", formatDateTimeAttribute(dateValue));
    document.querySelector("[data-article-body]").innerHTML = body;
    detail.hidden = false;
    detail.classList.remove("article-loading");

    const description = document.querySelector("[data-article-description]");
    if (description) {
      description.setAttribute("content", `${title} | Automato`);
    }
  }

  async function initArticleList() {
    try {
      renderArticleList(await getArticles());
    } catch (error) {
      console.warn(error);
      renderArticleList(fallbackArticles);
    }
  }

  async function initArticleDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || fallbackArticles[0].id;

    try {
      renderArticleDetail(await getArticle(id));
    } catch (error) {
      console.warn(error);
      renderArticleDetail(fallbackArticles[0]);
    }
  }

  if (document.querySelector("[data-article-list]")) {
    initArticleList();
  }

  if (document.querySelector("[data-article-detail]")) {
    initArticleDetail();
  }
})();
