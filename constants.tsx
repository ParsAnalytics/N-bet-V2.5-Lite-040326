
import { Savci } from './types';

export const SAVCILAR: Record<string, Savci> = {
  oguz_seckin_paksoy: { name: 'OĞUZ SEÇKİN PAKSOY', sicil: '212100' },
  ali_dokumaci: { name: 'ALİ DOKUMACI', sicil: '174445' },
  mehmet_aktas: { name: 'MEHMET AKTAŞ', sicil: '189533' },
  egemen_besinci: { name: 'EGEMEN BEŞİNCİ', sicil: '211292' },
  emre_orman: { name: 'EMRE ORMAN', sicil: '171168' },
  mustafa_emre_demir: { name: 'MUSTAFA EMRE DEMİR', sicil: '193921' },
  mucahit_sarikaya: { name: 'MUCAHİT SARIKAYA', sicil: '194612' },
  fatih_kaya: { name: 'FATİH KAYA', sicil: '199022' },
  enes_yusuf_aycicek: { name: 'ENES YUSUF AYÇİÇEK', sicil: '198464' },
  osman_unlu: { name: 'OSMAN ÜNLÜ', sicil: '150959' },
  cihat_acar: { name: 'CİHAT ACAR', sicil: '214664' },
  ayse_gul_gurer: { name: 'AYŞE GÜL GÜRER', sicil: '120654' },
  feyzullah_solak: { name: 'FEYZULLAH SOLAK', sicil: '212171' },
  hakan_kilic: { name: 'HAKAN KILIÇ', sicil: '252300' }
};

export const TCK_ARTICLES = `
Madde 76: Soykırım, Madde 77: İnsanlığa Karşı Suçlar, Madde 78: Örgüt, Madde 79: Göçmen Kaçakçılığı, Madde 80: İnsan Ticareti, 
Madde 81: Kasten Öldürme, Madde 86: Kasten Yaralama, Madde 102: Cinsel Saldırı, Madde 103: Çocukların Cinsel İstismarı, 
Madde 106: Tehdit, Madde 107: Şantaj, Madde 109: Kişiyi Hürriyetinden Yoksun Kılma, Madde 116: Konut Dokunulmazlığının İhlali, 
Madde 125: Hakaret, Madde 134: Özel Hayatın Gizliliğini İhlal, Madde 141: Hırsızlık, Madde 142: Nitelikli Hırsızlık, 
Madde 148: Yağma (Gasp), Madde 149: Nitelikli Yağma, Madde 151: Mala Zarar Verme, Madde 155: Güveni Kötüye Kullanma, 
Madde 157: Dolandırıcılık, Madde 158: Nitelikli Dolandırıcılık, Madde 170: Genel Güvenliğin Kasten Tehlikeye Sokulması, 
Madde 179: Trafik Güvenliğini Tehlikeye Sokma, Madde 188: Uyuşturucu veya Uyarıcı Madde İmal ve Ticareti, 
Madde 191: Kullanmak İçin Uyuşturucu Satın Almak, Madde 197: Parada Sahtecilik, Madde 204: Resmi Belgede Sahtecilik, 
Madde 241: Tefecilik, Madde 257: Görevi Kötüye Kullanma, Madde 265: Görevi Yaptırmamak İçin Direnme, Madde 267: İftira, 
Madde 282: Suçtan Kaynaklanan Malvarlığı Değerlerini Aklama, Madde 299: Cumhurbaşkanına Hakaret, Madde 314: Silâhlı Örgüt,
6136 Sayılı Kanuna Muhalefet.
`;

const TABLE_STYLE = "border: 1px solid #000; border-collapse: collapse; width: 100%; font-family: 'Inter', sans-serif; color: #000; margin-bottom: 20px; background-color: #fff; table-layout: fixed;";
const TH_STYLE = "border: 1px solid #000; padding: 8px 6px; text-align: center; background-color: #f3f4f6; font-weight: bold; font-size: 10pt; line-height: 1.2;";
const TD_LABEL_STYLE = "border: 1px solid #000; padding: 8px 6px; font-size: 9pt; width: 35%; vertical-align: top; font-weight: 600; line-height: 1.4;";
const TD_VALUE_STYLE = "border: 1px solid #000; padding: 8px 6px; font-size: 9pt; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; line-height: 1.4;";
const SIGNATURE_BLOCK_STYLE = "margin-top: 30px; display: flex; flex-direction: column; align-items: center; width: 300px; margin-left: auto; text-align: center; font-size: 9pt; line-height: 1.5; color: #000;";

export const TEMPLATES = {
  gozalti: `
    <div style="background-color: #fff; padding: 10px; position: relative;">
      <table style="${TABLE_STYLE}">
        <tr><th colspan="2" style="${TH_STYLE}">T.C. İSTANBUL ANADOLU CUMHURİYET BAŞSAVCILIĞI</th></tr>
        <tr><th colspan="2" style="${TH_STYLE}">GÖZALTI KARARI</th></tr>
        <tr><td style="${TD_LABEL_STYLE}">İlgili Emniyet Birimi</td><td style="${TD_VALUE_STYLE}">{{KARAKOL}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Gözaltına Alınan Şüpheli(ler)in Kimliği</td><td style="${TD_VALUE_STYLE}; white-space: pre-line;">{{SUPHELI_AD_KIMLIK}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Yüklenen Suç</td><td style="${TD_VALUE_STYLE}">{{SUC_ADI}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Karar Tarihi</td><td style="${TD_VALUE_STYLE}">{{KARAR_TARIHI}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Gözaltına Alınma Sebebi</td><td style="${TD_VALUE_STYLE}; text-align: justify;">Atılı suçu işlediği şüphesini gösteren somut delillerin varlığı, yüklenen suçun yasada öngörülen cezasının üst haddi, delilleri yok etme, gizleme veya değiştirme hususlarında kuvvetli şüphe sebeplerinin bulunması, soruşturmanın ikmali için gereken süre.</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Gözaltı süresi ile sürenin biteceği tarih ve saat</td><td style="${TD_VALUE_STYLE}">Şüphelinin yakalama emri yerine en yakın hakim veya mahkemeye gönderilmesi için zorunlu süre hariç yakalama tarihi ve saatinden itibaren 1 gün süre ile gözaltına alınmasına</td></tr>
      </table>
      
      <div style="text-align: center; font-weight: bold; font-size: 9pt; margin-bottom: 8px; color: #000;">İSTANBUL EMNİYET MÜDÜRLÜĞÜ</div>
      <div style="font-size: 7.5pt; text-align: justify; line-height: 1.4; color: #000;">
        1-Atılı suçu işlediği şüphesini gösteren somut delillerin varlığı, yüklenen suçun yasada öngörülen cezasının üst haddi, kaçacağı şüphesini uyandıran somut olgular, delilleri yok etme, gizleme veya değiştirme hususlarında kuvvetli şüphe sebeplerinin bulunması, soruşturmanın ikmali için gereken süre nazara alınarak 5271 sayılı CMK'nun 91. maddesine göre yukarıda ismi yazılı şüpheli/şüphelilerin yakalandığı tarih ve saat itibarıyla 1 GÜN SÜRE İLE GÖZALTINA ALINMASINA/ ALINMALARI ARINA.<br>
        2-Gözaltı sürecinde bütün işlemlerin yürütülmesi ve gerek görülürse şüphelinin hakim önüne çıkarılması gerektiğinden. Cumhuriyet Başsavcılığımıza da yapılacak işlemler için makul bir zaman kalacak şekilde getirilmesi.<br>
        3-Üst sınırı 2 yıl veya daha fazla hapis cezasını gerektiren bir suçtan dolayı yürütülen soruşturma söz konusu ise şüpheli/şüphelilerin kimliğinin teşhisi için gerekli olması halinde 5271 sayılı CMK'nın 81. maddesi gereğince fotoğrafı, beden ölçüleri, parmak ve avuç içi izi, bedeninde yer almış olup teşhisini kolaylaştıracak diğer özellikleri ile sesi ve görüntülerinin kayda alınarak. soruşturma evrakına eklenmesi, ayrıca evrak kapsamında gerekli olması halinde PVSK’nın Ek-6. maddesindeki usule göre canlı teşhis işleminin şüphelinin mukavemet etmesi ve rıza göstermemesi durumunda.<br>
        4-Türkiye Cumhuriyeti Anayasasının 19 ve 5271 sayılı CMK’nın 85. maddelerine göre şüpheli/şüphelilerin gözaltına alındığının / alındıklarının bir yakınına veya belirlediği bir kişiye gecikmeksizin bildirilmesi ve bu hususta tutanak hazırlanmasına karar verilmekle gereğinin ifası rica olunur.<br>
        İş bu karar ıslak imzalı iki nüsha olarak düzenlenmiştir.
      </div>

      <div style="${SIGNATURE_BLOCK_STYLE}">
        <div style="font-weight: bold;">{{SAVCI_ADI}}</div>
        <div>{{SAVCI_SICIL}}</div>
        <div style="margin-bottom: 10px;">İstanbul Anadolu Cumhuriyet Savcısı</div>
        {{IMZA_ALANI}}
      </div>
    </div>
  `,
  arama: `
    <div style="background-color: #fff; padding: 10px; position: relative;">
      <table style="${TABLE_STYLE}">
        <tr><th colspan="2" style="${TH_STYLE}">T.C. İSTANBUL ANADOLU CUMHURİYET BAŞSAVCILIĞI</th></tr>
        <tr><th colspan="2" style="${TH_STYLE}">ARAMA VE EL KOYMA EMRİ</th></tr>
        <tr><td style="${TD_LABEL_STYLE}">İlgili Emniyet Birimi</td><td style="${TD_VALUE_STYLE}">{{KARAKOL}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Hakkında karar verilen şüphelinin/şüphelilerin kimliği</td><td style="${TD_VALUE_STYLE}; white-space: pre-line;">{{SUPHELI_AD_KIMLIK}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Yüklenen Suç</td><td style="${TD_VALUE_STYLE}">{{SUC_ADI}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Karar Tarihi</td><td style="${TD_VALUE_STYLE}">{{KARAR_TARIHI}}</td></tr>
        <tr><td colspan="2" style="${TD_VALUE_STYLE}; text-align: justify; line-height: 1.4;">Yukarıda kimlik bilgileri yer alan şüphelinin yakalanması ve/veya olayda kullandığı suç aletinin ele geçirilmesi için arama ve elkoyma emri talep edilmiş olmakla, hakim kararı alınmasının işlemleri geciktireceği ve gecikmenin de sakınca doğuracağı anlaşıldığından, CMK’nın 116 ve devamı maddeleri uyarınca kolluk kuvvetleri tarafından arama yapması ve emrin konusunu oluşturan ya da suç teşkil eden eşya bulunması halinde CMK’nın 127 ve devamı maddeleri gereğince elkoyulması, el koymanın 24 saat içerisinde CMK’nın 127/3 maddesi gereğince hakim onayına sunulması, derhal Cumhuriyet Başsavcılığımıza bilgi verilmesi ve arama-elkoyma işlemlerinde görev alanların ıslak imzalarını içerir belgelerin gönderilmesi rica olunur.<br>İş bu karar ıslak imzalı iki nüsha olarak düzenlenmiştir.</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Aramanın yapılacağı yerin adresi ya da eşya</td><td style="${TD_VALUE_STYLE}">{{ARANILACAK_ADRES}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Aramanın Yapılacağı Tarih</td><td style="${TD_VALUE_STYLE}">{{ARAMA_TARIHI}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Emrin geçerli olduğu saat dilimi</td><td style="${TD_VALUE_STYLE}">{{ARAMA_BASLANGIC_SAATI}} - {{ARAMA_BITIS_SAATI}}</td></tr>
      </table>

      <div style="${SIGNATURE_BLOCK_STYLE}">
        <div style="font-weight: bold;">{{SAVCI_ADI}}</div>
        <div>{{SAVCI_SICIL}}</div>
        <div style="margin-bottom: 10px;">İstanbul Anadolu Cumhuriyet Savcısı</div>
        {{IMZA_ALANI}}
      </div>
    </div>
  `,
  kan: `
    <div style="background-color: #fff; padding: 10px; position: relative;">
      <table style="${TABLE_STYLE}">
        <tr><th colspan="2" style="${TH_STYLE}">T.C. İSTANBUL ANADOLU CUMHURİYET BAŞSAVCILIĞI</th></tr>
        <tr><th colspan="2" style="${TH_STYLE}">BEDEN MUAYENESİ VE VÜCUTTAN ÖRNEK ALINMASI KARARI (CMK 75. VE 76. MADDELERİ UYARINCA)</th></tr>
        <tr><td style="${TD_LABEL_STYLE}">İlgili emniyet birimi</td><td style="${TD_VALUE_STYLE}">{{KARAKOL}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Hakkında karar verilen şüphelinin/şüphelilerin kimliği</td><td style="${TD_VALUE_STYLE}; white-space: pre-line;">{{SUPHELI_AD_KIMLIK}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Yüklenen Suç</td><td style="${TD_VALUE_STYLE}">{{SUC_ADI}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Karar Tarihi</td><td style="${TD_VALUE_STYLE}">{{KARAR_TARIHI}}</td></tr>
        <tr><td colspan="2" style="${TD_VALUE_STYLE}; text-align: justify; line-height: 1.4;">Yukarıda belirtilen suça yönelik olarak Cumhuriyet Başsavcılığımızca başlatılan soruşturma kapsamında; mesai saatleri dışında olunması ve mesai saati beklenerek hakim kararının talep edilmesi halinde soruşturmaya konu suça ilişkin delillerin kaybolma ihtimalinin bulunması hususları birlikte değerlendirildiğinde, gecikmesinde sakınca bulunan hal bulunmakla; CMK 75. maddesi uyarınca şüpheli / CMK 76. maddesi uyarınca yukarıda kimlik bilgileri belirtilen şahsın vücudundan kan, idrar vb. biyolojik örnekler alınmasına / iç beden muayenesi yapılmasına ve kararımızın yirmidört saat içinde hakim onayına sunulmasına karar verilmiştir.<br>İş bu karar ıslak imzalı iki nüsha olarak düzenlenmiştir.</td></tr>
      </table>

      <div style="${SIGNATURE_BLOCK_STYLE}">
        <div style="font-weight: bold;">{{SAVCI_ADI}}</div>
        <div>{{SAVCI_SICIL}}</div>
        <div style="margin-bottom: 10px;">İstanbul Anadolu Cumhuriyet Savcısı</div>
        {{IMZA_ALANI}}
      </div>
    </div>
  `,
  telefon: `
    <div style="background-color: #fff; padding: 10px; position: relative;">
      <table style="${TABLE_STYLE}">
        <tr><th colspan="2" style="${TH_STYLE}">T.C. İSTANBUL ANADOLU CUMHURİYET BAŞSAVCILIĞI</th></tr>
        <tr><th colspan="2" style="${TH_STYLE}">BİLGİSAYAR, CEP TELEFONU, TABLET VE BENZERİ EŞYALAR ÜZERİNDE İNCELEME KARARI (CMK 134. MADDESİ UYARINCA)</th></tr>
        <tr><td style="${TD_LABEL_STYLE}">İlgili emniyet birimi</td><td style="${TD_VALUE_STYLE}">{{KARAKOL}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Hakkında karar verilen şüphelinin/şüphelilerin kimliği</td><td style="${TD_VALUE_STYLE}; white-space: pre-line;">{{SUPHELI_AD_KIMLIK}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Yüklenen Suç</td><td style="${TD_VALUE_STYLE}">{{SUC_ADI}}</td></tr>
        <tr><td style="${TD_LABEL_STYLE}">Karar Tarihi</td><td style="${TD_VALUE_STYLE}">{{KARAR_TARIHI}}</td></tr>
        <tr><td colspan="2" style="${TD_VALUE_STYLE}; text-align: justify; line-height: 1.4;">Şüpheli/şüphelilere ait cep telefonu, tablet ve benzeri bilgisayar niteliğindeki eşyalar üzerinde 5271 sayılı CMK’nın 134/1. maddesi gereğince gecikmesinde sakınca bulunan hal kapsamında arama yapılmasına, kayıtlarından kopya çıkarılmasına ve bu kayıtların çözülerek metin haline getirilmesine karar verildi. Kararımızın yine CMK 134. maddesi uyarınca 24 saat içerisinde hakim onayına sunulması hususunda gereği rica olunur.<br>İş bu karar ıslak imzalı iki nüsha olarak düzenlenmiştir.</td></tr>
      </table>

      <div style="${SIGNATURE_BLOCK_STYLE}">
        <div style="font-weight: bold;">{{SAVCI_ADI}}</div>
        <div>{{SAVCI_SICIL}}</div>
        <div style="margin-bottom: 10px;">İstanbul Anadolu Cumhuriyet Savcısı</div>
        {{IMZA_ALANI}}
      </div>
    </div>
  `
};

export function trUpperCase(s: string) {
  return s ? s.toLocaleUpperCase('tr-TR') : '';
}

export function formatDateTR(d: string) {
  if (!d) return '';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
}

export function formatSupheliText(t: string) {
  if (!t) return '';
  return t.split('\n').map(l => {
    const isYabanci = l.toUpperCase().includes('YABANCI') || l.toUpperCase().includes('PASAPORT');
    const m = l.match(/\b\d+\b/g); 
    let tc = '';
    if (m) tc = m.find(x => x.length === 11) || m[0]; // grab 11 digit first, else any number
    
    let n = l.replace(tc, '')
             .replace(/TC:?/i, '')
             .replace(/T\.C\.?/i, '')
             .replace(/kimlik no:?/i, '')
             .replace(/PASAPORT NO\/YBKN:?/i, '')
             .replace(/\(YABANCI\)/i, '')
             .replace(/Uyruklu/i, '')
             .replace(/Yabancı/i, '')
             .replace(/[-:()]/g, ' ')
             .replace(/\s+/g, ' ')
             .trim();
             
    n = n.replace(/^"|"$/g, '').trim();
    n = trUpperCase(n);
    
    if (n && tc) {
      return isYabanci ? `${n} PASAPORT NO/YBKN: ${tc}` : `${n} (TC:${tc})`;
    } else if (n) {
      return isYabanci ? `${n} PASAPORT NO/YBKN: ` : `${n}`;
    } else if (tc) {
      return isYabanci ? `PASAPORT NO/YBKN: ${tc}` : `(TC:${tc})`;
    }
    return '';
  }).filter(l => l.trim() !== '').join('\n');
}

export function formatSucAdi(t: string) {
  if (!t) return '';
  return t.split(/[,;\/\n]/).map(l => {
    let clean = l.trim();
    if (!clean) return '';
    clean = trUpperCase(clean);
    
    if (clean.includes('191') || (clean.includes('UYUŞTURUCU') && clean.includes('KULLAN'))) {
      clean = trUpperCase("Kullanmak için uyuşturucu veya uyarıcı madde satın almak, kabul etmek veya bulundurmak ya da uyuşturucu veya uyarıcı madde kullanmak");
    }
    
    return clean;
  }).filter(l => l !== '').join('\n');
}

export function populateTemplate(temp: string, d: any, sig?: string) {
  let h = temp || '';
  
  const formattedSupheli = formatSupheliText(d.supheliAdKimlik);
  if (formattedSupheli) {
    const lines = formattedSupheli.split('\n').filter((l: string) => l.trim());
    // Her zaman dikey listeleme (alt alta) sağlamak için her ismi bir div içinde döndür
    const formatted = lines.map((x: string, i: number) => {
      const prefix = lines.length > 1 ? `${i + 1}- ` : '';
      return `<div style="margin-bottom: 2px;">${prefix}${x.trim()}</div>`;
    }).join('');
    h = h.replace('{{SUPHELI_AD_KIMLIK}}', formatted);
  } else {
    h = h.replace('{{SUPHELI_AD_KIMLIK}}', '-');
  }

  const formattedSuc = formatSucAdi(d.sucAdi);
  if (formattedSuc) {
    const lines = formattedSuc.split('\n').filter((l: string) => l.trim());
    // Her zaman dikey listeleme
    const formatted = lines.map((x: string, i: number) => {
      const prefix = lines.length > 1 ? `${i + 1}- ` : '';
      return `<div style="margin-bottom: 2px;">${prefix}${x.trim()}</div>`;
    }).join('');
    h = h.replace(/{{SUC_ADI}}/g, formatted);
  } else {
    h = h.replace(/{{SUC_ADI}}/g, '-');
  }

  h = h.replace(/{{KARAKOL}}/g, d.karakol || '-')
       .replace(/{{KARAR_TARIHI}}/g, formatDateTR(d.kararTarihi) || '-')
       .replace(/{{GOZALTI_SAATI}}/g, d.gozaltiSaati || '-')
       .replace(/{{ARANILACAK_ADRES}}/g, d.aranilacakAdres || '') 
       .replace(/{{ARAMA_TARIHI}}/g, formatDateTR(d.aramaTarihi) || '-')
       .replace(/{{ARAMA_BASLANGIC_SAATI}}/g, d.aramaBaslangicSaati || '-')
       .replace(/{{ARAMA_BITIS_SAATI}}/g, d.aramaBitisSaati || '-')
       .replace(/{{SAVCI_ADI}}/g, d.savciAdi || 'İsim Belirtilmedi')
       .replace(/{{SAVCI_SICIL}}/g, d.savciSicil || 'Sicil Belirtilmedi');
  
  if (sig) {
    h = h.replace('{{IMZA_ALANI}}', `<img src="${sig}" alt="İmza" style="max-height: 80px; max-width: 160px; display: block; margin: 8px auto 0;">`);
  } else {
    h = h.replace('{{IMZA_ALANI}}', '<div style="height: 60px; border-bottom: 1px dotted #ccc; width: 150px; margin: 10px auto;"></div>');
  }

  return h;
}

export function formatDateInput(val: string) {
  // Remove non-digit characters
  const clean = val.replace(/\D/g, '');
  // If exactly 8 digits, format as DD.MM.YYYY
  if (clean.length === 8) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 8)}`;
  }
  return val;
}
