/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import qrcode from 'qrcode'
import Route from '@ioc:Adonis/Core/Route'
import WhatsappService from 'App/Services/WhatsappService'

Route.get('/', async () => {
  const state = WhatsappService.state
  return { hello: 'world', state }
})

Route.get('/qr-image', async ({response}) => {


  const data = await qrcode.toBuffer(WhatsappService.qrcode);

  response.header('Content-type', 'image/png')
  response.send(data ?? "")
  
})

Route.get("/qr",async ({view}) => {
    return view.render('qrcode')
})

Route.resource('messages', 'MessagesController')
