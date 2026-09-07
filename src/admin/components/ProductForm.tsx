import React, { useState, useEffect } from 'react';
import { 
  Upload, X, Plus, Trash2, MapPin, Globe, Copy, ArrowUp, ArrowDown, 
  Image as ImageIcon, Sparkles, ShieldCheck, HeartHandshake, CheckCircle2, 
  LayoutTemplate, Layers, Info, Award, Leaf, Truck, Star, Package, Heart, Shield
} from 'lucide-react';
import { AdminProduct, Variant, VariantType, ProductShowcaseSection, WhyChooseUsConfig, WhyChooseUsItem } from '../../types/admin';
import '../styles/admin.css';

const TARGET_CITIES = [
  'Kanpur',
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Lucknow'
];

const CITY_TO_CODE: Record<string, string> = {
  'kanpur': 'kn',
  'mumbai': 'mum',
  'delhi ncr': 'del',
  'delhi': 'del',
  'bangalore': 'blr',
  'hyderabad': 'hyd',
  'pune': 'pune',
  'lucknow': 'lko',
  'kolkata': 'kol',
  'jaipur': 'jai',
  'chennai': 'chn',
  'ahmedabad': 'ahd',
  'varanasi': 'var',
};

const DEFAULT_WHY_CHOOSE_ITEMS: WhyChooseUsItem[] = [
  {
    icon: 'leaf',
    title: '100% Plantable Seed Paper',
    description: 'Embedded with organic live seeds (Tulsi, Marigold, Wildflower) that blossom into plants after use.'
  },
  {
    icon: 'heart',
    title: 'Empowering Women Artisans',
    description: 'Handcrafted with love and devotion by skilled rural artisans, supporting sustainable livelihoods.'
  },
  {
    icon: 'shield',
    title: 'Zero Waste & Chemical-Free',
    description: 'Recycled cotton scrap paper dyed with natural non-toxic vegetable colors. 100% biodegradable.'
  },
  {
    icon: 'truck',
    title: 'Safe & Plastic-Free Delivery',
    description: 'Carefully packed with eco-friendly corrugated materials and delivered safely to your home.'
  }
];

const MAX_MEDIA_ITEMS = 5;
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5MB per MP4 (base64 gets bigger)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB input file cap
const IMAGE_MAX_DIM = 1600; // resize longest side
const IMAGE_JPEG_QUALITY = 0.82;

function bytesToMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Invalid image'));
    img.src = dataUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return dataUrl;

  const scale = Math.min(1, IMAGE_MAX_DIM / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, outW, outH);

  // Convert to JPEG to shrink payload; this is the main protection against request-size failures.
  return canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);
}

interface ProductFormProps {
  product?: AdminProduct | null;
  onSave: (data: Partial<AdminProduct>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<AdminProduct>>({
    title: '',
    description: '',
    price: 0,
    compare_at_price: 0,
    category: '',
    colors: '[]',
    variants: '[]',
    variant_types: '[]',
    material: '',
    custom_slug: '',
    stock: 0,
    featured: false,
    images: '[]',
  });

  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [newVariants, setNewVariants] = useState<Variant[]>([]);

  // City SEO Description & Custom Slugs State
  const [cityDescriptions, setCityDescriptions] = useState<Record<string, string>>({});
  const [citySlugs, setCitySlugs] = useState<Record<string, string>>({});
  const [activeCityTab, setActiveCityTab] = useState<string>('Kanpur');
  const [copiedCityUrl, setCopiedCityUrl] = useState<string | null>(null);

  // Dynamic Image & Content Showcase Sections State
  const [showcaseSections, setShowcaseSections] = useState<ProductShowcaseSection[]>([]);
  const [cityShowcaseSections, setCityShowcaseSections] = useState<Record<string, ProductShowcaseSection[]>>({});
  const [activeShowcaseCityTab, setActiveShowcaseCityTab] = useState<string>('global');

  // Dynamic Why Choose Us State
  const [whyChooseUs, setWhyChooseUs] = useState<Record<string, WhyChooseUsConfig>>({});
  const [activeWhyChooseCityTab, setActiveWhyChooseCityTab] = useState<string>('default');

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    // Reset all state when the product prop changes
    setFormData({
      title: '',
      description: '',
      price: 0,
      compare_at_price: 0,
      category: '',
      colors: '[]',
      variants: '[]',
      variant_types: '[]',
      material: '',
      custom_slug: '',
      stock: 0,
      featured: false,
      images: '[]',
    });
    setVariantStocks({});
    setVariantTypes([]);
    setNewVariants([]);
    setCityDescriptions({});
    setCitySlugs({});
    setActiveCityTab('Kanpur');
    setShowcaseSections([]);
    setCityShowcaseSections({});
    setActiveShowcaseCityTab('global');
    setWhyChooseUs({});
    setActiveWhyChooseCityTab('default');
    setImagePreviews([]);
    setSaving(false);
    setUploading(false);
    setUploadError('');

    if (product) {
      const productObj = { ...product };
      let imagesArray: string[] = [];
      if (typeof product.images === 'string') {
        try {
          imagesArray = JSON.parse(product.images);
        } catch {
          imagesArray = [];
        }
      } else if (Array.isArray(product.images)) {
        imagesArray = product.images;
        productObj.images = JSON.stringify(product.images);
      }

      let colorsArray: string[] = [];
      if (typeof product.colors === 'string') {
        try {
          colorsArray = JSON.parse(product.colors);
        } catch {
          colorsArray = [];
        }
      } else if (Array.isArray(product.colors)) {
        colorsArray = product.colors;
        productObj.colors = JSON.stringify(product.colors);
      }

      let variantsArray: Array<{ color: string; stock: number }> = [];
      if (typeof (product as any).variants === 'string') {
        try {
          variantsArray = JSON.parse((product as any).variants);
        } catch {
          variantsArray = [];
        }
      } else if (Array.isArray((product as any).variants)) {
        variantsArray = (product as any).variants;
        (productObj as any).variants = JSON.stringify((product as any).variants);
      }

      const stockMap: Record<string, number> = {};
      if (variantsArray.length) {
        for (const v of variantsArray) {
          if (v?.color) stockMap[String(v.color)] = Number(v.stock || 0);
        }
      } else if (colorsArray.length) {
        for (const c of colorsArray) stockMap[String(c)] = 0;
        const existingTotal = Number((product as any).stock ?? 0);
        if (colorsArray[0]) stockMap[String(colorsArray[0])] = Number.isFinite(existingTotal) ? Math.max(0, existingTotal) : 0;
        (productObj as any).variants = JSON.stringify(colorsArray.map(c => ({ color: c, stock: Number(stockMap[String(c)] || 0) })));
      }

      const totalVariantStock = Object.values(stockMap).reduce((sum, n) => sum + Math.max(0, Number(n || 0)), 0);
      if (colorsArray.length) {
        productObj.stock = totalVariantStock;
      }
      
      let vTypes: VariantType[] = [];
      let varts: Variant[] = [];
      try { vTypes = JSON.parse((product as any).variant_types || '[]'); } catch {}
      try { varts = JSON.parse((product as any).variants || '[]'); } catch {}
      setVariantTypes(vTypes);
      setNewVariants(varts);

      let cityDescMap: Record<string, string> = {};
      if (typeof (product as any).city_descriptions === 'string') {
        try {
          cityDescMap = JSON.parse((product as any).city_descriptions || '{}');
        } catch {
          cityDescMap = {};
        }
      } else if (typeof (product as any).city_descriptions === 'object' && (product as any).city_descriptions !== null) {
        cityDescMap = { ...(product as any).city_descriptions };
      }
      setCityDescriptions(cityDescMap);

      let citySlugsMap: Record<string, string> = {};
      if (typeof (product as any).city_slugs === 'string') {
        try {
          citySlugsMap = JSON.parse((product as any).city_slugs || '{}');
        } catch {
          citySlugsMap = {};
        }
      } else if (typeof (product as any).city_slugs === 'object' && (product as any).city_slugs !== null) {
        citySlugsMap = { ...(product as any).city_slugs };
      }
      setCitySlugs(citySlugsMap);

      // Parse showcase_sections
      let parsedShowcase: ProductShowcaseSection[] = [];
      if (typeof (product as any).showcase_sections === 'string') {
        try {
          parsedShowcase = JSON.parse((product as any).showcase_sections || '[]');
        } catch {
          parsedShowcase = [];
        }
      } else if (Array.isArray((product as any).showcase_sections)) {
        parsedShowcase = (product as any).showcase_sections;
      }
      setShowcaseSections(parsedShowcase);

      // Parse city_showcase_sections
      let parsedCityShowcase: Record<string, ProductShowcaseSection[]> = {};
      if (typeof (product as any).city_showcase_sections === 'string') {
        try {
          parsedCityShowcase = JSON.parse((product as any).city_showcase_sections || '{}');
        } catch {
          parsedCityShowcase = {};
        }
      } else if (typeof (product as any).city_showcase_sections === 'object' && (product as any).city_showcase_sections !== null) {
        parsedCityShowcase = { ...(product as any).city_showcase_sections };
      }
      setCityShowcaseSections(parsedCityShowcase);

      // Parse why_choose_us
      let parsedWhyChoose: Record<string, WhyChooseUsConfig> = {};
      if (typeof (product as any).why_choose_us === 'string') {
        try {
          parsedWhyChoose = JSON.parse((product as any).why_choose_us || '{}');
        } catch {
          parsedWhyChoose = {};
        }
      } else if (typeof (product as any).why_choose_us === 'object' && (product as any).why_choose_us !== null) {
        parsedWhyChoose = { ...(product as any).why_choose_us };
      }
      setWhyChooseUs(parsedWhyChoose);

      setFormData(productObj);
      setImagePreviews(imagesArray);
      setVariantStocks(stockMap);
    }
  }, [product]);

  const getColorsArray = () => {
    if (Array.isArray(formData.colors)) return formData.colors.map(String);
    if (typeof formData.colors === 'string') {
      try {
        const parsed = JSON.parse(formData.colors);
        return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
      } catch {
        return formData.colors.split(',').map(c => c.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const syncVariantsToForm = (colorsArray: string[], nextStocks: Record<string, number>) => {
    const variants = colorsArray.map(c => ({
      color: c,
      stock: Math.max(0, Number(nextStocks[c] ?? 0)),
    }));
    const total = variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);
    setFormData(prev => ({
      ...prev,
      colors: JSON.stringify(colorsArray),
      variants: JSON.stringify(variants),
      stock: total,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleColorsChange = (raw: string) => {
    const colorsArray = raw.split(',').map(c => c.trim()).filter(Boolean);
    const nextStocks: Record<string, number> = {};
    for (const c of colorsArray) {
      nextStocks[c] = variantStocks[c] ?? 0;
    }
    setVariantStocks(nextStocks);
    if (colorsArray.length) {
      syncVariantsToForm(colorsArray, nextStocks);
    } else {
      setFormData(prev => ({ ...prev, colors: '[]', variants: '[]' }));
    }
  };

  const updateVariantStock = (color: string, stock: number) => {
    const colorsArray = getColorsArray();
    const nextStocks = { ...variantStocks, [color]: Math.max(0, Number(stock || 0)) };
    setVariantStocks(nextStocks);
    if (colorsArray.length) {
      syncVariantsToForm(colorsArray, nextStocks);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadError('');
    setUploading(true);

    try {
      const remaining = Math.max(0, MAX_MEDIA_ITEMS - imagePreviews.length);
      const selected = Array.from(files).slice(0, remaining);

      if (selected.length === 0) {
        throw new Error(`Maximum ${MAX_MEDIA_ITEMS} images allowed`);
      }

      const processed: string[] = [];
      for (const file of selected) {
        const isVideo = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
          throw new Error(`File "${file.name}" is not supported. Only images and MP4 videos allowed.`);
        }

        if (isVideo && file.size > MAX_VIDEO_BYTES) {
          throw new Error(`MP4 "${file.name}" is too large (${bytesToMb(file.size)}MB). Max: ${bytesToMb(MAX_VIDEO_BYTES)}MB`);
        }
        if (isImage && file.size > MAX_IMAGE_BYTES) {
          throw new Error(`Image "${file.name}" is too large (${bytesToMb(file.size)}MB). Max: ${bytesToMb(MAX_IMAGE_BYTES)}MB`);
        }

        try {
          if (isImage) {
            processed.push(await compressImageToDataUrl(file));
          } else {
            processed.push(await fileToDataUrl(file));
          }
        } catch (uploadErr) {
          const errMsg = uploadErr instanceof Error ? uploadErr.message : 'Failed to process file';
          throw new Error(`Error processing "${file.name}": ${errMsg}`);
        }
      }

      const next = [...imagePreviews, ...processed].slice(0, MAX_MEDIA_ITEMS);
      setImagePreviews(next);
      setFormData(prev => ({
        ...prev,
        images: JSON.stringify(next),
      }));
      console.log(`✓ Uploaded ${processed.length} image(s). Total: ${next.length}/${MAX_MEDIA_ITEMS}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
      console.error('Image upload error:', message);
    } finally {
      setUploading(false);
      // allow selecting the same file again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updated = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(updated);
    setFormData(prev => ({
      ...prev,
      images: JSON.stringify(updated),
    }));
  };

  const handleVariantTypeChange = (index: number, name: string) => {
    const updated = [...variantTypes];
    updated[index] = { ...updated[index], name };
    setVariantTypes(updated);
  };

  const addVariantType = () => {
    setVariantTypes([...variantTypes, { name: '', options: [] }]);
  };

  const removeVariantType = (index: number) => {
    setVariantTypes(variantTypes.filter((_, i) => i !== index));
  };

  const generateVariantCombinations = () => {
    const vTypes = variantTypes.filter(vt => vt.name && vt.options.map(o => o.trim()).filter(Boolean).length > 0);
    if (vTypes.length === 0) {
      setNewVariants([]);
      return;
    }

    const combinations = vTypes.reduce((acc, vt) => {
      const validOptions = vt.options.map(opt => opt.trim()).filter(Boolean);
      if (acc.length === 0) {
        return validOptions.map(opt => ({ [vt.name]: opt }));
      }
      return acc.flatMap(combo => 
        validOptions.map(opt => ({ ...combo, [vt.name]: opt }))
      );
    }, [] as Array<Record<string, string>>);

    const updatedVariants = combinations.map(attributes => {
      const existing = newVariants.find(v => 
        Object.keys(attributes).every(key => attributes[key] === v.attributes[key]) &&
        Object.keys(v.attributes).every(key => attributes[key] === v.attributes[key])
      );
      return {
        attributes,
        price: existing?.price ?? formData.price ?? 0,
        stock: existing?.stock ?? 0,
      };
    });
    setNewVariants(updatedVariants);
  };

  const addCustomVariant = () => {
    const attributes: Record<string, string> = {};
    variantTypes.forEach(vt => {
      if (vt.name) {
        const validOptions = vt.options.map(o => o.trim()).filter(Boolean);
        attributes[vt.name] = validOptions[0] || '';
      }
    });
    setNewVariants([
      ...newVariants,
      {
        attributes,
        price: formData.price ?? 0,
        stock: 0
      }
    ]);
  };

  const handleVariantDetailChange = (index: number, field: 'price' | 'stock', value: number) => {
    const updated = [...newVariants];
    if (updated[index]) {
      updated[index][field] = value;
      setNewVariants(updated);
    }
  };

  // --- Showcase Section Helpers ---
  const getCurrentShowcaseList = (): ProductShowcaseSection[] => {
    const rawList = activeShowcaseCityTab === 'global'
      ? showcaseSections
      : (cityShowcaseSections[activeShowcaseCityTab] || []);

    // If we have product images uploaded in imagePreviews, ensure each image is represented
    if (imagePreviews.length > 0) {
      const merged: ProductShowcaseSection[] = [];

      imagePreviews.forEach((imgUrl, idx) => {
        // Find existing match by index or image URL
        const existing = rawList[idx] || rawList.find(s => s.image === imgUrl);
        const isAlternateRight = idx % 2 === 1;

        merged.push({
          id: existing?.id || `sec_img_${idx}`,
          image: imgUrl,
          imageAlt: existing?.imageAlt || `Product View ${idx + 1}`,
          tag: existing?.tag || '',
          title: existing?.title || '',
          description: existing?.description || '',
          bullets: Array.isArray(existing?.bullets) ? existing.bullets : [],
          layout: existing?.layout || (isAlternateRight ? 'image-right' : 'image-left')
        });
      });

      // Append any custom extra sections beyond the uploaded images count
      if (rawList.length > imagePreviews.length) {
        for (let i = imagePreviews.length; i < rawList.length; i++) {
          merged.push(rawList[i]);
        }
      }

      return merged;
    }

    return rawList;
  };

  const updateCurrentShowcaseList = (newList: ProductShowcaseSection[]) => {
    if (activeShowcaseCityTab === 'global') {
      setShowcaseSections(newList);
    } else {
      setCityShowcaseSections(prev => ({
        ...prev,
        [activeShowcaseCityTab]: newList
      }));
    }
  };

  const addCustomShowcaseSection = () => {
    const current = getCurrentShowcaseList();
    const isAlternateRight = current.length % 2 === 1;
    const newSection: ProductShowcaseSection = {
      id: String(Date.now()),
      image: imagePreviews[0] || '',
      tag: 'Eco Devotion',
      title: 'Sacred Plantable Creation',
      description: 'Handcrafted by rural women artisans using cotton waste pulp and organic wildflower seeds.',
      bullets: ['100% Plantable Seed Paper', 'Eco-friendly & Biodegradable'],
      layout: isAlternateRight ? 'image-right' : 'image-left'
    };
    updateCurrentShowcaseList([...current, newSection]);
  };

  const removeShowcaseSection = (index: number) => {
    const current = getCurrentShowcaseList();
    updateCurrentShowcaseList(current.filter((_, i) => i !== index));
  };

  const updateShowcaseField = (index: number, field: keyof ProductShowcaseSection, value: any) => {
    const current = [...getCurrentShowcaseList()];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      updateCurrentShowcaseList(current);
    }
  };

  const addShowcaseBullet = (sectionIndex: number) => {
    const current = [...getCurrentShowcaseList()];
    if (current[sectionIndex]) {
      const bullets = Array.isArray(current[sectionIndex].bullets) ? [...(current[sectionIndex].bullets || [])] : [];
      bullets.push('Handcrafted eco-friendly feature');
      current[sectionIndex].bullets = bullets;
      updateCurrentShowcaseList(current);
    }
  };

  const updateShowcaseBullet = (sectionIndex: number, bulletIndex: number, val: string) => {
    const current = [...getCurrentShowcaseList()];
    if (current[sectionIndex] && Array.isArray(current[sectionIndex].bullets)) {
      const bullets = [...current[sectionIndex].bullets!];
      bullets[bulletIndex] = val;
      current[sectionIndex].bullets = bullets;
      updateCurrentShowcaseList(current);
    }
  };

  const removeShowcaseBullet = (sectionIndex: number, bulletIndex: number) => {
    const current = [...getCurrentShowcaseList()];
    if (current[sectionIndex] && Array.isArray(current[sectionIndex].bullets)) {
      current[sectionIndex].bullets = current[sectionIndex].bullets!.filter((_, i) => i !== bulletIndex);
      updateCurrentShowcaseList(current);
    }
  };

  const copyShowcaseFromGlobal = (city: string) => {
    setCityShowcaseSections(prev => ({
      ...prev,
      [city]: JSON.parse(JSON.stringify(getCurrentShowcaseList()))
    }));
  };

  const resetShowcaseForCity = (city: string) => {
    setCityShowcaseSections(prev => {
      const copy = { ...prev };
      delete copy[city];
      return copy;
    });
  };

  // --- Why Choose Us Helpers ---
  const getCurrentWhyChoose = (): WhyChooseUsConfig => {
    if (whyChooseUs[activeWhyChooseCityTab]) {
      return whyChooseUs[activeWhyChooseCityTab];
    }
    const isDefault = activeWhyChooseCityTab === 'default';
    return {
      tag: isDefault ? 'Why Choose Nivaran' : `Why Choose Us in ${activeWhyChooseCityTab}`,
      title: isDefault ? 'Why Choose Nivaran Handicrafts?' : `Why ${activeWhyChooseCityTab} Chooses Nivaran`,
      subtitle: isDefault 
        ? 'Pure artisanal craftsmanship, plantable seeds, and zero environmental footprint.'
        : `Handcrafted with devotion and delivered across ${activeWhyChooseCityTab} with care.`,
      description: isDefault
        ? 'Every purchase directly supports sustainable rural livelihoods and eco-conscious celebration across India.'
        : `Bringing authentic eco-friendly handicrafts and plantable sacred items directly to your doorstep in ${activeWhyChooseCityTab}.`,
      items: DEFAULT_WHY_CHOOSE_ITEMS
    };
  };

  const updateCurrentWhyChoose = (config: WhyChooseUsConfig) => {
    setWhyChooseUs(prev => ({
      ...prev,
      [activeWhyChooseCityTab]: config
    }));
  };

  const updateWhyChooseField = (field: keyof WhyChooseUsConfig, value: any) => {
    const current = getCurrentWhyChoose();
    updateCurrentWhyChoose({ ...current, [field]: value });
  };

  const updateWhyChooseItem = (index: number, field: keyof WhyChooseUsItem, value: string) => {
    const current = getCurrentWhyChoose();
    const items = Array.isArray(current.items) ? [...current.items] : [...DEFAULT_WHY_CHOOSE_ITEMS];
    if (!items[index]) {
      items[index] = { title: '', description: '', icon: 'leaf' };
    }
    items[index] = { ...items[index], [field]: value };
    updateCurrentWhyChoose({ ...current, items });
  };

  const addWhyChooseItem = () => {
    const current = getCurrentWhyChoose();
    const items = Array.isArray(current.items) ? [...current.items] : [...DEFAULT_WHY_CHOOSE_ITEMS];
    items.push({
      icon: 'award',
      title: 'Artisan Quality Guarantee',
      description: 'Handcrafted with meticulous devotion and attention to authentic traditional sustainability.'
    });
    updateCurrentWhyChoose({ ...current, items });
  };

  const removeWhyChooseItem = (index: number) => {
    const current = getCurrentWhyChoose();
    const items = (current.items || DEFAULT_WHY_CHOOSE_ITEMS).filter((_, i) => i !== index);
    updateCurrentWhyChoose({ ...current, items });
  };

  const copyWhyChooseFromDefault = (city: string) => {
    const defaultConf = whyChooseUs['default'] || {
      tag: 'Why Choose Nivaran',
      title: 'Why Choose Nivaran Handicrafts?',
      subtitle: 'Pure artisanal craftsmanship, plantable seeds, and zero environmental footprint.',
      description: 'Every purchase directly supports sustainable rural livelihoods and eco-conscious celebration across India.',
      items: DEFAULT_WHY_CHOOSE_ITEMS
    };
    setWhyChooseUs(prev => ({
      ...prev,
      [city]: {
        ...JSON.parse(JSON.stringify(defaultConf)),
        tag: `Why Choose Us in ${city}`,
        title: `Why ${city} Chooses Nivaran`,
        subtitle: `Handcrafted with devotion, delivered fresh across ${city}.`
      }
    }));
  };

  const resetWhyChooseCity = (city: string) => {
    setWhyChooseUs(prev => {
      const copy = { ...prev };
      delete copy[city];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      setUploadError('Please wait for uploads to finish before saving.');
      return;
    }
    setSaving(true);
    try {
      const totalStock = newVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const finalShowcase = (showcaseSections.length > 0 ? showcaseSections : getCurrentShowcaseList())
        .filter(s => (s.title && s.title.trim().length > 0) || (s.description && s.description.trim().length > 0));

      const finalFormData = {
        ...formData,
        variant_types: JSON.stringify(variantTypes),
        variants: JSON.stringify(newVariants),
        stock: newVariants.length > 0 ? totalStock : formData.stock,
        city_descriptions: JSON.stringify(cityDescriptions),
        showcase_sections: JSON.stringify(finalShowcase),
        city_showcase_sections: JSON.stringify(cityShowcaseSections),
        why_choose_us: JSON.stringify(whyChooseUs),
        city_slugs: JSON.stringify(citySlugs),
      };
      await onSave(finalFormData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-form-container">
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Product Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter product title"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Custom SEO Slug / Keyword (Optional)</label>
              <input
                type="text"
                name="custom_slug"
                value={formData.custom_slug || ''}
                onChange={handleInputChange}
                placeholder="e.g. jute-bags or organic-cotton-tote"
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Used for City SEO URLs like <code>nivaranupcyclers.com/kn/jute-bags-in-kanpur</code> or <code>nivaranupcyclers.com/del/jute-bags-in-delhi</code>.
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Default Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter general product description"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. DYNAMIC IMAGE & CONTENT SHOWCASE SECTIONS (SEO PRODUCT STORIES) */}
        {/* ========================================================================= */}
        <div className="form-section" style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={22} color="#2563eb" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Image & Content Showcase Sections (Product Stories)
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Every available product image is displayed below in alternating left/right layout with side-by-side SEO content fields.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={addCustomShowcaseSection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
              }}
            >
              <Plus size={16} /> Add Custom Image Section
            </button>
          </div>

          {/* City Tabs for Showcase Sections */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => setActiveShowcaseCityTab('global')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: activeShowcaseCityTab === 'global' ? 700 : 500,
                cursor: 'pointer',
                border: activeShowcaseCityTab === 'global' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: activeShowcaseCityTab === 'global' ? '#eff6ff' : '#ffffff',
                color: activeShowcaseCityTab === 'global' ? '#1e40af' : '#475569',
              }}
            >
              <Globe size={14} /> Global / All India ({getCurrentShowcaseList().length} images)
            </button>
            {TARGET_CITIES.map((city) => {
              const count = (cityShowcaseSections[city] || []).length;
              const isActive = activeShowcaseCityTab === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveShowcaseCityTab(city)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 13px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    border: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: isActive ? '#eff6ff' : '#ffffff',
                    color: isActive ? '#1e40af' : '#475569',
                  }}
                >
                  <MapPin size={13} color={count > 0 ? '#16a34a' : '#94a3b8'} />
                  {city}
                  {count > 0 ? (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                      Customized
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>(default)</span>
                  )}
                </button>
              );
            })}
          </div>

          {activeShowcaseCityTab !== 'global' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#1e40af' }}>
                Editing SEO content for <strong>{activeShowcaseCityTab}</strong>
                {(cityShowcaseSections[activeShowcaseCityTab] || []).length === 0 ? ' (Currently falling back to Global)' : ' (Customized)'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => copyShowcaseFromGlobal(activeShowcaseCityTab)}
                  style={{ background: '#ffffff', border: '1px solid #93c5fd', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#1d4ed8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Copy size={13} /> Copy from Global
                </button>
                {(cityShowcaseSections[activeShowcaseCityTab] || []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => resetShowcaseForCity(activeShowcaseCityTab)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset to Global
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List of Showcase Sections */}
          {getCurrentShowcaseList().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <ImageIcon size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                No product images available yet
              </p>
              <p style={{ margin: '4px 0 14px', fontSize: '12px', color: '#94a3b8' }}>
                Upload product images in the <strong>Product Images & Videos</strong> section above, and they will automatically appear here with alternating left/right layout boxes!
              </p>
              <button
                type="button"
                onClick={addCustomShowcaseSection}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Image Section Manually
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {getCurrentShowcaseList().map((section, idx) => {
                const isImageRight = section.layout === 'image-right' || (idx % 2 === 1 && section.layout !== 'image-left');

                // Content editing column JSX
                const contentCol = (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Section Heading / Title *
                        </label>
                        <input
                          type="text"
                          value={section.title || ''}
                          onChange={(e) => updateShowcaseField(idx, 'title', e.target.value)}
                          placeholder="e.g. Sacred Trishul Embedded With Seeds"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Badge / Tag
                        </label>
                        <input
                          type="text"
                          value={section.tag || ''}
                          onChange={(e) => updateShowcaseField(idx, 'tag', e.target.value)}
                          placeholder="e.g. 100% Plantable Seed Paper"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Story Description (SEO Content) *
                      </label>
                      <textarea
                        value={section.description || ''}
                        onChange={(e) => updateShowcaseField(idx, 'description', e.target.value)}
                        placeholder="Write detailed paragraph about this specific photo / aspect of the product..."
                        rows={3}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.5' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          Key Highlight Bullet Points:
                        </label>
                        <button
                          type="button"
                          onClick={() => addShowcaseBullet(idx)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Plus size={13} /> Add Point
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(section.bullets || []).map((bullet, bIdx) => (
                          <div key={bIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateShowcaseBullet(idx, bIdx, e.target.value)}
                              placeholder={`Bullet point #${bIdx + 1}...`}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeShowcaseBullet(idx, bIdx)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );

                // Image display column JSX
                const imageCol = (
                  <div style={{ width: '320px', flexShrink: 0, background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                        Product Image #{idx + 1}
                      </span>
                      {section.tag && (
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          {section.tag}
                        </span>
                      )}
                    </div>

                    <div style={{ width: '100%', height: '170px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {section.image ? (
                        <img src={section.image} alt={section.title || `Product View ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                          <ImageIcon size={32} />
                          <span style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>No image</span>
                        </div>
                      )}
                      <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                        {isImageRight ? 'Right Side View' : 'Left Side View'}
                      </span>
                    </div>

                    {/* Quick switch image if needed */}
                    {imagePreviews.length > 1 && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          Switch Image:
                        </span>
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                          {imagePreviews.map((mediaUrl, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => updateShowcaseField(idx, 'image', mediaUrl)}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                border: section.image === mediaUrl ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                padding: 0,
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div
                    key={section.id || idx}
                    style={{
                      background: isImageRight ? '#f8fafc' : '#f0fdf4',
                      borderRadius: '12px',
                      border: isImageRight ? '1.5px solid #cbd5e1' : '1.5px solid #bbf7d0',
                      padding: '16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Header bar of section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: isImageRight ? '#6366f1' : '#16a34a', color: '#ffffff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                          {idx + 1}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                          Section #{idx + 1}: {isImageRight ? '📝 Content on Left ➔ 🖼️ Image on Right' : '🖼️ Image on Left ➔ 📝 Content on Right'}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Layout Side:</span>
                        <button
                          type="button"
                          onClick={() => updateShowcaseField(idx, 'layout', isImageRight ? 'image-left' : 'image-right')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#2563eb',
                            cursor: 'pointer'
                          }}
                        >
                          Flip to {isImageRight ? 'Image Left' : 'Image Right'}
                        </button>
                        {idx >= imagePreviews.length && (
                          <button
                            type="button"
                            onClick={() => removeShowcaseSection(idx)}
                            style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '11px' }}
                            title="Delete Section"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Alternating Side-by-Side row */}
                    <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', alignItems: 'stretch' }}>
                      {isImageRight ? (
                        <>
                          {contentCol}
                          {imageCol}
                        </>
                      ) : (
                        <>
                          {imageCol}
                          {contentCol}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. DYNAMIC "WHY CHOOSE US" SECTION (CITY-SPECIFIC SEO) */}
        {/* ========================================================================= */}
        <div className="form-section" style={{ border: '1px solid #86efac', borderRadius: '12px', padding: '20px', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="#16a34a" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#14532d' }}>
                  "Why Choose Us" Section (Dynamic City SEO)
                </h3>
                <span style={{ fontSize: '12px', color: '#15803d' }}>
                  Bottom trust section with dynamic headline, local narrative, and 4 highlight benefit cards.
                </span>
              </div>
            </div>
          </div>

          {/* City Selection Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveWhyChooseCityTab('default')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: activeWhyChooseCityTab === 'default' ? 700 : 500,
                cursor: 'pointer',
                border: activeWhyChooseCityTab === 'default' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                background: activeWhyChooseCityTab === 'default' ? '#dcfce7' : '#ffffff',
                color: activeWhyChooseCityTab === 'default' ? '#14532d' : '#475569',
              }}
            >
              <Globe size={14} /> All India (Default)
              {Boolean(whyChooseUs['default']) && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>}
            </button>
            {TARGET_CITIES.map((city) => {
              const isConfigured = Boolean(whyChooseUs[city]);
              const isActive = activeWhyChooseCityTab === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveWhyChooseCityTab(city)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    border: isActive ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: isActive ? '#dcfce7' : '#ffffff',
                    color: isActive ? '#14532d' : '#475569',
                  }}
                >
                  <MapPin size={13} color={isConfigured ? '#16a34a' : '#94a3b8'} />
                  {city}
                  {isConfigured && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* Active Why Choose Us Editor */}
          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong style={{ fontSize: '14px', color: '#14532d' }}>
                  {activeWhyChooseCityTab === 'default' ? 'All India (Default)' : activeWhyChooseCityTab} "Why Choose Us" Content
                </strong>
                <span style={{ marginLeft: '8px', fontSize: '11px', background: whyChooseUs[activeWhyChooseCityTab] ? '#dcfce7' : '#f1f5f9', color: whyChooseUs[activeWhyChooseCityTab] ? '#166534' : '#64748b', padding: '2px 8px', borderRadius: '12px' }}>
                  {whyChooseUs[activeWhyChooseCityTab] ? 'Customized' : 'Using Template Default'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {activeWhyChooseCityTab !== 'default' && (
                  <button
                    type="button"
                    onClick={() => copyWhyChooseFromDefault(activeWhyChooseCityTab)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#166534', cursor: 'pointer' }}
                  >
                    <Copy size={13} /> Copy from Default
                  </button>
                )}
                {Boolean(whyChooseUs[activeWhyChooseCityTab]) && (
                  <button
                    type="button"
                    onClick={() => resetWhyChooseCity(activeWhyChooseCityTab)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>

            {/* Headline and Subtitle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Main Section Title
                </label>
                <input
                  type="text"
                  value={getCurrentWhyChoose().title || ''}
                  onChange={(e) => updateWhyChooseField('title', e.target.value)}
                  placeholder="e.g. Why Choose Nivaran in Kanpur?"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Tag / Badge Text
                </label>
                <input
                  type="text"
                  value={getCurrentWhyChoose().tag || ''}
                  onChange={(e) => updateWhyChooseField('tag', e.target.value)}
                  placeholder="e.g. Pure Handmade Devotion"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Subtitle
                </label>
                <input
                  type="text"
                  value={getCurrentWhyChoose().subtitle || ''}
                  onChange={(e) => updateWhyChooseField('subtitle', e.target.value)}
                  placeholder="e.g. 100% Biodegradable & Plantable Seed Paper Items"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  City Reassurance Narrative (SEO Context)
                </label>
                <input
                  type="text"
                  value={getCurrentWhyChoose().description || ''}
                  onChange={(e) => updateWhyChooseField('description', e.target.value)}
                  placeholder={`e.g. Trusted by thousands of eco-conscious homes in ${activeWhyChooseCityTab === 'default' ? 'India' : activeWhyChooseCityTab}`}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Feature Benefit Cards */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#14532d', margin: 0 }}>
                  Feature / Benefit Cards ({(getCurrentWhyChoose().items || DEFAULT_WHY_CHOOSE_ITEMS).length} Cards):
                </label>
                <button
                  type="button"
                  onClick={addWhyChooseItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(22,163,74,0.3)'
                  }}
                >
                  <Plus size={14} /> Add Benefit Card
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {(getCurrentWhyChoose().items || DEFAULT_WHY_CHOOSE_ITEMS).map((item, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>Card #{cIdx + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                          value={item.icon || 'leaf'}
                          onChange={(e) => updateWhyChooseItem(cIdx, 'icon', e.target.value)}
                          style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                        >
                          <option value="leaf">🌿 Leaf (Eco)</option>
                          <option value="heart">❤️ Heart (Artisan)</option>
                          <option value="shield">🛡️ Shield (Pure/Zero Chemical)</option>
                          <option value="truck">🚚 Truck (Delivery)</option>
                          <option value="award">🏆 Award (Quality)</option>
                          <option value="star">⭐ Star (Handmade)</option>
                          <option value="package">📦 Package (Eco Pack)</option>
                        </select>
                        {(getCurrentWhyChoose().items || DEFAULT_WHY_CHOOSE_ITEMS).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWhyChooseItem(cIdx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            title="Delete Card"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateWhyChooseItem(cIdx, 'title', e.target.value)}
                      placeholder="Card Title..."
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}
                    />
                    <textarea
                      value={item.description || ''}
                      onChange={(e) => updateWhyChooseItem(cIdx, 'description', e.target.value)}
                      placeholder="Card description..."
                      rows={2}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', lineHeight: '1.4' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CITY-SPECIFIC SEO DESCRIPTIONS (LOCALIZED ABOUT SECTION) */}
        {/* ========================================================================= */}
        <div className="form-section" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="#DBB520" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                City-Specific SEO "About" Descriptions
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
              {Object.values(cityDescriptions).filter(v => typeof v === 'string' && v.trim().length > 0).length} of {TARGET_CITIES.length} cities customized
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
            Customize product descriptions for SEO & city-targeted campaigns for target cities. If a city description is left empty, the site will automatically fall back to the default description above.
          </p>

          {/* City Selection Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {TARGET_CITIES.map((city) => {
              const isConfigured = Boolean(cityDescriptions[city]?.trim());
              const isActive = activeCityTab === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveCityTab(city)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    border: isActive ? '2px solid #DBB520' : '1px solid #e2e8f0',
                    background: isActive ? '#fefce8' : '#ffffff',
                    color: isActive ? '#854d0e' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isConfigured ? '#22c55e' : '#cbd5e1',
                      display: 'inline-block',
                    }}
                  />
                  {city}
                  {isConfigured && (
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active City Description & Custom URL Editor */}
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
            {(() => {
              const cityName = (activeCityTab || 'kanpur').toLowerCase();
              const activeCityCode = CITY_TO_CODE[cityName] || cityName.slice(0, 3);
              const rawTitle = typeof formData.title === 'string' ? formData.title : '';
              const rawCustomSlug = typeof formData.custom_slug === 'string' ? formData.custom_slug : '';
              const defaultBaseSlug = (rawCustomSlug || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product').replace(/-+$/, '');
              const defaultCitySlug = `${defaultBaseSlug}-in-${cityName.replace(/\s+/g, '-')}`;
              const currentCustomCitySlug = (citySlugs && citySlugs[activeCityTab]) || '';
              const effectiveCitySlug = currentCustomCitySlug || defaultCitySlug;
              const fullCityUrl = `https://nivaranupcyclers.com/${activeCityCode}/${effectiveCitySlug}`;

              return (
                <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={15} color="#2563eb" />
                      {activeCityTab} Specific URL Slug
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(fullCityUrl);
                          setCopiedCityUrl(activeCityTab);
                          setTimeout(() => setCopiedCityUrl(null), 2000);
                        }}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          color: copiedCityUrl === activeCityTab ? '#16a34a' : '#334155',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Copy size={12} />
                        {copiedCityUrl === activeCityTab ? 'Copied!' : 'Copy URL'}
                      </button>
                      <a
                        href={fullCityUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '11px',
                          color: '#2563eb',
                          textDecoration: 'underline',
                          fontWeight: 500
                        }}
                      >
                        Test Link ↗
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      /{activeCityCode}/
                    </span>
                    <input
                      type="text"
                      value={citySlugs[activeCityTab] || ''}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                        setCitySlugs(prev => ({
                          ...prev,
                          [activeCityTab]: val
                        }));
                      }}
                      placeholder={`Default: ${defaultCitySlug}`}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                    Live URL: <strong style={{ color: '#0f172a' }}>{fullCityUrl}</strong>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="#DBB520" />
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>{activeCityTab} Description</strong>
                {cityDescriptions[activeCityTab]?.trim() ? (
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                    Active Custom SEO Content
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px' }}>
                    Using Default Description
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {Boolean(formData.description?.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.description) {
                        setCityDescriptions(prev => ({ ...prev, [activeCityTab]: formData.description || '' }));
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                    title="Copy text from the main product description to start editing"
                  >
                    <Copy size={13} />
                    Copy Default
                  </button>
                )}
                {Boolean(cityDescriptions[activeCityTab]?.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCityDescriptions(prev => {
                        const copy = { ...prev };
                        delete copy[activeCityTab];
                        return copy;
                      });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={cityDescriptions[activeCityTab] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCityDescriptions(prev => ({
                  ...prev,
                  [activeCityTab]: val,
                }));
              }}
              placeholder={`Enter localized SEO description for ${activeCityTab} (e.g. including local context, delivery in ${activeCityTab}, keywords)...`}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                lineHeight: '1.5',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <span>
                {cityDescriptions[activeCityTab]?.trim() ? `${cityDescriptions[activeCityTab].length} characters` : 'No custom description set'}
              </span>
              <span>
                Preview on product page with <code>?city={encodeURIComponent(activeCityTab.toLowerCase())}</code>
              </span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing & Inventory</h3>
          {getColorsArray().length > 0 && (
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              Per-color stock is enabled. Total stock is calculated automatically.
            </p>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price || 0}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Compare at Price (₹)</label>
              <input
                type="number"
                name="compare_at_price"
                value={formData.compare_at_price || 0}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock || 0}
                onChange={handleInputChange}
                required={getColorsArray().length === 0}
                min="0"
                disabled={getColorsArray().length > 0}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., Electronics, Clothing"
              />
            </div>
            <div className="form-group">
              <label>Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={handleInputChange}
                placeholder="e.g., Cotton, Plastic"
              />
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '20px' }}>
            <div>
              <h3>Advanced Variants (Optional)</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Define complex options like multiple Sizes and Colors.</p>
            </div>
            {variantTypes.map((vt, typeIndex) => (
              <div key={typeIndex} className="variant-type-section" style={{ marginBottom: '10px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Variant Type</label>
                    <input
                      type="text"
                      placeholder="e.g., Color, Size"
                      value={vt.name}
                      onChange={(e) => handleVariantTypeChange(typeIndex, e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Options (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., Red, Green, Blue"
                      value={vt.options.join(', ')}
                      onChange={(e) => {
                        const updated = [...variantTypes];
                        updated[typeIndex].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setVariantTypes(updated);
                      }}
                    />
                  </div>
                  <button type="button" onClick={() => removeVariantType(typeIndex)} className="admin-btn danger-outline small" style={{alignSelf:"flex-end", marginBottom:"5px"}}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="form-row" style={{marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap"}}>
              <button type="button" onClick={addVariantType} className="admin-btn secondary" style={{display: "flex", alignItems: "center", gap: "6px"}}>
                <Plus size={16} /> Add Variant Type
              </button>
              <button type="button" onClick={generateVariantCombinations} className="admin-btn primary" disabled={variantTypes.length === 0}>
                Generate Combinations
              </button>
              <button type="button" onClick={addCustomVariant} className="admin-btn secondary" style={{display: "flex", alignItems: "center", gap: "6px"}} disabled={variantTypes.length === 0}>
                <Plus size={16} /> Add Custom Variant
              </button>
            </div>

            {newVariants.length > 0 && (
              <div className="variants-table" style={{overflowX: 'auto', marginTop: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
                  <thead>
                    <tr style={{background: '#f8fafc'}}>
                      {variantTypes.map(vt => vt.name && <th key={vt.name} style={{borderBottom:"2px solid #e2e8f0", padding:"12px 10px", textAlign:"left", fontWeight: '600', color: '#475569'}}>{vt.name}</th>)}
                      <th style={{borderBottom:"2px solid #e2e8f0", padding:"12px 10px", textAlign:"left", fontWeight: '600', color: '#475569', width: '120px'}}>Price (₹)</th>
                      <th style={{borderBottom:"2px solid #e2e8f0", padding:"12px 10px", textAlign:"left", fontWeight: '600', color: '#475569', width: '100px'}}>Stock</th>
                      <th style={{borderBottom:"2px solid #e2e8f0", padding:"12px 10px", textAlign:"center", width: '60px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newVariants.map((variant, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s'}}>
                        {variantTypes.map(vt => {
                          if (!vt.name) return null;
                          const currentVal = variant.attributes[vt.name] || '';
                          const opts = vt.options.map(o => o.trim()).filter(Boolean);
                          return (
                            <td key={vt.name} style={{padding:"10px"}}>
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const updated = [...newVariants];
                                  updated[index] = {
                                    ...updated[index],
                                    attributes: {
                                      ...updated[index].attributes,
                                      [vt.name]: e.target.value
                                    }
                                  };
                                  setNewVariants(updated);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: 'white',
                                  fontSize: '14px',
                                  width: '100%',
                                  minWidth: '100px',
                                  outline: 'none',
                                  color: '#334155'
                                }}
                              >
                                <option value="">Select option...</option>
                                {opts.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                        <td style={{padding:"10px"}}>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantDetailChange(index, 'price', parseFloat(e.target.value) || 0)}
                            style={{
                              width:"100%",
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '14px',
                              outline: 'none',
                              color: '#334155'
                            }}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td style={{padding:"10px"}}>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleVariantDetailChange(index, 'stock', parseInt(e.target.value) || 0)}
                            style={{
                              width:"100%",
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '14px',
                              outline: 'none',
                              color: '#334155'
                            }}
                            min="0"
                          />
                        </td>
                        <td style={{padding:"10px", textAlign: 'center'}}>
                          <button
                            type="button"
                            onClick={() => {
                              setNewVariants(newVariants.filter((_, i) => i !== index));
                            }}
                            className="admin-btn danger-outline small"
                            style={{
                              padding: '6px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              minWidth: 'auto',
                              width: '36px',
                              height: '36px'
                            }}
                            title="Delete this variant combination"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Legacy Colors (comma-separated)</label>
              <input
                type="text"
                name="colors"
                value={
                  Array.isArray(formData.colors)
                    ? formData.colors.join(', ')
                    : formData.colors && typeof formData.colors === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(formData.colors).join(', ');
                        } catch {
                          return formData.colors;
                        }
                      })()
                    : ''
                }
                onChange={(e) => handleColorsChange(e.target.value)}
                placeholder="e.g., Red, Blue, Green"
              />
            </div>
          </div>

          {getColorsArray().length > 0 && (
            <div className="form-row">
              {getColorsArray().map((color) => (
                <div key={color} className="form-group">
                  <label>Stock for {color}</label>
                  <input
                    type="number"
                    min="0"
                    value={variantStocks[color] ?? 0}
                    onChange={(e) => updateVariantStock(color, parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="form-row">
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured || false}
                  onChange={handleInputChange}
                />
                Featured Product
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Images & Videos</h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Upload up to 5 images or videos (MP4)</p>
          {uploadError && (
            <div style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '10px' }}>
              {uploadError}
            </div>
          )}
          <div className="form-upload">
            <label className={`upload-label ${imagePreviews.length >= 5 ? 'disabled' : ''}`}>
              <Upload size={24} />
              <span>{uploading ? 'Processing...' : 'Click to upload media'}</span>
              <input
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleImageUpload}
                disabled={imagePreviews.length >= 5 || uploading || saving}
                hidden
              />
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((media, idx) => (
                <div key={idx} className="image-preview">
                  {typeof media === 'string' && (media.startsWith('data:video') || media.includes('.mp4')) ? (
                    <video src={media} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={media} alt={`Preview ${idx}`} />
                  )}
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(idx)}
                  >
                    <X size={16} />
                  </button>
                  <div className="preview-number">{idx === 0 ? 'Main' : idx + 1}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn primary"
            disabled={saving || uploading}
          >
            {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
