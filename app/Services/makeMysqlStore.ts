import Database from "@ioc:Adonis/Lucid/Database";
import {
  BaileysEventEmitter,
  Chat,
  ConnectionState,
  Contact,
  proto,
} from "@whiskeysockets/baileys";
import { chunk, get, has } from "lodash";
import Logger from "@ioc:Adonis/Core/Logger";


export const makeMysqlStore = () => {
  const connection = Database.knexQuery();
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
        unreadCount: c.unreadCount,
        payload: JSON.stringify(c)
      };
    });
    await connection.table("chats").insert(insertChats).onConflict().merge();
    Logger.info(`sync %\d chat(s)`,  chats.length);
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
        payload: JSON.stringify(message),
      };
    });

    const chunked = chunk(inserMessages, 100);

    for await (const list of chunked) {
      await connection.table("messages").insert(list).onConflict().merge();
    }

    Logger.info(`sync %d message(s)`, messages.length);
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
    await connection
      .table("contacts")
      .insert(insertContacts)
      .onConflict()
      .merge();
    Logger.info(`sync %s contact(s)`, contacts.length);
  };

  const bind = (ev: BaileysEventEmitter) => {
    ev.on("connection.update", (state) => {
      Object.assign(state, state);
    });

    ev.on("messaging-history.set", async (data) => {
      Logger.info("History receiving")
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

  return {
    state,
    bind,
  };
};
