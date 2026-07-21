/**
 * Zoho Embedded App SDK shim for Create Contract PDF.
 * All calls go through one API: /api/widgets/create-contract-pdf?action=…
 */
(function () {
  const API = "/api/widgets/create-contract-pdf";

  function recordIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("recordId") || params.get("id") || "").trim();
  }

  function apiUrl(action, extraQuery) {
    var q = "action=" + encodeURIComponent(action);
    if (extraQuery) q += "&" + extraQuery;
    return API + "?" + q;
  }

  async function jsonFetch(url, options) {
    const res = await fetch(url, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error || body.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  const pageLoadHandlers = [];

  window.ZOHO = {
    embeddedApp: {
      on: function (event, handler) {
        if (event === "PageLoad" && typeof handler === "function") {
          pageLoadHandlers.push(handler);
        }
      },
      init: function () {
        const id = recordIdFromQuery();
        const entityData = { EntityId: id, Entity: "Contracts" };
        pageLoadHandlers.forEach(function (handler) {
          try {
            handler(entityData);
          } catch (err) {
            console.error("[zoho-shim] PageLoad handler error", err);
          }
        });
      },
    },
    CRM: {
      API: {
        getRecord: async function (config) {
          const entity = String(config.Entity || "").trim();
          const recordId = String(config.RecordID || "").trim();

          if (entity === "Contracts") {
            return jsonFetch(
              apiUrl("contract", "id=" + encodeURIComponent(recordId)),
            );
          }

          return jsonFetch(
            apiUrl(
              "related",
              "module=" +
                encodeURIComponent(entity) +
                "&id=" +
                encodeURIComponent(recordId),
            ),
          );
        },

        uploadFile: async function (config) {
          const file = config && config.FILE && config.FILE.file;
          if (!file) {
            throw new Error("uploadFile: missing FILE.file");
          }
          const form = new FormData();
          form.append("file", file, file.name || "contract.pdf");
          const contractId = recordIdFromQuery();
          if (contractId) {
            form.append("contractId", contractId);
          }
          return jsonFetch(apiUrl("upload"), { method: "POST", body: form });
        },

        updateRecord: async function (config) {
          return jsonFetch(apiUrl("status"), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              Entity: config.Entity,
              APIData: config.APIData,
            }),
          });
        },
      },
      CONFIG: {
        getCurrentUser: async function () {
          try {
            const body = await jsonFetch(apiUrl("me"));
            const users = Array.isArray(body.users) ? body.users : [];
            if (users.length > 0) return { users: users };
            return { users: [{ id: "", email: "" }] };
          } catch (err) {
            console.warn("[zoho-shim] getCurrentUser failed", err);
            return { users: [{ id: "", email: "" }] };
          }
        },
      },
      FUNCTIONS: {
        execute: async function (name, reqData) {
          const payload =
            reqData && typeof reqData === "object" ? reqData : { arguments: "{}" };
          return jsonFetch(apiUrl("send-sign"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        },
      },
    },
  };
})();
