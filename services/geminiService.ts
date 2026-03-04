
import { GoogleGenAI, Type } from "@google/genai";
import { TCK_ARTICLES } from "../constants";

/**
 * Robust retry wrapper with Exponential Backoff
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 3000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const isRateLimit = error?.message?.includes('429') || 
                          error?.message?.includes('RESOURCE_EXHAUSTED') ||
                          error?.status === 429;
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`API Quota exceeded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Güvenli API Anahtarı Alma - Kapsamlı Kontrol
const getApiKey = (): string => {
  let key = '';

  // 1. Vite Environment (En yaygın)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Process Environment (Build-time replacement)
  if (!key) {
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        if (process.env.VITE_API_KEY) key = process.env.VITE_API_KEY;
        // @ts-ignore
        else if (process.env.API_KEY) key = process.env.API_KEY;
        // @ts-ignore
        else if (process.env.REACT_APP_API_KEY) key = process.env.REACT_APP_API_KEY;
      }
    } catch (e) {}
  }
  
  // 3. Window Shim (Index.tsx bridge sonucu)
  if (!key) {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.process && window.process.env) {
        // @ts-ignore
        key = window.process.env.API_KEY || window.process.env.VITE_API_KEY;
      }
    } catch (e) {}
  }

  // Temizlik: Boşlukları ve yanlışlıkla string olarak gelmiş 'undefined' değerlerini temizle
  if (key) {
    key = String(key).trim();
    if (key === 'undefined' || key === 'null' || key === '') {
      key = '';
    }
  }

  return key;
};

export async function analyzeInfoNote(text: string) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Anahtarı Hatası: Sistem API anahtarını bulamadı. Lütfen Vercel ayarlarında 'VITE_API_KEY' değişkeninin tanımlı olduğundan emin olun.");
  }

  const ai = new GoogleGenAI({ apiKey });

  return withRetry(async () => {
    const prompt = `GÖREV: Aşağıdaki bilgi notunu analiz et ve TÜM şüphelileri/yakalanan şahısları eksiksiz listele.
    
    METİN: "${text}"

    TALİMATLAR:
    1. Metinde geçen (*) veya madde imi ile belirtilmiş veya "Şüpheliler:" başlığı altındaki HER BİR şahsı tespit et.
    2. "supheliler" dizisine, tespit ettiğin her şahsın "AD SOYAD TC" bilgisini ayrı birer eleman olarak ekle.
    3. Asla sadece ilk ismi alıp durma. Metnin sonuna kadar tara.
    4. Suç ismini şu listeden en uygun olanıyla eşleştir: ${TCK_ARTICLES}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supheliler: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Tespit edilen her bir şüphelinin Ad Soyad ve TC bilgisi"
            },
            sucAdi: { type: Type.STRING },
            karakol: { type: Type.STRING },
            kararTarihi: { type: Type.STRING },
            gozaltiSaati: { type: Type.STRING },
            aranilacakAdres: { type: Type.STRING },
            aramaBaslangicSaati: { type: Type.STRING },
            aramaBitisSaati: { type: Type.STRING },
            aramaTarihi: { type: Type.STRING },
            aramaGerekli: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    let supheliString = '';
    if (Array.isArray(result.supheliler) && result.supheliler.length > 0) {
      supheliString = result.supheliler.join('\n');
    } else if (typeof result.supheliler === 'string') {
      supheliString = result.supheliler;
    }

    return {
        ...result,
        supheliAdKimlik: supheliString
    };
  });
}

export async function analyzeDocumentImage(base64: string, mimeType: string) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Anahtarı Hatası: Sistem API anahtarını bulamadı. Lütfen Vercel ayarlarında 'VITE_API_KEY' değişkeninin tanımlı olduğundan emin olun.");
  }

  const ai = new GoogleGenAI({ apiKey });

  return withRetry(async () => {
    // Liste ve Tablo okuma odaklı güçlendirilmiş prompt
    const prompt = `GÖREV: Bu görseli bir "Nezarethane Listesi", "Gözaltı Takip Çizelgesi" veya "Yakalama Tutanağı" olarak ele al.
    
    TEMEL HEDEF: Görseldeki listede yer alan **TÜM** şahısları eksiksiz tespit etmektir.

    KRİTİK TALİMATLAR:
    1. LİSTE TARAMASI (ÖNEMLİ): Görselde alt alta sıralanmış isimler veya bir tablo varsa, **SADECE İLK SATIRI DEĞİL, TABLONUN TAMAMINI** oku.
    2. HEPSİNİ AL: Eğer listede 5 kişi varsa, 5'ini de "supheliler" dizisine ekle. Asla özet geçme.
    3. SÜTUNLARI BUL: "Adı Soyadı", "Şüpheli", "Kimlik" sütunlarını bul ve altındaki verileri çek.
    4. FORMAT: Şahıs isimlerini ve varsa TC numaralarını "AD SOYAD TC" formatında al.
    5. SUÇ TESPİTİ: Belgenin "Suç" sütununu veya genel konusunu bul.
    6. ZAMAN: "Gözaltı Giriş", "Yakalama" veya belgenin tarih/saatini bul.
    7. EL YAZISI: Yazılar silik veya el yazısı olsa bile bağlama göre en mantıklı tahmini yap.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            belgeBasligi: { type: Type.STRING, description: "Belgenin türü (Gözaltı Listesi, Arama Tutanağı vb.)" },
            supheliler: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Listede tespit edilen TÜM şüphelilerin isimleri (Eksiksiz)" },
            sucAdi: { type: Type.STRING },
            karakol: { type: Type.STRING },
            gozaltiTarihSaat: { type: Type.STRING, description: "Belgede geçen işlem saati" },
            aranilacakAdres: { type: Type.STRING },
            aramaBaslangicSaati: { type: Type.STRING },
            aramaBitisSaati: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');

    let supheliString = '';
    if (Array.isArray(result.supheliler) && result.supheliler.length > 0) {
      supheliString = result.supheliler.join('\n');
    } else if (typeof result.supheliler === 'string') {
      supheliString = result.supheliler;
    }

    return {
        ...result,
        supheliAdKimlik: supheliString
    };
  });
}
