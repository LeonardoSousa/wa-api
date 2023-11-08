import { get } from "lodash";
import data from "../../storage/store-deltex.json";
import { makeMysqlStore } from "./make-mysql-store";
import { connection } from "./database";

(async function() {
   const store = makeMysqlStore(connection)
//    await store.readFromFile('./storage/store-deltex.json')
    store.loadMessages("559984263501-1633033348@g.us", 10)
})()
