import { Schema } from "effect";
import { Runtime } from "foldkit";
import type { Url } from "foldkit/url";
import { AppModel } from "./platform/app.model";
import { AppMessage } from "./platform/app.message";
import { init, onUrlChange, update } from "./platform/app.update";
import { view } from "./platform/app.view";
import { ClickedLink } from "./platform/route.message";
import "./style.css";

const program = Runtime.makeProgram({
  Model: AppModel as Schema.Schema<AppModel>,
  init,
  update,
  view,
  container: document.getElementById("root")!,
  routing: {
    onUrlRequest: (request) => ClickedLink({ request }),
    onUrlChange: (url: Url) => onUrlChange(url),
  },
  devTools: { Message: AppMessage, banner: "QaveAI Sync" },
});

Runtime.run(program);
