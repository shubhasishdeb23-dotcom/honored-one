import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, X, Check } from 'lucide-react';
import { faker } from '@faker-js/faker';

interface GalleryPickerProps {
  onSelect: (files: File[]) => void;
  onClose: () => void;
}

export const GalleryPicker = ({ onSelect, onClose }: GalleryPickerProps) => {
  const [selected, setSelected] = useState<number[]>([]);

  // Mock gallery images
  const mockImages = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    url: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/200/200`,
    date: faker.date.recent().toLocaleDateString(),
  }));

  const toggleSelect = (id: number) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : prev.length < 3 
          ? [...prev, id]
          : prev
    );
  };

  const handleConfirm = async () => {
    const selectedImages = mockImages.filter(img => selected.includes(img.id));
    
    const files: File[] = await Promise.all(
      selectedImages.map(async (img) => {
        const response = await fetch(img.url);
        const blob = await response.blob();
        return new File([blob], `gallery-${img.id}.jpg`, { type: 'image/jpeg' });
      })
    );
    
    onSelect(files);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <div>
          <h2 className="text-white font-semibold">Select Photos</h2>
          <p className="text-gray-400 text-sm">Choose up to 3 images</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-20">
        <div className="grid grid-cols-3 gap-2">
          {mockImages.map((img) => (
            <motion.button
              key={img.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSelect(img.id)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selected.includes(img.id)
                  ? 'border-teal-400'
                  : 'border-transparent'
              }`}
            >
              <img
                src={img.url}
                alt={`Gallery ${img.id}`}
                className="w-full h-full object-cover"
              />
              {selected.includes(img.id) && (
                <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-xs">{img.date}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="p-4 bg-[#0a0a0a] border-t border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-teal-400" />
              <span className="text-white">{selected.length} selected</span>
            </div>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
            >
              Analyze Selected
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
