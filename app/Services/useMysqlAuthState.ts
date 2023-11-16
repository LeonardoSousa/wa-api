import Database from "@ioc:Adonis/Lucid/Database";
import Logger from "@ioc:Adonis/Core/Logger";
import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  SignalDataSet,
  SignalDataTypeMap,
  initAuthCreds,
  proto,
} from "@whiskeysockets/baileys";

export const useMysqlAuthState = async (
  instance: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const writeData = async (data: any, key: string) => {
    const id = `${instance}:${key}`;

    await Database.from("auth").where("id", id).del();

    await Database.table("auth").insert({
      id,
      instance,
      key,
      value: JSON.stringify(data, BufferJSON.replacer),
    });
  };

  const readData = async (key: string) => {
    const line = await Database.from("auth")
      .where("instance", instance)
      .where("key", key)
      .first();

    if (line) {
      return JSON.parse(line.value, BufferJSON.reviver);
    }
    return null;
  };

  const removeData = async (key: string) => {
    await Database.from("auth")
      .where("instance", instance)
      .where("key", key)
      .delete();
  };

  const creds: AuthenticationCreds =
    (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[]
        ) => {
          const data: { [_: string]: SignalDataTypeMap[T] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: SignalDataSet) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      return await writeData(creds, "creds");
    },
  };
};
