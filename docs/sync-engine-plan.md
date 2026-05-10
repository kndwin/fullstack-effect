# Sync Engine Implementation Plan

## Goal

Build a reusable tenant-scoped sync layer in `packages/sync` that supports multiple domains, starting with:

- Simple domain: `tasks`
- Complex domain: `channels`

The sync layer provides reusable mechanics only:

```txt
tenant-scoped event log
idempotent mutations
pull/stream
visibility filtering
client cursor
client outbox
projection application
```

Domain code stays in app/domain areas:

```txt
apps/server-core/src/module/*
apps/client-web/src/module/*
```

The sync package must not import or know about:

```txt
task
channel
message
draft
rich text
```

## Architecture

### Package Shape

```txt
packages/sync/
  package.json
  tsconfig.json
  src/
    server/
      context.ts
      event.ts
      event-store.ts
      mutation-store.ts
      visibility.ts
      stream.ts
      index.ts

    client/
      cursor-store.ts
      outbox-store.ts
      event-router.ts
      sync-client.ts
      projection.ts
      index.ts

    index.ts
```

### Server Domain Locations

```txt
apps/server-core/src/module/task/
  task.table.ts
  task.repo.ts
  task.service.ts
  task.rpc.impl.ts

apps/server-core/src/module/channel/
  channel.table.ts
  channel.repo.ts
  channel.service.ts
  channel.rpc.impl.ts
```

### Client Domain Locations

```txt
apps/client-web/src/module/task/
  task.model.ts
  task.message.ts
  task.command.ts
  task.update.ts
  task.view.ts
  task.preview.ts

apps/client-web/src/module/channel/
  channel.model.ts
  channel.message.ts
  channel.command.ts
  channel.update.ts
  channel.view.ts
  channel.preview.ts
```

Existing `todo` can either remain as-is or become the seed for the new simple `task` slice.

## Core Concepts

### Tenant Context

Every server command runs with:

```ts
type TenantContext = {
  tenantId: string;
  userId: string;
};
```

Tenant context is resolved at the app boundary, then passed into sync/domain services.

### Sync Event

```ts
type SyncEvent<TPayload = unknown> = {
  tenantId: string;
  seq: number;
  domain: string;
  type: string;
  visibility: SyncVisibility;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  createdAt: string;
};
```

### Visibility

```ts
type SyncVisibility =
  | { type: "tenant" }
  | { type: "user"; userId: string }
  | { type: "resource"; resourceType: string; resourceId: string };
```

Examples:

```txt
task.created
  visibility = tenant

channel.message.created
  visibility = resource(channel)

channel.draft.updated
  visibility = user(owner)
```

### Durable vs Ephemeral

Durable sync events:

```txt
task.created
task.status.updated
channel.message.created
channel.message.updated
channel.message.deleted
channel.draft.updated
channel.draft.cleared
```

Ephemeral realtime events:

```txt
channel.typing.updated
```

Typing is derived from draft activity but is not stored in the durable event log.

## Database Shape

### Sync Tables

Use `tenant_id` everywhere.

```txt
sync.sync_event
  tenant_id
  seq
  domain
  type
  visibility_type
  visibility_resource_type nullable
  visibility_resource_id nullable
  target_user_id nullable
  aggregate_type
  aggregate_id
  payload jsonb
  created_at

primary key (tenant_id, seq)
```

```txt
sync.client_mutation
  tenant_id
  user_id
  client_mutation_id
  domain
  command_type
  result_event_seq nullable
  status
  created_at

primary key (tenant_id, user_id, client_mutation_id)
```

### Required Indexes

```txt
sync.sync_event (tenant_id, seq)
sync.sync_event (tenant_id, domain, seq)
sync.client_mutation (tenant_id, user_id, client_mutation_id)
```

### Task Tables

Minimal task/ticket domain:

```txt
app.task
  tenant_id
  id
  title
  status
  created_by_user_id
  created_at
  updated_at

primary key (tenant_id, id)
```

Optional later:

```txt
app.task_comment
app.task_assignment
app.task_label
```

### Channel Tables

```txt
app.channel
  tenant_id
  id
  name
  created_at

primary key (tenant_id, id)
```

```txt
app.channel_member
  tenant_id
  channel_id
  user_id
  role
  created_at

primary key (tenant_id, channel_id, user_id)
```

```txt
app.channel_thread
  tenant_id
  id
  channel_id
  created_at

primary key (tenant_id, id)
```

```txt
app.channel_thread_message
  tenant_id
  id
  channel_id
  thread_id
  author_user_id
  content jsonb
  content_text text
  client_mutation_id nullable
  deleted_at nullable
  edited_at nullable
  created_at

primary key (tenant_id, id)
```

```txt
app.channel_thread_draft
  tenant_id
  user_id
  channel_id
  thread_id
  content jsonb
  content_text text
  version
  updated_at

primary key (tenant_id, user_id, channel_id, thread_id)
```

## Rich Text Rule

Rich text belongs outside sync-core.

Suggested later package:

```txt
packages/rich-text/
  schema.ts
  normalize.ts
  to-plain-text.ts
  is-empty.ts
```

Initial implementation can reuse existing editor code from:

```txt
packages/client-ds/src/rich-text-editor/*
```

Server command behavior:

```txt
validate rich text schema
normalize content
derive content_text server-side
reject empty rich text
reject oversized content
store content + content_text
```

Sync treats rich text as opaque payload.

## Server Sync Core Responsibilities

`packages/sync/src/server` should provide:

```txt
appendEvent(ctx, input)
pullEvents(ctx, afterSeq, limit)
streamEvents(ctx, afterSeq)
withClientMutation(ctx, input, handler)
recordClientMutation(ctx, result)
filterVisibleEvents(ctx, events)
```

### Command Pattern

Every domain command follows:

```txt
1. resolve TenantContext
2. validate domain permissions
3. check idempotency
4. write canonical domain state
5. append sync event
6. record mutation result
7. return canonical result/event
```

### Idempotency

Scope:

```txt
tenant_id + user_id + client_mutation_id
```

Retry behavior:

```txt
same clientMutationId returns prior result
no duplicate canonical write
no duplicate sync event
```

## Client Sync Core Responsibilities

`packages/sync/src/client` should provide:

```txt
per-tenant cursor
pull/apply/advance loop
stream connection with reconnect
event router
generic outbox
mutation retry
projection adapter interfaces
```

### Cursor Rule

Cursor is per tenant:

```txt
sync_cursor[tenantId] = lastAppliedSeq
```

Cursor advances only after event application succeeds.

### Event Router

Domain reducers register by domain/type:

```txt
tasks -> applyTaskEvent
channels -> applyChannelEvent
```

Unknown event types should not crash the app. They should either be ignored with diagnostics or produce a controlled sync error.

### Outbox

Generic shape:

```ts
type PendingMutation = {
  tenantId: string;
  domain: string;
  commandType: string;
  clientMutationId: string;
  payload: unknown;
  status: "pending" | "flushing" | "failed";
  createdAt: string;
  attemptCount: number;
  lastError?: string;
};
```

Offline policy is domain-owned.

Initial offline policy:

```txt
channels.sendMessage = allowed
channels.editMessage = denied
channels.deleteMessage = denied
channels.updateDraft = denied
tasks.* = denied
```

## Iteration Plan

### Phase 1: Sync Contract Skeleton

Implement type-only or near-type-only sync primitives.

Deliverables:

```txt
packages/sync package
server/client exports
TenantContext
SyncEvent
SyncVisibility
PendingMutation
EventRouter interfaces
VisibilityResolver interface
```

Verification:

```txt
Typecheck passes.
A task event and channel event can be represented.
sync package has no domain imports.
```

Promotion gate:

```txt
No app-specific concepts in packages/sync.
tenantId is required by core event/mutation types.
```

### Phase 2: Server Sync Core With Simple Task Create

Implement:

```txt
sync.sync_event
sync.client_mutation
appendEvent
pullEvents
withClientMutation
```

Add simple task command:

```txt
createTask
task.created
```

Server flow:

```txt
createTask
  -> insert app.task
  -> append task.created
  -> record client mutation
```

Verification:

```txt
createTask inserts task.
createTask appends task.created.
retry same clientMutationId does not duplicate.
pullEvents returns events after seq.
pullEvents does not return another tenant's events.
```

Promotion gate:

```txt
Task proves sync-core can support a non-chat domain.
```

### Phase 3: Client Sync Core With Task Projection

Implement:

```txt
per-tenant cursor
event router
pull/apply/advance loop
task event reducer
task local projection
task previews
```

Task reducer:

```txt
task.created -> upsert task
```

Preview scenarios:

```txt
Task list empty
Task list seeded
Pull task.created
Tenant switch
Duplicate event replay
Task create failure
```

Verification:

```txt
Reload renders projected tasks.
Duplicate replay does not duplicate tasks.
Tenant switch uses separate projection/cursor.
```

Promotion gate:

```txt
Client projection works before realtime.
```

### Phase 4: Task Status Update

Add:

```txt
updateTaskStatus
task.status.updated
```

Verification:

```txt
Server updates canonical task status.
Event updates client projection.
Duplicate status event is safe.
Two task events replay in order.
```

Preview scenarios:

```txt
Status update success
Status update failure
Live-looking status transition
```

Promotion gate:

```txt
Sync supports mutable projections, not just creates.
```

### Phase 5: Channel Message Create With Rich Text

Add channel schema and command:

```txt
channel
channel_member
channel_thread
channel_thread_message
sendMessage
channel.message.created
```

Payload:

```txt
content json
content_text text
```

Server verification:

```txt
valid rich text accepted.
empty rich text rejected.
oversized rich text rejected.
content_text derived server-side.
non-member cannot send.
cross-tenant send rejected.
retry same clientMutationId does not duplicate.
```

Client verification:

```txt
channel.message.created inserts message.
rich text renders.
duplicate replay is safe.
task and channel events route independently.
```

Preview scenarios:

```txt
Channel empty
Channel seeded with rich text
Send rich text success
Send empty rich text rejected
Cross-tenant isolation state
```

Promotion gate:

```txt
Same sync event log supports task and channel events.
sync-core remains domain-free.
```

### Phase 6: Realtime Stream

Implement:

```txt
server streamEvents(afterSeq)
client stream connection
reconnect/backfill path
```

Stream behavior:

```txt
first replay missed events after cursor
then push live events
same apply path as pullEvents
```

Verification:

```txt
task.status.updated arrives live.
channel.message.created arrives live.
disconnect/reconnect catches missed events.
events apply in seq order.
unauthorized events are filtered.
```

Preview scenarios:

```txt
Live task update
Live channel message
Disconnected state
Reconnect with missed events
Tenant switch closes old stream
```

Promotion gate:

```txt
One tenant stream carries multiple domains.
No separate realtime-only projection logic.
```

### Phase 7: Optimistic Channel Send

Add channel-domain optimistic UI.

Flow:

```txt
user sends rich text
client creates clientMutationId
client creates pending local message
RPC sendMessage starts
channel.message.created reconciles by clientMutationId
pending message becomes canonical
```

Verification:

```txt
message appears immediately.
server success replaces pending.
server failure marks pending failed.
retry uses same clientMutationId.
stream echo does not duplicate.
```

Preview scenarios:

```txt
Optimistic send success with delay
Optimistic send failure
Retry failed send
Duplicate stream echo
Slow network pending state
```

Promotion gate:

```txt
Canonical event wins over optimistic state.
```

### Phase 8: Backend Drafts With Debounce

Add:

```txt
channel_thread_draft
updateDraft
channel.draft.updated
channel.draft.cleared
```

Draft behavior:

```txt
composer updates locally immediately
updateDraft debounced at 1000ms
draft events visible only to owner
same user's other devices receive draft.updated
```

Verification:

```txt
draft upserts and increments version.
draft.updated visible only to owner.
other users never receive draft body.
fake clock proves debounce behavior.
draft keyed by tenant/channel/thread/user.
```

Preview scenarios:

```txt
Draft restores
Draft saving debounce
Draft syncs to second tab
Draft update failure
Draft conflict/newer version
```

Promotion gate:

```txt
User-private durable sync events work.
```

### Phase 9: Ephemeral Typing From Draft Activity

Add ephemeral event:

```txt
channel.typing.updated
```

Server behavior on `updateDraft` success:

```txt
persist draft
append private draft.updated
publish ephemeral typing.updated to channel members
```

Payload excludes body:

```txt
tenantId
channelId
threadId
userId
updatedAt
```

Client rule:

```txt
show typing if now - updatedAt < 8s
expire automatically
```

Verification:

```txt
other users see typing.
typing expires.
typing does not replay after reconnect.
typing payload does not contain draft content.
```

Preview scenarios:

```txt
One user typing
Multiple users typing
Typing expires
Reconnect does not replay stale typing
```

Promotion gate:

```txt
Durable and ephemeral sync paths are clearly separate.
```

### Phase 10: Offline Channel Send Only

Add generic outbox plus channel policy.

Offline allowed:

```txt
channels.sendMessage
```

Offline denied:

```txt
channels.updateDraft
channels.editMessage
channels.deleteMessage
tasks.*
```

Flow:

```txt
offline send
  -> pending message
  -> pending mutation stored
  -> survives reload
  -> reconnect flushes in createdAt order
  -> server validates and emits message.created
  -> pending reconciles
```

Verification:

```txt
offline send persists pending mutation.
reload preserves pending message.
reconnect flushes.
same clientMutationId prevents duplicate.
validation failure marks failed.
offline edit/delete/task controls disabled.
```

Preview scenarios:

```txt
Offline pending message
Reload with pending message
Reconnect flush success
Reconnect validation failure
Multiple offline messages
Offline disabled controls
```

Promotion gate:

```txt
Outbox is generic, offline policy is domain-specific.
```

### Phase 11: Channel Edit/Delete With Tombstones

Add online-only commands:

```txt
editMessage
deleteMessage
channel.message.updated
channel.message.deleted
```

Delete behavior:

```txt
set deleted_at
emit tombstone event
client displays "message deleted"
preserve thread ordering
```

Verification:

```txt
edit updates rich text.
delete creates tombstone.
deleted message cannot be edited.
offline edit/delete unavailable.
cross-tenant edit/delete rejected.
```

Preview scenarios:

```txt
Edited message
Deleted tombstone
Edit failure
Delete failure
Offline edit/delete disabled
```

Promotion gate:

```txt
Mutable channel projections work without compromising offline boundary.
```

### Phase 12: Second Task Feature Reuse Check

Add task comments or richer task update.

Recommended:

```txt
task.comment.created
```

If task comments use rich text, that proves rich text is not channel-specific.

Verification:

```txt
task comments flow through same sync log.
task comments render through task projection.
sync-core remains domain-free.
```

Promotion gate:

```txt
The sync abstraction is reusable across simple and complex domains.
```

## Verification Standard

A slice is done only when it passes:

```txt
Effect service tests
sync invariant tests
Foldkit update/machine tests
preview scenarios
one manual happy-path demo
```

### Cross-Cutting Invariants

Test repeatedly:

```txt
No cross-tenant reads.
No cursor advancement before successful event apply.
Duplicate events are safe.
Unknown events do not crash.
Domain reducers are isolated.
sync package imports no task/channel/rich-text code.
Server never trusts client-derived content_text.
Every mutation has tenant/user context.
Every sync event has tenant_id + seq.
```

### Preview Categories

Use your preview abstraction as a scenario harness.

For each meaningful view/domain:

```txt
Empty
Seeded
Loading
Error
Realtime update
Optimistic pending
Permission denied
Tenant switch
Offline
Conflict
```

Existing preview style in `todo.preview.ts` is a good model:

```txt
States preview
Replay preview
Scenario steps
Command resolutions
Delayed steps
```

## First Meaningful Milestone

Before drafts, typing, and offline, get this demo working:

```txt
One tenant stream.
Create a task.
Update task status.
Send a rich text channel message.
Reload.
Everything rehydrates from local projection.
No duplicate events.
Tenant switch shows separate state.
```

This proves:

```txt
server sync core
client sync core
channel domain
rich text message payload
tenant cursor
event routing
preview verification
```

## First Implementation Step

Create `packages/sync` with server/client skeleton types and exports, then add the first sync-core tests proving tenant-scoped event shape and domain-free package boundaries.
