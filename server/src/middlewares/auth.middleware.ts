import { supabase } from "../lib/supabase";
import { MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

const authMiddleware: MiddlewareHandler = async (c, next) => {
  const access_token = getCookie(c, "access_token");
  const refresh_token = getCookie(c, "refresh_token");

  let { data, error } = await supabase.auth.getUser(access_token || "");

  if (data?.user) {
    c.set("user", data.user);
    return next();
  }

  if (error || !data?.user) {
    if (!refresh_token) {
      throw new HTTPException(401, { message: "Not logged in" });
    }

    const { data: refreshed, error: refreshErr } =
      await supabase.auth.refreshSession({
        refresh_token,
      });

    if (refreshErr || !refreshed.session) {
      throw new HTTPException(401, { message: "Session expired" });
    }

    setCookie(c, "access_token", refreshed.session.access_token, {
      httpOnly: true,
      secure: true,
      path: "/",
    });

    setCookie(c, "refresh_token", refreshed.session.refresh_token!, {
      httpOnly: true,
      secure: true,
      path: "/",
    });

    c.set("user", refreshed.user);
    return next();
  }
};

export default authMiddleware;
