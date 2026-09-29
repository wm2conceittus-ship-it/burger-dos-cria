// Client service for interacting with our backend Mercado Pago API endpoints

export interface PixResponse {
  id: string | number;
  status: string;
  status_detail: string;
  qr_code: string;
  qr_code_base64?: string;
  ticket_url?: string;
  isRealApi?: boolean;
  note?: string;
}

export interface CardPaymentResponse {
  id: string | number;
  status: string;
  status_detail: string;
  isRealApi?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
  error?: string;
  methodsCount?: number;
  mode?: string;
}

export const mercadoPagoApi = {
  // Test connection with token
  async testConnection(accessToken?: string): Promise<ConnectionTestResult> {
    try {
      const res = await fetch('/api/mercadopago/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao conectar com o servidor' };
    }
  },

  // Create Pix payment via server API
  async createPix(params: {
    transaction_amount: number;
    description: string;
    payer: {
      email: string;
      first_name: string;
      identification: { type: string; number: string };
    };
    customAccessToken?: string;
  }): Promise<PixResponse> {
    const res = await fetch('/api/mercadopago/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao gerar Pix via API');
    }

    return await res.json();
  },

  // Process Card payment via server API
  async createCardPayment(params: {
    transaction_amount: number;
    description: string;
    installments: number;
    payer: {
      email: string;
      identification: { type: string; number: string };
    };
    cardDetails: {
      cardNumber: string;
      cardHolder: string;
      expiry: string;
      cvv: string;
    };
    customAccessToken?: string;
  }): Promise<CardPaymentResponse> {
    const res = await fetch('/api/mercadopago/create-card-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_amount: params.transaction_amount,
        description: params.description,
        installments: params.installments,
        payer: params.payer,
        customAccessToken: params.customAccessToken,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao processar cartão via API');
    }

    return await res.json();
  },

  // Check payment status (polling or manual check)
  async checkPaymentStatus(
    paymentId: string | number,
    customAccessToken?: string
  ): Promise<{ status: string; approved: boolean }> {
    const query = customAccessToken ? `?customAccessToken=${encodeURIComponent(customAccessToken)}` : '';
    const res = await fetch(`/api/mercadopago/payment-status/${paymentId}${query}`);
    if (!res.ok) {
      throw new Error('Falha ao verificar status do pagamento');
    }
    return await res.json();
  },

  // Create Checkout Pro Preference
  async createPreference(params: {
    items: Array<{ title: string; quantity: number; unit_price: number }>;
    payer: { email: string };
    customAccessToken?: string;
  }): Promise<{ id: string; init_point: string; sandbox_init_point: string }> {
    const res = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error('Falha ao criar preferência de checkout');
    }

    return await res.json();
  },

  // Get recent webhook logs
  async getWebhookLogs(): Promise<{ total: number; logs: any[] }> {
    const res = await fetch('/api/mercadopago/webhook-logs');
    if (!res.ok) return { total: 0, logs: [] };
    return await res.json();
  },
};
