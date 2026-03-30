import pkg from '@whiskeysockets/baileys'
import pino from 'pino'

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = pkg

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['GeekPoint Bot', 'Chrome', '1.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔗 código de pareamento
    setTimeout(async () => {
        try {
            if (!sock.authState.creds.registered) {
                const numero = "559180305171"
                const code = await sock.requestPairingCode(numero)
                console.log("🔗 Código:", code)
            }
        } catch (e) {
            console.log("Erro:", e)
        }
    }, 5000)

    // 📩 comando ping
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0]
            if (!msg.message) return

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text

            if (text === 'ping') {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🏓 Pong!\n🤖 GeekPoint Bot online!'
                })
            }
        } catch {}
    })

    // 🔄 reconexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            if (shouldReconnect) startBot()
        }

        if (connection === 'open') {
            console.log("✅ Conectado!")
        }
    })
}

startBot()
