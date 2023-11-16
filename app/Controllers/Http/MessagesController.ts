import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import WhatsappService from 'App/Services/WhatsappService'
import { omit } from 'lodash';

export default class MessagesController {

    async index() {
        return (await Database.query()
        .from('messages')
        .whereNotNull('payload')
        .limit(50)).map(m => omit(JSON.parse(m.payload), 'payload'));
    }

    async store(ctx: HttpContextContract) {
        const {jid, message} = ctx.request.body()

        return WhatsappService.sock.sendMessage(jid, message);
    }

    async show(ctx: HttpContextContract) {
        const msg = await Database.query()
            .from('messages')
            .where('id', ctx.params.id)
            .first()

        const p = JSON.parse(msg.payload);
        return await WhatsappService.sock.updateMediaMessage(p)
        
    }

}
