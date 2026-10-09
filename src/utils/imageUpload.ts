/**
 * Utilitário para upload e compressão de imagens do dispositivo para o cardápio.
 * Redimensiona e otimiza imagens localmente no navegador antes de salvar no Firestore.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).'));
    }

    // Limite de segurança de 25MB para leitura inicial
    if (file.size > 25 * 1024 * 1024) {
      return reject(new Error('A imagem selecionada é muito grande (máximo 25MB).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler a imagem do dispositivo.'));
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result !== 'string') {
        return reject(new Error('Não foi possível ler o arquivo.'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem não suportado pelo navegador.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensiona proporcionalmente mantendo a proporção de aspecto
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(result);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para jpeg otimizado
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
