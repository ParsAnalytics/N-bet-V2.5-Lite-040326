
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Download, 
  PenTool,
  AlertCircle,
  Camera,
  Sparkles,
  X,
  AlertTriangle,
  ClipboardList,
  Users,
  FileArchive,
  Globe,
  Plus,
  Share2
} from 'lucide-react';
import { PageType, KararData, TrackingItem, DecisionFormData, Stroke, Point } from './types';
import { 
  SAVCILAR, 
  trUpperCase, 
  formatSupheliText, 
  formatSucAdi,
  populateTemplate, 
  TEMPLATES,
  formatDateTR,
  formatDateInput
} from './constants';
import { analyzeInfoNote } from './services/geminiService';
import SignaturePad from './components/SignaturePad';

const App: React.FC = () => {
  // Navigation
  const [currentPage, setCurrentPage] = useState<PageType>('bilgi-notu');
  
  // Data
  const [kararlar, setKararlar] = useState<KararData[]>(() => {
    const saved = localStorage.getItem('nobetApp_kararlar');
    return saved ? JSON.parse(saved) : [];
  });
  const [trackingList, setTrackingList] = useState<TrackingItem[]>(() => {
    const saved = localStorage.getItem('nobetApp_gozaltiListesi');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper for cleaning karakol name
  const cleanKarakolName = (name: string) => {
    if (!name) return '';
    return trUpperCase(name)
      .replace(/.*İLÇE EMNİYET MÜDÜRLÜĞÜ\s*/g, '') 
      .replace(/POLİS MERKEZİ AMİRLİĞİ/g, 'PMA')
      .replace(/POLİS MERKEZİ/g, 'PMA')
      .replace(/BÜRO AMİRLİĞİ/g, 'B.A.') 
      .trim();
  };

  // --- FILENAME ENCODING HELPERS ---
  const sanitizeForFilename = (text: string) => {
    if (!text) return 'BELIRSIZ';
    return text
      .trim()
      .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
      .replace(/Ü/g, 'U').replace(/ü/g, 'u')
      .replace(/Ş/g, 'S').replace(/ş/g, 's')
      .replace(/İ/g, 'I').replace(/ı/g, 'i')
      .replace(/Ö/g, 'O').replace(/ö/g, 'o')
      .replace(/Ç/g, 'C').replace(/ç/g, 'c')
      .replace(/[\s\-_]+/g, '_') // Boşluk, tire ve alt çizgileri tek bir alt çizgiye indir
      .replace(/[^a-zA-Z0-9_]/g, '') // Alfanumerik olmayanları sil
      .replace(/__+/g, '_') // Çift alt çizgileri teke indir
      .replace(/^_|_$/g, ''); // Başındaki ve sonundaki alt çizgileri sil
  };

  const parseFilename = (filename: string): TrackingItem | null => {
    // Format: NOBETV2__TUR__SUPHELI__SUC__KARAKOL__TARIH__ID.jpg
    // Arama için: NOBETV2__ARAMA__SUPHELI__SUC__KARAKOL__TARIH__ADRES__SAAT__ID.jpg
    
    let decodedName = filename;
    try {
      // URL encode edilmiş dosya isimlerini çöz (örn: %20, %5F vb.)
      decodedName = decodeURIComponent(filename);
    } catch (e) {}

    const tag = 'NOBETV2__';
    const upperName = decodedName.toUpperCase();
    
    // Etiketi dosya isminin herhangi bir yerinde ara (başında rastgele karakterler olabilir)
    if (!upperName.includes(tag)) return null;

    try {
      // Etiketin başladığı konumu bul ve sonrasını al
      const startIndex = upperName.indexOf(tag);
      const cleanName = decodedName.substring(startIndex);
      
      // Uzantıyı ve parantezli ekleri temizle (örn: .jpg, (1).jpg, .png (1) vb.)
      // Önce bilinen uzantıları ve sonrasını atalım
      let nameWithoutExt = cleanName.replace(/\.(jpg|jpeg|png|heic|pdf|webp).*/i, "");
      // Sonra parantezli sayıları temizleyelim (örn: "dosya (1)")
      nameWithoutExt = nameWithoutExt.replace(/\s*\(\d+\)$/, "").trim();
      
      const parts = nameWithoutExt.split('__');
      
      if (parts.length < 6) return null;

      const typeCode = parts[1];
      let typeLabel = 'Belge';
      if (typeCode === 'GOZALTI') typeLabel = 'Gözaltı Kararı';
      else if (typeCode === 'ARAMA') typeLabel = 'Arama Kararı';
      else if (typeCode === 'KAN') typeLabel = 'Kan Örneği Kararı';
      else if (typeCode === 'DIJITAL') typeLabel = 'Telefon İnceleme Kararı';

      const supheli = parts[2].replace(/_/g, ' ');
      const suc = parts[3].replace(/_/g, ' ');
      const karakol = parts[4].replace(/_/g, ' ');
      let tarih = parts[5].replace(/_/g, ' ');

      // Eğer tarih DDMMYYYY formatındaysa (8 karakter rakam), DD.MM.YYYY formatına çevir
      if (tarih.length === 8 && /^\d+$/.test(tarih)) {
        tarih = `${tarih.substring(0, 2)}.${tarih.substring(2, 4)}.${tarih.substring(4, 8)}`;
      }

      let aranilacakAdres = '';
      let aramaBaslangicSaati = '';
      let aramaBitisSaati = '';

      // Arama kararı ise ve ekstra parçalar varsa (Adres ve Saat)
      // Yeni formatta: NOBETV2(0)__ARAMA(1)__SUP(2)__SUC(3)__KAR(4)__TAR(5)__ADRES(6)__SAAT(7)__ID(8)
      if (typeCode === 'ARAMA' && parts.length >= 8) {
        aranilacakAdres = parts[6].replace(/_/g, ' ');
        
        const timePart = parts[7];
        if (timePart.includes('_')) {
          const times = timePart.split('_');
          if (times[0] && times[0].length === 4) {
             aramaBaslangicSaati = `${times[0].substring(0,2)}:${times[0].substring(2,4)}`;
          }
          if (times[1] && times[1].length === 4) {
             aramaBitisSaati = `${times[1].substring(0,2)}:${times[1].substring(2,4)}`;
          }
        }
      }

      return {
        id: `track-fn-${Date.now()}-${Math.random()}`,
        type: typeLabel,
        supheliAdKimlik: supheli,
        sucAdi: suc,
        karakol: karakol,
        gozaltiTarihSaat: tarih,
        aranilacakAdres: aranilacakAdres,
        aramaBaslangicSaati: aramaBaslangicSaati,
        aramaBitisSaati: aramaBitisSaati
      };
    } catch (e) {
      console.error("Filename parsing error", e);
      return null;
    }
  };
  // -------------------------------

  const getInitialDateTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const minutesRaw = now.getMinutes();
    const minutesRounded = Math.floor(minutesRaw / 10) * 10;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minutesRounded).padStart(2, '0')}`;
    const endHour = String((hour + 3) % 24).padStart(2, '0');
    const endTimeStr = `${endHour}:${String(minutesRounded).padStart(2, '0')}`;
    return { dateStr, timeStr, endTimeStr };
  };

  const initial = getInitialDateTime();
  
  const [infoNote, setInfoNote] = useState('');
  const [selectedSavciKey, setSelectedSavciKey] = useState(Object.keys(SAVCILAR)[0]);
  const [formData, setFormData] = useState<DecisionFormData>({
    savciAdi: SAVCILAR[Object.keys(SAVCILAR)[0]].name,
    savciSicil: SAVCILAR[Object.keys(SAVCILAR)[0]].sicil,
    supheliAdKimlik: '',
    sucAdi: '',
    karakol: '',
    kararTarihi: initial.dateStr,
    gozaltiSaati: initial.timeStr,
    aranilacakAdres: '',
    aramaTarihi: initial.dateStr,
    aramaBaslangicSaati: initial.timeStr,
    aramaBitisSaati: initial.endTimeStr,
  });
  
  const [selectedDecisions, setSelectedDecisions] = useState({
    gozalti: true,
    kan: false,
    telefon: false,
    arama: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingKararId, setSigningKararId] = useState<string | null>(null);
  const [isBulkSigning, setIsBulkSigning] = useState(false);
  const [iosPreview, setIosPreview] = useState<{url: string, filename: string} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'karar' | 'tracking' | 'all' } | null>(null);

  useEffect(() => {
    localStorage.setItem('nobetApp_kararlar', JSON.stringify(kararlar));
  }, [kararlar]);

  useEffect(() => {
    localStorage.setItem('nobetApp_gozaltiListesi', JSON.stringify(trackingList));
  }, [trackingList]);

  const gozaltiTracking = trackingList.filter(item => 
    item.type.toLowerCase().includes('gözaltı') || item.type.toLowerCase() === 'gozalti'
  );
  const digerTracking = trackingList.filter(item => 
    !item.type.toLowerCase().includes('gözaltı') && item.type.toLowerCase() !== 'gozalti'
  );

  /**
   * ADVANCED ELASTIC DEFORMATION ALGORITHM (Rubber Band Effect)
   */
  const generateVariedSignature = (originalStrokes: Stroke[]): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; 
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    originalStrokes.forEach(s => s.forEach(p => {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const rotationDeg = (Math.random() - 0.5) * 12; // ±6 degrees
    const rotationRad = (rotationDeg * Math.PI) / 180;
    const scaleFactor = 0.9 + Math.random() * 0.2; 
    const scaleX = scaleFactor * (0.95 + Math.random() * 0.1); 
    const scaleY = scaleFactor * (0.95 + Math.random() * 0.1);
    const skewX = (Math.random() - 0.5) * 0.15; 
    const globalThickness = (1.5 + Math.random() * 1.5);

    ctx.save();
    ctx.scale(2, 2);
    ctx.translate(midX, midY);
    ctx.rotate(rotationRad);
    ctx.scale(scaleX, scaleY);
    ctx.transform(1, 0, skewX, 1, 0, 0);
    ctx.translate(-midX, -midY);

    ctx.strokeStyle = '#000044';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    originalStrokes.forEach(stroke => {
      if (stroke.length < 2) return;
      const numAnchors = Math.floor(Math.random() * 3) + 3; 
      const anchors = Array.from({ length: numAnchors }, () => ({
        idx: Math.floor(Math.random() * stroke.length),
        dispX: (Math.random() - 0.5) * 14,
        dispY: (Math.random() - 0.5) * 14
      }));
      const sigma = stroke.length / 7;

      const deformedPoints = stroke.map((p, k) => {
        let offsetX = 0;
        let offsetY = 0;
        anchors.forEach(a => {
          const distIdx = k - a.idx;
          const weight = Math.exp(-Math.pow(distIdx, 2) / (2 * Math.pow(sigma, 2)));
          offsetX += a.dispX * weight;
          offsetY += a.dispY * weight;
        });
        return { x: p.x + offsetX, y: p.y + offsetY };
      });

      ctx.beginPath();
      ctx.lineWidth = globalThickness * (0.85 + Math.random() * 0.3);
      ctx.moveTo(deformedPoints[0].x, deformedPoints[0].y);
      for (let i = 1; i < deformedPoints.length - 2; i++) {
        const xc = (deformedPoints[i].x + deformedPoints[i + 1].x) / 2;
        const yc = (deformedPoints[i].y + deformedPoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(deformedPoints[i].x, deformedPoints[i].y, xc, yc);
      }
      if (deformedPoints.length > 2) {
        const last = deformedPoints[deformedPoints.length - 1];
        const prev = deformedPoints[deformedPoints.length - 2];
        ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
      } else if (deformedPoints.length === 2) {
        ctx.lineTo(deformedPoints[1].x, deformedPoints[1].y);
      }
      ctx.stroke();
    });
    ctx.restore();
    return canvas.toDataURL('image/png');
  };

  const handleAIAnalysis = async () => {
    if (!infoNote.trim()) return;
    setIsLoading(true);
    setKararlar([]);
    
    try {
      const data = await analyzeInfoNote(infoNote);
      const current = getInitialDateTime();
      setFormData(prev => ({
        ...prev,
        supheliAdKimlik: formatSupheliText(data.supheliAdKimlik || ''),
        sucAdi: formatSucAdi(data.sucAdi || ''),
        karakol: cleanKarakolName(data.karakol || ''),
        kararTarihi: current.dateStr,
        gozaltiSaati: current.timeStr,
        aranilacakAdres: (data.aranilacakAdres || '') + ', adres ve eklentileri ile şahsın üzeri ve eşyalarında.',
        aramaTarihi: current.dateStr,
        aramaBaslangicSaati: current.timeStr,
        aramaBitisSaati: current.endTimeStr,
      }));
      setSelectedDecisions({
        gozalti: true,
        arama: !!data.aramaGerekli,
        kan: infoNote.toLowerCase().includes('188') || infoNote.toLowerCase().includes('uyuşturucu') || infoNote.toLowerCase().includes('kan'),
        telefon: infoNote.toLowerCase().includes('188') || infoNote.toLowerCase().includes('dijital') || infoNote.toLowerCase().includes('telefon')
      });
    } catch (err: any) {
      console.error("Analiz Hatası Detay:", err);
      const isQuotaError = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      const isKeyError = err?.message?.includes('API Key must be set') || err?.message?.includes('API Anahtarı bulunamadı');
      
      let message = "Analiz sırasında bir hata oluştu.";
      if (isKeyError) {
        message = "⚠️ API Anahtarı Hatası: Sistem API anahtarını bulamadı. Lütfen Vercel ayarlarında 'VITE_API_KEY' değişkeninin tanımlı olduğundan emin olun.";
      } else if (isQuotaError) {
        message = "⚠️ API Kota Sınırı: Çok fazla istek yapıldı, lütfen bekleyin.";
      } else if (err.message) {
        message = `⚠️ Hata: ${err.message}`;
      }
      
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFormsInitiate = () => {
    // 1. Zorunlu Alan Kontrolü
    if (!formData.supheliAdKimlik.trim() || !formData.sucAdi.trim() || !formData.karakol.trim()) {
      alert("Lütfen zorunlu alanları (*) doldurunuz.");
      return;
    }

    // 2. TC Kimlik No Validasyonu
    const isForeign = formData.supheliAdKimlik.includes('(YABANCI)');
    // 11 haneli sayı var mı kontrolü (kelime sınırları ile)
    const hasTC = /\b\d{11}\b/.test(formData.supheliAdKimlik);

    if (!isForeign && !hasTC) {
      alert("HATA: Şüpheli alanında 11 haneli TC Kimlik Numarası bulunamadı!\n\nEğer şahıs yabancı uyruklu ise veya TC numarası yoksa, kutucuğun yanındaki 'YABANCI' butonuna basınız.");
      return;
    }

    if (!Object.values(selectedDecisions).some(v => v)) {
      alert("Lütfen en az bir karar türü seçiniz.");
      return;
    }
    setIsBulkSigning(true);
    setSigningKararId(null);
    setShowSignatureModal(true);
  };

  const finalizeBulkSave = async (originalStrokes: Stroke[]) => {
    setIsLoading(true);
    try {
      const newKararlar: KararData[] = [];
      const timestamp = Date.now();
      const decisionKeys = ['gozalti', 'arama', 'kan', 'telefon'] as const;
      const typeMapping: Record<string, string> = {
        gozalti: 'Gözaltı Kararı',
        arama: 'Arama Kararı',
        kan: 'Kan Örneği Kararı',
        telefon: 'Telefon İnceleme Kararı'
      };
      const templateMapping: Record<string, keyof typeof TEMPLATES> = {
        gozalti: 'gozalti',
        arama: 'arama',
        kan: 'kan',
        telefon: 'telefon'
      };

      for (let idx = 0; idx < decisionKeys.length; idx++) {
        const key = decisionKeys[idx];
        if (selectedDecisions[key]) {
          const variedSignature = generateVariedSignature(originalStrokes);
          
          newKararlar.push({
            id: `${timestamp}-${idx}-${Math.random()}`,
            type: typeMapping[key],
            formData: { ...formData },
            signatureData: variedSignature,
            html: populateTemplate(TEMPLATES[templateMapping[key]], formData, variedSignature)
          });
        }
      }
      
      setKararlar(newKararlar); 
      setIsBulkSigning(false);
      setShowSignatureModal(false);
      setCurrentPage('kararlar');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Karar oluşturma hatası:", error);
      alert("Kararlar oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'karar') {
      setKararlar(prev => prev.filter(k => k.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'tracking') {
      setTrackingList(prev => prev.filter(t => t.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'all') {
      const reset = getInitialDateTime();
      setKararlar([]);
      setTrackingList([]);
      setInfoNote('');
      setFormData({
        savciAdi: SAVCILAR[Object.keys(SAVCILAR)[0]].name,
        savciSicil: SAVCILAR[Object.keys(SAVCILAR)[0]].sicil,
        supheliAdKimlik: '',
        sucAdi: '',
        karakol: '',
        kararTarihi: reset.dateStr,
        gozaltiSaati: reset.timeStr,
        aranilacakAdres: '',
        aramaTarihi: reset.dateStr,
        aramaBaslangicSaati: reset.timeStr,
        aramaBitisSaati: reset.endTimeStr,
      });
      localStorage.removeItem('nobetApp_kararlar');
      localStorage.removeItem('nobetApp_gozaltiListesi');
    }
    setConfirmDelete(null);
  };

  const updateAramaStartTime = (hour: string, minute: string) => {
    const endH = String((parseInt(hour) + 3) % 24).padStart(2, '0');
    setFormData(f => ({
      ...f,
      aramaBaslangicSaati: `${hour}:${minute}`,
      aramaBitisSaati: `${endH}:${minute}`
    }));
  };

  const updateTrackingItemDate = (id: string, newDate: string) => {
    setTrackingList(prev => prev.map(item => 
      item.id === id ? { ...item, gozaltiTarihSaat: newDate } : item
    ));
  };

  const addKararToTrackingList = (k: KararData) => {
    const item: TrackingItem = {
      id: `track-manual-${Date.now()}-${Math.random()}`,
      type: k.type,
      supheliAdKimlik: k.formData.supheliAdKimlik,
      sucAdi: k.formData.sucAdi,
      karakol: k.formData.karakol,
      gozaltiTarihSaat: formatDateTR(k.formData.kararTarihi),
      aranilacakAdres: k.formData.aranilacakAdres,
      aramaBaslangicSaati: k.formData.aramaBaslangicSaati,
      aramaBitisSaati: k.formData.aramaBitisSaati
    };
    setTrackingList(prev => [item, ...prev]);
    alert("Karar takip listesine başarıyla eklendi.");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsLoading(true);
    
    let addedCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files) as File[]) {
      try {
        // STRATEGY 0: Check Filename First (Most Reliable)
        const filenameData = parseFilename(file.name);
        if (filenameData) {
          setTrackingList(prev => [filenameData, ...prev]);
          addedCount++;
          continue; 
        } else {
          errorCount++;
        }
      } catch (err: any) {
        console.error("Okuma Hatası:", err);
        errorCount++;
      }
    }
    
    setIsLoading(false);
    if (addedCount > 0) {
      // Success
    } else if (errorCount > 0) {
      alert("Yüklenen bazı resimlerde bilgi bulunamadı. Lütfen dosya isimlerinin orijinal formatta (NOBETV2__...) olduğundan emin olun.");
    }
  };

  const downloadAsImage = async (kararId: string, elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const k = kararlar.find(item => item.id === kararId);
    if (!k) return;

    try {
      const canvas = await (window as any).html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      
      // Construct Smart Filename: NOBETV2__TYPE__SUSPECT__CRIME__STATION__DATE__ID.jpg
      let typeCode = 'BELGE';
      if (k.type.includes('Gözaltı')) typeCode = 'GOZALTI';
      else if (k.type.includes('Arama')) typeCode = 'ARAMA';
      else if (k.type.includes('Kan')) typeCode = 'KAN';
      else if (k.type.includes('Telefon') || k.type.includes('İnceleme')) typeCode = 'DIJITAL';

      const fnSuspect = sanitizeForFilename(k.formData.supheliAdKimlik);
      const fnCrime = sanitizeForFilename(k.formData.sucAdi);
      const fnStation = sanitizeForFilename(k.formData.karakol);
      const fnDate = sanitizeForFilename(formatDateTR(k.formData.kararTarihi));

      const filenameParts = [
        'NOBETV2',
        typeCode,
        fnSuspect,
        fnCrime,
        fnStation,
        fnDate
      ];

      if (typeCode === 'ARAMA') {
        const fnAdres = sanitizeForFilename(k.formData.aranilacakAdres || '');
        const start = (k.formData.aramaBaslangicSaati || '').replace(':', '');
        const end = (k.formData.aramaBitisSaati || '').replace(':', '');
        const fnSaat = `${start}_${end}`;
        filenameParts.push(fnAdres);
        filenameParts.push(fnSaat);
      }

      // ID'yi sona ekle
      filenameParts.push(k.id.substring(0, 8));

      const smartFilename = filenameParts.join('__') + '.jpg';

      try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const arr = img.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        // Android'de normal resim olarak, iOS'te ise doğrudan Dosyalar'a inmesi için mime type ayarlaması.
        const finalMime = isIOS ? 'application/octet-stream' : mime;
        const blob = new Blob([u8arr], {type: finalMime});
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = smartFilename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (err) {
        // Fallback to simple link if blob fails
        const link = document.createElement('a');
        link.href = img;
        link.download = smartFilename;
        link.click();
      }
    } catch (e) {
      alert("Görüntü oluşturulurken hata oluştu.");
    }
  };

  const downloadGozaltiListJpg = async () => {
    const el = document.getElementById('gozalti-list-container');
    if (!el) return;
    
    setIsLoading(true);
    
    // Store original styles to restore later
    const originalOverflow = el.style.overflow;
    const originalHeight = el.style.height;
    const originalMaxHeight = el.style.maxHeight;
    
    try {
      // Temporarily expand the container to show all content
      el.style.overflow = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      
      // Also need to handle the inner table container if it has scroll
      const tableContainer = el.querySelector('.overflow-x-auto') as HTMLElement;
      let originalTableOverflow = '';
      if (tableContainer) {
        originalTableOverflow = tableContainer.style.overflow;
        tableContainer.style.overflow = 'visible';
      }

      const canvas = await (window as any).html2canvas(el, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight
      });
      
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const filename = `Gozalti_Listesi_${new Date().toISOString().slice(0,10)}.jpg`;

      try {
        const base64Response = await fetch(img);
        const blob = await base64Response.blob();
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (err) {
        const link = document.createElement('a');
        link.href = img;
        link.download = filename;
        link.click();
      }

      // Restore inner table container style
      if (tableContainer) {
        tableContainer.style.overflow = originalTableOverflow;
      }
    } catch (error) {
      console.error(error);
      alert("Liste görüntüsü oluşturulurken hata oluştu.");
    } finally {
      // Restore original styles
      el.style.overflow = originalOverflow;
      el.style.height = originalHeight;
      el.style.maxHeight = originalMaxHeight;
      setIsLoading(false);
    }
  };

  const downloadArchivePdf = async () => {
    if (trackingList.length === 0) {
      alert("Arşivlenecek kayıt bulunmuyor.");
      return;
    }
    setIsLoading(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const offscreen = document.createElement('div');
      offscreen.style.position = 'absolute';
      offscreen.style.left = '-9999px';
      offscreen.style.top = '0';
      document.body.appendChild(offscreen);

      for (let i = 0; i < trackingList.length; i++) {
        const item = trackingList[i];
        const typeLower = item.type.toLowerCase();
        let tempKey: keyof typeof TEMPLATES = 'gozalti';
        if (typeLower.includes('arama')) tempKey = 'arama';
        else if (typeLower.includes('kan')) tempKey = 'kan';
        else if (typeLower.includes('telefon')) tempKey = 'telefon';
        
        const dtParts = item.gozaltiTarihSaat.split(' ');
        const date = dtParts[0] || '';
        const time = dtParts[1] || '';

        const dummyFormData = {
          savciAdi: formData.savciAdi,
          savciSicil: formData.savciSicil,
          supheliAdKimlik: item.supheliAdKimlik,
          sucAdi: item.sucAdi,
          karakol: item.karakol,
          kararTarihi: date,
          gozaltiSaati: time,
          aranilacakAdres: item.aranilacakAdres || '',
          aramaTarihi: date,
          aramaBaslangicSaati: item.aramaBaslangicSaati || '',
          aramaBitisSaati: item.aramaBitisSaati || ''
        };

        const unsignedHtml = populateTemplate(TEMPLATES[tempKey], dummyFormData);
        const wrapper = document.createElement('div');
        wrapper.style.width = '210mm';
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.padding = '40px';
        wrapper.innerHTML = unsignedHtml;
        offscreen.appendChild(wrapper);

        const canvas = await (window as any).html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        offscreen.removeChild(wrapper);
      }
      
      document.body.removeChild(offscreen);
      pdf.save(`Yuklenen_Belge_Arsivi_Imzasiz_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error(error);
      alert("PDF arşivi oluşturulurken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const NavButtons = () => (
    <div className="w-full max-w-2xl flex justify-center space-x-2 my-6 px-4">
      {['bilgi-notu', 'kararlar', 'liste'].map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page as PageType)}
          className={`flex-1 py-2.5 rounded-xl shadow-md font-bold transition-all text-xs border border-transparent ${
            currentPage === page 
              ? 'bg-blue-600 text-white shadow-blue-200' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
          }`}
        >
          {page === 'bilgi-notu' ? 'Bilgi Notu' : page === 'kararlar' ? 'Kararlar' : 'Liste'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 pb-12 font-sans selection:bg-blue-100">
      <header className="w-full max-w-2xl text-center mb-2 mt-8 px-4 relative">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-3 shadow-2xl border border-blue-400">
          <div className="flex-1 text-center">
             <h1 className="text-xl font-black text-white tracking-widest uppercase">NÖBET (V2.5 LITE)</h1>
          </div>
          <button onClick={() => setConfirmDelete({ id: 'all', type: 'all' })} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow transition-colors text-[10px] uppercase">Temizle</button>
        </div>
      </header>

      <NavButtons />

      <main className="w-full max-w-3xl px-4 flex-grow mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          
          {currentPage === 'bilgi-notu' && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2 mb-4">
                <h2 className="text-lg font-black text-gray-800 uppercase">Yeni Karar / Bilgi Notu</h2>
                <Sparkles size={20} className="text-blue-500" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">1. Savcı Seçimi</label>
                  <select 
                    value={selectedSavciKey}
                    onChange={(e) => {
                      setSelectedSavciKey(e.target.value);
                      const s = SAVCILAR[e.target.value];
                      setFormData(f => ({ ...f, savciAdi: s.name, savciSicil: s.sicil }));
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold"
                  >
                    {Object.entries(SAVCILAR).map(([key, val]) => (
                      <option key={key} value={key}>{val.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">2. Bilgi Notu Girişi (AI Analiz)</label>
                  <textarea 
                    value={infoNote}
                    onChange={(e) => setInfoNote(e.target.value)}
                    placeholder="Emniyetten gelen bilgi notunu yapıştırın..."
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-40 resize-none bg-gray-50 font-medium"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleAIAnalysis} disabled={isLoading || !infoNote.trim()} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl text-xs uppercase">
                      {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
                      Analiz Et ve Aktar ✨
                    </button>
                    <button onClick={() => setInfoNote('')} className="px-5 py-3.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black rounded-xl text-xs shadow-md transition-colors uppercase">🗑️ Sil</button>
                  </div>
                </div>
                <div className="space-y-5 pt-4 border-t-2 border-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2 group">
                      <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider flex justify-between items-center">
                        <span>3. Şüpheli İsim ve TC <span className="text-red-500">*</span></span>
                      </label>
                      
                      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-2 sm:p-3 space-y-2">
                        {(formData.supheliAdKimlik ? formData.supheliAdKimlik.split('\n') : ['']).map((line, idx, arr) => (
                          <div key={idx} className="flex items-center gap-1 sm:gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                            <span className="text-xs font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                            <input
                              value={line}
                              onChange={(e) => {
                                const newLines = [...arr];
                                newLines[idx] = e.target.value;
                                setFormData(f => ({ ...f, supheliAdKimlik: newLines.join('\n') }));
                              }}
                              placeholder='"ÖRNEK İSİM" (TC:12345678900)'
                              className="flex-1 min-w-0 p-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                            <button
                              onClick={() => {
                                const newLines = [...arr];
                                newLines[idx] = newLines[idx].includes('(YABANCI)') 
                                  ? newLines[idx].replace(' (YABANCI)', '') 
                                  : `${newLines[idx].trim()} (YABANCI)`;
                                setFormData(f => ({ ...f, supheliAdKimlik: newLines.join('\n') }));
                              }}
                              className={`p-2 rounded-lg font-bold text-[10px] transition-all ${line.includes('(YABANCI)') ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-orange-100 hover:text-orange-600'}`}
                              title="Yabancı Uyruklu İşaretle"
                            >
                              <Globe size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const newLines = [...arr];
                                newLines.splice(idx, 1);
                                setFormData(f => ({ ...f, supheliAdKimlik: newLines.join('\n') }));
                              }}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                              title="Satırı Sil"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            setFormData(f => ({ ...f, supheliAdKimlik: f.supheliAdKimlik ? f.supheliAdKimlik + '\n' : '\n' }));
                          }}
                          className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> YENİ ŞÜPHELİ EKLE
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">4. Suç Adı (Madde) <span className="text-red-500">*</span></label>
                      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-2 sm:p-3 space-y-2">
                        {(formData.sucAdi ? formData.sucAdi.split('\n') : ['']).map((line, idx, arr) => (
                          <div key={idx} className="flex items-center gap-1 sm:gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                            <span className="text-xs font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                            <input
                              value={line}
                              onChange={(e) => {
                                const newLines = [...arr];
                                newLines[idx] = e.target.value;
                                setFormData(f => ({ ...f, sucAdi: newLines.join('\n') }));
                              }}
                              placeholder="Suç Adı / Madde"
                              className="flex-1 min-w-0 p-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                            <button
                              onClick={() => {
                                const newLines = [...arr];
                                newLines.splice(idx, 1);
                                setFormData(f => ({ ...f, sucAdi: newLines.join('\n') }));
                              }}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                              title="Satırı Sil"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(f => ({ ...f, sucAdi: f.sucAdi ? f.sucAdi + '\n' : '\n' }));
                          }}
                          className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> YENİ SUÇ EKLE
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">5. Karakol Birimi <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.karakol} onChange={(e) => setFormData(f => ({ ...f, karakol: cleanKarakolName(e.target.value) }))} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">6. Karar Tarihi</label>
                      <input type="date" value={formData.kararTarihi} onChange={(e) => setFormData(f => ({ ...f, kararTarihi: e.target.value, aramaTarihi: e.target.value }))} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">7. Arama Adresi</label>
                    <textarea value={formData.aranilacakAdres} onChange={(e) => setFormData(f => ({ ...f, aranilacakAdres: e.target.value }))} rows={2} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">8. Arama Başlangıç</label>
                      <div className="flex items-center gap-2">
                        <select className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white" value={formData.aramaBaslangicSaati.split(':')[0]} onChange={(e) => updateAramaStartTime(e.target.value, formData.aramaBaslangicSaati.split(':')[1])}>
                          {Array.from({length: 24}).map((_, i) => <option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}
                        </select>
                        <span className="font-bold">:</span>
                        <select className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white" value={formData.aramaBaslangicSaati.split(':')[1]} onChange={(e) => updateAramaStartTime(formData.aramaBaslangicSaati.split(':')[0], e.target.value)}>
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 mb-1 uppercase tracking-wider">9. Arama Bitiş (+3s)</label>
                      <div className="flex items-center gap-2">
                        <select className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white" value={formData.aramaBitisSaati.split(':')[0]} onChange={(e) => setFormData(f => ({...f, aramaBitisSaati: `${e.target.value}:${f.aramaBitisSaati.split(':')[1]}`}))}>
                          {Array.from({length: 24}).map((_, i) => <option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}
                        </select>
                        <span className="font-bold">:</span>
                        <select className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white" value={formData.aramaBitisSaati.split(':')[1]} onChange={(e) => setFormData(f => ({...f, aramaBitisSaati: `${f.aramaBitisSaati.split(':')[0]}:${e.target.value}`}))}>
                          {['00','10','20','30','40','50'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {([
                    { id: 'gozalti', label: 'Gözaltı Kararı' },
                    { id: 'kan', label: 'Kan Örneği' },
                    { id: 'telefon', label: 'Cep Telefonu' },
                    { id: 'arama', label: 'Arama Kararı' }
                  ] as const).map((item) => (
                    <label key={item.id} className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedDecisions[item.id] ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                      <input type="checkbox" className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedDecisions[item.id]} onChange={() => setSelectedDecisions(d => ({ ...d, [item.id]: !d[item.id] }))} />
                      <span className="ml-3 text-xs font-black text-gray-700 uppercase">{item.label}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveFormsInitiate} className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all shadow-2xl mt-8 flex items-center justify-center gap-3 text-sm uppercase tracking-widest transform hover:scale-[1.02] active:scale-95">
                  <PenTool size={20} /> Kaydet ve İmzala
                </button>
              </div>
            </section>
          )}

          {currentPage === 'kararlar' && (
            <section className="space-y-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-black text-gray-800 pb-3 border-b-4 border-purple-500 mb-6 uppercase tracking-wider">Oluşturulan Kararlar</h2>
              {kararlar.length === 0 ? (
                <div className="text-center py-24 text-gray-400 font-bold uppercase tracking-widest italic bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200"> Henüz bir karar bulunmuyor. </div>
              ) : (
                <div className="space-y-12">
                  {kararlar.map((k) => (
                    <div key={k.id} className="bg-white rounded-3xl overflow-hidden border-2 border-gray-100 shadow-2xl transition-all hover:border-purple-200">
                      <div className="bg-gray-50 px-6 py-3 border-b-2 border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-purple-700 tracking-widest">{k.type}</span>
                        <button type="button" onClick={() => setConfirmDelete({ id: k.id, type: 'karar' })} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all z-20 relative cursor-pointer" title="Sil">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="p-8 bg-white overflow-x-auto flex justify-center">
                        <div id={`karar-view-${k.id}`} className="bg-white border-2 border-gray-200 p-10 min-w-[210mm] max-w-[210mm] shadow-sm text-gray-900" dangerouslySetInnerHTML={{ __html: k.html }} />
                      </div>
                      <div className="p-6 bg-gray-50 border-t-2 border-gray-100 flex gap-4">
                        <button onClick={() => { setSigningKararId(k.id); setIsBulkSigning(false); setShowSignatureModal(true); }} className={`flex-1 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-lg ${k.signatureData ? 'bg-green-600 text-white' : 'bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50'}`}>
                          <PenTool size={18} /> {k.signatureData ? '✓ İmzalandı' : '✎ Islak İmza At'}
                        </button>
                        <button onClick={() => downloadAsImage(k.id, `karar-view-${k.id}`)} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest transition-all">
                          <Download size={18} /> Görüntü Olarak İndir
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {currentPage === 'liste' && (
            <section className="space-y-10 animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-black text-gray-800 pb-3 border-b-4 border-green-500 mb-6 uppercase tracking-wider">Takip Listesi / Arşiv</h2>
              
              <div className="relative border-4 border-dashed border-blue-400 rounded-3xl bg-blue-50 p-12 flex flex-col items-center justify-center text-center hover:bg-blue-100 transition-all cursor-pointer group shadow-inner">
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 text-blue-600"> <Camera size={48} /> <span className="text-3xl font-black text-gray-300">|</span> <FileText size={48} /> </div>
                  <div> <p className="text-lg font-black text-blue-900 uppercase tracking-widest">Belge Yükle</p> <p className="text-xs text-blue-600 font-bold mt-2 uppercase">Kaydedilen kararların resimlerini (Dosya İsimli) yükleyerek listeye ekleyin.</p> </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={downloadArchivePdf}
                  className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest transition-all"
                >
                  <FileArchive size={20} /> Tüm Kararlar İmzasız PDF Olarak Arşivle
                </button>
                <button 
                  onClick={downloadGozaltiListJpg}
                  className="flex-1 py-4 bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest transition-all"
                >
                  <Download size={20} /> Gözaltı Listesi İndir
                </button>
              </div>

              <div id="gozalti-list-container" className="bg-white rounded-3xl border-2 border-blue-100 shadow-2xl overflow-hidden">
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-blue-100" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Gözaltı Takip Listesi</h3>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase">{gozaltiTracking.length} Kayıt</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-blue-50 border-b font-black text-blue-900 uppercase tracking-tighter">
                        <th className="p-4">Şüpheli</th> <th className="p-4">Suç</th> <th className="p-4">Karakol</th> <th className="p-4 text-center">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gozaltiTracking.length === 0 ? (
                        <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-black uppercase tracking-widest italic bg-gray-50/30">Gözaltı kaydı bulunmuyor.</td></tr>
                      ) : (
                        gozaltiTracking.map((item) => (
                          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="p-4 font-black text-gray-900 relative group">
                              <div className="flex items-start justify-between gap-2">
                                <span className="whitespace-pre-line leading-tight">{item.supheliAdKimlik}</span>
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: item.id, type: 'tracking' }); }} 
                                  className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-all flex-shrink-0" 
                                  title="Kaydı Sil"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-gray-700">{item.sucAdi}</td>
                            <td className="p-4 font-medium text-gray-600 uppercase">{item.karakol}</td>
                            <td className="p-2 text-center">
                              <input 
                                type="text" 
                                value={item.gozaltiTarihSaat} 
                                onChange={(e) => updateTrackingItemDate(item.id, e.target.value)}
                                onBlur={(e) => updateTrackingItemDate(item.id, formatDateInput(e.target.value))}
                                className="w-full min-w-[80px] p-1.5 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-2xl overflow-hidden">
                <div className="bg-purple-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardList size={20} className="text-purple-100" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Tüm Kararlar</h3>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase">{digerTracking.length} Kayıt</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-purple-50 border-b font-black text-purple-900 uppercase tracking-tighter">
                        <th className="p-4">Şüpheli</th> <th className="p-4">İşlem Türü</th> <th className="p-4">Karakol</th> <th className="p-4 text-center">Tarih/Saat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {digerTracking.length === 0 ? (
                        <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-black uppercase tracking-widest italic bg-gray-50/30">İşlem kaydı bulunmuyor.</td></tr>
                      ) : (
                        digerTracking.map((item) => (
                          <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="p-4 font-black text-gray-900 relative group">
                              <div className="flex items-start justify-between gap-2">
                                <span className="whitespace-pre-line leading-tight">{item.supheliAdKimlik}</span>
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: item.id, type: 'tracking' }); }} 
                                  className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-all flex-shrink-0" 
                                  title="Kaydı Sil"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter shadow-sm ${ item.type.includes('Arama') ? 'bg-purple-600 text-white' : item.type.includes('Kan') ? 'bg-red-600 text-white' : 'bg-orange-600 text-white' }`}> {item.type} </span>
                            </td>
                            <td className="p-4 font-medium text-gray-600 uppercase">{item.karakol}</td>
                            <td className="p-2 text-center">
                              <input 
                                type="text" 
                                value={item.gozaltiTarihSaat} 
                                onChange={(e) => updateTrackingItemDate(item.id, e.target.value)}
                                onBlur={(e) => updateTrackingItemDate(item.id, formatDateInput(e.target.value))}
                                className="w-full min-w-[120px] p-1.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl border-4 border-red-50">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <AlertTriangle size={40} className="text-red-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Emin misiniz?</h3>
            <p className="text-xs text-gray-500 font-bold uppercase mb-8 leading-relaxed">
              {confirmDelete.type === 'all' 
                ? 'TÜM VERİLER KALICI OLARAK SİLİNECEKTİR. BU İŞLEM GERİ ALINAMAZ.' 
                : 'SEÇİLİ KAYIT LİSTEDEN TAMAMEN KALDIRILACAKTIR.'}
            </p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setConfirmDelete(null)} 
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-3xl text-xs uppercase tracking-widest transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-3xl text-xs uppercase tracking-widest shadow-lg shadow-red-200 transition-all transform active:scale-95"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <SignaturePad onClose={() => { setShowSignatureModal(false); setIsBulkSigning(false); }} onSave={async (dataUrl, strokes) => {
            if (isBulkSigning) {
              finalizeBulkSave(strokes);
            } else if (signingKararId) {
              // NOTE: Made this block async to allow potential future async ops if needed, currently synchronous-like behavior
              
              setKararlar(prev => {
                const updated = prev.map(k => {
                  if (k.id === signingKararId) {
                     return { ...k, signatureData: dataUrl }; // Temporary placeholder
                  }
                  return k;
                });
                return updated;
              });

              // Process specific update with signature
              const targetKarar = kararlar.find(k => k.id === signingKararId);
              if (targetKarar) {
                const typeLower = targetKarar.type.toLowerCase();
                let tempKey: keyof typeof TEMPLATES = 'gozalti';

                if (typeLower.includes('gözaltı')) { tempKey = 'gozalti'; }
                else if (typeLower.includes('arama')) { tempKey = 'arama'; }
                else if (typeLower.includes('kan')) { tempKey = 'kan'; }
                else if (typeLower.includes('telefon') || typeLower.includes('inceleme')) { tempKey = 'telefon'; }

                 setKararlar(prev => prev.map(k => {
                  if (k.id === signingKararId) {
                    return { 
                      ...k, 
                      signatureData: dataUrl, 
                      html: populateTemplate(TEMPLATES[tempKey], k.formData, dataUrl) 
                    };
                  }
                  return k;
                }));
              }
              
              setShowSignatureModal(false);
            }
          }}
        />
      )}

      {iosPreview && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-6 w-full max-w-lg flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-gray-50 pb-4 px-2">
              <h3 className="font-black text-gray-900 text-xl uppercase tracking-widest">Belge Hazırlandı</h3>
              <button onClick={() => setIosPreview(null)} className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all">✕</button>
            </div>
            <div className="flex-grow overflow-auto flex items-center justify-center bg-gray-50 rounded-[30px] mb-6 p-4 border-2 border-gray-100 relative">
              <img src={iosPreview.url} className="max-w-full h-auto shadow-2xl border-4 border-white rounded-lg pointer-events-auto" alt="Karar Önizleme" />
            </div>
            
            <div className="text-center p-4 mb-4 bg-gray-100 rounded-2xl border border-gray-200">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Dosya Adı</p>
              <code className="text-[10px] text-blue-600 font-mono break-all">{iosPreview.filename}</code>
            </div>

            <button 
              onClick={async () => {
                try {
                  // Synchronous base64 to blob to preserve user gesture on iOS Safari
                  const arr = iosPreview.url.split(',');
                  const mime = arr[0].match(/:(.*?);/)[1];
                  const bstr = atob(arr[1]);
                  let n = bstr.length;
                  const u8arr = new Uint8Array(n);
                  while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                  }
                  const blob = new Blob([u8arr], {type:mime});
                  const file = new File([blob], iosPreview.filename, { type: 'image/jpeg' });
                  
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: iosPreview.filename });
                  } else {
                    const link = document.createElement('a');
                    link.href = iosPreview.url;
                    link.download = iosPreview.filename;
                    link.click();
                  }
                } catch(e) {
                   console.error("Share failed", e);
                   alert("Paylaşım başarısız oldu. Lütfen resme basılı tutarak kaydedin.");
                }
              }}
              className="w-full text-center p-5 bg-blue-600 rounded-[30px] hover:bg-blue-700 active:scale-95 transition-all outline-none border-4 border-blue-400 shadow-xl flex flex-col items-center justify-center cursor-pointer mb-3"
            >
              <div className="flex items-center gap-3 mb-2 text-white">
                <Share2 size={24} />
                <Download size={24} />
              </div>
              <p className="text-base font-black text-white uppercase tracking-widest leading-none">Kaydet / Paylaş</p>
              <p className="text-[10px] text-blue-100 font-bold uppercase mt-2">Daha Hızlı İndirmek İçin Tıklayın</p>
            </button>

            <p className="text-[9px] text-center text-gray-400 font-bold uppercase mt-1 px-4 leading-relaxed">
              * Buton çalışmazsa doğrudan resmin üzerine basılı tutup "Fotoğraflara Kaydet" veya "Dosyalara Kaydet" diyebilirsiniz.
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/40 z-[300] flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
            <p className="font-black uppercase tracking-widest text-indigo-900">İşlem Yapılıyor...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
