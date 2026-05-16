const API_BASE =
  "http://127.0.0.1:8000/api";

export const getToken = () => {

  return localStorage.getItem(
    "access"
  );
};

const refreshAccessToken =
  async () => {

    const refresh =
      localStorage.getItem(
        "refresh"
      );

    if (!refresh) return null;

    try {

      const response =
        await fetch(

          `${API_BASE}/auth/token/refresh/`,

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              refresh
            })
          }
        );

      const data =
        await response.json();

      if (data.access) {

        localStorage.setItem(
          "access",
          data.access
        );

        return data.access;
      }

      return null;

    } catch {

      return null;
    }
};

export const apiFetch =
  async (

    endpoint: string,

    options: RequestInit = {}
  ) => {

    let token = getToken();

    const makeRequest =
      async (jwt: string | null) => {

        const headers: HeadersInit = {

          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        };

        if (jwt) {

          headers["Authorization"] =
            `Bearer ${jwt}`;
        }

        return fetch(

          `${API_BASE}${endpoint}`,

          {

            ...options,

            headers
          }
        );
      };

    let response =
      await makeRequest(token);

    if (response.status === 401) {

      const newAccess =
        await refreshAccessToken();

      if (newAccess) {

        response =
          await makeRequest(
            newAccess
          );

      } else {

        localStorage.removeItem(
          "access"
        );

        localStorage.removeItem(
          "refresh"
        );

        window.location.href =
          "/login";
      }
    }

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(

        data.detail ||

        data.error ||

        "API request failed"
      );
    }

    return data;
};