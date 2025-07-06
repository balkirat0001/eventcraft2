import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  PhotoIcon,
  TagIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { eventService } from '../services/eventService';
import { useNotification } from '../components/NotificationContext';

const CreateEvent = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.user.user);
  const { success, error } = useNotification();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get('edit');
  const isEditing = !!editEventId;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    isVirtual: false,
    virtualLink: '',
    capacity: 100,
    ticketPrice: 0,
    category: '',
    tags: [],
    ticketTypes: [
      {
        name: 'General Admission',
        price: 0,
        description: 'Standard event admission',
        quantity: 100
      }
    ],
    image: ''
  });

  // Load event data for editing
  useEffect(() => {
    if (isEditing && editEventId) {
      loadEventForEditing(editEventId);
    }
  }, [isEditing, editEventId]);

  const loadEventForEditing = async (eventId) => {
    try {
      setLoading(true);
      const event = await eventService.getEvent(eventId);
      
      // Check if user is authorized to edit this event
      if (event.organizer && event.organizer !== user._id && user.role !== 'admin') {
        error('You are not authorized to edit this event');
        navigate('/organizer/dashboard');
        return;
      }

      // Format date for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: formatDateForInput(event.date),
        endDate: formatDateForInput(event.endDate),
        location: event.location || '',
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || '',
        capacity: event.capacity || 100,
        ticketPrice: event.ticketPrice || 0,
        category: event.category || '',
        tags: event.tags || [],
        ticketTypes: event.ticketTypes && event.ticketTypes.length > 0 
          ? event.ticketTypes 
          : [{
              name: 'General Admission',
              price: event.ticketPrice || 0,
              description: 'Standard event admission',
              quantity: event.capacity || 100
            }],
        image: event.image || ''
      });
    } catch (err) {
      console.error('Error loading event for editing:', err);
      error('Failed to load event data');
      navigate('/organizer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const [errors, setErrors] = useState({});

  const categories = [
    'Technology', 'Music', 'Business', 'Food & Drink', 'Health & Fitness',
    'Arts & Culture', 'Education', 'Sports', 'Entertainment', 'Networking'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTicketTypeChange = (index, field, value) => {
    const updatedTicketTypes = [...formData.ticketTypes];
    updatedTicketTypes[index] = { ...updatedTicketTypes[index], [field]: value };
    setFormData(prev => ({ ...prev, ticketTypes: updatedTicketTypes }));
  };

  const addTicketType = () => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        {
          name: '',
          price: 0,
          description: '',
          quantity: 50
        }
      ]
    }));
  };

  const removeTicketType = (index) => {
    if (formData.ticketTypes.length > 1) {
      setFormData(prev => ({
        ...prev,
        ticketTypes: prev.ticketTypes.filter((_, i) => i !== index)
      }));
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateStep = () => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Event title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.date) newErrors.date = 'Event date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (new Date(formData.endDate) <= new Date(formData.date)) {
          newErrors.endDate = 'End date must be after start date';
        }
        break;
      case 2:
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 3:
        if (formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setLoading(true);
    try {
      let response;
      if (isEditing) {
        response = await eventService.updateEvent(editEventId, formData);
        success(response.message || 'Event updated successfully!');
      } else {
        response = await eventService.createEvent(formData);
        success(response.message || 'Event created successfully!');
      }
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, err);
      error(err.message || `Failed to ${isEditing ? 'update' : 'create'} event. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Basic Info', icon: CalendarIcon },
    { id: 2, title: 'Location & Category', icon: MapPinIcon },
    { id: 3, title: 'Capacity & Pricing', icon: CurrencyDollarIcon },
    { id: 4, title: 'Review & Submit', icon: CheckIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit Event 📝' : 'Create New Event 🎪'}
          </h1>
          <p className="text-gray-600">
            {isEditing 
              ? 'Update your event details below' 
              : 'Fill in the details below to create your amazing event'
            }
          </p>
        </motion.div>

        {/* Progress Steps */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= stepItem.id 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {step > stepItem.id ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <stepItem.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= stepItem.id ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {stepItem.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > stepItem.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Form */}
        <Card className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your event title"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Describe your event..."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.endDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Image URL
                    </label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://example.com/event-image.jpg"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location & Category */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter event location"
                    />
                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isVirtual"
                      checked={formData.isVirtual}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      This is a virtual event
                    </label>
                  </div>

                  {formData.isVirtual && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Virtual Meeting Link
                      </label>
                      <input
                        type="url"
                        name="virtualLink"
                        value={formData.virtualLink}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a tag and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Capacity & Pricing */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.capacity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Ticket Types
                    </label>
                    <div className="space-y-4">
                      {formData.ticketTypes.map((ticketType, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Ticket Type {index + 1}</h4>
                            {formData.ticketTypes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTicketType(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={ticketType.name}
                                onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., Early Bird, VIP"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price ($)
                              </label>
                              <input
                                type="number"
                                value={ticketType.price}
                                onChange={(e) => handleTicketTypeChange(index, 'price', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity Available
                              </label>
                              <input
                                type="number"
                                value={ticketType.quantity}
                                onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={ticketType.description}
                                onChange={(e) => handleTicketTypeChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="What's included?"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTicketType}
                        className="w-full"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Another Ticket Type
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Title</p>
                        <p className="text-gray-900">{formData.title}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Category</p>
                        <p className="text-gray-900">{formData.category}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Start Date</p>
                        <p className="text-gray-900">{new Date(formData.date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">End Date</p>
                        <p className="text-gray-900">{new Date(formData.endDate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Location</p>
                        <p className="text-gray-900">{formData.location}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Capacity</p>
                        <p className="text-gray-900">{formData.capacity} people</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="font-medium text-gray-700">Description</p>
                        <p className="text-gray-900">{formData.description}</p>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="font-medium text-gray-700">Tags</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Ready to submit
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Your event will be reviewed by our admin team before being published. 
                            You'll receive a notification once it's approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex items-center"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {step < 4 && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  className="flex items-center"
                >
                  Next
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {step === 4 && (
                <Button
                  type="submit"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Event' : 'Create Event'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
