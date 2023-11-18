import { WaWebhooks } from "App/Services/WaWebhooks";
import WhatsappService from "App/Services/WhatsappService";

(async () => {

    await WhatsappService.connect();
    const webhooks = new WaWebhooks(WhatsappService.sock.ev)
    webhooks.start()
})()
