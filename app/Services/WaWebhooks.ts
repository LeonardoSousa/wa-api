import Database from "@ioc:Adonis/Lucid/Database";
import Logger from "@ioc:Adonis/Core/Logger";
import { BaileysEventEmitter, BaileysEventMap } from "@whiskeysockets/baileys";
import axios from "axios";

export class WaWebhooks {
  constructor(private eventEmitter: BaileysEventEmitter) {}

  start() {
    this.eventEmitter.on("messages.upsert", this.onMessage);
  }

  async onMessage({ messages, type }: BaileysEventMap["messages.upsert"]) {
    const webhooks = await Database.from("webhooks").where("enabled", true);

    if (type == "notify" || type == "append") {
      for await (let wh of webhooks) {
        for await (let msg of messages) {
          try {
            await axios.post(wh.url, msg, {
              headers: {
                "Content-Type": "application/json",
              },
            });
          } catch (error) {
            Logger.error("Erro ao enviar para o webhook %s", wh.name);
          }
        }
      }
    }
  }
}
