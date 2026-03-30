import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import pino from 'pino'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['GeekPoint Bot', 'Chrome', '1.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔗 Código de pareamento automático
    if (!sock.authState.creds.registered) {
        try {
            const numero = "559180305171" // 👈 SEU NÚMERO CORRIGIDO
            const code = await sock.requestPairingCode(numero)
            console.log("🔗 Código de pareamento:", code)
        } catch (err) {
            console.log("Erro ao gerar código:", err)
        }
    }

    // 📩 Comando ping
    sock.ev.on('messages.upsert', async ({ messages }) => {
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
    })

    // 🔄 Reconexão automática
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            console.log('🔄 Reconectando...')
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('✅ GeekPoint Bot conectado!')
        }
    })
}

startBot()
