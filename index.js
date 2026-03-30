import pkg from '@whiskeysockets/baileys'
import pino from 'pino'

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = pkg

let jaGerouCodigo = false

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['GeekPoint Bot', 'Chrome', '1.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 GERA CÓDIGO DIRETO (ANTES DE TUDO)
    setTimeout(async () => {
        if (!jaGerouCodigo) {
            try {
                jaGerouCodigo = true
                const numero = "559180305171"
                const code = await sock.requestPairingCode(numero)
                console.log("🔗 Código de pareamento:", code)
            } catch (e) {
                console.log("Erro ao gerar código:", e)
            }
        }
    }, 3000)

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

    // 🔄 reconexão controlada
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log("✅ Conectado!")
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            console.log("❌ Conexão fechada:", statusCode)

            if (statusCode !== DisconnectReason.loggedOut) {
                setTimeout(() => {
                    startBot()
                }, 5000)
            }
        }
    })
}

startBot()
