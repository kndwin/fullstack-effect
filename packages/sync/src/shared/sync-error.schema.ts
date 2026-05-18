import { Schema } from "effect";

export class ErrorSyncEventInsertFailed extends Schema.TaggedErrorClass<ErrorSyncEventInsertFailed>()(
  "ErrorSyncEventInsertFailed",
  { message: Schema.String },
) {}

export class ErrorClientMutationInsertFailed extends Schema.TaggedErrorClass<ErrorClientMutationInsertFailed>()(
  "ErrorClientMutationInsertFailed",
  { message: Schema.String },
) {}

export class ErrorInvalidSyncEventVisibility extends Schema.TaggedErrorClass<ErrorInvalidSyncEventVisibility>()(
  "ErrorInvalidSyncEventVisibility",
  { message: Schema.String, visibilityType: Schema.String },
) {}
