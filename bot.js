const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true });

bot.onText(/\/start/, (msg)=>{

const chatId = msg.chat.id;
const userId = msg.from.id;

bot.sendMessage(chatId,
`🎉 অভিনন্দন ${msg.from.first_name}

⬇️ নিচে আয় শুরু করুন বাটনে ক্লিক করুন!

🔗 আপনার রেফার লিংক:
https://t.me/loyalti_app_bot/app?startapp=${userId}`,
{
reply_markup:{
inline_keyboard:[

[
{
text:"আয় শুরু করুন",
web_app:{
url:"https://t.me/loyalti_app_bot/app"
}
}
],

[
{
text:"অফিসিয়াল গ্রুপ",
url:"https://t.me/zomato_app_official_channel"
}
],

[
{
text:"কিভাবে কাজ করবেন ভিডিও",
url:"https://t.me/zomato_app_payment_proof/94"
}
],

[
{
text:"পেমেন্ট প্রুফ গ্রুপ",
url:"https://t.me/zomato_app_payment_proof"
}
]

]
}
});

});