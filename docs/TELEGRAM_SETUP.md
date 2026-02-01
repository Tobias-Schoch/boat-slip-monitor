# Telegram Setup Guide

Complete guide to setting up Telegram notifications for the Boat Slip Monitor.

## Overview

Telegram is the **primary notification channel** for this monitoring system. It provides instant, reliable notifications with rich formatting and inline buttons.

## Step-by-Step Setup

### Step 1: Create a Telegram Bot

1. **Open Telegram** on your phone or computer

2. **Search for @BotFather** in the search bar
   - This is Telegram's official bot for creating bots
   - Username: `@BotFather`
   - Make sure it's verified (blue checkmark)

3. **Start a chat** with BotFather
   - Click START or send `/start`

4. **Create your bot**
   - Send: `/newbot`
   - BotFather will ask for a name and username

5. **Choose a name** (display name)
   - Example: `Boat Slip Alert`
   - This is what users see in the chat list

6. **Choose a username** (must end with 'bot')
   - Example: `boat_slip_alert_bot`
   - Must be unique across Telegram
   - Must end with `bot`

7. **Copy your bot token**
   - BotFather will send you a message like:
     ```
     Done! Here is your bot token:
     123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567

     Keep your token secure and store it safely, it can be used by anyone to control your bot.
     ```
   - **Copy the entire token** (it's long!)
   - Keep it secret - anyone with this token controls your bot

### Step 2: Get Your Chat ID

Your Chat ID is the unique identifier for your Telegram account. The bot needs this to know where to send notifications.

#### Method A: Automated Helper Script (Recommended)

```bash
cd website-change-monitor
./scripts/get-telegram-chat-id.sh
```

1. Paste your bot token when prompted
2. The script will tell you to message your bot
3. Open Telegram, search for your bot, click START
4. Send any message (e.g., "hello")
5. Return to the terminal and press Enter
6. Your Chat ID will be displayed automatically

#### Method B: Manual Method

1. **Find your bot in Telegram**
   - Search for the username you created (e.g., `boat_slip_alert_bot`)
   - Click on it

2. **Start the bot**
   - Click the **START** button at the bottom
   - OR send any message (e.g., "hello", "test", "hi")

3. **Open the Telegram API URL**
   - Replace `<YOUR_TOKEN>` with your actual bot token:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   - Example:
   ```
   https://api.telegram.org/bot123456789:ABCdefGHI/getUpdates
   ```

4. **Find your Chat ID in the response**

   **Good response** (you messaged the bot):
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 987654321,
             "is_bot": false,
             "first_name": "Your Name"
           },
           "chat": {
             "id": 987654321,  ← THIS IS YOUR CHAT ID!
             "first_name": "Your Name",
             "type": "private"
           },
           "date": 1234567890,
           "text": "hello"
         }
       }
     ]
   }
   ```

   Look for `"chat": {"id": 987654321` - that number is your Chat ID!

   **Bad response** (you didn't message the bot):
   ```json
   {"ok":true,"result":[]}
   ```

   This means no messages found. See troubleshooting below.

## Troubleshooting

### Issue: Empty Result `{"ok":true,"result":[]}`

**Cause**: You haven't sent a message to your bot yet, or the updates were already consumed.

**Solution**:

1. **Double-check you're using the correct bot**
   - Search for your bot username in Telegram
   - Make sure it's YOUR bot (the one you just created)

2. **Send a message to the bot**
   - Click START in the bot chat
   - Send any message: "hello", "test", "hi"

3. **Try the API URL again**
   - Refresh the browser
   - Or wait 10-30 seconds and try again

4. **Send ANOTHER message**
   - Sometimes the first message gets consumed
   - Send a second message
   - Try the API URL again

5. **Check your bot token**
   - Make sure you copied the entire token
   - No spaces or extra characters
   - Should look like: `123456789:ABC...`

### Issue: Invalid Bot Token

**Error**: `{"ok":false,"error_code":404,"description":"Not Found"}`

**Cause**: The bot token is incorrect.

**Solution**:
1. Go back to @BotFather
2. Send `/mybots`
3. Select your bot
4. Click "API Token"
5. Copy the token again
6. Make sure to copy the ENTIRE token

### Issue: Multiple Chat IDs

If you see multiple chat IDs in the response:

**Cause**: Multiple people or devices messaged your bot.

**Solution**: Use the first Chat ID (most likely yours) or look at the `"first_name"` field to identify which one is you.

### Issue: Can't Find My Bot

**Symptoms**:
- Search doesn't find your bot
- Bot username already taken

**Solutions**:
1. **Check the username**
   - Must end with `bot`
   - Case-sensitive
   - Use @ symbol when searching: `@your_bot_name_bot`

2. **Try a different username**
   - Send `/newbot` to BotFather again
   - Choose a more unique username
   - Add numbers: `boat_slip_alert_2024_bot`

3. **Check if bot was created**
   - Send `/mybots` to BotFather
   - See list of your bots

### Issue: Bot Token Compromised

If you accidentally shared your bot token:

1. **Revoke the old token**
   - Go to @BotFather
   - Send `/mybots`
   - Select your bot
   - Click "API Token"
   - Click "Revoke current token"

2. **Generate new token**
   - BotFather will give you a new token
   - Update your `.env` file with the new token

3. **Restart services**
   ```bash
   pm2 restart all
   # or
   docker-compose restart
   ```

## Testing Your Setup

After you have both the bot token and chat ID:

1. **Add to .env file**
   ```bash
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
   TELEGRAM_CHAT_ID=987654321
   ```

2. **Test the notification**
   ```bash
   ./scripts/test-notification.sh telegram
   ```

3. **Check Telegram**
   - You should receive a test message within seconds
   - Message will have inline buttons
   - Message will be formatted with emoji

**Expected test message**:
```
🚨 Test Notification

This is a test notification from Boat Slip Monitor

🔗 URL: http://localhost:3000
📊 Confidence: 100%

⏰ [timestamp]
```

## Security Best Practices

1. **Keep your bot token secret**
   - Never commit to git
   - Never share publicly
   - Store in `.env` file (ignored by git)

2. **Restrict bot access**
   - Only you should message your bot
   - Don't share the bot username publicly

3. **Regular token rotation**
   - Consider rotating token periodically
   - Especially if you suspect compromise

4. **Use environment variables**
   - Never hardcode tokens in code
   - Always use `.env` file

## Advanced Configuration

### Custom Bot Settings

You can customize your bot with @BotFather:

1. **Set description**
   - Send `/mybots` to BotFather
   - Select your bot
   - Click "Edit Bot"
   - Click "Description"
   - Add: "24/7 monitoring for website waiting list"

2. **Set about text**
   - Click "About"
   - Add: "Notifies you when the waiting list opens"

3. **Set profile picture**
   - Click "Edit Bot Picture"
   - Upload an image (optional)

### Multiple Users

To send notifications to multiple people:

**Option A**: Multiple bots (recommended)
- Each user creates their own bot
- Each user runs their own instance

**Option B**: Telegram group
1. Create a Telegram group
2. Add your bot to the group
3. Make bot an admin
4. Get the group Chat ID (negative number)
5. Use group Chat ID in `.env`

### Notification Features

The bot sends rich notifications with:

- **Emoji indicators** (🚨 for critical, ⚠️ for important, ℹ️ for info)
- **Markdown formatting** (bold, italic)
- **Inline buttons**:
  - "🔍 View Dashboard" - Opens dashboard
  - "✅ Acknowledge" - Mark as read
- **Screenshot attachments** (when available)

## FAQ

**Q: Do I need a phone number for Telegram?**
A: Yes, Telegram requires phone number verification.

**Q: Can I use the same bot for multiple monitors?**
A: Yes, but each instance should have its own database.

**Q: Does the bot need to be running 24/7?**
A: No, the bot doesn't run - it's just used to send messages via Telegram's API.

**Q: What if I delete the bot?**
A: You'll need to create a new bot and update your credentials.

**Q: Can I change the bot username?**
A: No, once created, usernames are permanent. You'd need to create a new bot.

**Q: Is Telegram required?**
A: Yes, it's the primary notification channel. Email and SMS are optional.

**Q: Does this cost money?**
A: No, Telegram bots are completely free.

## Support

If you're still having issues:

1. Check the [QUICK_START.md](../QUICK_START.md) guide
2. Review the [SETUP.md](../SETUP.md) for detailed instructions
3. Run the helper script: `./scripts/get-telegram-chat-id.sh`
4. Check logs: `pm2 logs` or `docker-compose logs`

## Related Documentation

- [Quick Start Guide](../QUICK_START.md)
- [Setup Guide](../SETUP.md)
- [Troubleshooting](../SETUP.md#troubleshooting)
- [Scripts Documentation](../scripts/README.md)
