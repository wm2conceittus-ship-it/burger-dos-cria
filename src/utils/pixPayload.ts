/**
 * Utilitário de Geração de Código Pix e Payload EMV (Padrão Banco Central do Brasil)
 */

export function generatePixPayload(params: {
  pixKey: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txid?: string;
}): string {
  const { pixKey, merchantName = 'BURGER DOS CRIAS', merchantCity = 'SAO PAULO', amount, txid = '***' } = params;

  let cleanKey = (pixKey || '11987654321').trim();
  
  // Format cleanKey according to BCB standard
  if (cleanKey.includes('@')) {
    cleanKey = cleanKey.toLowerCase().trim();
  } else {
    const digits = cleanKey.replace(/\D/g, '');
    // CNPJ (14 digits)
    if (digits.length === 14) {
      cleanKey = digits;
    } else if (cleanKey.startsWith('+')) {
      cleanKey = `+${cleanKey.replace(/\D/g, '')}`;
    } else if (digits.length === 10 || digits.length === 11) {
      // If it looks like Brazilian phone (e.g. 11987654321 or (11) 98765-4321)
      // Check if it's formatted as phone or explicitly with DDD >= 11
      if (cleanKey.includes('(') || cleanKey.includes('-') || cleanKey.startsWith('9')) {
        cleanKey = `+55${digits}`;
      } else {
        // Keep as digits (works for CPF or phone)
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

  // 00: Payload Format Indicator
  const f00 = formatField('00', '01');
  // 01: Point of Initiation Method (12 = Dynamic / Specific amount, 11 = Static)
  const f01 = formatField('01', strAmount ? '12' : '11');

  // 26: Merchant Account Information (Pix)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', cleanKey);
  const f26 = formatField('26', `${gui}${keyField}`);

  // 52: Merchant Category Code (0000)
  const f52 = formatField('52', '0000');
  // 53: Transaction Currency (986 = Real BRL)
  const f53 = formatField('53', '986');
  // 54: Transaction Amount
  const f54 = strAmount ? formatField('54', strAmount) : '';
  // 58: Country Code (BR)
  const f58 = formatField('58', 'BR');
  // 59: Merchant Name
  const f59 = formatField('59', cleanName || 'BURGER CRIAS');
  // 60: Merchant City
  const f60 = formatField('60', cleanCity || 'SAO PAULO');

  // 62: Additional Data Field (TXID)
  const f05 = formatField('05', txid || '***');
  const f62 = formatField('62', f05);

  const raw = `${f00}${f01}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;

  // CRC16-CCITT (Polynomial 0x1021, Initial 0xFFFF)
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
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    payload
  )}`;
}
