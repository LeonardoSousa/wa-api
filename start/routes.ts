
import Route from '@ioc:Adonis/Core/Route'
import WhatsappService from 'App/Services/WhatsappService'

Route.get('/', async () => {
  const state = WhatsappService.state
  return { hello: 'world', state }
})


Route.get("messages/:id/download", 'MessagesController.download')
Route.resource('messages', 'MessagesController')
