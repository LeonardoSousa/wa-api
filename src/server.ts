import express from 'express';
import { Client } from './client';


export class Server {
    #app: ReturnType<typeof express>;
    #client: Client;

    constructor(client: Client) {
        this.#client = client;
        this.#app = express();
        this.#app.use(express.json())
        this.initHandlers()        
    }

    initHandlers() {
        const cl = this.#client
        this.#app.get('/messages/:jid', async function(req, res) {

            const {jid} = req.params

            const messages = await cl.fetchMessages(jid)
            return res.json({messages})
        })

        this.#app.get('/status', (_, res) => {

            return res.json(cl.getState())
        })

        this.#app.post('/send-message', async function(req, res) {
            const data = req.body
            const message = await cl.getSocket()
                .sendMessage(data.number, data.message)
            return res.json({message})
        })
    }

    start() {
        this.#app.listen(8080, function() {
            console.log('rodando server....')
        })
    }

}
