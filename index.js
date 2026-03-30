import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const pergunta = (texto) => new Promise(resolve => rl.question(texto, resolve))

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['GeekPoint Bot', 'Chrome', '1.0'] // 👈 NOME AQUI
    })

    if (!sock.authState.creds.registered) {
        const numero = await pergunta('Digite seu número (ex: 559999999999): ')
        const code = await sock.requestPairingCode(numero)
        console.log(`🔗 Código: ${code}`)
    }

    sock.ev.on('creds.update', saveCreds)

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
            console.log('✅ GeekPoint Bot conectado!')
        }
    })
}

iniciarBot()
