
export type PageType = 'bilgi-notu' | 'kararlar' | 'liste';

export interface Savci {
  name: string;
  sicil: string;
}

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export interface KararData {
  id: string;
  type: string;
  formData: any;
  signatureData?: string;
  html: string;
}

export interface TrackingItem {
  id: string;
  type: string;
  supheliAdKimlik: string;
  sucAdi: string;
  karakol: string;
  gozaltiTarihSaat: string;
  aranilacakAdres?: string;
  aramaBaslangicSaati?: string;
  aramaBitisSaati?: string;
}

export interface DecisionFormData {
  savciAdi: string;
  savciSicil: string;
  supheliAdKimlik: string;
  sucAdi: string;
  karakol: string;
  kararTarihi: string;
  gozaltiSaati: string;
  aranilacakAdres: string;
  aramaTarihi: string;
  aramaBaslangicSaati: string;
  aramaBitisSaati: string;
}
