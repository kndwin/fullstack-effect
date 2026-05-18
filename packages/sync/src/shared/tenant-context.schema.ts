import { Schema } from "effect";

export const TenantContextSchema = Schema.Struct({
  tenantId: Schema.String,
  userId: Schema.String,
});
export type TenantContext = typeof TenantContextSchema.Type;
