import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { extractDriveDirectLink } from '../../utils/driveHelpers';

export default function AddProductForm() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  
  // Placeholders for exactly 4 images
  const [images, setImages] = useState(['', '', '', '']);

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // Transform links into direct view links, filter out empty inputs
    const processedImages = images
      .map(url => extractDriveDirectLink(url))
      .filter(url => url.trim() !== '');

    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        name, 
        price, 
        stock_quantity: stockQuantity,
        image_urls: processedImages // Saving as an array in PostgreSQL
      }]);

    if (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product.");
    } else {
      alert("Product saved successfully!");
      // Reset form fields
      setName('');
      setPrice(0);
      setStockQuantity(0);
      setImages(['', '', '', '']);
    }
  };

  return (
    <form onSubmit={handleSaveProduct} className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Add New Product</h2>
      
      <div>
        <label className="block font-medium">Product Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="border p-2 w-full" />
      </div>

      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block font-medium">Price (₹)</label>
          <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required min="0" className="border p-2 w-full" />
        </div>
        <div className="w-1/2">
          <label className="block font-medium">Initial Stock Quantity</label>
          <input type="number" value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} required min="0" className="border p-2 w-full" />
        </div>
      </div>

      <div>
        <label className="block font-medium mb-2">Product Images (Google Drive Links - Up to 4)</label>
        {images.map((imgUrl, index) => (
          <input key={index} type="url" placeholder={`Image Link ${index + 1}`} value={imgUrl} onChange={(e) => handleImageChange(index, e.target.value)} className="border p-2 w-full mb-2" />
        ))}
        <p className="text-sm text-gray-500">Links will be automatically converted to direct images.</p>
      </div>

      <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-2">
        Save Product
      </button>
    </form>
  );
}