import { test } from "@japa/runner";
import { useMultiFileAuthState } from "App/Services/useMultiFileAuthState";
import { useMysqlAuthState } from "App/Services/useMysqlAuthState";

test("display welcome page", async ({ client }) => {
  const response = await client.get("/");

  response.assertStatus(200);
  response.assertBodyContains({ hello: "world" });
});

test("save fs to db", async () => {
  // console.log(Database.connection().connectionName);
  const { state, saveCreds } = await useMultiFileAuthState("storage/deltex2");

  await state.keys.set({
    "sender-key-memory": {
      teste: {
        "0": true,
      },
    },
  });

  await saveCreds();
});
