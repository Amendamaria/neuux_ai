import { supabase } from "../lib/supabase";
import { zValidator } from "../middlewares/zodValidator.middleware";

import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { startTime, endTime } from "hono/timing";
import { z } from "zod";

const authRoutes = new Hono();

authRoutes.post(
  "/sign-up",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error(error);
      throw new HTTPException(400, { message: error.message });
    }

    if (!data?.user) {
      throw new HTTPException(400, {
        message: "No user returned from Supabase",
      });
    }

    const dbUser = {
      id: data.user.id,
      email: data.user.email,
      tier: "free",
      ux_generations_left: 5,
      project_limit: 5,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at,
    };

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert(dbUser)
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      throw new HTTPException(400, { message: insertError.message });
    }

    return c.json({ message: "Account created", user });
  }
);

authRoutes.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error", error);
      throw new HTTPException(401, { message: error.message });
    }

    if (!data?.user || !data.session) {
      throw new HTTPException(401, {
        message: "Invalid login or no session returned",
      });
    }

    const user = data.user;
    const session = data.session;

    const expires = session.expires_at
      ? new Date(session.expires_at * 1000)
      : undefined;

    setCookie(c, "access_token", session.access_token, {
      expires,
      httpOnly: true,
      secure: true,
      path: "/",
    });

    setCookie(c, "refresh_token", session.refresh_token ?? "", {
      expires,
      httpOnly: true,
      secure: true,
      path: "/",
    });

    const { data: profile } = await supabase
      .from("users")
      .select("id,email,tier,ux_generations_left,project_limit")
      .eq("id", user.id)
      .single();

    return c.json({ message: "Logged in", user: profile ?? user, session });
  }
);

authRoutes.post(
  "/authprovider",
  zValidator(
    "json",
    z.object({
      provider: z.enum(["google"]),
      token: z.string().min(8),
      accessToken: z.string().optional(),
    })
  ),
  async (c) => {
    const { provider, token, accessToken } = c.req.valid("json");

    startTime(c, "supabase.auth.signInWithProvider");

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider,
      token,
      access_token: accessToken,
    });

    endTime(c, "supabase.auth.signInWithProvider");

    if (error) {
      console.error("Provider sign-in error", error);
      throw new HTTPException(401, { message: error.message });
    }

    if (!data?.user || !data.session) {
      throw new HTTPException(401, { message: "No user or session returned" });
    }

    const user = data.user;
    const session = data.session;

    const expires = session.expires_at
      ? new Date(session.expires_at * 1000)
      : undefined;

    setCookie(c, "access_token", session.access_token, {
      expires,
      httpOnly: true,
      secure: true,
      path: "/",
    });

    setCookie(c, "refresh_token", session.refresh_token ?? "", {
      expires,
      httpOnly: true,
      secure: true,
      path: "/",
    });

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        tier: "free",
        ux_generations_left: 5,
        project_limit: 5,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id,email,tier,ux_generations_left,project_limit")
      .eq("id", user.id)
      .single();

    return c.json({ user: profile ?? user, session });
  }
);

authRoutes.get("/refresh", async (c) => {
  const refresh_token = getCookie(c, "refresh_token");

  if (!refresh_token) {
    throw new HTTPException(403, { message: "No refresh token" });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error) {
    console.error("Refresh error", error);
    throw new HTTPException(403, { message: error.message });
  }

  if (!data?.user || !data.session) {
    throw new HTTPException(403, { message: "No session returned" });
  }

  const user = data.user;
  const session = data.session;

  const expires = session.expires_at
    ? new Date(session.expires_at * 1000)
    : undefined;

  if (session.refresh_token) {
    setCookie(c, "refresh_token", session.refresh_token, {
      expires,
      httpOnly: true,
      secure: true,
      path: "/",
    });
  }

  setCookie(c, "access_token", session.access_token, {
    expires,
    httpOnly: true,
    secure: true,
    path: "/",
  });

  const { data: profile } = await supabase
    .from("users")
    .select("id,email,tier,ux_generations_left,project_limit")
    .eq("id", user.id)
    .single();

  return c.json({ user: profile ?? user, session });
});

export default authRoutes;
