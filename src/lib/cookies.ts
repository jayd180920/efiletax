import { cookies } from "next/headers";
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

// Get a cookie (server-side)
export const getCookie = async (name: string): Promise<string | undefined> => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return undefined;
  }
};

// Set a cookie (server-side)
// Note: This should be used with a Response object's cookies
export const setCookieInResponse = (
  responseCookies: ResponseCookies,
  name: string,
  value: string,
  options: {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {}
): void => {
  try {
    responseCookies.set({
      name,
      value,
      ...options,
    });
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error);
  }
};

// Delete a cookie (server-side)
// Note: This should be used with a Response object's cookies
export const deleteCookieFromResponse = (
  responseCookies: ResponseCookies,
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
): void => {
  try {
    responseCookies.set({
      name,
      value: "",
      expires: new Date(0),
      ...options,
    });
  } catch (error) {
    console.error(`Error deleting cookie ${name}:`, error);
  }
};

// Client-side cookie functions
export const getClientCookie = (name: string): string | undefined => {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return undefined;
};

export const setClientCookie = (
  name: string,
  value: string,
  options: {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {}
): void => {
  let cookie = `${name}=${value}`;

  if (options.maxAge) {
    cookie += `; max-age=${options.maxAge}`;
  }

  if (options.expires) {
    cookie += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.path) {
    cookie += `; path=${options.path}`;
  }

  if (options.domain) {
    cookie += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookie += "; secure";
  }

  if (options.sameSite) {
    cookie += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookie;
};

export const deleteClientCookie = (
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
): void => {
  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  if (options.path) {
    cookie += `; path=${options.path}`;
  }

  if (options.domain) {
    cookie += `; domain=${options.domain}`;
  }

  document.cookie = cookie;
};
