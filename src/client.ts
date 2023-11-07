import makeWASocket, {
  Browsers,
  MessageUpsertType,
  WASocket,
  makeInMemoryStore,
  proto,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";

export class Client {
  #sock: WASocket;
  #store: ReturnType<typeof makeInMemoryStore>;
  #prefix: string = "";

  constructor(prefix: string) {
    this.#prefix = prefix;
    this.#store = makeInMemoryStore({});
    // this.#store.readFromFile(this.getStoreFileName());

    // setInterval(() => {
    //   this.#store.writeToFile(this.getStoreFileName());
    // }, 1000);
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
      browser: Browsers.macOS('Desktop')
    });

    this.#sock.ev.on("connection.update", (update) => {
      if (update.lastDisconnect?.error?.message.startsWith("Stream Errored")) {
        this.connect();
      }
      if (update.connection == "open") {
        console.log("conectado...");
        this.#store.bind(this.#sock.ev);
      }
      if(update.connection == "close") {
        console.log("desconectado")
      }
    });

    this.#sock.ev.on("creds.update", saveCreds);

    this.#sock.ev.on("messages.upsert", this.onUpsertMessage);

    this.#sock.ev.on("messaging-history.set", function(data) {
      console.log('set messages', data.messages.length)
    })
    
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

    const recent = await this.#store.mostRecentMessage(jid);

    if (recent) {
      return await this.#store.loadMessages(jid, 10, {
        before: {
          id: recent.key.id,
        },
      });
    }
    return [];
  }

  getState() {
    return this.#store.state
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
