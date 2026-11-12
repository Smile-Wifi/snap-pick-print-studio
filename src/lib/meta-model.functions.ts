import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Staff-only so visitors cannot spend the owner's Meta API quota.
export const staffAskMetaModel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(10).max(500), prompt: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data }) => {
    const { requireStaffToken } = await import("@/lib/staff-auth.server");
    await requireStaffToken(data.token);
    const { callMetaModel } = await import("@/server/meta-model.server");
    return { reply: await callMetaModel(data.prompt) };
  });
