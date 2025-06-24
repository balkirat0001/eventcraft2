import React, { useState } from 'react';

const initialVendors = [
  {
    id: 1,
    name: 'Delight Catering Co.',
    category: 'Catering',
    contact: 'delight@vendor.com',
  },
  {
    id: 2,
    name: 'SoundBlast Audio',
    category: 'Audio/Visual',
    contact: 'soundblast@vendor.com',
  },
];

const VendorManagement = () => {
  const [vendors, setVendors] = useState(initialVendors);
  const [form, setForm] = useState({
    name: '',
    category: '',
    contact: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const newVendor = {
      id: vendors.length + 1,
      ...form,
    };
    setVendors([...vendors, newVendor]);
    setForm({ name: '', category: '', contact: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-700 mb-6"> Vendor Management</h2>

        <form onSubmit={handleAdd} className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-xl font-semibold mb-4"> Add New Vendor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Vendor Name"
              value={form.name}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="category"
              placeholder="Category (e.g., Catering)"
              value={form.category}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
            <input
              type="email"
              name="contact"
              placeholder="Contact Email"
              value={form.contact}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Vendor
          </button>
        </form>

        <h3 className="text-xl font-semibold mb-3"> Existing Vendors</h3>
        <ul className="space-y-3">
          {vendors.map((vendor) => (
            <li
              key={vendor.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{vendor.name}</p>
                <p className="text-sm text-gray-500">
                  {vendor.category} •  {vendor.contact}
                </p>
              </div>
              <button
                onClick={() => alert('Edit/Delete functionality coming soon')}
                className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
              >
                Manage
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VendorManagement;
