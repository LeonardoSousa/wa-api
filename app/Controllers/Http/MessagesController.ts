import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import WhatsappService from "App/Services/WhatsappService";
import { get, has, omit } from "lodash";

export default class MessagesController {
  async index() {
    return (
      await Database.query().from("messages").whereNotNull("payload").limit(50)
    ).map((m) => omit(JSON.parse(m.payload), "payload"));
  }

  async store(ctx: HttpContextContract) {
    const { jid, message } = ctx.request.body();

    const mediaKey = Object.keys(message).find(k => ['video', 'image', 'audio', 'sticker', 'document'].includes(k));

    if(mediaKey) {
      
      const base64:string = get(message, mediaKey, '')

      const data = base64.split("base64,")[1]

      message[mediaKey] = Buffer.from(data, 'base64')
    }


    return WhatsappService.sock.sendMessage(jid, message);
  }

  async show(ctx: HttpContextContract) {
    const msg = await Database.query()
      .from("messages")
      .where("id", ctx.params.id)
      .first();
    
    return JSON.parse(msg.payload);
  }

  async download(ctx: HttpContextContract) {
    const msg = await Database.query()
      .from("messages")
      .where("id", ctx.params.id)
      .first();

    try {
      const m = JSON.parse(msg.payload);
      const buff = await downloadMediaMessage(m, "buffer", {});
            

      return ctx.response.header("content-type", msg.mime).send(buff);
    } catch (error) {
        let messageError = "Não é uma messagem media"
        if(has(error, 'message')) {
          messageError = get(error, 'message')
        }
        // console.log(Object.keys(error))
        return ctx.response.json({error: messageError,})
    }
  }
}
