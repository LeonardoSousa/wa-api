import { BaseCommand } from "@adonisjs/core/build/standalone";
import makeWASocket, {
  Browsers,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { pino } from "pino";

export default class WaAuth extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = "wa:auth";

  /**
   * Command description is displayed in the "help" output
   */
  public static description = "";

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: false,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  };

  public async run() {
    const logger = pino({}).child({});
    this.logger.info("iniciando whatsapp...");

    const { state, saveCreds } = await useMultiFileAuthState("storage/deltex");

    logger.level = "fatal";
    const sock = makeWASocket({
      // version: [2, 2321, 88],
      auth: state,
      printQRInTerminal: true,
      logger,
      browser: Browsers.macOS("Desktop"),
      syncFullHistory: true,
    });

    

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (state) => {
      console.log('update')
      if(state.connection == "open") {
        this.logger.info("Connectado")
        process.exit(1)
      }
    })

    while(true) {}
  }
}
