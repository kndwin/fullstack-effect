import { Match } from "effect";
import { Command } from "foldkit";
import { loadAuth, logout } from "./auth.command";
import type { AuthModel } from "./auth.model";
import { AuthMessage } from "./auth.message";

export const init = () => [{ session: null, loading: true, error: null }, [loadAuth]] as const;

export const update = (
  model: AuthModel,
  message: AuthMessage,
): readonly [AuthModel, ReadonlyArray<Command.Command<AuthMessage>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [AuthModel, ReadonlyArray<Command.Command<AuthMessage>>]>(),
    Match.tagsExhaustive({
      AuthStarted: () => [{ ...model, loading: true, error: null }, [loadAuth]],
      AuthLoaded: ({ session }) => [{ session, loading: false, error: null }, []],
      AuthLogoutClicked: () => [{ ...model, loading: true, error: null }, [logout]],
      AuthLoggedOut: () => [{ session: null, loading: false, error: null }, []],
      AuthFailed: ({ message }) => [{ ...model, loading: false, error: message }, []],
    }),
  );
