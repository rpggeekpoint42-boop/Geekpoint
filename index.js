import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['GeekPoint Bot', 'Chrome', '1.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔗 GERAR CÓDIGO AUTOMÁTICO
    if (!sock.authState.creds.registered) {
        const numero = "+559180305171" // ex: 559999999999
        const code = await sock.requestPairingCode(numero)
        console.log("🔗 Código de pareamento:", code)
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (texto === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🏓 Pong!\n🤖 GeekPoint Bot online!'
            })
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            if (shouldReconnect) iniciarBot()
        } else if (connection === 'open') {
            console.log('✅ Bot conectado!')
        }
    })
}

iniciarBot()
