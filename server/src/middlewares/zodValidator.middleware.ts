import { validator } from "hono/validator";
import type {
  Context,
  Env,
  MiddlewareHandler,
  TypedResponse,
  ValidationTargets,
} from "hono";
import { fromZodError } from "zod-validation-error";
import type { ZodSchema, ZodError, z } from "zod";

export type Hook<T, E extends Env, P extends string> = (
  result:
    | { success: true; data: T }
    | { success: false; error: ZodError; data: unknown },
  c: Context<E, P>
) =>
  | Response
  | Promise<Response>
  | void
  | Promise<Response | void>
  | TypedResponse<any>;

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
  E extends Env = Env,
  P extends string = string
>(
  target: Target,
  schema: T,
  hook?: Hook<z.infer<T>, E, P>
): MiddlewareHandler<
  E,
  P,
  {
    in: { [K in Target]: z.input<T> };
    out: { [K in Target]: z.output<T> };
  }
> =>
  validator(target, async (value, c) => {
    const result = await schema.safeParseAsync(value);

    // 🔹 Optional Hook Logic
    if (hook) {
      const hookResult = hook(
        {
          data: value,
          ...(result.success
            ? { success: true as const }
            : { success: false as const, error: result.error }),
        },
        c
      );

      if (hookResult) {
        // Raw Response or Promise<Response>
        if (hookResult instanceof Response || hookResult instanceof Promise) {
          return hookResult;
        }

        // TypedResponse
        if ("response" in hookResult) {
          return hookResult.response;
        }
      }
    }

    // ❌ Validation Failed → Return JSON error
    if (!result.success) {
      const validationError = fromZodError(result.error);

      return c.json(
        {
          message: validationError.message,
          errors: validationError.details,
        },
        400
      );
    }

    // ✔️ Valid → return parsed data
    return result.data;
  }) as MiddlewareHandler<
    E,
    P,
    {
      in: { [K in Target]: z.input<T> };
      out: { [K in Target]: z.output<T> };
    }
  >;
