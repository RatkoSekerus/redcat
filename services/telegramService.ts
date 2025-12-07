import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from '../constants';

export const sendTelegramOrder = async (
  productName: string, 
  quantity: number, 
  customerName: string, 
  address: string, 
  phone: string
): Promise<boolean> => {
  const message = `
🚨 **NOVA PORUDŽBINA** 🚨

📦 **Proizvod:** ${productName}
🔢 **Količina:** ${quantity}
👤 **Kupac:** ${customerName}
📞 **Telefon:** ${phone}
📍 **Adresa za isporuku:** ${address}
🕒 **Vreme:** ${new Date().toLocaleString('sr-RS')}

Molimo proverite inventar i kontaktirajte kupca za potvrdu i detalje isporuke.
  `;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
};
