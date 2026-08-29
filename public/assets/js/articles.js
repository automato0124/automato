(function () {
  const config = window.MICROCMS_CONFIG || {};
  const hasMicroCMSConfig = Boolean(config.apiBase);

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
    return `/article/?id=${encodeURIComponent(id)}`;
  }

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`);
    }

    return response.json();
  }

  async function getArticles() {
    if (!hasMicroCMSConfig) return [];

    const params = new URLSearchParams({ limit: "5" });
    const data = await fetchJson(`${config.apiBase}/articles?${params}`);

    return Array.isArray(data.contents) ? data.contents : [];
  }

  async function getArticle(id) {
    if (!hasMicroCMSConfig) return null;

    const params = new URLSearchParams({ id });
    return fetchJson(`${config.apiBase}/article?${params}`);
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
    if (!article) {
      document.querySelector("[data-article-title]").textContent = "記事が見つかりませんでした";
      document.querySelector("[data-article-body]").innerHTML = "<p>記事を取得できませんでした。</p>";
      detail.hidden = false;
      detail.classList.remove("article-loading");
      return;
    }

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
      renderArticleList([]);
    }
  }

  async function initArticleDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    try {
      renderArticleDetail(id ? await getArticle(id) : null);
    } catch (error) {
      console.warn(error);
      renderArticleDetail(null);
    }
  }

  if (document.querySelector("[data-article-list]")) {
    initArticleList();
  }

  if (document.querySelector("[data-article-detail]")) {
    initArticleDetail();
  }
})();
