import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';

let bot: TelegramBot | null = null;

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not provided, Telegram bot features disabled');
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: false });
    
    // Set webhook for production
    if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
      bot.setWebHook(process.env.TELEGRAM_WEBHOOK_URL);
    }

    console.log('✅ Telegram bot initialized successfully');
    return bot;
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error);
    return null;
  }
}

export function getTelegramBot() {
  return bot;
}

export async function sendTelegramMessage(chatId: string | number, message: string) {
  if (!bot) {
    console.log('Telegram bot not initialized, message not sent:', message);
    return;
  }

  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

export async function notifyTelegramUsers(message: string, userRole?: string) {
  if (!bot) return;

  try {
    // Get all users or filter by role
    const users = await storage.getAllUsers(userRole);
    
    for (const user of users) {
      if (user.telegramId) {
        await sendTelegramMessage(user.telegramId, message);
      }
    }
  } catch (error) {
    console.error('Failed to notify Telegram users:', error);
  }
}

export async function handleTelegramWebhook(req: any, res: any) {
  if (!bot) {
    return res.status(500).json({ error: 'Bot not initialized' });
  }

  try {
    const update = req.body;
    console.log('📨 Received Telegram update:', JSON.stringify(update, null, 2));
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const user = update.message.from;
      
      console.log(`💬 Processing message: ${text} from user ${user.id}`);
      
      // Create or find user in database
      let dbUser = await storage.getUserByTelegramId(user.id.toString());
      if (!dbUser) {
        console.log(`👤 Creating new user: ${user.id}`);
        dbUser = await storage.createUser({
          telegramId: user.id.toString(),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.id.toString() === '5155574276' ? 'admin' : 'customer'
        });
      }

      if (text === '/start') {
        const webAppUrl = process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
          : 'https://3f306987-154e-43c1-95c7-23a8ebe4e4c1-00-373p6j1y25mqd.spock.replit.dev';
        
        await bot.sendMessage(chatId, 
          `🛍️ Xush kelibsiz bizning yetkazib berish xizmatiga!\n\nBozorni ochish uchun quyidagi tugmani bosing:`, 
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "🛒 Bozorni ochish",
                  web_app: { url: webAppUrl }
                }
              ]]
            }
          }
        );
      } else if (text === '/admin' && dbUser.role === 'admin') {
        const webAppUrl = process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/admin`
          : 'https://3f306987-154e-43c1-95c7-23a8ebe4e4c1-00-373p6j1y25mqd.spock.replit.dev/admin';
        
        await bot.sendMessage(chatId, 
          `👨‍💼 Admin paneliga xush kelibsiz!`, 
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "⚙️ Admin Panel",
                  web_app: { url: webAppUrl }
                }
              ]]
            }
          }
        );
      } else if (text === '/orders') {
        const webAppUrl = process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/orders`
          : 'https://3f306987-154e-43c1-95c7-23a8ebe4e4c1-00-373p6j1y25mqd.spock.replit.dev/orders';
        
        await bot.sendMessage(chatId, 
          `📦 Buyurtmalaringizni ko'rish uchun:`, 
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "📋 Buyurtmalarim",
                  web_app: { url: webAppUrl }
                }
              ]]
            }
          }
        );
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}