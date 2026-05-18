import { Schema } from "effect";
import { emptyTaskModel, TaskModel } from "./task.model";

export type TaskProjectionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type TaskProjectionStore = {
  readonly getModel: (tenantId: string) => Promise<TaskModel>;
  readonly setModel: (model: TaskModel) => Promise<void>;
};

export type LocalStorageTaskProjectionStoreInput = {
  readonly storage: TaskProjectionStorage;
  readonly keyPrefix?: string;
};

const taskModelJsonSchema = Schema.fromJsonString(TaskModel);
const defaultKeyPrefix = "qave.task.projection";

export const createLocalStorageTaskProjectionStore = (
  input: LocalStorageTaskProjectionStoreInput,
): TaskProjectionStore => {
  const keyForTenant = (tenantId: string) => `${input.keyPrefix ?? defaultKeyPrefix}:${tenantId}`;

  return {
    getModel: async (tenantId: string): Promise<TaskModel> => {
      const value = input.storage.getItem(keyForTenant(tenantId));
      return value === null ? emptyTaskModel(tenantId) : Schema.decodeUnknownSync(taskModelJsonSchema)(value);
    },
    setModel: async (model: TaskModel): Promise<void> => {
      input.storage.setItem(keyForTenant(model.tenantId), Schema.encodeSync(taskModelJsonSchema)(model));
    },
  };
};
