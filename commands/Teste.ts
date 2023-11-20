import { BaseCommand } from "@adonisjs/core/build/standalone";

export default class Teste extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = "teste";

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
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: true,
  };

  public async run() {
    const Database = this.application.container.use("Adonis/Lucid/Database");
    const Logger = this.application.container.use("Adonis/Core/Logger");
    
    console.time("t")

    const c = await Database.from('messages')
      .select('id', 'remoteJid', 'mime')
      .orderBy('timestamp', 'desc').limit(100)

    console.timeEnd("t")

    Logger.info("%o", c);
  }
}
