import makeWASocket, {
  Browsers,
  ConnectionState,
  MessageUpsertType,
  WASocket,
  makeInMemoryStore,
  proto,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { makeMysqlStore } from "./utils/make-mysql-store";
import { connection } from "./utils/database";

export class Client {
  #sock: WASocket;
  #store: ReturnType<typeof makeMysqlStore>;
  #prefix: string = "";

  constructor(prefix: string) {
    this.#prefix = prefix;
   
  }

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(
      this.getAuthFileName()
    );

    const logger = pino({}).child({});
    logger.level = "fatal";

    this.#sock = makeWASocket({
      version: [2, 2321, 88],
      auth: state,
      printQRInTerminal: true,
      logger,
      browser: Browsers.macOS("Desktop"),
    });

    this.#store = makeMysqlStore(connection);
    this.#store.readFromFile(this.getStoreFileName());
   
    this.#store.bind(this.#sock.ev)

    this.#sock.ev.on("connection.update", async state => {
      if (state.lastDisconnect?.error?.message.startsWith("Stream Errored")) {
        console.log('error connect')
        await this.connect();
      }
      this.onConnectionUpdate(state)
    } 
    );

    this.#sock.ev.on("creds.update", saveCreds);

    this.#sock.ev.on("messages.upsert", this.onUpsertMessage);

  }

  async onConnectionUpdate(state: Partial<ConnectionState>) {
       
    if (state.connection == "open") {
      console.log("conectado...");
    }
    if (state.connection == "close") {
      console.log("desconectado");
    }
  }

  onUpsertMessage(message: {
    messages: proto.IWebMessageInfo[];
    type: MessageUpsertType;
  }) {
    const [m] = message.messages;
    console.log(
      "new message",
      m.message?.conversation,
      m.message?.extendedTextMessage,
      m.key.remoteJid,
      message.type
    );
  }

  sendMessage(number: string, text: string) {
    return this.#sock.sendMessage(number, {
      text: text,
    });
  }

  async fetchMessages(jid: string) {
    return this.#store.loadMessages(jid, 50)
  }

  getState() {
    return this.#store.state;
  }

  updateStore() {
    this.#store.writeToFile(this.getStoreFileName());
  }

  getAuthFileName(): string {
    return `storage/auth-info-${this.#prefix}`;
  }

  getStoreFileName(): string {
    return `storage/store-${this.#prefix}.json`;
  }

  getSocket(): ReturnType<typeof makeWASocket> {
    return this.#sock;
  }
}
