import {
  BaileysEventEmitter,
  Chat,
  ConnectionState,
  Contact,
  WAMessageContent,
  WAMessageCursor,
  proto,
} from "@whiskeysockets/baileys";
import { existsSync, readFileSync } from "fs";
import { knex } from "knex";
import { chunk, get, has } from "lodash";

export const makeMysqlStore = (conexao: knex.Knex) => {
  const state: ConnectionState = { connection: "close" };

  const syncChats = async (chats: Chat[]) => {
    const insertChats = chats.map((c) => {
      c.displayName;
      return {
        id: c.id,
        name: c.name,
        displayName: c.displayName,
        archived: c.archived,
        description: c.description,
      };
    });
    await conexao.table("chats").insert(insertChats).onConflict().merge();
    console.log(`sync ${chats.length}  chats`);
  };

  const syncMessages = async (messages: proto.IWebMessageInfo[]) => {
    const inserMessages = messages.map((message) => {
      var text = "";
      if (has(message, "message.conversation")) {
        text = get(message, "message.conversation", "");
      }
      if (has(message, "message.extendedTextMessage")) {
        text = get(message, "message.extendedTextMessage.text", "");
      }

      return {
        remoteJid: message.key.remoteJid,
        id: message.key.id,
        fromMe: message.key.fromMe,
        timestamp: parseInt(String(message.messageTimestamp)),
        text: text,
        status: message.status,
      };
    });

    const chunked = chunk(inserMessages, 1000);

    for await (const list of chunked) {
      await conexao.table("messages").insert(list).onConflict().merge();
    }

    console.log(`sync ${messages.length} messages`);
  };

  const syncContacts = async (contacts: Contact[]) => {
    contacts[0].imgUrl;
    const insertContacts = contacts.map((c) => {
      return {
        id: c.id,
        name: c.name,
        notify: c.notify,
        verifiedName: c.verifiedName,
        imgUrl: c.imgUrl,
        status: c.status,
      };
    });
    await conexao.table("contacts").insert(insertContacts).onConflict().merge();
    console.log(`sync ${contacts.length} contacts`);
  };

  const bind = (ev: BaileysEventEmitter) => {
    ev.on("connection.update", (state) => {
      Object.assign(state, state);
    });

    ev.on("messaging-history.set", async (data) => {
      await syncMessages(data.messages);
      await syncChats(data.chats);
      await syncContacts(data.contacts);
    });

    ev.on("contacts.upsert", async (contacts) => {
      await syncContacts(contacts);
    });

    ev.on("contacts.update", async (contacts) => {
      await syncContacts(contacts as Contact[]);
    });

    ev.on("chats.upsert", async (chats) => {
      await syncChats(chats);
    });

    ev.on("chats.update", async (chats) => {
      await syncChats(chats as Chat[]);
    });

    ev.on("messages.upsert", async (data) => {
      if (data.type == "append" || data.type == "notify") {
        await syncMessages(data.messages);
      }
    });
  };

  const loadMessages = async (
    jid: string,
    count: number,
    cursor?: WAMessageCursor
  ) => {
    const mode = !cursor || "before" in cursor ? "before" : "after";

    const query = await conexao
      .from("messages")
      .where("remoteJid", jid)
      .limit(count)
      .select("*");

    return query
  };

  const readFromFile = async (path: string) => {
    const exits = await existsSync(path);
    if (exits) {
      const strJson = await readFileSync(path, { encoding: "utf-8" });
      const json: {
        chats: Chat[];
        messages: Record<string, proto.IWebMessageInfo[]>;
        contacts: Record<string, Contact>;
      } = JSON.parse(strJson);

      const messages = Object.values(json.messages).reduce<
        proto.IWebMessageInfo[]
      >((acc, m) => {
        return [...acc, ...m];
      }, []);

      const contacts = Object.values(json.contacts);

      await syncChats(json.chats);
      await syncMessages(messages);
      await syncContacts(contacts);
    }
  };

  return {
    state,
    bind,
    readFromFile,
    loadMessages,
  };
};
