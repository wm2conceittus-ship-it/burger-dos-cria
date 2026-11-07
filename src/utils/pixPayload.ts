/**
 * Utilitário de Geração de Código Pix e Payload EMV (Padrão Banco Central do Brasil)
 * Com gerador síncrono local de QR Code SVG 100% confiável via 'qrcode'.
 */
import QRCode from 'qrcode';

export function generatePixPayload(params: {
  pixKey: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txid?: string;
}): string {
  const { pixKey, merchantName = 'BURGER DOS CRIAS', merchantCity = 'SAO PAULO', amount, txid = '***' } = params;

  let cleanKey = (pixKey || '11987654321').trim();
  
  if (cleanKey.includes('@')) {
    cleanKey = cleanKey.toLowerCase().trim();
  } else {
    const digits = cleanKey.replace(/\D/g, '');
    if (digits.length === 14) {
      cleanKey = digits;
    } else if (cleanKey.startsWith('+')) {
      cleanKey = `+${cleanKey.replace(/\D/g, '')}`;
    } else if (digits.length === 10 || digits.length === 11) {
      if (cleanKey.includes('(') || cleanKey.includes('-') || cleanKey.startsWith('9')) {
        cleanKey = `+55${digits}`;
      } else {
        cleanKey = digits;
      }
    }
  }
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .slice(0, 25)
    .toUpperCase();
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .slice(0, 15)
    .toUpperCase();

  const strAmount = amount > 0 ? Number(amount).toFixed(2) : '';

  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const f00 = formatField('00', '01');
  const f01 = formatField('01', strAmount ? '12' : '11');

  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', cleanKey);
  const f26 = formatField('26', `${gui}${keyField}`);

  const f52 = formatField('52', '0000');
  const f53 = formatField('53', '986');
  const f54 = strAmount ? formatField('54', strAmount) : '';
  const f58 = formatField('58', 'BR');
  const f59 = formatField('59', cleanName || 'BURGER CRIAS');
  const f60 = formatField('60', cleanCity || 'SAO PAULO');

  const f05 = formatField('05', txid || '***');
  const f62 = formatField('62', f05);

  const raw = `${f00}${f01}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;

  let crc = 0xffff;
  for (let i = 0; i < raw.length; i++) {
    crc ^= raw.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${raw}${crcHex}`;
}

export function getPixQrCodeUrl(payload: string, size = 260): string {
  try {
    const qr = (QRCode as any).create(payload, { errorCorrectionLevel: 'M' });
    const sizeModules = qr.modules.size;
    const data = qr.modules.data;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizeModules} ${sizeModules}" width="${size}" height="${size}">`;
    svg += `<path fill="#ffffff" d="M0 0h${sizeModules}v${sizeModules}H0z"/>`;
    svg += `<path fill="#000000" d="`;
    
    for (let row = 0; row < sizeModules; row++) {
      for (let col = 0; col < sizeModules; col++) {
        if (data[row * sizeModules + col]) {
          svg += `M${col} ${row}h1v1H${col}z `;
        }
      }
    }
    svg += `"/></svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch (err) {
    console.warn('Error generating local QR code, falling back to external API:', err);
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    payload
  )}`;
}
